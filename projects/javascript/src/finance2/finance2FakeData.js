/**
 * Finance2-only fake data switch (does not affect live /finance).
 * Persisted in localStorage so the playground can practice without touching real txn.
 */

export const FINANCE2_FAKE_DATA_KEY = 'finance2_use_fake_data_v1';
export const FINANCE2_FAKE_DATA_EVENT = 'finance2-fake-data-changed';

/** True when Settings / banner toggle is on. */
export function isFinance2FakeDataEnabled() {
  try {
    return localStorage.getItem(FINANCE2_FAKE_DATA_KEY) === '1';
  } catch {
    return false;
  }
}

/** Persist toggle and notify layout + API consumers. */
export function setFinance2FakeDataEnabled(enabled) {
  try {
    localStorage.setItem(FINANCE2_FAKE_DATA_KEY, enabled ? '1' : '0');
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(
      new CustomEvent(FINANCE2_FAKE_DATA_EVENT, { detail: { enabled: !!enabled } })
    );
  } catch {
    /* ignore */
  }
}
