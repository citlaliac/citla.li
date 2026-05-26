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

  test('wheel saints have blurbs', () => {
    expect(WHEEL_SAINTS_BY_ID.francis.blurb).toBeTruthy();
    expect(WHEEL_SAINTS_BY_ID.jude_wheel.imageFile).toBe('jude.png');
  });
});
