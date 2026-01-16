import {
  calculateSunAngle,
  getMoonPhase,
  getMoonPhaseValue,
  calculatePressureChange,
  getPressureInfo,
  formatTime,
  getMinYearlySunlightHours,
  getMaxYearlySunlightHours
} from '../weatherService';

describe('Weather Service', () => {
  describe('calculateSunAngle', () => {
    test('calculates sun angle for NYC at noon in summer', () => {
      // June 21, 2026 at noon (summer solstice, should be high angle)
      const date = new Date('2026-06-21T12:00:00-04:00'); // EDT
      const lat = 40.7336; // NYC
      const lon = -73.9983;
      
      const angle = calculateSunAngle(date, lat, lon);
      
      // At noon on summer solstice in NYC, sun should be around 73° high
      expect(angle).toBeGreaterThan(60);
      expect(angle).toBeLessThan(90);
    });

    test('calculates sun angle for NYC at midnight (below horizon)', () => {
      const date = new Date('2026-06-21T00:00:00-04:00');
      const lat = 40.7336;
      const lon = -73.9983;
      
      const angle = calculateSunAngle(date, lat, lon);
      
      // At midnight, sun should be below horizon (negative angle)
      expect(angle).toBeLessThan(0);
    });

    test('calculates sun angle for NYC at winter solstice noon', () => {
      // December 21, 2026 at noon (winter solstice, lower angle)
      const date = new Date('2026-12-21T12:00:00-05:00'); // EST
      const lat = 40.7336;
      const lon = -73.9983;
      
      const angle = calculateSunAngle(date, lat, lon);
      
      // At noon on winter solstice in NYC, sun should be around 26° high
      expect(angle).toBeGreaterThan(20);
      expect(angle).toBeLessThan(35);
    });

    test('handles DST correctly', () => {
      // Summer date (DST)
      const summerDate = new Date('2026-07-15T12:00:00-04:00');
      // Winter date (no DST)
      const winterDate = new Date('2026-01-15T12:00:00-05:00');
      
      const summerAngle = calculateSunAngle(summerDate, 40.7336, -73.9983);
      const winterAngle = calculateSunAngle(winterDate, 40.7336, -73.9983);
      
      // Both should be valid angles
      expect(typeof summerAngle).toBe('number');
      expect(typeof winterAngle).toBe('number');
    });
  });

  describe('getMoonPhase', () => {
    test('returns correct phase name for new moon', () => {
      // Approximate new moon date
      const date = new Date('2026-01-08T00:00:00Z');
      const phase = getMoonPhase(date);
      
      expect(phase).toMatch(/new moon/i);
    });

    test('returns correct phase name for full moon', () => {
      // Approximate full moon date
      const date = new Date('2026-01-23T00:00:00Z');
      const phase = getMoonPhase(date);
      
      expect(phase).toMatch(/full moon/i);
    });

    test('returns a valid phase name', () => {
      const date = new Date();
      const phase = getMoonPhase(date);
      
      const validPhases = [
        'New Moon',
        'Waxing Crescent',
        'First Quarter',
        'Waxing Gibbous',
        'Full Moon',
        'Waning Gibbous',
        'Last Quarter',
        'Waning Crescent'
      ];
      
      expect(validPhases).toContain(phase);
    });
  });

  describe('getMoonPhaseValue', () => {
    test('returns a value between 0 and 1', () => {
      const date = new Date();
      const phaseValue = getMoonPhaseValue(date);
      
      expect(phaseValue).toBeGreaterThanOrEqual(0);
      expect(phaseValue).toBeLessThan(1);
    });

    test('returns consistent value for same date', () => {
      const date = new Date('2026-01-15T12:00:00Z');
      const value1 = getMoonPhaseValue(date);
      const value2 = getMoonPhaseValue(date);
      
      expect(value1).toBe(value2);
    });
  });

  describe('calculatePressureChange', () => {
    test('calculates positive change correctly', () => {
      const current = 1020; // hPa
      const yesterday = 1010; // hPa
      
      const change = calculatePressureChange(current, yesterday);
      
      expect(change).not.toBeNull();
      expect(change.direction).toBe('up');
      expect(change.percentChange).toBeGreaterThan(0);
      expect(change.change).toBe(10);
    });

    test('calculates negative change correctly', () => {
      const current = 1000; // hPa
      const yesterday = 1010; // hPa
      
      const change = calculatePressureChange(current, yesterday);
      
      expect(change).not.toBeNull();
      expect(change.direction).toBe('down');
      expect(change.percentChange).toBeLessThan(0);
      expect(change.change).toBe(-10);
    });

    test('handles no change', () => {
      const current = 1010;
      const yesterday = 1010;
      
      const change = calculatePressureChange(current, yesterday);
      
      expect(change).not.toBeNull();
      expect(change.direction).toBe('same');
      expect(change.percentChange).toBe(0);
      expect(change.change).toBe(0);
    });

    test('returns null for invalid input', () => {
      expect(calculatePressureChange(1010, null)).toBeNull();
      expect(calculatePressureChange(1010, 0)).toBeNull();
    });
  });

  describe('getPressureInfo', () => {
    test('identifies low pressure', () => {
      const pressure = 970; // hPa (low)
      const info = getPressureInfo(pressure);
      
      expect(info.level).toBe('Low');
      expect(info.effects).toContain('headache');
    });

    test('identifies normal pressure', () => {
      const pressure = 1013; // hPa (normal)
      const info = getPressureInfo(pressure);
      
      expect(info.level).toBe('Normal');
    });

    test('identifies high pressure', () => {
      const pressure = 1030; // hPa (high)
      const info = getPressureInfo(pressure);
      
      expect(info.level).toBe('High');
      expect(info.effects).toContain('clear');
    });
  });

  describe('formatTime', () => {
    test('formats Unix timestamp correctly', () => {
      // January 15, 2026 at 3:30 PM
      const timestamp = 1736962200; // Unix timestamp
      const formatted = formatTime(timestamp);
      
      expect(formatted).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/);
    });

    test('handles midnight', () => {
      const timestamp = 1736899200; // Midnight
      const formatted = formatTime(timestamp);
      
      expect(formatted).toMatch(/12:00\s?AM/i);
    });
  });

  describe('getMinYearlySunlightHours', () => {
    // Mock fetch globally
    global.fetch = jest.fn();

    beforeEach(() => {
      fetch.mockClear();
    });

    test('returns minimum hours for NYC latitude', async () => {
      const mockResponse = {
        status: 'OK',
        results: {
          day_length: 32400 // 9 hours in seconds
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const minHours = await getMinYearlySunlightHours(40.7336); // NYC latitude
      
      expect(minHours).toBe(9.0);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('12-21')
      );
    });

    test('returns fallback value when API fails', async () => {
      fetch.mockRejectedValueOnce(new Error('API error'));

      const minHours = await getMinYearlySunlightHours(40.7336);
      
      // Should return fallback estimate for NYC (~9 hours)
      expect(minHours).toBe(9.0);
    });

    test('returns appropriate fallback for different latitudes', async () => {
      fetch.mockRejectedValueOnce(new Error('API error'));

      // Equator
      const equatorHours = await getMinYearlySunlightHours(0);
      expect(equatorHours).toBe(11.5);

      // High latitude
      const highLatHours = await getMinYearlySunlightHours(65);
      expect(highLatHours).toBe(4.0);
    });

    test('handles invalid API response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'INVALID_REQUEST' })
      });

      const minHours = await getMinYearlySunlightHours(40.7336);
      
      // Should return fallback
      expect(minHours).toBe(9.0);
    });
  });

  describe('getMaxYearlySunlightHours', () => {
    // Mock fetch globally
    global.fetch = jest.fn();

    beforeEach(() => {
      fetch.mockClear();
    });

    test('returns maximum hours for NYC latitude', async () => {
      const mockResponse = {
        status: 'OK',
        results: {
          day_length: 54000 // 15 hours in seconds
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const maxHours = await getMaxYearlySunlightHours(40.7336); // NYC latitude
      
      expect(maxHours).toBe(15.0);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('06-21')
      );
    });

    test('returns fallback value when API fails', async () => {
      fetch.mockRejectedValueOnce(new Error('API error'));

      const maxHours = await getMaxYearlySunlightHours(40.7336);
      
      // Should return fallback estimate for NYC (~15 hours)
      expect(maxHours).toBe(15.0);
    });
  });
});

