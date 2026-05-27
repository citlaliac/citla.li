import {
  rankFromPoints,
  rankPromotionMessage,
  canCompleteAction,
  nextRank,
  amenDiscoveryKey,
  avatarById,
  portraitForRank,
  portraitForSkinAndRank,
  portraitForWorshiper,
  maxPontifexPointsNonWheelSession,
  ENTRY_WORSHIPER_SKINS,
  RANKS,
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

  test('rankPromotionMessage', () => {
    expect(rankPromotionMessage('seminarian', 'Maria')).toMatch(/Maria.*admitted to seminary/i);
    expect(rankPromotionMessage('deacon', 'Paul')).toMatch(/Paul.*Diaconate/i);
    expect(rankPromotionMessage('priest', 'Ana')).toMatch(/Ana.*Priesthood/i);
    expect(rankPromotionMessage('cantor', 'X')).toBeNull();
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

  test('portraitForRank uses frog sprites', () => {
    expect(portraitForRank('cantor').imageFile).toBe('frog-cantor.png');
    expect(portraitForRank('priest').imageFile).toBe('frog-priest.png');
  });

  test('portraitForSkinAndRank', () => {
    expect(portraitForSkinAndRank('frog', 'deacon').imageFile).toBe('frog-deacon.png');
    expect(portraitForSkinAndRank('fairy', 'priest').imageFile).toBe('fairy-preist.png');
    expect(portraitForSkinAndRank('fairy', 'seminarian').imageFile).toBe('fairy-seminarian.png');
    expect(portraitForSkinAndRank('worshiper_a', 'cantor').emoji).toBe('🙏');
    expect(portraitForSkinAndRank('worshiper_a', 'priest').imageFile).toBeNull();
  });

  test('portraitForWorshiper respects skin', () => {
    const frog = portraitForWorshiper({ avatarId: 'frog', pontifexPoints: 500, rank: { id: 'priest' } });
    expect(frog.imageFile).toBe('frog-priest.png');
    const fairy = portraitForWorshiper({ avatarId: 'fairy', pontifexPoints: 220, rank: { id: 'deacon' } });
    expect(fairy.imageFile).toBe('fairy-deacon.png');
  });

  test('ENTRY_WORSHIPER_SKINS has three entry options', () => {
    expect(ENTRY_WORSHIPER_SKINS.map((s) => s.id)).toEqual(['frog', 'fairy', 'worshiper_a']);
  });

  test('avatarById legacy cantor ids map to frog cantor', () => {
    expect(avatarById('cantor_a').imageFile).toBe('frog-cantor.png');
    expect(avatarById('missing').imageFile).toBe('frog-cantor.png');
  });

  test('full session PP budget reaches Priest without wheel', () => {
    expect(maxPontifexPointsNonWheelSession()).toBeGreaterThanOrEqual(RANKS[RANKS.length - 1].minPP);
  });

  test('wheel saints match uploaded assets', () => {
    expect(WHEEL_SAINTS_BY_ID.francis.imageFile).toBe('assisi.png');
    expect(WHEEL_SAINTS_BY_ID.peter.imageFile).toBe('saints/peter.png');
    expect(WHEEL_SAINTS_BY_ID.therese.imageFile).toBe('Saint Therese of Lisieux.png');
    expect(Object.keys(WHEEL_SAINTS_BY_ID)).toHaveLength(10);
  });
});
