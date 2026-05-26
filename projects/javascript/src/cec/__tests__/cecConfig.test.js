import {
  rankFromPoints,
  canCompleteAction,
  nextRank,
  amenDiscoveryKey,
  avatarById,
  WHEEL_SAINTS_BY_ID,
} from '../cecConfig';

describe('cecConfig', () => {
  test('rankFromPoints', () => {
    expect(rankFromPoints(0).id).toBe('cantor');
    expect(rankFromPoints(30).id).toBe('cantor');
    expect(rankFromPoints(500).id).toBe('priest');
  });

  test('nextRank', () => {
    expect(nextRank(10)?.id).toBe('seminarian');
    expect(nextRank(500)).toBeNull();
  });

  test('canCompleteAction', () => {
    const w = {
      completedActions: ['register', 'bulletin_post', 'bulletin_post'],
    };
    expect(canCompleteAction(w, 'register')).toBe(false);
    expect(canCompleteAction(w, 'bulletin_post')).toBe(false);
    expect(canCompleteAction(w, 'incense')).toBe(true);
  });

  test('amenDiscoveryKey', () => {
    expect(amenDiscoveryKey('vatican')).toBe('amen_vatican');
  });

  test('avatarById falls back', () => {
    expect(avatarById('missing').id).toBe('cantor_a');
  });

  test('wheel saints match uploaded assets', () => {
    expect(WHEEL_SAINTS_BY_ID.francis.imageFile).toBe('assisi.png');
    expect(WHEEL_SAINTS_BY_ID.peter.imageFile).toBe('saints/peter.png');
    expect(WHEEL_SAINTS_BY_ID.therese.imageFile).toBe('Saint Therese of Lisieux.png');
    expect(Object.keys(WHEEL_SAINTS_BY_ID)).toHaveLength(10);
  });
});
