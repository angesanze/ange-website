# Cloud SQL (PostgreSQL). The backend connects through the built-in Cloud Run
# Cloud SQL connector (Unix socket), so no VPC is required — access is gated by
# IAM (the runtime service account has roles/cloudsql.client), not the network.
resource "google_sql_database_instance" "main" {
  name             = "${var.project_id}-db"
  region           = var.region
  database_version = "POSTGRES_15"

  settings {
    tier              = "db-f1-micro"
    availability_type = "ZONAL"

    ip_configuration {
      ipv4_enabled = true # reachable only via the Cloud SQL connector; no authorized networks
    }

    backup_configuration {
      enabled = true
    }
  }

  deletion_protection = false # set true once you have data you care about
  depends_on          = [google_project_service.apis]
}

resource "google_sql_database" "app" {
  name     = local.db_name
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "app" {
  name     = local.db_user
  instance = google_sql_database_instance.main.name
  password = var.db_password
}
