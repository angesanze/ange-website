terraform {
  required_version = ">= 1.6"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 6.0"
    }
  }
  # State is kept locally (infra/terraform.tfstate, gitignored). For a team,
  # switch to a remote GCS backend.
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Firebase resources require the google-beta provider.
provider "google-beta" {
  project               = var.project_id
  region                = var.region
  user_project_override = true
}

locals {
  # Postgres identifiers: hyphens are awkward, so derive underscore names.
  db_name = replace(var.project_id, "-", "_")
  db_user = replace(var.project_id, "-", "_")
}
