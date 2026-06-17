# Deploy — Google Cloud + CI/CD

Production runs on **Google Cloud**, project `ange-website` (region `europe-west1`):

| Piece            | Service                                  |
| ---------------- | ---------------------------------------- |
| Frontend (SPA)   | Firebase Hosting (`ange-website.web.app`)  |
| Backend (Strapi) | Cloud Run (`ange-website-backend`)        |
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

## Cost

Roughly a few €/month: Cloud SQL `db-f1-micro` is the only always-on cost; both
Cloud Run services and GCS are near-free at this traffic. `tofu destroy` removes
everything (the DB has `deletion_protection = false`).

## Local development

Unchanged — `docker compose up -d` (see README). Dev uses Strapi's local upload
provider and the Postgres container; production swaps in GCS + Cloud SQL via
`NODE_ENV=production`.
