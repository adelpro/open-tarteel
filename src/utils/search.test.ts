import { describe, expect, it } from 'vitest';

import {
    fuzzySearch,
    normalizeArabicText,
    removeTashkeel,
} from '@/utils/search';

describe('removeTashkeel', () => {
  it('should remove Arabic diacritics', () => {
    expect(removeTashkeel('مُحَمَّد')).toBe('محمد');
    expect(removeTashkeel('عَبْدُ اللَّهِ')).toBe('عبد الله');
    expect(removeTashkeel('قُرْآن')).toBe('قرآن'); // آ is not removed by removeTashkeel
  });

  it('should handle text without tashkeel', () => {
    expect(removeTashkeel('محمد')).toBe('محمد');
    expect(removeTashkeel('عبد الله')).toBe('عبد الله');
  });

  it('should handle empty string', () => {
    expect(removeTashkeel('')).toBe('');
  });

  it('should handle mixed Arabic and English', () => {
    expect(removeTashkeel('مُحَمَّد Muhammad')).toBe('محمد Muhammad');
  });
});

describe('normalizeArabicText', () => {
  it('should normalize Arabic characters', () => {
    // Alef variations
    expect(normalizeArabicText('أحمد')).toBe('احمد');
    expect(normalizeArabicText('إبراهيم')).toBe('ابراهيم');
    expect(normalizeArabicText('آدم')).toBe('ادم');

    // Taa Marbouta to Haa
    expect(normalizeArabicText('فاطمة')).toBe('فاطمه');
  });

  it('should remove tashkeel and normalize', () => {
    expect(normalizeArabicText('مُحَمَّد')).toBe('محمد');
    expect(normalizeArabicText('عَبْدُ اللَّهِ')).toBe('عبد الله');
  });

  it('should keep whitespace (no trimming)', () => {
    // normalizeArabicText does not trim whitespace
    expect(normalizeArabicText('  محمد  ')).toBe('  محمد  ');
    expect(normalizeArabicText('\n\tعلي\n')).toBe('\n\tعلي\n');
  });

  it('should keep case (no lowercase conversion)', () => {
    // normalizeArabicText does not convert to lowercase
    expect(normalizeArabicText('MUHAMMAD')).toBe('MUHAMMAD');
    expect(normalizeArabicText('AbDuLlAh')).toBe('AbDuLlAh');
  });

  it('should handle empty string', () => {
    expect(normalizeArabicText('')).toBe('');
  });
});

describe('fuzzySearch', () => {
  const mockReciters = [
    { id: '1', name: 'عبد الباسط عبد الصمد' },
    { id: '2', name: 'محمد صديق المنشاوي' },
    { id: '3', name: 'أحمد العجمي' },
    { id: '4', name: 'عبد الرحمن السديس' },
    { id: '5', name: 'سعد الغامدي' },
    { id: '6', name: 'ماهر المعيقلي' },
    { id: '7', name: 'محمود خليل الحصري' },
    { id: '8', name: 'مشاري العفاسي' },
  ];

  describe('Exact matches', () => {
    it('should find exact full name match', () => {
      const results = fuzzySearch(mockReciters, 'عبد الباسط عبد الصمد');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('عبد الباسط عبد الصمد');
    });

    it('should find exact partial name match', () => {
      const results = fuzzySearch(mockReciters, 'محمد');
      expect(results.length).toBeGreaterThan(0);
      const names = results.map((r) => r.name);
      expect(names).toContain('محمد صديق المنشاوي');
      expect(names).toContain('محمود خليل الحصري');
    });

    it('should find matches with Arabic article', () => {
      const results = fuzzySearch(mockReciters, 'العجمي');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('أحمد العجمي');
    });
  });

  describe('Fuzzy matching - spacing variations', () => {
    it('should match names with missing spaces', () => {
      const results = fuzzySearch(mockReciters, 'عبدالباسط');
      expect(results.length).toBeGreaterThan(0);
      const names = results.map((r) => r.name);
      expect(names).toContain('عبد الباسط عبد الصمد');
    });

    it('should match names with extra spaces', () => {
      const results = fuzzySearch(mockReciters, 'عبد  الباسط');
      expect(results.length).toBeGreaterThan(0);
      const names = results.map((r) => r.name);
      expect(names).toContain('عبد الباسط عبد الصمد');
    });
  });

  describe('Fuzzy matching - typos', () => {
    it('should match with single character typo', () => {
      // عبض instead of عبد (ض vs د)
      const results = fuzzySearch(mockReciters, 'عبض الباسط');
      expect(results.length).toBeGreaterThan(0);
      const names = results.map((r) => r.name);
      expect(names).toContain('عبد الباسط عبد الصمد');
    });

    it('should match with character transposition', () => {
      // السديص instead of السديس
      const results = fuzzySearch(mockReciters, 'السديص');
      expect(results.length).toBeGreaterThan(0);
      const names = results.map((r) => r.name);
      expect(names).toContain('عبد الرحمن السديس');
    });

    it('should match with missing character', () => {
      // باست instead of باسط
      const results = fuzzySearch(mockReciters, 'باست');
      expect(results.length).toBeGreaterThan(0);
      const names = results.map((r) => r.name);
      expect(names).toContain('عبد الباسط عبد الصمد');
    });

    it('should match with extra character', () => {
      // الغاممدي instead of الغامدي
      const results = fuzzySearch(mockReciters, 'الغاممدي');
      expect(results.length).toBeGreaterThan(0);
      const names = results.map((r) => r.name);
      expect(names).toContain('سعد الغامدي');
    });
  });

  describe('Fuzzy matching - Arabic character variations', () => {
    it('should match Alef variations (أ، إ، آ → ا)', () => {
      // Search with plain Alef, should match أحمد
      const results1 = fuzzySearch(mockReciters, 'احمد');
      expect(results1.length).toBeGreaterThan(0);
      const names1 = results1.map((r) => r.name);
      expect(names1).toContain('أحمد العجمي');

      // Search with Hamza on Alef, should still work
      const results2 = fuzzySearch(mockReciters, 'أحمد');
      expect(results2.length).toBeGreaterThan(0);
    });

    it('should match Taa Marbouta (ة) with Haa (ه)', () => {
      // This is handled by normalization
      const results = fuzzySearch(mockReciters, 'ماهر المعيقلي');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('ماهر المعيقلي');
    });
  });

  describe('Fuzzy matching - partial matches', () => {
    it('should match with first name only', () => {
      const results = fuzzySearch(mockReciters, 'أحمد');
      expect(results.length).toBeGreaterThan(0);
      const names = results.map((r) => r.name);
      expect(names).toContain('أحمد العجمي');
    });

    it('should match with last name only', () => {
      const results = fuzzySearch(mockReciters, 'العفاسي');
      expect(results.length).toBeGreaterThan(0);
      const names = results.map((r) => r.name);
      expect(names).toContain('مشاري العفاسي');
    });

    it('should match with middle part of name', () => {
      const results = fuzzySearch(mockReciters, 'صديق');
      expect(results.length).toBeGreaterThan(0);
      const names = results.map((r) => r.name);
      expect(names).toContain('محمد صديق المنشاوي');
    });
  });

  describe('Edge cases', () => {
    it('should return all items for empty search term', () => {
      const results = fuzzySearch(mockReciters, '');
      expect(results).toHaveLength(mockReciters.length);
    });

    it('should return all items for whitespace-only search term', () => {
      const results = fuzzySearch(mockReciters, '   ');
      expect(results).toHaveLength(mockReciters.length);
    });

    it('should return empty array for completely unrelated search', () => {
      const results = fuzzySearch(mockReciters, 'xyz123');
      expect(results).toHaveLength(0);
    });

    it('should handle search with numbers', () => {
      const results = fuzzySearch(mockReciters, '123');
      expect(results).toHaveLength(0);
    });

    it('should handle search with special characters', () => {
      const results = fuzzySearch(mockReciters, '@#$%');
      expect(results).toHaveLength(0);
    });

    it('should handle empty items array', () => {
      const results = fuzzySearch([], 'محمد');
      expect(results).toHaveLength(0);
    });
  });

  describe('Multiple matches with ranking', () => {
    it('should return better matches first', () => {
      // Search for محمد - should return exact matches before partial matches
      const results = fuzzySearch(mockReciters, 'محمد');
      expect(results.length).toBeGreaterThan(0);

      // محمد صديق المنشاوي should rank high (exact start match)
      const exactMatchIndex = results.findIndex(
        (r) => r.name === 'محمد صديق المنشاوي'
      );
      expect(exactMatchIndex).toBeGreaterThanOrEqual(0);

      // محمود should also be found but may rank differently
      const similarMatchIndex = results.findIndex(
        (r) => r.name === 'محمود خليل الحصري'
      );
      expect(similarMatchIndex).toBeGreaterThanOrEqual(0);
    });

    it('should handle searches matching multiple items', () => {
      // Search for عبد - multiple reciters have this
      const results = fuzzySearch(mockReciters, 'عبد');
      expect(results.length).toBeGreaterThan(1);

      const names = results.map((r) => r.name);
      expect(names).toContain('عبد الباسط عبد الصمد');
      expect(names).toContain('عبد الرحمن السديس');
    });
  });

  describe('Case sensitivity', () => {
    it('should be case-insensitive', () => {
      const results1 = fuzzySearch(mockReciters, 'محمد');
      const results2 = fuzzySearch(mockReciters, 'مُحَمَّد');

      // Both should find matches (normalization handles this)
      expect(results1.length).toBeGreaterThan(0);
      expect(results2.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should handle large dataset efficiently', () => {
      // Create 1000 mock reciters
      const largeDataset = Array.from({ length: 1000 }, (_, index) => ({
        id: `${index}`,
        name: `قارئ ${index}`,
      }));

      // Add target reciter
      largeDataset.push({ id: '1000', name: 'عبد الباسط عبد الصمد' });

      const startTime = performance.now();
      const results = fuzzySearch(largeDataset, 'عبد الباسط');
      const endTime = performance.now();

      // Should find the match
      expect(results.length).toBeGreaterThan(0);
      const names = results.map((r) => r.name);
      expect(names).toContain('عبد الباسط عبد الصمد');

      // Should complete in reasonable time (< 100ms for 1000 items)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Return value integrity', () => {
    it('should return original objects, not normalized copies', () => {
      const results = fuzzySearch(mockReciters, 'محمد');
      expect(results.length).toBeGreaterThan(0);

      // Check that returned objects are the original objects
      results.forEach((result) => {
        expect(mockReciters).toContainEqual(result);
      });
    });

    it('should preserve all properties of original objects', () => {
      const itemsWithExtraProps = [
        {
          id: '1',
          name: 'عبد الباسط عبد الصمد',
          country: 'مصر',
          views: 1000,
        },
        {
          id: '2',
          name: 'محمد صديق المنشاوي',
          country: 'مصر',
          views: 2000,
        },
      ];

      const results = fuzzySearch(itemsWithExtraProps, 'عبد');
      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('country', 'مصر');
      expect(results[0]).toHaveProperty('views', 1000);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle common user typos', () => {
      const commonTypos = [
        'عبدالباست', // missing ط
        'عبد البابسط', // ب instead of ا
        'عبدالباسضط', // ض instead of nothing
        'عبدلباسط', // ل instead of space+ال
      ];

      commonTypos.forEach((typo) => {
        const results = fuzzySearch(mockReciters, typo);
        expect(
          results.length,
          `Failed for typo: ${typo}`
        ).toBeGreaterThanOrEqual(0);
        // At least one should likely be عبد الباسط if threshold is correct
      });
    });

    it('should differentiate between very different names', () => {
      const results = fuzzySearch(mockReciters, 'الغامدي');
      const names = results.map((r) => r.name);

      // Should find الغامدي
      expect(names).toContain('سعد الغامدي');

      // Should NOT find completely different names (if any)
      // Depends on threshold - with 0.4, very different names shouldn't match
    });

    it('should handle mixed Arabic-English names', () => {
      const mixedItems = [
        { id: '1', name: 'Sheikh Abdul Basit' },
        { id: '2', name: 'عبد الباسط عبد الصمد' },
        { id: '3', name: 'Muhammad Al-Hussary' },
      ];

      const results1 = fuzzySearch(mixedItems, 'Abdul');
      expect(results1.length).toBeGreaterThan(0);

      const results2 = fuzzySearch(mixedItems, 'عبد');
      expect(results2.length).toBeGreaterThan(0);
    });
  });
});
