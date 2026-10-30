# DevOps Task Manager

A basic ASP.NET Core 10 application for practicing Azure Repos, Azure Pipelines, build artifacts, and deployment to Azure App Service. The app uses **in-memory task storage**: tasks reset after application restart/redeploy and are not shared between app instances.

## Run locally

1. Install the [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0).
2. Open a terminal in the folder containing `DevOpsTaskManager.csproj`.
3. Run `dotnet restore`, `dotnet build`, and `dotnet run`.
4. Open the HTTP/HTTPS address printed in the console (for example, `http://localhost:5000`).
5. Check `/api/health` for an API response.

## Push to Azure Repos

Create an EMPTY Azure Repos Git repository, then run:

```bash
git init
git add .
git commit -m "Initial ASP.NET Core task manager"
git branch -M main
git remote add origin https://dev.azure.com/YOUR_ORG/YOUR_PROJECT/_git/YOUR_REPO
git push -u origin main
```

Replace the URL with the **Clone** URL from Azure Repos. Authenticate as prompted.

## Deploy with YAML pipeline

1. Create an Azure App Service **Web App** with **Linux** as the OS and **.NET 10** runtime; choose your region and plan. An Azure subscription with sufficient permissions is needed, and App Service may incur charges.
2. Create or use an authorized **Azure Resource Manager** service connection in Azure DevOps > Project settings > Service connections.
3. Edit the variables `azureServiceConnection` and `webAppName` in `azure-pipelines.yml` to match the existing connection and App Service name.
4. Commit/push the YAML changes.
5. Azure DevOps > Pipelines > New pipeline > Azure Repos Git > your repository > Existing Azure Pipelines YAML file > `/azure-pipelines.yml` > Run. Grant service connection/resource permission if prompted.
6. The **Build** stage restores, builds, publishes, zips and uploads `drop/app.zip` as a pipeline artifact. The **Deploy** stage downloads the artifact automatically and deploys it to Azure App Service.
7. Visit `https://YOUR_WEB_APP_NAME.azurewebsites.net`.

**Important:** The YAML deployment task uses `webAppLinux` and requires a Linux App Service. If you create a Windows App Service instead, update `appType` to `webApp`.

## Alternative: Classic UI pipeline practice

**Build:** Pipelines > New pipeline > Use classic editor > Azure Repos Git > ASP.NET Core template (or Empty job). On a Microsoft-hosted agent, add **Use .NET Core** (SDK 10.0.x), **.NET Core restore**, **.NET Core build**, **.NET Core publish** (output to `$(Build.ArtifactStagingDirectory)/publish`), **Archive files** (zip the *contents* of that folder to `$(Build.ArtifactStagingDirectory)/app.zip`), and **Publish Build Artifacts** (publish staging directory as `drop`). Queue and verify the ZIP is produced.

**Release:** Pipelines > Releases > New pipeline > Empty job. Add the build pipeline as an artifact. Enable continuous deployment trigger if desired. Add an **Azure App Service deploy** task, choose the authorized Azure Resource Manager service connection, App Service, and package `$(System.DefaultWorkingDirectory)/**/app.zip`. Save, create release, and deploy. Classic UI labels may vary.

**Choose one deployment approach at a time** to avoid deploying the same commit from YAML and Classic simultaneously.

## API routes

| Method | Route | Description |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create task with JSON `{ "title": "My task" }` |
| PUT | `/api/tasks/{id}/toggle` | Mark task completed/incomplete |
| DELETE | `/api/tasks/{id}` | Delete task |

## Verify the artifact locally

```bash
dotnet publish DevOpsTaskManager.csproj -c Release -o ./published
```

The resulting `published` directory is the website content that is packaged for deployment.

## Troubleshooting

- **No SDK:** Install .NET 10 SDK or check `dotnet --info`.
- **Pipeline cannot deploy:** Confirm Azure subscription, service connection permission, App Service name, and Linux App Service type.
- **Website missing:** Verify the ZIP contains `DevOpsTaskManager.dll`, `web.config` if applicable, and `wwwroot/` at ZIP root rather than an extra `publish/` directory.
- **Tasks disappear:** Expected: storage is in memory. Add a persistent database as a future exercise.
- **Pipeline queue stalled:** Confirm a Microsoft-hosted parallel job is available to your Azure DevOps organization, or adapt the pool to your self-hosted agent and install .NET 10 on it.
