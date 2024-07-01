# The following variables are expected to be present as environment variables 
variable "org" {}
variable "webhook_secret" {}
variable "private_key" {}
variable "app_id" {}
variable "client_id" {}
variable "subscription_id" {}
variable "tenant_id" {}

terraform {
  backend "azurerm" {}
}

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "3.110.0"
    }
  }
}

provider "azurerm" {
  use_oidc        = true
  subscription_id = var.subscription_id
  tenant_id       = var.tenant_id
  client_id       = var.client_id
  features {}
}

resource "azurerm_resource_group" "honeybadger" {
  name     = var.resource-group.name
  location = var.resource-group.location
}

resource "azurerm_service_plan" "honeybadger-asp" {
  name                = var.app-service-plan.name
  location            = azurerm_resource_group.honeybadger.location
  resource_group_name = azurerm_resource_group.honeybadger.name
  os_type             = var.app-service-plan.os-type
  sku_name            = var.app-service-plan.sku-name
}

resource "azurerm_linux_web_app" "honeybadger-app" {
  name = "${var.linux-web-app-name}-${var.org}"
  identity {
    type = "SystemAssigned"
  }

  resource_group_name = azurerm_resource_group.honeybadger.name
  location            = azurerm_service_plan.honeybadger-asp.location
  service_plan_id     = azurerm_service_plan.honeybadger-asp.id
  https_only          = true

  logs {
    http_logs {
      file_system {
        retention_in_days = 4
        retention_in_mb   = 25
      }
    }
    failed_request_tracing = true
  }

  app_settings = {
    "WEBHOOK_SECRET"                    = var.webhook_secret
    "APP_ID"                            = var.app_id
    "PRIVATE_KEY"                       = var.private_key
  }

  site_config {
    application_stack {
      docker_image     = var.docker-config.image
      docker_image_tag = var.docker-config.tag
    }
    http2_enabled                     = true
    ftps_state                        = "Disabled"
    health_check_path                 = "/probot"
    health_check_eviction_time_in_min = 2
  }
}
