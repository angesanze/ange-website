# Service accounts:
#   - runtime  : identity the backend Cloud Run service runs as (DB + GCS + secrets).
#   - deployer : used by GitHub Actions to build/push images and deploy Cloud Run.

resource "google_service_account" "runtime" {
  account_id   = "${var.project_id}-run"
  display_name = "${var.project_id} Cloud Run runtime"
}

resource "google_service_account" "deployer" {
  account_id   = "${var.project_id}-deployer"
  display_name = "${var.project_id} CI/CD deployer"
}

# ── Runtime SA roles ─────────────────────────────────────────────────────────
resource "google_project_iam_member" "runtime_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.runtime.email}"
}

# ── Deployer SA roles ────────────────────────────────────────────────────────
resource "google_project_iam_member" "deployer_run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.deployer.email}"
}

resource "google_project_iam_member" "deployer_ar_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.deployer.email}"
}

# Deployer must be able to deploy services that *run as* the runtime SA.
resource "google_service_account_iam_member" "deployer_actas_runtime" {
  service_account_id = google_service_account.runtime.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.deployer.email}"
}
