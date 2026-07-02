import { rankFromPoints } from '../cecConfig';
import { applyAccountWorshiper, saveWorshiperLocal } from '../worshiperStorage';

describe('CEC account helpers', () => {
  test('rankFromPoints matches Cantor at zero', () => {
    expect(rankFromPoints(0)).toEqual({ id: 'cantor', label: 'Cantor', minPP: 0 });
  });

  test('rankFromPoints advances at thresholds', () => {
    expect(rankFromPoints(120).id).toBe('seminarian');
    expect(rankFromPoints(3000).id).toBe('pope');
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

  test('saveWorshiperLocal keeps server PP over stale local session', () => {
    const server = applyAccountWorshiper({
      accountId: 3,
      sessionId: 'cec-acc-3',
      displayName: 'Friend',
      avatarId: 'frog',
      pontifexPoints: 500,
      rank: { id: 'deacon', label: 'Deacon', minPP: 620 },
      completedActions: ['register'],
      actionLastDone: {},
      lastSpinDate: null,
    });
    const saved = saveWorshiperLocal(server);
    expect(saved.pontifexPoints).toBe(500);
    expect(saved.rank.id).toBe('seminarian');
  });
});
