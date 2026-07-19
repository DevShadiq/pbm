# API

Express and MySQL backend for the public website and admin panel.

Configuration lives in `.env` beside this file. Start it from the repository root with `npm run dev:api`.

Persistent uploads are stored under `uploads/` and production frontend builds are stored under `dist/website` and `dist/admin`.

## Password reset email (Brevo)

1. In Brevo, add and verify the sender email address that will send reset links.
2. Copy `apps/api/.env.example` to `apps/api/.env` and configure these values. Keep `BREVO_API_KEY` server-side; never put it in an admin or website `.env` file.

   ```env
   BREVO_API_KEY=xkeysib-your-secret-key
   BREVO_SENDER_EMAIL=no-reply@your-domain.com
   BREVO_SENDER_NAME=School Management
   PASSWORD_RESET_URL=https://your-domain.com/admin/reset-password
   PASSWORD_RESET_TTL_MINUTES=60
   ```

3. If the database was created from an older schema, run `database/migrations/20260719_password_reset_tokens.sql` once against the MySQL database.
4. Build the admin panel and restart the API. Users can then select **Forgot Password?** on `/admin/login`.

The flow stores only a SHA-256 hash of each single-use token, invalidates earlier reset links for the user, and does not reveal whether an email address has an account.
