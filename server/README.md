# PBM Backend

The root backend entry point now starts the merged `school-management/backend` Express API.
It uses JWT authentication, MySQL, uploads, and the school-management route modules.

## Setup

1. Copy `.env.example` to `.env`.
2. Update the MySQL credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pbm
```

3. Start the API:

```bash
npm run dev:api
```

The server no longer auto-creates or seeds the database on startup. Import the SQL schema/data explicitly before running the admin API.

## Default Admin

Use the admin account already present in your imported database, or run the backend's explicit admin helper if needed:

```bash
node school-management/backend/create-admin.js
```

## Reusable Access-Control Tables

The reusable auth core creates and manages:

```text
users
roles
user_roles
app_modules
app_pages
menus
permissions
role_permissions
```

Default permission actions:

```text
VIEW
CREATE
EDIT
UPDATE
DELETE
APPROVE
EXPORT
PRINT
```

Login returns the portable app context:

```json
{
  "user": {},
  "roles": ["SUPER_ADMIN"],
  "menus": [],
  "permissions": {
    "USER_MANAGEMENT": ["VIEW", "CREATE", "UPDATE"]
  }
}
```

Use backend middleware like:

```js
checkPermission('USER_MANAGEMENT', 'CREATE')
```

Admin access API:

```text
GET /api/admin/access
POST /api/admin/users
PUT /api/admin/users/:userId
POST /api/admin/roles
PUT /api/admin/roles/:roleId
PUT /api/admin/roles/:roleId/permissions
```
