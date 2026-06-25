# PBM Backend

This backend uses Express, JWT authentication, and MySQL.

It also includes a reusable role/menu/permission module for any Vue + Node.js + MySQL app.

## Setup

1. Copy `.env.example` to `.env`.
2. Update the MySQL credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pbm_education
```

3. Start the API:

```bash
npm run dev:api
```

The server automatically creates the database, tables, and seed data if the MySQL user has permission.

## Default Admin

Email: `admin@pbm.edu.bd`

Password: `Admin@12345`

Change this password before using the system in production.

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
