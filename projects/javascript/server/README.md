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

## Personal finance (local dev)

Private module at `/finance` (not linked from site nav). Mirrors `finance-api.php`.

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/finance/auth/login` | Body: `{ password }` |
| GET | `/api/finance/categories` | Bearer token |
| POST | `/api/finance/plaid/link-token` | Plaid Link token |
| POST | `/api/finance/plaid/exchange` | Body: `{ publicToken, institutionName }` |
| GET | `/api/finance/plaid/items` | Linked institutions |
| POST | `/api/finance/sync` | Pull transactions from Plaid |
| GET | `/api/finance/transactions?status=uncategorized` | Inbox |
| PATCH | `/api/finance/transactions/:id` | Body: `{ categoryId }` |
| GET | `/api/finance/reports?month=YYYY-MM` | Monthly totals |
| POST | `/api/finance/export?month=YYYY-MM` | Google Drive CSV; add `&download=1` for file download |

### `.env` (finance)

```env
FINANCE_ADMIN_PASSWORD=your-dev-password
# Or for production:
FINANCE_ADMIN_PASSWORD_HASH=
FINANCE_ENCRYPTION_KEY=   # openssl rand -hex 32
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox
FINANCE_GDRIVE_FOLDER_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
```

Generate a password hash: `node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"`

Tables seed from `schema-finance.sql` on first request. Production: `finance-api.php?resource=...&action=...`
