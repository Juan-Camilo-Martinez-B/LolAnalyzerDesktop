import { describe, expect, it } from 'vitest';
import { resolveTheme } from '../services/theme';

describe('theme resolution', () => {
  it('keeps light as the explicit and default choice', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('light', false)).toBe('light');
  });

  it('follows the system preference only in system mode', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });

  it('keeps dark when the user asks for it', () => {
    expect(resolveTheme('dark', false)).toBe('dark');
  });
});
