# PBM Backend

This backend uses Express, JWT authentication, and MySQL.

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

