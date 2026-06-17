# Enable the GCP APIs the stack needs. (Also pre-enabled via gcloud in the
# bootstrap so resource creation never races API propagation.)
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "sqladmin.googleapis.com",
    "secretmanager.googleapis.com",
    "storage.googleapis.com",
    "iam.googleapis.com",
    "firebase.googleapis.com",
    "firebasehosting.googleapis.com",
  ])
  service            = each.value
  disable_on_destroy = false
}
