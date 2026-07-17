# Windows VPS Deployment

This application runs as one Node.js service. Express serves the Vue frontend from `backend/dist`, the API from `/api`, and uploaded files from `/uploads`.

## 1. Prepare the VPS

Install these on the Windows VPS:

- Node.js 20 LTS or newer
- MySQL 8
- [Caddy](https://caddyserver.com/) for HTTPS and reverse proxying
- [NSSM](https://nssm.cc/) to run Node.js and Caddy as Windows services

Point your domain's A record to the VPS public IP, then open inbound TCP ports `80` and `443` in the VPS provider firewall and Windows Firewall. Keep port `5000` private.

## 2. Copy the application

Copy the `school-management` directory to a stable path, for example:

```powershell
C:\apps\school-management
```

Do not place it under a temporary user Downloads or Desktop folder.

## 3. Configure environment files

Create `backend\.env` from `backend\.env.example` and enter the MySQL and JWT values.

Create `.env.production` from `.env.production.example`. Keep `VITE_API_BASE_URL=/api` so the browser uses the same HTTPS domain for the frontend and API.

Generate a JWT secret with:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

## 4. Set up MySQL

Create the production database and import the project schema before starting the app. Use the current MySQL schema file from the repository, then create the production admin account if required:

```powershell
Set-Location C:\apps\school-management\backend
node .\create-admin.js
```

## 5. Install and build

```powershell
Set-Location C:\apps\school-management
npm ci
npm run build

Set-Location .\backend
npm ci --omit=dev
```

The build output must exist at `backend\dist\index.html`.

## 6. Start the Node.js service

Run this once in an elevated PowerShell session. Update the paths if you used another installation folder.

```powershell
nssm install SchoolManagementBackend "C:\Program Files\nodejs\node.exe" "C:\apps\school-management\backend\src\server.js"
nssm set SchoolManagementBackend AppDirectory "C:\apps\school-management\backend"
nssm set SchoolManagementBackend AppEnvironmentExtra "NODE_ENV=production"
nssm set SchoolManagementBackend Start SERVICE_AUTO_START
nssm start SchoolManagementBackend
```

Verify the private backend endpoint:

```powershell
Invoke-WebRequest http://127.0.0.1:5000/api/health
```

## 7. Enable HTTPS with Caddy

Copy `Caddyfile.example` to the Caddy folder as `Caddyfile`, replace `your-domain.example` with your actual domain, then install Caddy as a service:

```powershell
nssm install SchoolManagementCaddy "C:\caddy\caddy.exe" "run --config C:\caddy\Caddyfile"
nssm set SchoolManagementCaddy AppDirectory "C:\caddy"
nssm set SchoolManagementCaddy Start SERVICE_AUTO_START
nssm start SchoolManagementCaddy
```

Open `https://your-domain.example/api/health`. A successful response confirms the reverse proxy, backend, and TLS certificate are working.

## Updates and Backups

For each update, stop the backend service, back up `backend\uploads` and the MySQL database, deploy the new files, run `npm ci` and `npm run build`, then start the backend service again.

Uploaded student photos and documents are stored in:

```text
backend\uploads\students
backend\uploads\documents
backend\uploads\guardians
```

Back up those folders together with the MySQL database.
