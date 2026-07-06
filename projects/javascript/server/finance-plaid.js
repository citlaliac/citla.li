function plaidBaseUrl() {
  const env = (process.env.PLAID_ENV || 'sandbox').toLowerCase();
  if (env === 'production') return 'https://production.plaid.com';
  if (env === 'development') return 'https://development.plaid.com';
  return 'https://sandbox.plaid.com';
}

async function plaidRequest(path, body) {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  if (!clientId || !secret) {
    throw new Error('PLAID_CLIENT_ID and PLAID_SECRET must be set');
  }
  const res = await fetch(`${plaidBaseUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, secret, ...body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error_message || data.display_message || data.error_code || `Plaid error (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

function createLinkToken({ clientUserId }) {
  return plaidRequest('/link/token/create', {
    user: { client_user_id: clientUserId },
    client_name: 'citla.li Finance',
    products: ['transactions'],
    country_codes: ['US'],
    language: 'en',
    transactions: { days_requested: 90 },
  });
}

function exchangePublicToken(publicToken) {
  return plaidRequest('/item/public_token/exchange', { public_token: publicToken });
}

function syncTransactions(accessToken, cursor) {
  const body = { access_token: accessToken };
  if (cursor) body.cursor = cursor;
  return plaidRequest('/transactions/sync', body);
}

module.exports = {
  createLinkToken,
  exchangePublicToken,
  syncTransactions,
};
