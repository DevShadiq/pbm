# Windows VPS Deployment

The repository contains separate website, admin, and API applications. Production builds are served by the API process:

- Website: `/`
- Admin: `/admin`
- API: `/api`
- Uploads: `/uploads`

## Requirements

Install Node.js 20 LTS or newer, MySQL 8, Nginx, and PM2. Point the domain to the VPS and open ports 80 and 443. Keep port 5000 private.

## Install

Copy the complete repository to a stable location. The included PM2 and Nginx files use `D:\pbm` to match this server; update those absolute paths if you choose a different location.

```powershell
Set-Location D:\pbm
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

## PM2 backend process

Install PM2 globally once from an elevated PowerShell session:

```powershell
npm install --global pm2
```

Start and persist the API process:

```powershell
New-Item -ItemType Directory -Force D:\pbm\logs
pm2 start deploy\windows-vps\ecosystem.config.cjs
pm2 save
pm2 status
```

`pm2 save` preserves the process list. On Windows, configure PM2 to restore it at boot using your approved service or Scheduled Task method.

Verify `http://127.0.0.1:5000/api/health`, then copy `nginx-sms.conf` into Nginx's `conf\sites-enabled` directory (or include it from `nginx.conf`) and reload Nginx:

```powershell
C:\nginx\nginx.exe -t
C:\nginx\nginx.exe -s reload
```

For later deployments, run `npm ci`, `npm run build`, and `pm2 reload school-management-api --update-env`.

## Backups

Back up the MySQL database and these persistent folders before every deployment:

```text
apps\api\uploads\students
apps\api\uploads\documents
apps\api\uploads\guardians
```
