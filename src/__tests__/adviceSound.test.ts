import { describe, expect, it } from 'vitest';
import { adviceSound } from '../overlay/adviceSound';

describe('advice sound', () => {
  it('plays the fanfare for praise, even when the text is about an objective', () => {
    expect(adviceSound({ category: 'praise', severity: 'INFO' })).toBe('praise');
  });

  it('chimes for objectives even when the enemy took them', () => {
    expect(adviceSound({ category: 'objective', severity: 'WARNING' })).toBe('objective');
  });

  it('pulses for danger: low health, death, tilt or a critical tip', () => {
    expect(adviceSound({ category: 'recall', severity: 'WARNING' })).toBe('danger');
    expect(adviceSound({ category: 'death', severity: 'INFO' })).toBe('danger');
    expect(adviceSound({ category: 'farm', severity: 'CRITICAL' })).toBe('danger');
  });

  it('uses the soft tip for gold and vision advice', () => {
    expect(adviceSound({ category: 'economy', severity: 'INFO' })).toBe('tip');
    expect(adviceSound({ category: 'vision', severity: 'info' })).toBe('tip');
    expect(adviceSound({ severity: 'INFO' })).toBe('tip');
  });
});
