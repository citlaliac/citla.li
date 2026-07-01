# citla.li dev server

Express API on port **4201** (see `server.js`). Run from this directory:

```bash
npm install
npm start
```

With the React app (`npm start` in `projects/javascript`), `npm run dev` in the parent folder starts both when configured.

## Meal planner API (local dev)

Mirrors production PHP (`meals-api.php`, `meals-recipe-import.php`):

| Method | Path | Notes |
|--------|------|--------|
| GET/POST/PUT/DELETE | `/api/meals/ingredients` | CRUD; `/:id` for single resource |
| GET/POST/PUT/DELETE | `/api/meals/recipes` | List filters: `?category=&tag=` |
| GET/POST/PUT/DELETE | `/api/meals/plans` | Weekly plans + meal slots |
| GET | `/api/meals/shopping?planId=` | Current list |
| POST | `/api/meals/shopping/generate` | Body: `{ planId }` |
| PATCH | `/api/meals/shopping/toggle` | Body: `{ itemId, isChecked }` |
| POST | `/api/meals/shopping/reset` | Body: `{ planId }` |
| POST | `/api/meals/import` | Body: `{ url }` — Schema.org JSON-LD preview |

Tables are created automatically from `schema-meals.sql` on first request (requires `MYSQL_PASSWORD` in `.env`).

Production: run `schema-meals.sql` on MySQL once, then deploy `*.php` via the GitHub Actions workflow.

## Catholic e Cloud accounts (local dev)

Mirrors production PHP (`cec-accounts-api.php`):

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/cec/names/check?username=` | Whether username is free (registered accounts only) |
| POST | `/api/cec/auth/register` | Body: `{ email, username, password, avatarId }` |
| POST | `/api/cec/auth/login` | Body: `{ email, password }` — local dev: `citlali` logs in without a password |
| GET | `/api/cec/me` | Header: `Authorization: Bearer <token>` |
| PATCH | `/api/cec/me` | Sync PP, rank progress, cooldowns |

Tables are created from `schema-cec-accounts.sql` on first request. The reigning Pope must have logged in or synced within the last **3 months** (`last_active_at`); otherwise the throne shows as *Sede Vacante*.

Production: `cec-accounts-api.php?resource=auth&action=register|login` and `?resource=me`.
