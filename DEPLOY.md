# Deploy — Google Cloud + CI/CD

Production runs on **Google Cloud**, project `ange-website` (region `europe-west1`):

| Piece            | Service                                  |
| ---------------- | ---------------------------------------- |
| Frontend (SPA)   | Firebase Hosting (`ange-website.web.app`)  |
| Backend (Strapi) | Cloud Run (`ange-website-backend`)        |
| MCP server       | Cloud Run (`ange-website-mcp`)            |
| Database         | Cloud SQL for PostgreSQL (`ange-website-db`) |
| Media uploads    | Cloud Storage bucket (`ange-website-media`)  |
| Images           | Artifact Registry (`ange-website`)        |
| Secrets          | Secret Manager                            |

The backend reaches Cloud SQL through Cloud Run's built-in **Cloud SQL connector**
(Unix socket) — no VPC. Media is stored in GCS so it survives revisions. The
backend Cloud Run service scales to zero; the frontend is static on Firebase's CDN.

## One-time infrastructure (Terraform / OpenTofu)

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # then fill with strong secrets:
#   openssl rand -base64 32
tofu init
tofu apply
```

This creates Artifact Registry, Cloud SQL (instance + db + user), the GCS bucket,
the two service accounts (`-run` runtime, `-deployer` CI/CD), and the Strapi
secrets in Secret Manager. State is local (`infra/terraform.tfstate`, gitignored)
— it contains secrets, so keep it private.

> The live environment was bootstrapped with the equivalent gcloud calls; the
> Terraform here is the source of truth going forward (`tofu plan` should be clean,
> after `tofu import` of any pre-existing resources).

## CI/CD (GitHub Actions)

`.github/workflows/deploy.yml` runs on every push to `main`:

1. builds & pushes the backend image → deploys it to Cloud Run (with the Cloud SQL
   connection, the runtime SA, and the Secret Manager secrets wired in);
2. builds the frontend with `VITE_API_URL` = the backend URL → deploys it to
   **Firebase Hosting** (`firebase deploy`, authenticated with the same
   `GCP_CREDENTIALS` deployer key, which has `roles/firebasehosting.admin`).

It needs **one** GitHub secret:

```bash
# create a key for the deployer SA and store it as the Actions secret
gcloud iam service-accounts keys create key.json \
  --iam-account=ange-website-deployer@ange-website.iam.gserviceaccount.com
gh secret set GCP_CREDENTIALS < key.json
rm key.json
```

## After the first deploy

- **Create the admin user**: open `<backend-url>/admin` and register the first
  administrator (the public read API already works via the seed permissions).
- **Tighten CORS** (optional): the API allows all origins by default. To restrict
  it to the site, set `CORS_ORIGINS` on the backend:
  ```bash
  gcloud run services update ange-website-backend --region=europe-west1 \
    --update-env-vars=CORS_ORIGINS=<frontend-url>
  ```

## MCP server (work on the site via prompts)

`ange-website-mcp` (Cloud Run, code in `mcp/`) exposes the CMS to an AI client
over MCP (Streamable HTTP at `POST /mcp`): list/create/update/delete +
publish/unpublish posts & thoughts, and edit categories / global / profile.

Secrets drive it (all in Secret Manager; the runtime SA reads them):
- `ange-website-mcp-auth-token` — a static bearer for header-based clients (Claude
  Code / Desktop / Cursor). Read it with
  `gcloud secrets versions access latest --secret=ange-website-mcp-auth-token`.
- `ange-website-mcp-strapi-token` — a Strapi **full-access** API token. **Activate
  it once**: in the admin (`<backend>/admin` → Settings → API Tokens → create, type
  *Full access*), then:
  ```bash
  printf '<the-token>' | gcloud secrets versions add ange-website-mcp-strapi-token --data-file=-
  gcloud run services update ange-website-mcp --region=europe-west1 --update-secrets=STRAPI_API_TOKEN=ange-website-mcp-strapi-token:latest
  ```
- `ange-website-mcp-oauth-secret` + `ange-website-mcp-login-password` — enable the
  **OAuth** connector for claude.ai (its custom-connector dialog has no field for a
  static bearer). The service becomes its own OAuth 2.1 issuer; the login password
  gates who may authorize a client. **Create these before the next deploy** — the
  workflow references them, so a missing secret fails the MCP step:
  ```bash
  openssl rand -hex 32 | gcloud secrets create ange-website-mcp-oauth-secret    --data-file=-
  printf '<a-strong-password>' | gcloud secrets create ange-website-mcp-login-password --data-file=-
  for s in ange-website-mcp-oauth-secret ange-website-mcp-login-password; do
    gcloud secrets add-iam-policy-binding "$s" \
      --member="serviceAccount:ange-website-run@ange-website.iam.gserviceaccount.com" \
      --role="roles/secretmanager.secretAccessor"
  done
  ```
  `PUBLIC_URL` (the OAuth issuer) is set automatically by the deploy from the
  service's own URL. Rotating `ange-website-mcp-oauth-secret` invalidates all live
  Claude sessions (they re-authorize); changing the password applies on next login.

Connecting:
- **claude.ai** (OAuth, custom connector): add a custom connector with URL
  `https://<mcp-url>/mcp`, leave OAuth Client ID/Secret blank (Claude self-registers),
  then enter the login password on the authorize screen.
- **Header-based clients** (Claude Code, Cursor, Claude Desktop via `mcp-remote`):
  `https://<mcp-url>/mcp` with `Authorization: Bearer <auth-token>` — see `mcp/README.md`.

## Custom domain (ange.rocks)

The site is served at **https://ange.rocks** (Firebase Hosting custom domain).
`frontend/firebase.json` proxies Strapi's paths (`/admin`, `/content-manager`,
`/content-type-builder`, `/upload`, `/i18n`, `/users-permissions`, `/api`) to the
Cloud Run backend, so the **admin lives at https://ange.rocks/admin** while the rest
is the SPA. The backend runs with `PUBLIC_URL=https://ange.rocks` so the admin's API
calls resolve to those proxied paths.

> Firebase → Cloud Run proxying has a ~32 MB request cap; for very large media
> uploads, use the backend's Cloud Run URL `/admin` directly.

## Cost

Roughly a few €/month: Cloud SQL `db-f1-micro` is the only always-on cost; both
Cloud Run services and GCS are near-free at this traffic. `tofu destroy` removes
everything (the DB has `deletion_protection = false`).

## Local development

Unchanged — `docker compose up -d` (see README). Dev uses Strapi's local upload
provider and the Postgres container; production swaps in GCS + Cloud SQL via
`NODE_ENV=production`.
