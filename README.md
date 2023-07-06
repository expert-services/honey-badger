# Probot application that uses CodeQL to scan workflow files
This Probot application can be deployed as an Azure Web App (via docker container) to use CodeQL to scan GitHub Actions workflow files as part of a custom [Deployment Protection Rule](https://docs.github.com/en/actions/deployment/protecting-deployments/creating-custom-deployment-protection-rules). In general the application listens for a `deployment_protection_rule` event in a GitHub repository and then
  * Downloads the workflow file that invoked the Deployment Protection Rule 
  * Uses CodeQL to scan the workflow file for vulnerabilities
  * Sends a `POST` back to GitHub approving or rejecting the workflow execution

### Functional Architecture
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