# Bun on Sliplane

1. Sign up to Sliplane
2. Go to Projects and open the default project
3. Click on Deploy Service and select the default server
4. Click on Repository in the Deploy From screen
5. Click on Select a Repository and then Configure Repository Access
6. Select your GitHub account and then click Only Selected Repositories
7. Click on Select Repositories and find your Bun repository
8. Click on Install & Authorize and wait for the dialog to close
9. Select the repository in the list and click on Deploy
10. Wait for the deployment to complete and check the generated URL

From this point on, the service will re-deploy on every push to GitHub.

Note that volumes can be created and attached to services at a selected path
like `/data` and they will preserve data between deployments.

Run using `bun start`, test using `bun test`.

See [the contribution guide](CONTRIBUTING.md).
