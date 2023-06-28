# honey-badger
🦡 A Deployment Protection Rule (Probot app) that uses CodeQL to scan workflow files

![image](https://github.com/expert-services/honey-badger/assets/107562400/db6bebcb-ef57-48ff-8a40-785cf020edf8)

1. A given workflow reaches a job that references an environment that has the custom deployment protection rule enabled
2. Deployment protection rule event generated
3. GitHub App Installation acting as deployment protection rule receives webhook
4. GitHub App downloads only the `.github/workflows/<file>` workflow mentioned in the webhook
5. GitHub App uses the CodeQL CLI and its JavaScript extractor to create a database
6. The GitHub Actions CodeQL library supports built-in queries that are used analyze the database and create a `results.sarif` file
7. The `results.sarif` file is parsed by the GitHub App to determine if the workflow is compliant
8. The GitHub App sends an approval/rejection `POST` to the GitHub REST API
