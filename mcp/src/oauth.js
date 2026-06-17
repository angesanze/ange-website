// OAuth 2.1 authorization for the ange-website MCP server.
//
// Turns this service into its own MCP authorization server (AS) + resource
// server (RS) so it can be added as a "custom connector" on claude.ai, which
// only speaks OAuth (the dialog has no static-bearer field). Design:
//
//   - Stateless. Every artifact — client_id, authorization code, access &
//     refresh token — is a JWT signed with MCP_OAUTH_SECRET (HS256). No
//     database, so it survives Cloud Run autoscaling and cold starts. Dynamic
//     Client Registration needs no storage either: the client's redirect_uris
//     are encoded into the signed client_id and recovered on lookup.
//   - Gated. The /authorize step renders a password form; only someone who
//     knows MCP_LOGIN_PASSWORD can authorize a client. This preserves the
//     "only the owner writes to the CMS" property the static bearer gave.
//   - Spec-correct. Leans on @modelcontextprotocol/sdk's mcpAuthRouter +
//     requireBearerAuth for the discovery metadata, PKCE (S256), DCR and the
//     RFC 9728 401/WWW-Authenticate dance. We only implement the provider.
//
// Active only when PUBLIC_URL + MCP_OAUTH_SECRET + MCP_LOGIN_PASSWORD are all
// set; otherwise setupOAuth() returns null and the server keeps its previous
// static-bearer-only behavior (so Claude Code / Desktop header clients still
// work, and a half-configured deploy still boots).
import express from 'express';
import crypto from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { mcpAuthRouter, getOAuthProtectedResourceMetadataUrl } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import { InvalidTokenError } from '@modelcontextprotocol/sdk/server/auth/errors.js';

const PUBLIC_URL = (process.env.PUBLIC_URL || '').replace(/\/+$/, '');
const OAUTH_SECRET = process.env.MCP_OAUTH_SECRET || '';
const LOGIN_PASSWORD = process.env.MCP_LOGIN_PASSWORD || '';

export const OAUTH_ENABLED = Boolean(PUBLIC_URL && OAUTH_SECRET && LOGIN_PASSWORD);

// Issuer (AS) is the origin; the canonical resource (RS, and the token
// audience) is the MCP endpoint URL — per RFC 8707 / the MCP auth spec.
const ISSUER = OAUTH_ENABLED ? new URL(PUBLIC_URL).href : '';
const RESOURCE = OAUTH_ENABLED ? new URL('/mcp', PUBLIC_URL).href : '';

const ACCESS_TTL = '1h';
const REFRESH_TTL = '30d';
const CODE_TTL = '60s'; // short-lived; PKCE binds it to the client
const AUTHREQ_TTL = '10m'; // how long the login page stays valid

const key = new TextEncoder().encode(OAUTH_SECRET);

/** Sign a typed JWT. `typ` namespaces tokens so one kind can't be used as another. */
async function sign(payload, typ, ttl) {
  const jwt = new SignJWT({ ...payload, typ }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setIssuer(ISSUER);
  if (ttl) jwt.setExpirationTime(ttl);
  return jwt.sign(key);
}

/** Verify signature + issuer + expiry, and assert the token's `typ`. Throws on any failure. */
async function verify(token, typ) {
  const { payload } = await jwtVerify(token, key, { issuer: ISSUER });
  if (payload.typ !== typ) throw new Error(`unexpected token type ${payload.typ} (want ${typ})`);
  return payload;
}

function passwordOk(input) {
  const a = Buffer.from(String(input ?? ''));
  const b = Buffer.from(LOGIN_PASSWORD);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ------------------------------------------------------------------ */
/* OAuthServerProvider (stateless)                                     */
/* ------------------------------------------------------------------ */

const clientsStore = {
  // Recover a registered client by decoding its signed client_id.
  async getClient(clientId) {
    try {
      const p = await verify(clientId, 'rc');
      return {
        client_id: clientId,
        redirect_uris: Array.isArray(p.redirect_uris) ? p.redirect_uris : [],
        token_endpoint_auth_method: 'none',
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        scope: 'mcp',
      };
    } catch {
      return undefined;
    }
  },
  // DCR: mint a client_id that encodes the redirect_uris (no server-side store).
  // Treated as a public client (PKCE, no secret) — which is what Claude uses.
  async registerClient(client) {
    const redirect_uris = Array.isArray(client.redirect_uris) ? client.redirect_uris : [];
    const client_id = await sign({ redirect_uris }, 'rc'); // no expiry: client_id is durable
    return { ...client, client_id, client_id_issued_at: Math.floor(Date.now() / 1000) };
  },
};

async function issueTokens(clientId, scope) {
  const access_token = await sign({ client_id: clientId, scope, aud: RESOURCE }, 'at', ACCESS_TTL);
  const refresh_token = await sign({ client_id: clientId, scope }, 'rt', REFRESH_TTL);
  return { access_token, token_type: 'Bearer', expires_in: 3600, scope, refresh_token };
}

const provider = {
  get clientsStore() {
    return clientsStore;
  },

  // Render the password gate. The SDK has already validated client_id,
  // redirect_uri (against the registered set), response_type=code and S256.
  // We carry that validated request through the form as a signed `areq` token.
  async authorize(client, params, res) {
    const areq = await sign(
      {
        client_id: client.client_id,
        redirect_uri: params.redirectUri,
        code_challenge: params.codeChallenge,
        state: params.state,
        scope: (params.scopes || []).join(' '),
      },
      'areq',
      AUTHREQ_TTL,
    );
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).type('html').send(loginPage(areq));
  },

  // The SDK calls this to fetch the PKCE challenge, then verifies it itself.
  async challengeForAuthorizationCode(client, code) {
    const p = await verify(code, 'code');
    if (p.client_id !== client.client_id) throw new Error('client_id mismatch');
    return p.code_challenge;
  },

  async exchangeAuthorizationCode(client, code, _codeVerifier, redirectUri) {
    const p = await verify(code, 'code');
    if (p.client_id !== client.client_id) throw new Error('client_id mismatch');
    if (redirectUri && redirectUri !== p.redirect_uri) throw new Error('redirect_uri mismatch');
    return issueTokens(client.client_id, p.scope || 'mcp');
  },

  async exchangeRefreshToken(client, refreshToken, scopes) {
    const p = await verify(refreshToken, 'rt');
    if (p.client_id !== client.client_id) throw new Error('client_id mismatch');
    const scope = (scopes && scopes.length ? scopes.join(' ') : p.scope) || 'mcp';
    return issueTokens(client.client_id, scope);
  },

  // Gate for every POST /mcp (via requireBearerAuth). Reject anything that
  // isn't one of our access tokens bound to this exact resource (audience).
  async verifyAccessToken(token) {
    let p;
    try {
      p = await verify(token, 'at');
    } catch {
      throw new InvalidTokenError('Invalid or expired access token');
    }
    if (p.aud !== RESOURCE) throw new InvalidTokenError('Token audience mismatch');
    return {
      token,
      clientId: p.client_id,
      scopes: String(p.scope || '').split(' ').filter(Boolean),
      expiresAt: p.exp,
      resource: new URL(RESOURCE),
    };
  },
};

/* ------------------------------------------------------------------ */
/* Login gate (password -> authorization code)                         */
/* ------------------------------------------------------------------ */

// Best-effort per-client throttle on the password form. In-memory, so it's
// per-instance only, but it raises the bar; the password itself must be strong.
const attempts = new Map(); // ip -> { n, resetAt }
const MAX_ATTEMPTS = 10;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;

function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || 'unknown';
}
function throttled(req) {
  const rec = attempts.get(clientIp(req));
  return Boolean(rec && rec.resetAt > Date.now() && rec.n >= MAX_ATTEMPTS);
}
function noteFailure(req) {
  const ip = clientIp(req);
  const rec = attempts.get(ip);
  if (!rec || rec.resetAt <= Date.now()) attempts.set(ip, { n: 1, resetAt: Date.now() + ATTEMPT_WINDOW_MS });
  else rec.n += 1;
}

async function loginHandler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (throttled(req)) {
    res.status(429).type('html').send(noticePage('Too many attempts. Wait a few minutes and try again.'));
    return;
  }
  const { req: areqToken, password } = req.body || {};
  let areq;
  try {
    areq = await verify(areqToken, 'areq');
  } catch {
    res.status(400).type('html').send(noticePage('This authorization request expired. Start again from Claude.'));
    return;
  }
  if (!passwordOk(password)) {
    noteFailure(req);
    res.status(401).type('html').send(loginPage(areqToken, 'Incorrect password.'));
    return;
  }
  attempts.delete(clientIp(req));
  const code = await sign(
    { client_id: areq.client_id, redirect_uri: areq.redirect_uri, code_challenge: areq.code_challenge, scope: areq.scope },
    'code',
    CODE_TTL,
  );
  const url = new URL(areq.redirect_uri);
  url.searchParams.set('code', code);
  if (areq.state) url.searchParams.set('state', areq.state);
  res.redirect(302, url.href);
}

/* ------------------------------------------------------------------ */
/* HTML                                                                */
/* ------------------------------------------------------------------ */

const PAGE_HEAD = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Authorize · ange-website MCP</title><style>
:root{color-scheme:light dark}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;font:15px/1.5 system-ui,-apple-system,sans-serif;background:#0b0b0c;color:#e7e7e9}
.card{width:min(92vw,360px);background:#161618;border:1px solid #26262a;border-radius:14px;padding:28px}
h1{font-size:17px;margin:0 0 4px}.sub{margin:0 0 20px;color:#9a9aa2;font-size:13px}
label{display:block;font-size:12px;color:#9a9aa2;margin:0 0 6px}
input{width:100%;padding:11px 12px;border-radius:9px;border:1px solid #303036;background:#0f0f11;color:#e7e7e9;font-size:14px}
button{margin-top:16px;width:100%;padding:11px;border:0;border-radius:9px;background:#e7e7e9;color:#0b0b0c;font-weight:600;font-size:14px;cursor:pointer}
.err{color:#ff7a7a;font-size:13px;margin:0 0 14px}</style></head><body>`;

function loginPage(areq, error) {
  const err = error ? `<p class="err">${error}</p>` : '';
  return `${PAGE_HEAD}<form class="card" method="post" action="/auth/login" autocomplete="off">
<h1>Authorize Claude</h1><p class="sub">Connect to the ange-website CMS. Enter the access password to continue.</p>
${err}<input type="hidden" name="req" value="${areq}">
<label for="p">Password</label>
<input id="p" type="password" name="password" autocomplete="current-password" autofocus required>
<button type="submit">Authorize</button></form></body></html>`;
}

function noticePage(message) {
  return `${PAGE_HEAD}<div class="card"><h1>ange-website MCP</h1><p class="sub">${message}</p></div></body></html>`;
}

/* ------------------------------------------------------------------ */
/* Wiring                                                              */
/* ------------------------------------------------------------------ */

/**
 * Mounts the OAuth AS+RS endpoints on `app` and returns the bearer middleware
 * for POST /mcp, or null when OAuth isn't configured.
 */
export function setupOAuth(app) {
  if (!OAUTH_ENABLED) return null;

  // Our password gate. The SDK provides /authorize (renders the form via
  // provider.authorize) but not the credential check + code issuance.
  app.post('/auth/login', express.urlencoded({ extended: false }), loginHandler);

  // Standard MCP endpoints, mounted at the app root:
  //   /authorize  /token  /register
  //   /.well-known/oauth-authorization-server
  //   /.well-known/oauth-protected-resource/mcp
  app.use(
    mcpAuthRouter({
      provider,
      issuerUrl: new URL(ISSUER),
      resourceServerUrl: new URL(RESOURCE),
      scopesSupported: ['mcp'],
      resourceName: 'ange-website Strapi CMS',
      clientRegistrationOptions: { clientIdGeneration: false }, // we mint the client_id
    }),
  );

  const resourceMetadataUrl = getOAuthProtectedResourceMetadataUrl(new URL(RESOURCE));
  const bearer = requireBearerAuth({ verifier: provider, resourceMetadataUrl });
  return { bearer, resourceMetadataUrl, resource: RESOURCE, issuer: ISSUER };
}
