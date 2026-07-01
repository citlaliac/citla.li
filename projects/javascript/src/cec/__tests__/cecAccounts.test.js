import { rankFromPoints } from '../cecConfig';
import { applyAccountWorshiper } from '../worshiperStorage';

describe('CEC account helpers', () => {
  test('rankFromPoints matches Cantor at zero', () => {
    expect(rankFromPoints(0)).toEqual({ id: 'cantor', label: 'Cantor', minPP: 0 });
  });

  test('rankFromPoints advances at thresholds', () => {
    expect(rankFromPoints(90).id).toBe('seminarian');
    expect(rankFromPoints(2000).id).toBe('pope');
  });

  test('applyAccountWorshiper normalizes server payload', () => {
    const w = applyAccountWorshiper({
      accountId: 3,
      sessionId: 'cec-acc-3',
      displayName: 'Test',
      avatarId: 'frog',
      pontifexPoints: 42,
      rank: { id: 'cantor', label: 'Cantor', minPP: 0 },
      completedActions: [],
      actionLastDone: {},
      lastSpinDate: null,
    });
    expect(w.accountId).toBe(3);
    expect(w.pontifexPoints).toBe(42);
    expect(w.rank.id).toBe('cantor');
  });
});
