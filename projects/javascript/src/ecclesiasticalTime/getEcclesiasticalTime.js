import { ECCLESIASTICAL_FALLBACK, LITURGICAL_TODAY_PATH } from './constants';
import { normalizeLiturgicalDay } from './normalizeLiturgicalDay';

function isLiturgicalDayApi(value) {
  if (!value || typeof value !== 'object') return false;
  return typeof value.season === 'string' && Array.isArray(value.celebrations);
}

/**
 * Fetches today's General Roman Calendar (English) and returns normalized liturgical data.
 * On failure, returns fallback with season "Ordinary Time".
 */
export async function getEcclesiasticalTime(signal) {
  const fetchedAt = new Date().toISOString();

  try {
    const response = await fetch(LITURGICAL_TODAY_PATH, {
      signal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Liturgical API HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (!isLiturgicalDayApi(payload)) {
      throw new Error('Liturgical API returned unexpected shape');
    }

    return {
      data: normalizeLiturgicalDay(payload),
      source: 'api',
      fetchedAt,
      liturgicalDate: payload.date,
    };
  } catch {
    return {
      data: { ...ECCLESIASTICAL_FALLBACK },
      source: 'fallback',
      fetchedAt,
    };
  }
}
