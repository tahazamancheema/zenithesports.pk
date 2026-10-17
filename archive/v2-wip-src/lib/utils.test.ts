import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, generateId } from './utils';

describe('Utils', () => {
  describe('cn()', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      const isTrue = true;
      const isFalse = false;
      expect(cn('class1', isTrue && 'class2', isFalse && 'class3')).toBe('class1 class2');
    });

    it('should merge tailwind classes properly', () => {
      expect(cn('px-2 py-1', 'p-4')).toBe('p-4');
    });
  });

  describe('formatCurrency()', () => {
    it('should format numbers to USD format', () => {
      expect(formatCurrency(1500)).toBe('$1,500.00');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });
  });

  describe('generateId()', () => {
    it('should generate an ID with the default prefix', () => {
      const id = generateId();
      expect(id.startsWith('id_')).toBe(true);
      expect(id.length).toBeGreaterThan(3);
    });

    it('should generate an ID with a custom prefix', () => {
      const id = generateId('test');
      expect(id.startsWith('test_')).toBe(true);
    });
  });
});
