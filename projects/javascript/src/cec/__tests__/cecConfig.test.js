import {
  rankFromPoints,
  rankPromotionMessage,
  effectiveRank,
  ppToOvertakePope,
  popeDemotionMessage,
  canCompleteAction,
  canAwardAmenDiscovery,
  actionCooldownRemainingMs,
  formatActionCooldown,
  advancePortraitCommunion,
  portraitCommunionKindForClick,
  portraitCommunionCycleExpired,
  getPortraitCommunionStep,
  PORTRAIT_COMMUNION,
  PORTRAIT_COMMUNION_CYCLE_KEY,
  MAP_ACTION_COOLDOWN_MS,
  hasActionDoneRecently,
  hasAmenDiscovery,
  nextRank,
  amenDiscoveryKey,
  avatarById,
  portraitForRank,
  portraitForSkinAndRank,
  portraitForWorshiper,
  maxPontifexPointsNonWheelSession,
  maxPontifexPointsFullDay,
  minPontifexPointsPerDay,
  ENTRY_WORSHIPER_SKINS,
  REGISTER_WORSHIPER_SKINS,
  RANKS,
  WHEEL_SAINTS_BY_ID,
} from '../cecConfig';

describe('cecConfig', () => {
  test('rankFromPoints', () => {
    expect(rankFromPoints(0).id).toBe('cantor');
    expect(rankFromPoints(30).id).toBe('cantor');
    expect(rankFromPoints(750).id).toBe('priest');
    expect(rankFromPoints(3000).id).toBe('pope');
  });

  test('effectiveRank — contested papacy', () => {
    const reigning = { accountId: 1, displayName: 'Greg', pontifexPoints: 3100 };
    expect(effectiveRank(3200, { accountId: 2, reigningPope: reigning }).id).toBe('priest');
    expect(effectiveRank(3200, { accountId: 1, reigningPope: reigning }).id).toBe('pope');
    expect(effectiveRank(3200, {}).id).toBe('priest');
  });

  test('ppToOvertakePope', () => {
    expect(ppToOvertakePope(3000, 3100)).toBe(101);
  });

  test('nextRank', () => {
    expect(nextRank(10)?.id).toBe('seminarian');
    expect(
      nextRank(3000, {
        accountId: 1,
        reigningPope: { accountId: 1, displayName: 'Greg', pontifexPoints: 3000 },
      })
    ).toBeNull();
    expect(
      nextRank(3100, {
        accountId: 2,
        reigningPope: { accountId: 1, displayName: 'Greg', pontifexPoints: 3100 },
      })?.papacyContest
    ).toBe(true);
  });

  test('rankPromotionMessage', () => {
    expect(rankPromotionMessage('seminarian', 'Maria')).toMatch(/Maria.*admitted to seminary/i);
    expect(rankPromotionMessage('deacon', 'Paul')).toMatch(/Paul.*Diaconate/i);
    expect(rankPromotionMessage('priest', 'Ana')).toMatch(/Ana.*Priesthood/i);
    expect(rankPromotionMessage('pope', 'Greg')).toMatch(/Greg.*Papacy/i);
    expect(rankPromotionMessage('cantor', 'X')).toBeNull();
    expect(popeDemotionMessage('Ana', 'Greg', 42)).toMatch(/lost the Papacy.*Greg.*42/i);
  });

  test('canCompleteAction', () => {
    const w = {
      completedActions: ['register'],
      actionLastDone: {
        incense: Date.now() - MAP_ACTION_COOLDOWN_MS - 1000,
        bulletin_post: Date.now() - 1000,
      },
    };
    expect(canCompleteAction(w, 'register')).toBe(false);
    expect(canCompleteAction(w, 'incense')).toBe(true);
    expect(canCompleteAction(w, 'bulletin_post')).toBe(false);
    expect(canCompleteAction({ actionLastDone: {} }, 'rosary')).toBe(true);
  });

  test('hourly amen discovery', () => {
    const key = amenDiscoveryKey('vatican');
    const w = {
      actionLastDone: { [key]: Date.now() - 1000 },
    };
    expect(hasAmenDiscovery(w, 'vatican')).toBe(true);
    expect(canAwardAmenDiscovery(w, 'vatican')).toBe(false);
    const cooled = {
      actionLastDone: { [key]: Date.now() - MAP_ACTION_COOLDOWN_MS - 1 },
    };
    expect(hasAmenDiscovery(cooled, 'vatican')).toBe(false);
    expect(canAwardAmenDiscovery(cooled, 'vatican')).toBe(true);
  });

  test('hasActionDoneRecently', () => {
    expect(hasActionDoneRecently({ actionLastDone: { candle: Date.now() - 500 } }, 'candle')).toBe(
      true
    );
    expect(
      hasActionDoneRecently(
        { actionLastDone: { candle: Date.now() - MAP_ACTION_COOLDOWN_MS - 1 } },
        'candle'
      )
    ).toBe(false);
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
    expect(portraitForSkinAndRank('lamb', 'cantor').imageFile).toBe('lamb-cantor.PNG');
    expect(portraitForSkinAndRank('lamb', 'seminarian').imageFile).toBe('lamb-seminarian.PNG');
    expect(portraitForSkinAndRank('lamb', 'deacon').imageFile).toBe('lamb-deacon.png');
    expect(portraitForSkinAndRank('lamb', 'priest').imageFile).toBe('lamb-priest.png');
    expect(portraitForSkinAndRank('worshiper_a', 'cantor').emoji).toBe('🙏');
    expect(portraitForSkinAndRank('worshiper_a', 'priest').imageFile).toBeNull();
  });

  test('portraitForWorshiper respects skin', () => {
    const frog = portraitForWorshiper({ avatarId: 'frog', pontifexPoints: 750, rank: { id: 'priest' } });
    expect(frog.imageFile).toBe('frog-priest.png');
    const fairy = portraitForWorshiper({ avatarId: 'fairy', pontifexPoints: 300, rank: { id: 'deacon' } });
    expect(fairy.imageFile).toBe('fairy-deacon.png');
    const lamb = portraitForWorshiper({ avatarId: 'lamb', pontifexPoints: 120, rank: { id: 'seminarian' } });
    expect(lamb.imageFile).toBe('lamb-seminarian.PNG');
    const pope = portraitForWorshiper({ avatarId: 'frog', pontifexPoints: 3000, rank: { id: 'pope' } });
    expect(pope.imageFile).toBe('pope.png');
  });

  test('ENTRY_WORSHIPER_SKINS has four entry options', () => {
    expect(ENTRY_WORSHIPER_SKINS.map((s) => s.id)).toEqual(['frog', 'fairy', 'lamb', 'worshiper_a']);
  });

  test('REGISTER_WORSHIPER_SKINS lists art-ready pickers only', () => {
    expect(REGISTER_WORSHIPER_SKINS.map((s) => s.id)).toEqual(['frog', 'fairy', 'lamb']);
  });

  test('avatarById legacy cantor ids map to frog cantor', () => {
    expect(avatarById('cantor_a').imageFile).toBe('frog-cantor.png');
    expect(avatarById('missing').imageFile).toBe('frog-cantor.png');
  });

  test('full session PP budget does not reach Priest without wheel', () => {
    const priest = RANKS.find((r) => r.id === 'priest');
    expect(maxPontifexPointsNonWheelSession()).toBeLessThan(priest.minPP);
  });

  test('core daily loop needs a second pass for Priest', () => {
    const priest = RANKS.find((r) => r.id === 'priest');
    expect(minPontifexPointsPerDay()).toBeLessThan(priest.minPP);
    expect(minPontifexPointsPerDay() * 2).toBeGreaterThanOrEqual(priest.minPP);
  });

  test('max daily PP still below Pope threshold in one day', () => {
    const pope = RANKS.find((r) => r.id === 'pope');
    expect(maxPontifexPointsFullDay()).toBeLessThan(pope.minPP);
  });

  test('pope rank needs more than one map pass', () => {
    const pope = RANKS.find((r) => r.id === 'pope');
    expect(maxPontifexPointsNonWheelSession()).toBeLessThan(pope.minPP);
  });

  test('formatActionCooldown', () => {
    expect(formatActionCooldown(0)).toBe('');
    expect(formatActionCooldown(90_000)).toMatch(/minute/);
    expect(formatActionCooldown(65 * 60 * 1000)).toMatch(/1h/);
  });

  test('actionCooldownRemainingMs', () => {
    const w = { actionLastDone: { candle: Date.now() - 1000 } };
    expect(actionCooldownRemainingMs(w, 'candle')).toBeGreaterThan(0);
    expect(actionCooldownRemainingMs(w, 'register')).toBe(0);
  });

  test('portrait communion bonus PP', () => {
    expect(PORTRAIT_COMMUNION.blood.bonusPP).toBe(24);
    expect(PORTRAIT_COMMUNION.body.bonusPP).toBe(28);
  });

  test('portrait communion hourly sequence', () => {
    let w = { actionLastDone: {} };
    expect(portraitCommunionKindForClick(w)).toBe('blood');
    let r = advancePortraitCommunion(w);
    expect(r.kind).toBe('blood');
    expect(getPortraitCommunionStep(r.worshiper)).toBe(1);

    r = advancePortraitCommunion(r.worshiper);
    expect(r.kind).toBe('body');
    expect(getPortraitCommunionStep(r.worshiper)).toBe(2);

    r = advancePortraitCommunion(r.worshiper);
    expect(r.kind).toBe('stuffed');
    expect(getPortraitCommunionStep(r.worshiper)).toBe(3);

    expect(portraitCommunionKindForClick(r.worshiper)).toBe('stuffed');

    const cooled = {
      actionLastDone: {
        [PORTRAIT_COMMUNION_CYCLE_KEY]: Date.now() - MAP_ACTION_COOLDOWN_MS - 1,
        portrait_communion_step: 3,
      },
    };
    expect(portraitCommunionCycleExpired(cooled)).toBe(true);
    expect(portraitCommunionKindForClick(cooled)).toBe('blood');
  });

  test('wheel saints match uploaded assets', () => {
    expect(WHEEL_SAINTS_BY_ID.francis.imageFile).toBe('assisi.png');
    expect(WHEEL_SAINTS_BY_ID.peter.imageFile).toBe('saints/peter.png');
    expect(WHEEL_SAINTS_BY_ID.therese.imageFile).toBe('Saint Therese of Lisieux.png');
    expect(Object.keys(WHEEL_SAINTS_BY_ID)).toHaveLength(10);
  });
});
