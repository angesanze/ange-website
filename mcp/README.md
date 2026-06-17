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

| Var                | Purpose                                                        |
| ------------------ | -------------------------------------------------------------- |
| `STRAPI_URL`       | Base URL of the Strapi backend (Cloud Run).                    |
| `STRAPI_API_TOKEN` | Strapi **full-access** API token (Settings → API Tokens).      |
| `MCP_AUTH_TOKEN`   | Bearer token clients must send (`Authorization: Bearer …`).    |

In production these come from Secret Manager; see the repo `DEPLOY.md`.

## Connecting an AI client

The endpoint is `https://<mcp-url>/mcp` with header `Authorization: Bearer <MCP_AUTH_TOKEN>`.

**Claude Desktop** (`claude_desktop_config.json`) via the `mcp-remote` bridge:

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

**Cursor / other clients that accept a URL + headers**: point them at the same
URL with the same `Authorization` header.

## Local dev

```bash
cd mcp
npm install
STRAPI_URL=http://localhost:1338 STRAPI_API_TOKEN=<dev token> MCP_AUTH_TOKEN=dev node src/server.js
# then POST JSON-RPC to http://localhost:8080/mcp
```
