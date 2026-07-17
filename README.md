# PBM School Management

The repository is an npm workspace with three independent applications:

```text
apps/website   Public website and shared Vite development host (port 5173)
apps/admin     Admin panel source (served at /admin)
apps/api       Express/MySQL API (port 5000)
database       Database schemas and migrations
deploy         Windows VPS deployment files
```

## First setup

```powershell
cd D:\pbm
npm install
Copy-Item apps\api\.env.example apps\api\.env
```

Update `apps\api\.env` with the MySQL and JWT values.

## Local development

Start the website and admin panel on one frontend server:

```powershell
npm run dev
```

Start the backend in another terminal:

```powershell
npm run dev:api
```

URLs:

- Website: http://127.0.0.1:5173
- Admin: http://127.0.0.1:5173/admin/login
- API health: http://127.0.0.1:5000/api/health

Use `npm run dev:all` to start all three applications in one terminal.

## Production build

```powershell
npm run build
npm start
```

The API serves the website at `/`, the admin panel at `/admin`, API routes at `/api`, and uploaded files at `/uploads`.
