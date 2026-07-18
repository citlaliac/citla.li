const {
  smiteChancePercent,
  smiteLoss,
} = require('../../../server/cec-factions');

describe('CEC congregation smite rules', () => {
  test('larger active congregations reduce risk to a five-percent floor', () => {
    expect(smiteChancePercent(1)).toBe(30);
    expect(smiteChancePercent(4)).toBe(15);
    expect(smiteChancePercent(36)).toBe(5);
    expect(smiteChancePercent(1_000)).toBe(5);
    expect(smiteChancePercent(1_000, false)).toBe(30);
  });

  test('loss is five percent with the published minimum and cap', () => {
    expect(smiteLoss(0)).toBe(0);
    expect(smiteLoss(100)).toBe(10);
    expect(smiteLoss(1_000)).toBe(50);
    expect(smiteLoss(5_000)).toBe(150);
  });
});
