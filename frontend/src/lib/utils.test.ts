import { describe, expect, it } from 'vitest';
import { cn, spiceLabel } from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', false && 'b', 'c')).toContain('a');
    expect(cn('a', false && 'b', 'c')).toContain('c');
  });
});

describe('spiceLabel', () => {
  it('returns labels', () => {
    expect(spiceLabel(0)).toBe('Mild');
    expect(spiceLabel(3)).toBe('Spicy');
    expect(spiceLabel(5)).toBe('Extra Hot');
  });
});
