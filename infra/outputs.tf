output "project_id" {
  value = var.project_id
}

output "region" {
  value = var.region
}

output "artifact_registry" {
  description = "Docker registry prefix for image pushes"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.repository_id}"
}

output "sql_connection_name" {
  description = "Cloud SQL instance connection name (PROJECT:REGION:INSTANCE)"
  value       = google_sql_database_instance.main.connection_name
}

output "db_name" {
  value = google_sql_database.app.name
}

output "db_user" {
  value = google_sql_user.app.name
}

output "gcs_bucket" {
  value = google_storage_bucket.media.name
}

output "runtime_sa_email" {
  value = google_service_account.runtime.email
}

output "deployer_sa_email" {
  value = google_service_account.deployer.email
}
