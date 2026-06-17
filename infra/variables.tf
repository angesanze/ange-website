variable "project_id" {
  description = "GCP project ID"
  type        = string
  default     = "ange-website"
}

variable "region" {
  description = "GCP region for all resources"
  type        = string
  default     = "europe-west1"
}

variable "db_password" {
  description = "PostgreSQL password for the application user"
  type        = string
  sensitive   = true
}

# Strapi secrets — injected into the backend Cloud Run service from Secret Manager.
variable "app_keys" {
  description = "Strapi APP_KEYS (comma-separated)"
  type        = string
  sensitive   = true
}
variable "api_token_salt" {
  type      = string
  sensitive = true
}
variable "admin_jwt_secret" {
  type      = string
  sensitive = true
}
variable "transfer_token_salt" {
  type      = string
  sensitive = true
}
variable "jwt_secret" {
  type      = string
  sensitive = true
}
variable "encryption_key" {
  type      = string
  sensitive = true
}
