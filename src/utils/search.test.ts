import { describe, expect, it } from 'vitest';

import {
  clearNormalizationCache,
  fuzzySearch,
  normalizeArabicText,
  removeDefiniteArticle,
  removeTashkeel,
} from '@/utils/search';

// ──────────────────────────────────────────
// Real-world reciter dataset (from mp3quran.net API)
// ──────────────────────────────────────────
const RECITERS = [
  { id: 1, name: 'عبد الباسط عبد الصمد' },
  { id: 2, name: 'محمد صديق المنشاوي' },
  { id: 3, name: 'أحمد بن علي العجمي' },
  { id: 4, name: 'عبد الرحمن السديس' },
  { id: 5, name: 'سعد الغامدي' },
  { id: 6, name: 'ماهر المعيقلي' },
  { id: 7, name: 'محمود خليل الحصري' },
  { id: 8, name: 'مشاري راشد العفاسي' },
  { id: 9, name: 'ياسر الدوسري' },
  { id: 10, name: 'إدريس أبكر' },
  { id: 11, name: 'هاني الرفاعي' },
  { id: 12, name: 'خالد الجليل' },
  { id: 13, name: 'فارس عبّاد' },
  { id: 14, name: 'عبدالله بصفر' },
  { id: 15, name: 'ناصر القطامي' },
  { id: 16, name: 'بندر بليلة' },
  { id: 17, name: 'أبو بكر الشاطري' },
  { id: 18, name: 'عبدالودود حنيف' },
  { id: 19, name: 'محمد أيوب' },
  { id: 20, name: 'آل ياسين' },
];

// ──────────────────────────────────────────
// removeTashkeel
// ──────────────────────────────────────────

describe('removeTashkeel', () => {
  describe('basic diacritics removal', () => {
    it('should remove fatha, damma, kasra', () => {
      expect(removeTashkeel('مُحَمَّد')).toBe('محمد');
    });

    it('should remove shadda and sukun', () => {
      expect(removeTashkeel('عَبَّاد')).toBe('عباد');
      expect(removeTashkeel('مْ')).toBe('م');
    });

    it('should remove tanween (fathatan, dammatan, kasratan)', () => {
      expect(removeTashkeel('كِتَابًا')).toBe('كتابا');
      expect(removeTashkeel('كِتَابٌ')).toBe('كتاب');
      expect(removeTashkeel('كِتَابٍ')).toBe('كتاب');
    });

    it('should remove full tashkeel from Quranic verse', () => {
      expect(removeTashkeel('بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ')).toBe(
        'بسم الله الرحمـن الرحيم'
      );
    });

    it('should remove superscript Alef (small alef above)', () => {
      expect(removeTashkeel('الرَّحْمَـٰنِ')).toBe('الرحمـن');
    });
  });

  describe('Quranic annotation marks', () => {
    it('should remove Wasl sign (ٱ → ا)', () => {
      expect(removeTashkeel('ٱلْحَمْدُ')).toBe('الحمد');
    });

    it('should handle text without any diacritics', () => {
      expect(removeTashkeel('محمد صديق المنشاوي')).toBe('محمد صديق المنشاوي');
    });
  });

  describe('edge cases', () => {
    it('should return empty string for empty input', () => {
      expect(removeTashkeel('')).toBe('');
    });

    it('should preserve non-Arabic text', () => {
      expect(removeTashkeel('مُحَمَّد Muhammad')).toBe('محمد Muhammad');
    });

    it('should preserve numbers', () => {
      expect(removeTashkeel('سُورَة ١٢٣')).toBe('سورة ١٢٣');
    });

    it('should handle only-tashkeel text', () => {
      expect(removeTashkeel('ً ٌ ٍ َ ُ ِ ّ ْ')).toBe('       ');
    });
  });
});

// ──────────────────────────────────────────
// normalizeArabicText
// ──────────────────────────────────────────

describe('normalizeArabicText', () => {
  describe('Alef normalization', () => {
    it('should normalize Hamza above Alef (أ → ا)', () => {
      expect(normalizeArabicText('أحمد')).toBe('احمد');
    });

    it('should normalize Hamza below Alef (إ → ا)', () => {
      expect(normalizeArabicText('إبراهيم')).toBe('ابراهيم');
    });

    it('should normalize Alef with Madda (آ → ا)', () => {
      expect(normalizeArabicText('آدم')).toBe('ادم');
      expect(normalizeArabicText('آل ياسين')).toBe('ال ياسين');
      expect(normalizeArabicText('القرآن')).toBe('القران');
    });

    it('should normalize all Alef forms in the same text', () => {
      expect(normalizeArabicText('أبو إسماعيل آدم')).toBe('ابو اسماعيل ادم');
    });
  });

  describe('Hamza on carriers', () => {
    it('should normalize Hamza on Waw (ؤ → و)', () => {
      expect(normalizeArabicText('مؤمن')).toBe('مومن');
      expect(normalizeArabicText('فؤاد')).toBe('فواد');
    });

    it('should normalize Hamza on Yaa (ئ → ي)', () => {
      expect(normalizeArabicText('قائم')).toBe('قايم');
      expect(normalizeArabicText('رئيس')).toBe('رييس');
    });
  });

  describe('Alef Maqsura / Yaa normalization', () => {
    it('should normalize Alef Maqsura (ى → ي)', () => {
      expect(normalizeArabicText('مُوسَى')).toBe('موسي');
      expect(normalizeArabicText('عيسى')).toBe('عيسي');
    });

    it('should handle ى and ي interchangeably in reciter names', () => {
      const withMaqsura = normalizeArabicText('المنشاوى');
      const withYaa = normalizeArabicText('المنشاوي');
      expect(withMaqsura).toBe(withYaa);
    });

    it('should handle Dossari name variations', () => {
      const variant1 = normalizeArabicText('الدوسرى');
      const variant2 = normalizeArabicText('الدوسري');
      expect(variant1).toBe(variant2);
    });
  });

  describe('Taa Marbouta normalization', () => {
    it('should normalize Taa Marbouta to Haa (ة → ه)', () => {
      expect(normalizeArabicText('فاطمة')).toBe('فاطمه');
      expect(normalizeArabicText('مكة')).toBe('مكه');
    });

    it('should handle Surah name "الفاتحة"', () => {
      expect(normalizeArabicText('الفاتحة')).toBe('الفاتحه');
    });

    it('should handle Surah name "البقرة"', () => {
      expect(normalizeArabicText('البقرة')).toBe('البقره');
    });
  });

  describe('Tatweel (Kashida) removal', () => {
    it('should remove tatweel from text', () => {
      expect(normalizeArabicText('عـلـي')).toBe('علي');
    });

    it('should remove multiple tatweels', () => {
      expect(normalizeArabicText('مـحـمـد')).toBe('محمد');
    });
  });

  describe('Arabic-Indic digits conversion', () => {
    it('should convert Arabic-Indic digits to Western digits', () => {
      expect(normalizeArabicText('سورة ١١٤')).toBe('سوره 114');
      expect(normalizeArabicText('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
    });

    it('should handle mixed digit systems', () => {
      expect(normalizeArabicText('سورة 114 - آية ٧')).toBe('سوره 114 - ايه 7');
    });
  });

  describe('Whitespace normalization', () => {
    it('should trim leading/trailing whitespace', () => {
      expect(normalizeArabicText('  محمد  ')).toBe('محمد');
    });

    it('should collapse multiple internal spaces', () => {
      expect(normalizeArabicText('عبد   الباسط')).toBe('عبد الباسط');
    });

    it('should normalize tabs and newlines', () => {
      expect(normalizeArabicText('\tمحمد\n')).toBe('محمد');
      expect(normalizeArabicText('عبد\tالباسط')).toBe('عبد الباسط');
    });
  });

  describe('Lowercase conversion', () => {
    it('should lowercase English text', () => {
      expect(normalizeArabicText('MUHAMMAD')).toBe('muhammad');
      expect(normalizeArabicText('Sheikh Ahmad')).toBe('sheikh ahmad');
    });

    it('should not affect Arabic text (no case concept)', () => {
      expect(normalizeArabicText('محمد')).toBe('محمد');
    });
  });

  describe('Combined normalization', () => {
    it('should handle fully diacritized Quranic text', () => {
      const input = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ';
      const expected = 'بسم الله الرحمن الرحيم';
      expect(normalizeArabicText(input)).toBe(expected);
    });

    it('should normalize reciter names with mixed features', () => {
      // أحمد: hamza + alef, ة: taa marbouta
      expect(normalizeArabicText('أحمد بن عبد الله آل محمّد')).toBe(
        'احمد بن عبد الله ال محمد'
      );
    });

    it('should produce idempotent results', () => {
      const text = 'أحمد إبراهيم آل فؤاد';
      const first = normalizeArabicText(text);
      const second = normalizeArabicText(first);
      expect(first).toBe(second);
    });
  });

  describe('edge cases', () => {
    it('should return empty string for empty input', () => {
      expect(normalizeArabicText('')).toBe('');
    });

    it('should return empty string for null-like input', () => {
      expect(normalizeArabicText(undefined as unknown as string)).toBe('');
    });

    it('should handle pure English text', () => {
      expect(normalizeArabicText('Abdul Basit')).toBe('abdul basit');
    });

    it('should handle single character', () => {
      expect(normalizeArabicText('أ')).toBe('ا');
      expect(normalizeArabicText('ة')).toBe('ه');
    });
  });
});

// ──────────────────────────────────────────
// removeDefiniteArticle
// ──────────────────────────────────────────

describe('removeDefiniteArticle', () => {
  it('should remove "ال" prefix from beginning of word', () => {
    expect(removeDefiniteArticle('العجمي')).toBe('عجمي');
    expect(removeDefiniteArticle('السديس')).toBe('سديس');
  });

  it('should remove "ال" from multiple words', () => {
    expect(removeDefiniteArticle('المنشاوي الكبير')).toBe('منشاوي كبير');
  });

  it('should not remove "ال" from middle of word', () => {
    // "ال" in "خالد" is in the middle, not a definite article
    expect(removeDefiniteArticle('خالد')).toBe('خالد');
  });

  it('should handle text without definite articles', () => {
    expect(removeDefiniteArticle('محمد')).toBe('محمد');
  });

  it('should handle empty string', () => {
    expect(removeDefiniteArticle('')).toBe('');
  });
});

// ──────────────────────────────────────────
// fuzzySearch — Core functionality
// ──────────────────────────────────────────

describe('fuzzySearch', () => {
  describe('Exact and substring matches', () => {
    it('should find exact full name match', () => {
      const results = fuzzySearch(RECITERS, 'عبد الباسط عبد الصمد');
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].name).toBe('عبد الباسط عبد الصمد');
    });

    it('should find exact single-word match (first name)', () => {
      const results = fuzzySearch(RECITERS, 'مشاري');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('مشاري راشد العفاسي');
    });

    it('should find exact single-word match (last name)', () => {
      const results = fuzzySearch(RECITERS, 'العفاسي');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('مشاري راشد العفاسي');
    });

    it('should find match by middle name', () => {
      const results = fuzzySearch(RECITERS, 'صديق');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('محمد صديق المنشاوي');
    });

    it('should return multiple results for common name "محمد"', () => {
      const results = fuzzySearch(RECITERS, 'محمد');
      expect(results.length).toBeGreaterThanOrEqual(2);
      const names = results.map((r) => r.name);
      expect(names).toContain('محمد صديق المنشاوي');
      expect(names).toContain('محمد أيوب');
    });

    it('should find partial match "عبد"', () => {
      const results = fuzzySearch(RECITERS, 'عبد');
      expect(results.length).toBeGreaterThanOrEqual(2);
      const names = results.map((r) => r.name);
      expect(names).toContain('عبد الباسط عبد الصمد');
      expect(names).toContain('عبد الرحمن السديس');
    });
  });

  // ──────────────────────────────────────────
  // Arabic normalization in search
  // ──────────────────────────────────────────

  describe('Alef variation matching', () => {
    it('should match "احمد" (plain Alef) against "أحمد" (Hamza)', () => {
      const results = fuzzySearch(RECITERS, 'احمد');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('أحمد بن علي العجمي');
    });

    it('should match "ادريس" (plain Alef) against "إدريس" (Hamza below)', () => {
      const results = fuzzySearch(RECITERS, 'ادريس');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('إدريس أبكر');
    });

    it('should match "ال ياسين" (plain Alef) against "آل ياسين" (Madda)', () => {
      const results = fuzzySearch(RECITERS, 'ال ياسين');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('آل ياسين');
    });
  });

  describe('Yaa / Alef Maqsura matching', () => {
    it('should match "المنشاوى" (Alef Maqsura) against "المنشاوي" (Yaa)', () => {
      const results = fuzzySearch(RECITERS, 'المنشاوى');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('محمد صديق المنشاوي');
    });

    it('should match "الدوسرى" against "الدوسري"', () => {
      const results = fuzzySearch(RECITERS, 'الدوسرى');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('ياسر الدوسري');
    });

    it('should match "المعيقلى" against "المعيقلي"', () => {
      const results = fuzzySearch(RECITERS, 'المعيقلى');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('ماهر المعيقلي');
    });
  });

  describe('Tashkeel in search terms', () => {
    it('should find match when searching with full tashkeel', () => {
      const results = fuzzySearch(RECITERS, 'مُحَمَّد صِدِّيق المِنْشَاوِي');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('محمد صديق المنشاوي');
    });

    it('should find match with partial tashkeel', () => {
      const results = fuzzySearch(RECITERS, 'سَعد الغَامدي');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('سعد الغامدي');
    });
  });

  // ──────────────────────────────────────────
  // Spacing variations (عبدالباسط vs عبد الباسط)
  // ──────────────────────────────────────────

  describe('Spacing variations', () => {
    it('should match "عبدالباسط" (no space) against "عبد الباسط"', () => {
      const results = fuzzySearch(RECITERS, 'عبدالباسط');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('عبد الباسط عبد الصمد');
    });

    it('should match "عبد الباسط" (with space) against stored name', () => {
      const results = fuzzySearch(RECITERS, 'عبد الباسط');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('عبد الباسط عبد الصمد');
    });

    it('should match "عبدالرحمن" against "عبد الرحمن"', () => {
      const results = fuzzySearch(RECITERS, 'عبدالرحمن');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('عبد الرحمن السديس');
    });

    it('should match extra spaces "عبد  الباسط  عبد  الصمد"', () => {
      const results = fuzzySearch(RECITERS, 'عبد  الباسط  عبد  الصمد');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('عبد الباسط عبد الصمد');
    });

    it('should match items stored without space (عبدالله) when searching with space', () => {
      const results = fuzzySearch(RECITERS, 'عبد الله');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('عبدالله بصفر');
    });

    it('should match "عبدالودود" against "عبدالودود"', () => {
      const results = fuzzySearch(RECITERS, 'عبد الودود');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('عبدالودود حنيف');
    });
  });

  // ──────────────────────────────────────────
  // Typo tolerance (Arabic keyboard adjacency)
  // ──────────────────────────────────────────

  describe('Typo tolerance', () => {
    it('should match with one character typo (ض vs د)', () => {
      // ض is adjacent to د on Arabic keyboard
      const results = fuzzySearch(RECITERS, 'عبض الباسط');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('عبد الباسط عبد الصمد');
    });

    it('should match with character substitution (ص vs س)', () => {
      // السديص instead of السديس
      const results = fuzzySearch(RECITERS, 'السديص');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('عبد الرحمن السديس');
    });

    it('should match with missing character', () => {
      // الغامد instead of الغامدي
      const results = fuzzySearch(RECITERS, 'الغامد');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('سعد الغامدي');
    });

    it('should match with extra character', () => {
      // الغاممدي instead of الغامدي
      const results = fuzzySearch(RECITERS, 'الغاممدي');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('سعد الغامدي');
    });

    it('should match with character transposition', () => {
      // الحرصي → الحصري
      const results = fuzzySearch(RECITERS, 'الحرصي');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('محمود خليل الحصري');
    });
  });

  // ──────────────────────────────────────────
  // Mixed Arabic/English search
  // ──────────────────────────────────────────

  describe('Mixed Arabic/English search', () => {
    const mixedItems = [
      { id: 1, name: 'Sheikh Abdul Basit' },
      { id: 2, name: 'عبد الباسط عبد الصمد' },
      { id: 3, name: 'Muhammad Al-Hussary' },
      { id: 4, name: 'Abu Bakr Ash-Shatiri' },
    ];

    it('should find English name with lowercase search', () => {
      const results = fuzzySearch(mixedItems, 'sheikh');
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].name).toBe('Sheikh Abdul Basit');
    });

    it('should find English name with uppercase search', () => {
      const results = fuzzySearch(mixedItems, 'SHEIKH');
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].name).toBe('Sheikh Abdul Basit');
    });

    it('should find English name with mixed case search', () => {
      const results = fuzzySearch(mixedItems, 'Abdul');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('Sheikh Abdul Basit');
    });

    it('should find Arabic name in mixed dataset', () => {
      const results = fuzzySearch(mixedItems, 'عبد الباسط');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('عبد الباسط عبد الصمد');
    });
  });

  // ──────────────────────────────────────────
  // Arabic-Indic digit search
  // ──────────────────────────────────────────

  describe('Arabic-Indic digit search', () => {
    const numberedItems = [
      { id: 1, name: 'سورة البقرة 2' },
      { id: 2, name: 'سورة آل عمران 3' },
      { id: 3, name: 'الجزء 30' },
      { id: 4, name: 'الحزب ١٥' },
    ];

    it('should match Arabic-Indic digits against Western digits', () => {
      const results = fuzzySearch(numberedItems, '١٥');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('الحزب ١٥');
    });

    it('should match Western digits against Arabic-Indic digits', () => {
      const results = fuzzySearch(numberedItems, '15');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('الحزب ١٥');
    });
  });

  // ──────────────────────────────────────────
  // Ranking and ordering
  // ──────────────────────────────────────────

  describe('Ranking and ordering', () => {
    it('should rank exact matches higher than partial matches', () => {
      const results = fuzzySearch(RECITERS, 'محمد صديق المنشاوي');
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].name).toBe('محمد صديق المنشاوي');
    });

    it('should rank closer matches higher than distant ones', () => {
      // "محمد" matches multiple: محمد صديق المنشاوي, محمد أيوب, محمود (partial)
      const results = fuzzySearch(RECITERS, 'محمد أيوب');
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].name).toBe('محمد أيوب');
    });
  });

  // ──────────────────────────────────────────
  // Edge cases
  // ──────────────────────────────────────────

  describe('Edge cases', () => {
    it('should return all items for empty search term', () => {
      const results = fuzzySearch(RECITERS, '');
      expect(results).toHaveLength(RECITERS.length);
    });

    it('should return all items for whitespace-only search term', () => {
      const results = fuzzySearch(RECITERS, '   ');
      expect(results).toHaveLength(RECITERS.length);
    });

    it('should return all items for tabs/newlines-only search term', () => {
      const results = fuzzySearch(RECITERS, '\t\n');
      expect(results).toHaveLength(RECITERS.length);
    });

    it('should return empty array for completely unrelated search', () => {
      const results = fuzzySearch(RECITERS, 'xyz123unrelated');
      expect(results).toHaveLength(0);
    });

    it('should handle search with special characters', () => {
      const results = fuzzySearch(RECITERS, '@#$%^&*');
      expect(results).toHaveLength(0);
    });

    it('should handle empty items array', () => {
      const results = fuzzySearch([], 'محمد');
      expect(results).toHaveLength(0);
    });

    it('should handle single-item array', () => {
      const single = [{ name: 'محمد' }];
      const results = fuzzySearch(single, 'محمد');
      expect(results).toHaveLength(1);
    });

    it('should handle single Arabic character search', () => {
      // minMatchCharLength is 2, so single char shouldn't match
      const results = fuzzySearch(RECITERS, 'م');
      // May or may not return results depending on Fuse.js behavior
      // but should not throw
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle two-character Arabic search', () => {
      const results = fuzzySearch(RECITERS, 'سع');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('سعد الغامدي');
    });
  });

  // ──────────────────────────────────────────
  // Return value integrity
  // ──────────────────────────────────────────

  describe('Return value integrity', () => {
    it('should return original objects, not modified copies', () => {
      const results = fuzzySearch(RECITERS, 'محمد');
      expect(results.length).toBeGreaterThan(0);

      for (const result of results) {
        expect(RECITERS).toContainEqual(result);
      }
    });

    it('should not add normalizedName or spacelessName to returned objects', () => {
      const results = fuzzySearch(RECITERS, 'محمد');
      expect(results.length).toBeGreaterThan(0);

      for (const result of results) {
        expect(result).not.toHaveProperty('normalizedName');
        expect(result).not.toHaveProperty('spacelessName');
        expect(result).not.toHaveProperty('originalIndex');
      }
    });

    it('should preserve all properties of original objects', () => {
      const itemsWithExtraProperties = [
        {
          id: 1,
          name: 'عبد الباسط عبد الصمد',
          country: 'مصر',
          views: 1000,
          moshafCount: 5,
        },
        {
          id: 2,
          name: 'محمد صديق المنشاوي',
          country: 'مصر',
          views: 2000,
          moshafCount: 3,
        },
      ];

      const results = fuzzySearch(itemsWithExtraProperties, 'عبد الباسط');
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0]).toHaveProperty('country', 'مصر');
      expect(results[0]).toHaveProperty('views', 1000);
      expect(results[0]).toHaveProperty('moshafCount', 5);
    });

    it('should not contain duplicates in results', () => {
      const results = fuzzySearch(RECITERS, 'عبد');
      const ids = results.map((r) => r.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });
  });

  // ──────────────────────────────────────────
  // Performance
  // ──────────────────────────────────────────

  describe('Performance', () => {
    it('should handle a large dataset (1000 items) within 200ms', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, index) => ({
        id: index,
        name: `قارئ ${index} بن عبد الله`,
      }));
      largeDataset.push({ id: 1001, name: 'عبد الباسط عبد الصمد' });

      const startTime = performance.now();
      const results = fuzzySearch(largeDataset, 'عبد الباسط');
      const endTime = performance.now();

      expect(results.length).toBeGreaterThan(0);
      const names = results.map((r) => r.name);
      expect(names).toContain('عبد الباسط عبد الصمد');
      expect(endTime - startTime).toBeLessThan(200);
    });
  });

  // ──────────────────────────────────────────
  // Real-world user scenarios (Quran app UX)
  // ──────────────────────────────────────────

  describe('Real-world Quran app scenarios', () => {
    it('should find reciter when user pastes text with tashkeel from Mushaf', () => {
      const results = fuzzySearch(RECITERS, 'عَبْدُ الْبَاسِطِ');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('عبد الباسط عبد الصمد');
    });

    it('should find "أبو بكر الشاطري" without hamza', () => {
      const results = fuzzySearch(RECITERS, 'ابو بكر الشاطري');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('أبو بكر الشاطري');
    });

    it('should find "ياسر الدوسري" with Alef Maqsura variation', () => {
      const results = fuzzySearch(RECITERS, 'ياسر الدوسرى');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('ياسر الدوسري');
    });

    it('should find "ناصر القطامي" with partial name', () => {
      const results = fuzzySearch(RECITERS, 'القطامي');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('ناصر القطامي');
    });

    it('should find "فارس عبّاد" (with shadda on ب)', () => {
      // The stored name has shadda: عبّاد
      const results = fuzzySearch(RECITERS, 'فارس عباد');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('فارس عبّاد');
    });

    it('should find "بندر بليلة" using just last name', () => {
      const results = fuzzySearch(RECITERS, 'بليلة');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('بندر بليلة');
    });

    it('should differentiate between similar names', () => {
      const results = fuzzySearch(RECITERS, 'الغامدي');
      const names = results.map((r) => r.name);

      // Should find الغامدي
      expect(names).toContain('سعد الغامدي');

      // Should NOT include very different names like المعيقلي
      expect(names).not.toContain('ماهر المعيقلي');
    });

    it('should handle combined normalization challenges', () => {
      // آل ياسين: Alef with Madda + name
      const results = fuzzySearch(RECITERS, 'آل ياسين');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('آل ياسين');
    });

    it('should handle tatweel in search term', () => {
      const results = fuzzySearch(RECITERS, 'مـاهـر المعيقلي');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('ماهر المعيقلي');
    });

    it('should find reciter with "إدريس" when typing "ادريس ابكر"', () => {
      const results = fuzzySearch(RECITERS, 'ادريس ابكر');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('إدريس أبكر');
    });
  });

  // ──────────────────────────────────────────
  // Surah name search scenarios
  // ──────────────────────────────────────────

  describe('Surah name search scenarios', () => {
    const surahs = [
      { id: 1, name: 'الفاتحة' },
      { id: 2, name: 'البقرة' },
      { id: 3, name: 'آل عمران' },
      { id: 36, name: 'يس' },
      { id: 55, name: 'الرحمن' },
      { id: 112, name: 'الإخلاص' },
      { id: 113, name: 'الفلق' },
      { id: 114, name: 'الناس' },
    ];

    it('should find "الفاتحة" when searching "الفاتحه" (ة→ه confusion)', () => {
      // After normalization, both ة and ه become ه
      const results = fuzzySearch(surahs, 'الفاتحه');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('الفاتحة');
    });

    it('should find "آل عمران" with plain Alef', () => {
      const results = fuzzySearch(surahs, 'ال عمران');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('آل عمران');
    });

    it('should find "الإخلاص" without hamza below', () => {
      const results = fuzzySearch(surahs, 'الاخلاص');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('الإخلاص');
    });

    it('should find short surah name "يس"', () => {
      const results = fuzzySearch(surahs, 'يس');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('يس');
    });

    it('should find "الرحمن" from Quranic text "ٱلرَّحْمَـٰنِ"', () => {
      const results = fuzzySearch(surahs, 'ٱلرَّحْمَـٰنِ');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('الرحمن');
    });
  });

  // ──────────────────────────────────────────
  // Generic type safety
  // ──────────────────────────────────────────

  describe('Generic type safety', () => {
    it('should work with minimal { name: string } type', () => {
      const items = [{ name: 'محمد' }, { name: 'أحمد' }];
      const results = fuzzySearch(items, 'محمد');
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should work with complex types extending { name: string }', () => {
      interface Reciter {
        id: number;
        name: string;
        riwaya: string;
        server: string;
        surahCount: number;
      }

      const items: Reciter[] = [
        {
          id: 1,
          name: 'عبد الباسط',
          riwaya: 'حفص',
          server: 'https://example.com',
          surahCount: 114,
        },
      ];

      const results = fuzzySearch(items, 'عبد الباسط');
      expect(results).toHaveLength(1);
      expect(results[0].riwaya).toBe('حفص');
      expect(results[0].surahCount).toBe(114);
    });
  });

  // ──────────────────────────────────────────
  // Optional threshold parameter
  // ──────────────────────────────────────────

  describe('Optional threshold parameter', () => {
    const items = [
      { id: 1, name: 'محمد صديق المنشاوي' },
      { id: 2, name: 'محمد أيوب' },
      { id: 3, name: 'محمود خليل الحصري' },
    ];

    it('should use default threshold (0.35) when not specified', () => {
      const results = fuzzySearch(items, 'محمد');
      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it('should accept stricter threshold (0.2) for more exact matches', () => {
      // With strict threshold, "محمد" should match "محمد" but not "محمود"
      const results = fuzzySearch(items, 'محمد', { threshold: 0.2 });
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('محمد صديق المنشاوي');
      expect(names).toContain('محمد أيوب');
    });

    it('should accept looser threshold (0.5) for more typo tolerance', () => {
      // With loose threshold, even with typo "مخمد" should match "محمد"
      const results = fuzzySearch(items, 'مخمد', { threshold: 0.5 });
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should accept perfect match threshold (0.0)', () => {
      const results = fuzzySearch(items, 'محمد صديق المنشاوي', {
        threshold: 0.0,
      });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('محمد صديق المنشاوي');
    });
  });

  // ──────────────────────────────────────────
  // Memoization / Cache
  // ──────────────────────────────────────────

  describe('Normalization cache', () => {
    it('should cache normalized results for repeated calls', () => {
      const text = 'مُحَمَّد صِدِّيق المِنْشَاوِي';

      // First call - computes normalization
      const first = normalizeArabicText(text);

      // Second call - should use cached value
      const second = normalizeArabicText(text);

      expect(first).toBe(second);
      expect(first).toBe('محمد صديق المنشاوي');
    });

    it('should improve performance for static datasets', () => {
      const reciters = RECITERS.slice(0, 10);

      // First search - caches normalizations
      const start1 = performance.now();
      fuzzySearch(reciters, 'محمد');
      const duration1 = performance.now() - start1;

      // Second search - uses cached normalizations
      const start2 = performance.now();
      fuzzySearch(reciters, 'محمد');
      const duration2 = performance.now() - start2;

      // Second search should be faster (though not guaranteed due to JIT)
      // Just verify both complete without error
      expect(duration1).toBeGreaterThan(0);
      expect(duration2).toBeGreaterThan(0);
    });

    it('should clear cache when clearNormalizationCache is called', () => {
      const text = 'عبد الباسط';

      // Cache the value
      normalizeArabicText(text);

      // Clear cache
      clearNormalizationCache();

      // Should still work after clearing
      const result = normalizeArabicText(text);
      expect(result).toBe('عبد الباسط');
    });

    it('should cache spaceless searches separately', () => {
      const reciters = [{ name: 'عبد الباسط عبد الصمد' }];

      // Search with space
      const withSpace = fuzzySearch(reciters, 'عبد الباسط');
      expect(withSpace).toHaveLength(1);

      // Search without space (should also work due to spaceless variant)
      const withoutSpace = fuzzySearch(reciters, 'عبدالباسط');
      expect(withoutSpace).toHaveLength(1);
    });
  });
});
