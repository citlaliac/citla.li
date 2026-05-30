import {
  resolveCecSeasonTheme,
  getCecSeasonTheme,
  getSeasonBackgroundPhotos,
  getSeasonSkyOverlay,
  isSeasonDebugEnabled,
  CEC_SEASON_TEST_PATH,
  seasonUsesHeavenOverlay,
  CEC_SEASON_THEME_IDS,
} from '../cecSeasonTheme';

describe('resolveCecSeasonTheme', () => {
  test('maps API seasons to themes', () => {
    expect(resolveCecSeasonTheme({ season: 'advent', celebrations: [] })).toBe('advent');
    expect(resolveCecSeasonTheme({ season: 'ordinary', celebrations: [] })).toBe('ordinary');
    expect(resolveCecSeasonTheme({ season: 'lent', celebrations: [{ title: 'Friday of Lent' }] })).toBe(
      'lent'
    );
    expect(
      resolveCecSeasonTheme({
        season: 'lent',
        celebrations: [{ title: 'Palm Sunday of the Passion of the Lord' }],
      })
    ).toBe('holyWeek');
    expect(
      resolveCecSeasonTheme({
        season: 'easter',
        celebrations: [{ title: 'Sunday of Easter' }],
      })
    ).toBe('easter');
    expect(
      resolveCecSeasonTheme({
        season: 'easter',
        celebrations: [{ title: 'Pentecost Sunday' }],
      })
    ).toBe('pentecost');
  });

  test('christmas vs epiphany by date and celebration', () => {
    expect(
      resolveCecSeasonTheme({
        season: 'christmas',
        date: '2026-12-28',
        celebrations: [{ title: 'The Holy Family' }],
      })
    ).toBe('christmas');
    expect(
      resolveCecSeasonTheme({
        season: 'christmas',
        date: '2026-01-10',
        celebrations: [{ title: 'Saturday after Epiphany' }],
      })
    ).toBe('epiphany');
  });

  test('every theme id has config', () => {
    CEC_SEASON_THEME_IDS.forEach((id) => {
      expect(getCecSeasonTheme(id).id).toBe(id);
    });
  });

  test('season-specific background photos', () => {
    expect(getSeasonBackgroundPhotos('advent')).toEqual(['cathedral']);
    expect(getSeasonBackgroundPhotos('epiphany')).toEqual(['forest']);
    expect(getSeasonBackgroundPhotos('lent')).toEqual([]);
    expect(getSeasonBackgroundPhotos('holyWeek')).toEqual(['cathedral']);
    expect(getSeasonBackgroundPhotos('easter')).toEqual(['easterCathedral']);
    expect(getSeasonBackgroundPhotos('christmas')).toEqual(['christmasCathedral']);
    expect(getSeasonBackgroundPhotos('ordinary')).toEqual(['cathedral', 'heaven', 'forest']);
  });

  test('season debug UI only on test path', () => {
    const path = window.location.pathname;
    window.history.replaceState({}, '', CEC_SEASON_TEST_PATH);
    expect(isSeasonDebugEnabled()).toBe(true);
    window.history.replaceState({}, '', '/catholicecloud');
    expect(isSeasonDebugEnabled()).toBe(false);
    window.history.replaceState({}, '', path);
  });

  test('sky overlay by season', () => {
    expect(getSeasonSkyOverlay('advent')).toBe('heaven');
    expect(getSeasonSkyOverlay('christmas')).toBe('heaven');
    expect(getSeasonSkyOverlay('epiphany')).toBe('heaven');
    expect(getSeasonSkyOverlay('holyWeek')).toBe('heaven');
    expect(getSeasonSkyOverlay('easter')).toBe('heaven');
    expect(getSeasonSkyOverlay('lent')).toBe('heaven');
    expect(getSeasonSkyOverlay('ordinary')).toBe(null);
    expect(getSeasonSkyOverlay('pentecost')).toBe(null);
    expect(seasonUsesHeavenOverlay('advent')).toBe(true);
    expect(seasonUsesHeavenOverlay('ordinary')).toBe(false);
  });
});
