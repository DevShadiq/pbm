# Windows VPS Deployment

The repository contains separate website, admin, and API applications. Production builds are served by the API process:

- Website: `/`
- Admin: `/admin`
- API: `/api`
- Uploads: `/uploads`

## Requirements

Install Node.js 20 LTS or newer, MySQL 8, Caddy, and NSSM. Point the domain to the VPS and open ports 80 and 443. Keep port 5000 private.

## Install

Copy the complete repository to a stable location such as `C:\apps\pbm`.

```powershell
Set-Location C:\apps\pbm
npm ci
Copy-Item apps\api\.env.example apps\api\.env
```

Edit `apps\api\.env` with production MySQL and JWT values. Import `database\mysql-schema.sql`, followed by any required files in `database\migrations`.

Build both frontends:

```powershell
npm run build
```

The expected build files are:

```text
apps\api\dist\website\index.html
apps\api\dist\admin\index.html
```

Create the first administrator when required:

```powershell
npm run create-admin
```

## Windows service

Run in an elevated PowerShell session:

```powershell
nssm install SchoolManagementBackend "C:\Program Files\nodejs\node.exe" "C:\apps\pbm\apps\api\src\server.js"
nssm set SchoolManagementBackend AppDirectory "C:\apps\pbm\apps\api"
nssm set SchoolManagementBackend AppEnvironmentExtra "NODE_ENV=production"
nssm set SchoolManagementBackend Start SERVICE_AUTO_START
nssm start SchoolManagementBackend
```

Verify `http://127.0.0.1:5000/api/health`, then configure Caddy from `Caddyfile.example` and verify the public HTTPS URL.

## Backups

Back up the MySQL database and these persistent folders before every deployment:

```text
apps\api\uploads\students
apps\api\uploads\documents
apps\api\uploads\guardians
```
