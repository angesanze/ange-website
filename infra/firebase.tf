# Firebase Hosting for the frontend (the SPA is built in CI and deployed here).
# The backend stays on Cloud Run; only the static frontend lives on Firebase.

# Add Firebase to the GCP project.
resource "google_firebase_project" "default" {
  provider   = google-beta
  project    = var.project_id
  depends_on = [google_project_service.apis]
}

# Default Hosting site → https://<project_id>.web.app
resource "google_firebase_hosting_site" "default" {
  provider = google-beta
  project  = var.project_id
  site_id  = var.project_id
  depends_on = [google_firebase_project.default]
}

# Let the CI deployer publish to Firebase Hosting.
resource "google_project_iam_member" "deployer_firebase_hosting" {
  project = var.project_id
  role    = "roles/firebasehosting.admin"
  member  = "serviceAccount:${google_service_account.deployer.email}"
}
