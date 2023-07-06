# Probot application that uses CodeQL to scan workflows
This Probot application can be deployed as an Azure Web App (via docker container) to use CodeQL to scan GitHub Actions workflow files as part of a custom [Deployment Protection Rule](https://docs.github.com/en/actions/deployment/protecting-deployments/creating-custom-deployment-protection-rules). In general the application listens for a `deployment_protection_rule` event in a GitHub repository and then
  * Downloads the workflow file that invoked the Deployment Protection Rule 
  * Uses CodeQL to scan the workflow file for vulnerabilities
  * Sends a `POST` back to GitHub approving or rejecting the workflow execution

## Functional Architecture
![image](https://github.com/expert-services/honey-badger/assets/107562400/db6bebcb-ef57-48ff-8a40-785cf020edf8)

1. A given workflow reaches a job that references an environment that has the custom deployment protection rule enabled
2. Deployment protection rule event generated
3. GitHub App Installation acting as deployment protection rule receives webhook
4. GitHub App downloads only the `.github/workflows/<file>` workflow mentioned in the webhook
5. GitHub App uses the CodeQL CLI and its JavaScript extractor to create a database
6. The GitHub Actions CodeQL library supports built-in queries that are used analyze the database and create a `results.sarif` file
7. The `results.sarif` file is parsed by the GitHub App to determine if the workflow is compliant
8. The GitHub App sends an approval/rejection `POST` to the GitHub REST API

## Requirements
1. A GitHub App must be installed on the repositories that you wish to use environments and deployment protection rules on
     - The **GitHub App name** must be supplied with a name (e.g., my-org-honey-badger)
     - The **Homepage URL** must be provided (e.g., https://github.com/expert-services/honey-badger )
     - The initial **Webhook URL** must be a temporary one (e.g., https://example.com)
     - A **Webhook secret** must be generated and used
     - It must have **Read-only** to **Actions** as a Repository permission
     - It must have **Read and write** to **Deployments** as a Repository permission
     - It must be subscribed to the **Deployment protection rule** event
     - It should be installed **Only on this account** (i.e., not on Any account)
2. Generate a **Private key** for the GitHub App and Base64 encode the associated `.pem` file

    ```console
    foo@bar:~$ base64 -i oodles-noodles-honey-badger.YYYY-MM-DD.private-key.pem
    LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFb3dJQkFBS0NBUUVBa2xwaVlUdEZQbG5kdWdySDNOcGlvaGNZN1ZwNTlYMkhGTjJXM
    jZKdHkzYkRJWTJCClpJc20rRGN5dEZNb0kxbUg3UGUvUk1CN0xuOXZLS2N5Sk1kNVRuakxwUTBZWGdCOFRlQzdTa2tHNFB3alZKWlEKK1RlN3hiQU
    ...
    ...

    foo@bar:~$
    ```
3. Install the GitHub App on some or all the repositories in the Organization
4. Create a repository to store needed configuration items and deploy required infrastructure (e.g., my-org/honey-badger)
5. Create values the following as **Repository secrets** in the repository created in Step 3
     - **CLIENT_ID**: The client ID of the Azure App Registration used to deploy infrastructure
     - **TENANT_ID**: The tenant ID of the Azure App Registration used to deploy infrastructure
     - **SUBSCRIPTION_ID**: The subscription ID of the Azure subscription that infrastructure is to be deployed to
     - **APP_ID**: The GitHub App ID
     - **WEBHOOK_SECRET**: The Webhook secret specified when creating the GitHub App
     - **PRIVATE_KEY**: The Base64 string associated with the GitHub Apps Private key `.pem` file

## Deploy Infrastructure 
Infrastructure is required to process webhook events, as well as execute CodeQL scans. Several Azure services are used to provide the needed runtimes, configurations, and storage that allows for easy reporting layers to be integrated.

> **Note**
> In this case it is assumed that a Federated credential for GitHub Actions has been [correctly configured](https://github.com/marketplace/actions/azure-login#configure-a-federated-credential-to-use-oidc-based-authentication).

### Terraform
Use GitHub Actions 🚀 to execute Terraform CLI commands 

1. Create a file named `/.github/workflows/deploy_to_azure.yml` in the repository created during Step 4 of the Requirements section. Optionally update the `app-name:` value that is used in the names of Azure resources

```
name: Honey Badger
on:
  workflow_dispatch:
  push:
    branches: ['main']
    paths:
      - 'terraform/**'
jobs:     
  Deploy:
    uses: expert-services/reusable-workflows/.github/workflows/deploy_github_app.yml@main
    with:
      app-name: hb
      cloud-provider: az
    secrets: inherit
```

2. Copy the contents of [terraform/](terraform/) into the repository created during Step 4 of the Requirements section
   1. Optionally edit the default values in the `variables.tf` file copied in Step 1
3. Upon committing the files Step 2 observe the `deploy_to_azure.yml` workflow execute
4. Update the GitHub App **Webook URL** mentioned in Step 1 of the Requirements section to the URL of the App Service that is deployed

> **Note**
> If using the default values in [terraform/variables.tf](terraform/variables.tf), resources will be deployed in the East US region

### State Management
Code is included as part of the referenced reusable workflow at  [expert-services/reusable-workflows/.github/workflows/deploy_github_app.yml](https://github.com/expert-services/reusable-workflows/blob/main/.github/workflows/deploy_github_app.yml) to boostrap and maintain the needed Azure infrastructure for Terraform state files. The workflow creates an Azure Storage Account `<app-name>state<GITHUB_ORG>` (omitting `-` characters, limiting the name to 24 characters), as well as a storage container named `<GITHUB_ORG>-tfstate` if they are not present. This Azure Storage Account is then referenced as part of a backend configuration for Terraform state when initializing with the `terraform` CLI. If these values create a collision or are not up to the desired naming standards, change them before executing the workflow.

```powershell 
...
...

terraform init -backend-config="resource_group_name=$($storageAccount.ResourceGroupName)" `
               -backend-config="storage_account_name=$($storageAccount.StorageAccountName)" `
               -backend-config="container_name=$env:GITHUB_REPOSITORY_OWNER-tfstate" `
               -backend-config="key=prod.terraform.tfstate" `
               -backend-config="use_oidc=true" `
               -backend-config="subscription_id=$env:TF_VAR_subscription_id" `
               -backend-config="tenant_id=$env:TF_VAR_tenant_id" `
               -backend-config="client_id=$env:TF_VAR_client_id" && terraform plan -out out.tfplan && terraform apply -auto-approve out.tfplan

...
...
```



## Examples
### Using Environments
### Accepted Workflow

```
name: "CodeQL Scan"
on:
  push:
  pull_request:
  workflow_dispatch:
jobs:
  analyze:
    name: Analyze
    environment: production
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write
    strategy:
      fail-fast: false
      matrix:
        language: [ 'javascript' ]
    steps:
    - name: Checkout repository
      uses: actions/checkout@v3
    - name: Initialize CodeQL
      uses: github/codeql-action/init@v2
      with:
        languages: ${{ matrix.language }}
        queries: security-extended
    - name: Perform CodeQL Analysis
      uses: github/codeql-action/analyze@v2
```

![image](https://github.com/expert-services/honey-badger/assets/107562400/e86966ec-327b-4c5d-8ffe-df94f608fc59)


### Rejected Workflow

[CWE-094 (Expression Injection)](https://github.com/github/codeql/blob/main/javascript/ql/src/Security/CWE-094/ExpressionInjection.ql)

```
name: Vulnerable Issue
on: 
  issue_comment:
  workflow_dispatch:
jobs:
  echo-body:
    environment: production
    runs-on: ubuntu-latest
    steps:
    - run: |
        echo '${{ github.event.comment.body }}'
```

![image](https://github.com/expert-services/honey-badger/assets/107562400/1dec51d8-1781-4e75-9ea7-c355bea79609)

## Query Suites
To identify the queries that CodeQL associates with GitHub Actions, the `@tag actions` metadata key is targeted by creating a query suite similar to the below. Using this method avoids using non-applicable queries, as support for scanning Actions workflow files is provided by the JavaScript extractor.   

```
- description: Actions-based security queries for JavaScript and TypeScript
- queries: .
- include:
    tags contain: actions
```

In addition to the native queries that are bundled with CodeQL, the GitHub Advanced Security Field Team has also created the following queries related to securing GitHub Actions
- [Unpinned tag for 3rd party Action in workflow](https://github.com/advanced-security/codeql-queries/blob/main/javascript/CWE-829/UnpinnedActionsTag.md)

## Local Development
To install this Probot application, follow these steps:
1. Clone this repository to your development environment
2. Create a .env file in the root directory of the repository with the following content, and replace the values in angle brackets with your own values:
    ```
    APP_ID=<your GitHub App ID> 
    PRIVATE_KEY=<your Github App private key>
    WEBHOOK_SECRET=<your GitHub App webhook secret>
    ```
3. Install dependencies by running `npm install` in the root directory of the repository
4. Build the TypeScript application by running `npm run build` in the root directory of the repository
5. On a terminal run the following command: `npm start`
