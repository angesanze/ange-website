# Strapi secrets + DB password in Secret Manager. The backend Cloud Run service
# reads these as secret env vars (see DEPLOY.md / the CI workflow).
locals {
  secrets = {
    "app-keys"            = var.app_keys
    "api-token-salt"      = var.api_token_salt
    "admin-jwt-secret"    = var.admin_jwt_secret
    "transfer-token-salt" = var.transfer_token_salt
    "jwt-secret"          = var.jwt_secret
    "encryption-key"      = var.encryption_key
    "db-password"         = var.db_password
  }
}

resource "google_secret_manager_secret" "secret" {
  for_each  = local.secrets
  secret_id = "${var.project_id}-${each.key}"
  replication {
    auto {}
  }
  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "version" {
  for_each    = local.secrets
  secret      = google_secret_manager_secret.secret[each.key].id
  secret_data = each.value
}

# Runtime SA may read each secret.
resource "google_secret_manager_secret_iam_member" "runtime_access" {
  for_each  = local.secrets
  secret_id = google_secret_manager_secret.secret[each.key].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.runtime.email}"
}
