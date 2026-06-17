# Docker image registry for the backend + frontend images.
resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = var.project_id
  description   = "Docker images for ${var.project_id}"
  format        = "DOCKER"
  depends_on    = [google_project_service.apis]
}
