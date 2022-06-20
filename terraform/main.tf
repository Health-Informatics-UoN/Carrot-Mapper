# Configure the Azure provider
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 2.65"
    }
  }
  required_version = ">= 0.14.9"
  backend "azurerm" {
    resource_group_name  = "ccnet-tf-test"
    storage_account_name = "tfstateccnet"
    container_name       = "terraformtest"
    key                  = "terraformtest.tfstate"
  }
}
provider "azurerm" {
  skip_provider_registration = "true"
  features {}
}
# Generate a random integer to create a globally unique name
resource "random_integer" "ri" {
  min = 10000
  max = 99999
}
# Create the resource group
data "azurerm_resource_group" "rg" {
  name     = "ccnet-tf-test"
}
# Create the Linux App Service Plan
resource "azurerm_app_service_plan" "appserviceplan" {
  name                = "webapp-asp-${random_integer.ri.result}"
  location            = data.azurerm_resource_group.rg.location
  resource_group_name = data.azurerm_resource_group.rg.name
  sku {
    tier = "Free"
    size = "F1"
  }
}
# Create the web app, pass in the App Service Plan ID, and deploy code from a public GitHub repo
resource "azurerm_app_service" "webapp" {
  name                = "webapp-${random_integer.ri.result}"
  location            = data.azurerm_resource_group.rg.location
  resource_group_name = data.azurerm_resource_group.rg.name
  app_service_plan_id = azurerm_app_service_plan.appserviceplan.id
  source_control {
    repo_url           = "https://github.com/HDRUK/CaRROT-Mapper"
    branch             = "devel"
    manual_integration = true
    use_mercurial      = false
  }
}