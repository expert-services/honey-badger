variable "docker-config" {
  type = object({
    image = string
    tag   = string
  })
  default = {
    image = "yjactionsmetrics.azurecr.io/beaver"
    tag   = "latest"
  }
}

variable "resource-group" {
  type = object({
    name     = string
    location = string
  })
  default = {
    name     = "honeybadger"
    location = "eastus"
  }
}

variable "app-service-plan" {
  type = object({
    name     = string
    os-type  = string
    sku-name = string
  })
  default = {
    name     = "honeybadger-appserviceplan"
    os-type  = "Linux"
    sku-name = "P1v3"
  }
}

variable "linux-web-app-name" {
  type    = string
  default = "honeybadger"
}
