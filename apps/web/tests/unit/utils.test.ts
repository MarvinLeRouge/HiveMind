import { describe, it, expect } from 'vitest';
import { cn } from '../../src/lib/utils';

describe('cn', () => {
  it('merges multiple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('resolves Tailwind conflicts (last wins)', () => {
    expect(cn('p-4', 'p-6')).toBe('p-6');
  });

  it('handles conditional falsy values', () => {
    const show = false;
    expect(cn('base', show && 'skipped', 'end')).toBe('base end');
  });

  it('returns an empty string for no arguments', () => {
    expect(cn()).toBe('');
  });
});
