// Remote MCP server for the ange-website Strapi CMS.
// Transport: stateless Streamable HTTP (works on Cloud Run; each request is
// independent). Protected by a bearer token (MCP_AUTH_TOKEN). Talks to Strapi
// with a full-access API token (STRAPI_API_TOKEN).
import express from 'express';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { setupOAuth } from './oauth.js';

const PORT = Number(process.env.PORT) || 8080;
const STRAPI_URL = (process.env.STRAPI_URL || '').replace(/\/+$/, '');
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || '';
const MCP_AUTH_TOKEN = process.env.MCP_AUTH_TOKEN || '';

/** type alias → Strapi uid + REST path + kind + the field used for text search. */
const TYPES = {
  posts: { uid: 'api::post.post', kind: 'collection', path: 'posts', searchField: 'title' },
  thoughts: { uid: 'api::thought.thought', kind: 'collection', path: 'thoughts', searchField: 'body' },
  categories: { uid: 'api::category.category', kind: 'collection', path: 'categories', searchField: 'name' },
  global: { uid: 'api::global.global', kind: 'single', path: 'global' },
  profile: { uid: 'api::profile.profile', kind: 'single', path: 'profile' },
};
const COLLECTION_TYPES = Object.keys(TYPES).filter((t) => TYPES[t].kind === 'collection');
const SINGLE_TYPES = Object.keys(TYPES).filter((t) => TYPES[t].kind === 'single');
const PUBLISHABLE = ['posts', 'thoughts'];

const CONTENT_MODEL = `Content model for ange-website (Strapi v5).

Collections:
- posts (api::post.post) — draft & publish. Fields: title (string, required), slug (uid; PROVIDE a kebab-case slug on create, e.g. "my-post"), excerpt (text), content (markdown), category (set to a category documentId), tags (string[]), readingTime (int, minutes), featured (bool), icon (lucide name or emoji), cover/rowImage (images — set via admin UI).
- thoughts (api::thought.thought) — draft & publish. Fields: body (text, <=280 chars, required), mood (one of: calm, spark, warm, night, bitter, sweet).
- categories (api::category.category) — always live (no draft). Fields: name (required, unique), slug (uid; provide kebab-case), description (text), color (#rrggbb), accent (#rrggbb), icon (lucide name or emoji), order (int).

Single types:
- global (api::global.global) — site copy/config: siteName, tagline, brandIcon, homeTitle, homeSubtitle, homeCaption, filesTitle, filesDescription, filesIcon, thoughtsTitle, thoughtsSubtitle, thoughtsIcon, thoughtsDefaultView (carousel|grid|stack|random), aboutTitle, aboutIcon, navFiles, navThoughts, navAbout, footerText, headingFont, bodyFont, monoFont, customFonts (list of {family, url}).
- profile (api::profile.profile) — name, role, tagline, bio (markdown), location, email, socials (list of {label, url, icon}).

Workflow: create_entry makes a DRAFT. Edit with update_entry. Make it live with publish_entry (posts/thoughts only). Categories/global/profile are always live once saved.`;

/* ------------------------------------------------------------------ */
/* Strapi REST client                                                  */
/* ------------------------------------------------------------------ */

async function strapi(path, { method = 'GET', body } = {}) {
  if (!STRAPI_URL) throw new Error('STRAPI_URL is not configured on the MCP server.');
  if (!STRAPI_API_TOKEN) throw new Error('STRAPI_API_TOKEN is not configured — create a full-access API token in Strapi admin and set the secret.');
  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRAPI_API_TOKEN}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const msg = json?.error?.message || res.statusText;
    throw new Error(`Strapi ${method} ${path} -> ${res.status}: ${msg}`);
  }
  return json;
}

const qs = (obj) =>
  Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

const ok = (data) => ({ content: [{ type: 'text', text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }] });
const fail = (msg) => ({ content: [{ type: 'text', text: `Error: ${msg}` }], isError: true });

/* ------------------------------------------------------------------ */
/* MCP server + tools                                                  */
/* ------------------------------------------------------------------ */

function buildServer() {
  const server = new McpServer({ name: 'ange-website-strapi', version: '1.0.0' });

  server.registerTool(
    'get_content_model',
    { title: 'Get content model', description: 'Describe the site content types and their fields. Call this first.', inputSchema: {} },
    async () => ok(CONTENT_MODEL),
  );

  server.registerTool(
    'list_entries',
    {
      title: 'List entries',
      description: 'List entries of a collection (posts, thoughts, categories). Optionally filter by publish status or a text query.',
      inputSchema: {
        type: z.enum(['posts', 'thoughts', 'categories']),
        status: z.enum(['published', 'draft']).optional().describe('published (default) or draft'),
        query: z.string().optional().describe('case-insensitive text search'),
        page: z.number().int().positive().optional(),
        pageSize: z.number().int().positive().max(100).optional(),
      },
    },
    async ({ type, status, query, page = 1, pageSize = 25 }) => {
      try {
        const t = TYPES[type];
        const params = { 'pagination[page]': page, 'pagination[pageSize]': pageSize, populate: '*', sort: 'updatedAt:desc' };
        if (status) params.status = status;
        if (query) params[`filters[${t.searchField}][$containsi]`] = query;
        const json = await strapi(`/${t.path}?${qs(params)}`);
        const items = (json.data || []).map((e) => ({ documentId: e.documentId, ...e }));
        return ok({ total: json.meta?.pagination?.total, count: items.length, items });
      } catch (e) {
        return fail(e.message);
      }
    },
  );

  server.registerTool(
    'get_entry',
    {
      title: 'Get entry',
      description: 'Get one collection entry by documentId (fully populated).',
      inputSchema: { type: z.enum(['posts', 'thoughts', 'categories']), documentId: z.string(), status: z.enum(['published', 'draft']).optional() },
    },
    async ({ type, documentId, status }) => {
      try {
        const t = TYPES[type];
        const json = await strapi(`/${t.path}/${documentId}?${qs({ populate: '*', status })}`);
        return ok(json.data);
      } catch (e) {
        return fail(e.message);
      }
    },
  );

  server.registerTool(
    'create_entry',
    {
      title: 'Create entry (draft)',
      description: 'Create a new collection entry. For posts/thoughts it starts as a DRAFT — call publish_entry to make it live. Pass fields in `data` (see get_content_model). Set relations like category to a documentId.',
      inputSchema: { type: z.enum(['posts', 'thoughts', 'categories']), data: z.record(z.any()).describe('the entry fields') },
    },
    async ({ type, data }) => {
      try {
        const t = TYPES[type];
        const json = await strapi(`/${t.path}`, { method: 'POST', body: { data } });
        return ok({ created: true, documentId: json.data?.documentId, entry: json.data });
      } catch (e) {
        return fail(e.message);
      }
    },
  );

  server.registerTool(
    'update_entry',
    {
      title: 'Update entry',
      description: 'Update fields of a collection entry (edits the draft for posts/thoughts; re-publish to push changes live).',
      inputSchema: { type: z.enum(['posts', 'thoughts', 'categories']), documentId: z.string(), data: z.record(z.any()) },
    },
    async ({ type, documentId, data }) => {
      try {
        const t = TYPES[type];
        const json = await strapi(`/${t.path}/${documentId}`, { method: 'PUT', body: { data } });
        return ok({ updated: true, entry: json.data });
      } catch (e) {
        return fail(e.message);
      }
    },
  );

  server.registerTool(
    'delete_entry',
    {
      title: 'Delete entry',
      description: 'Permanently delete a collection entry by documentId.',
      inputSchema: { type: z.enum(['posts', 'thoughts', 'categories']), documentId: z.string() },
    },
    async ({ type, documentId }) => {
      try {
        const t = TYPES[type];
        await strapi(`/${t.path}/${documentId}`, { method: 'DELETE' });
        return ok({ deleted: true, documentId });
      } catch (e) {
        return fail(e.message);
      }
    },
  );

  for (const action of ['publish', 'unpublish']) {
    server.registerTool(
      `${action}_entry`,
      {
        title: `${action[0].toUpperCase()}${action.slice(1)} entry`,
        description: `${action} a post or thought by documentId.`,
        inputSchema: { type: z.enum(['posts', 'thoughts']), documentId: z.string() },
      },
      async ({ type, documentId }) => {
        try {
          const json = await strapi(`/manage/${action}`, { method: 'POST', body: { uid: TYPES[type].uid, documentId } });
          return ok({ [`${action}ed`]: true, entry: json.data });
        } catch (e) {
          return fail(e.message);
        }
      },
    );
  }

  server.registerTool(
    'get_single',
    {
      title: 'Get single type',
      description: 'Read the global settings or profile single type.',
      inputSchema: { type: z.enum(['global', 'profile']) },
    },
    async ({ type }) => {
      try {
        const json = await strapi(`/${TYPES[type].path}?populate=*`);
        return ok(json.data);
      } catch (e) {
        return fail(e.message);
      }
    },
  );

  server.registerTool(
    'update_single',
    {
      title: 'Update single type',
      description: 'Update the global settings or profile single type. Pass changed fields in `data`.',
      inputSchema: { type: z.enum(['global', 'profile']), data: z.record(z.any()) },
    },
    async ({ type, data }) => {
      try {
        const json = await strapi(`/${TYPES[type].path}`, { method: 'PUT', body: { data } });
        return ok({ updated: true, entry: json.data });
      } catch (e) {
        return fail(e.message);
      }
    },
  );

  return server;
}

/* ------------------------------------------------------------------ */
/* HTTP (stateless Streamable HTTP transport)                          */
/* ------------------------------------------------------------------ */

const app = express();
app.use(express.json({ limit: '4mb' }));

// OAuth authorization server + resource server endpoints, for the claude.ai
// custom connector. Returns null (and mounts nothing) unless PUBLIC_URL +
// MCP_OAUTH_SECRET + MCP_LOGIN_PASSWORD are all configured.
const oauth = setupOAuth(app);

// POST /mcp accepts either the static bearer (Claude Code / Desktop sending an
// Authorization header) or — when OAuth is on — a valid OAuth access token. An
// unauthenticated request gets a 401 + WWW-Authenticate so claude.ai begins
// OAuth discovery.
function mcpAuthGate(req, res, next) {
  const header = req.headers['authorization'] || '';
  if (MCP_AUTH_TOKEN && header === `Bearer ${MCP_AUTH_TOKEN}`) return next(); // static bearer
  if (oauth) return oauth.bearer(req, res, next); // OAuth token, or 401 + discovery
  if (!MCP_AUTH_TOKEN) return next(); // nothing configured: open (unchanged legacy behavior)
  res.status(401).json({ jsonrpc: '2.0', error: { code: -32001, message: 'Unauthorized — send Authorization: Bearer <MCP_AUTH_TOKEN> or connect via OAuth.' }, id: null });
}

app.get('/healthz', (_req, res) =>
  res.json({
    ok: true,
    strapiUrl: Boolean(STRAPI_URL),
    strapiTokenConfigured: Boolean(STRAPI_API_TOKEN),
    authRequired: Boolean(MCP_AUTH_TOKEN) || Boolean(oauth),
    oauth: Boolean(oauth),
  }),
);

app.post('/mcp', mcpAuthGate, async (req, res) => {
  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on('close', () => {
    transport.close();
    server.close();
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error('MCP request error:', err);
    if (!res.headersSent) res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null });
  }
});

// Stateless: no SSE stream / session teardown over GET/DELETE.
const methodNotAllowed = (_req, res) =>
  res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed. Use POST /mcp.' }, id: null });
app.get('/mcp', methodNotAllowed);
app.delete('/mcp', methodNotAllowed);

app.listen(PORT, () => {
  console.error(
    `ange-website MCP listening on :${PORT} (strapi=${STRAPI_URL || 'unset'}, staticBearer=${MCP_AUTH_TOKEN ? 'on' : 'off'}, oauth=${oauth ? 'on' : 'off'})`,
  );
});
