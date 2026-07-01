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
| POST | `/api/cec/auth/guest` | Body: `{ displayName, avatarId }` — name must be unique |
| POST | `/api/cec/auth/register` | Body: `{ email, password, displayName, avatarId }` |
| POST | `/api/cec/auth/login` | Body: `{ email, password }` |
| GET | `/api/cec/me` | Header: `Authorization: Bearer <token>` |
| PATCH | `/api/cec/me` | Sync PP, rank progress, cooldowns |

Tables are created from `schema-cec-accounts.sql` on first request.

Production: `cec-accounts-api.php?resource=auth&action=register|login` and `?resource=me`.
