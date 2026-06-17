# ange-website MCP server

A remote [MCP](https://modelcontextprotocol.io) server that lets an AI client
draft, edit and publish content on the site by talking to Strapi. Deployed on
Cloud Run as `ange-website-mcp`; transport is **stateless Streamable HTTP** at
`POST /mcp`.

## Tools

`get_content_model`, `list_entries`, `get_entry`, `create_entry`, `update_entry`,
`delete_entry`, `publish_entry`, `unpublish_entry`, `get_single`, `update_single`
— covering posts, thoughts, categories (collections) and global + profile
(single types).

## Config (env)

| Var                  | Purpose                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `STRAPI_URL`         | Base URL of the Strapi backend (Cloud Run).                             |
| `STRAPI_API_TOKEN`   | Strapi **full-access** API token (Settings → API Tokens).               |
| `MCP_AUTH_TOKEN`     | Static bearer for header-based clients (`Authorization: Bearer …`).      |
| `PUBLIC_URL`         | The server's own public URL — the OAuth issuer (e.g. the Cloud Run URL). |
| `MCP_OAUTH_SECRET`   | HS256 signing key for OAuth tokens (≥32 random chars). Enables OAuth.    |
| `MCP_LOGIN_PASSWORD` | Password shown on the OAuth authorize screen — who may connect Claude.   |

OAuth turns on only when `PUBLIC_URL` + `MCP_OAUTH_SECRET` + `MCP_LOGIN_PASSWORD`
are all set; otherwise only the static bearer is accepted. In production these come
from Secret Manager — see the repo `DEPLOY.md`.

## Connecting an AI client

Two ways in; both hit `https://<mcp-url>/mcp`.

**claude.ai (OAuth custom connector).** The web/desktop "Add custom connector"
dialog only speaks OAuth — it has no field for a static bearer. With OAuth enabled
this server is its own OAuth 2.1 authorization + resource server: add a custom
connector pointing at `https://<mcp-url>/mcp`, leave **OAuth Client ID / Secret
blank** (Claude registers itself via Dynamic Client Registration), and enter
`MCP_LOGIN_PASSWORD` on the authorize screen. Flow: 401 + `WWW-Authenticate` →
RFC 9728 discovery → DCR → PKCE (S256) authorization code → audience-bound JWT.

**Header-based clients (Claude Code, Cursor, Claude Desktop).** Send the static
bearer. Claude Code:

```bash
claude mcp add --transport http ange-website-mcp \
  https://<mcp-url>/mcp --header "Authorization: Bearer <MCP_AUTH_TOKEN>"
```

Claude Desktop (`claude_desktop_config.json`) via the `mcp-remote` bridge:

```json
{
  "mcpServers": {
    "ange-website": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://<mcp-url>/mcp", "--header", "Authorization: Bearer <MCP_AUTH_TOKEN>"]
    }
  }
}
```

## Local dev

```bash
cd mcp
npm install
STRAPI_URL=http://localhost:1338 STRAPI_API_TOKEN=<dev token> MCP_AUTH_TOKEN=dev node src/server.js
# then POST JSON-RPC to http://localhost:8080/mcp
```

To exercise the OAuth flow locally, also set `PUBLIC_URL=http://localhost:8080`
(the SDK allows a `localhost` issuer over HTTP), `MCP_OAUTH_SECRET=<32+ chars>` and
`MCP_LOGIN_PASSWORD=<pw>`. Discovery is then at
`/.well-known/oauth-authorization-server` and `/.well-known/oauth-protected-resource/mcp`.
