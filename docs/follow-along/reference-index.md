# Reference index

Tanzil has no word numbers. It has 6,236 ayah strings and nothing else. The
index below is therefore _ours_, derived from the verbatim text, and everything
else, tajweed, providers, translation, is mapped onto it.

## Identifiers

| Id              | Range         | Definition                                       |
| --------------- | ------------- | ------------------------------------------------ |
| `ayahId`        | 1..6,236      | mushaf order; equals the English CSV `id` column |
| `wordId`        | 1..77,878     | every whitespace span, basmala included          |
| `storedIndex`   | 1..N per ayah | the word's ordinal inside the verbatim string    |
| `providerIndex` | 1..N−basmala  | what timing providers call the word              |

Totals: 6,236 ayahs, 77,878 words, 448 basmala words (112 surahs × 4), leaving
**77,430 provider-addressable words**.

Corpus fingerprint over all ayah strings: `379fc74a2312d28a3331b07cadd96843f3871bbcb43c1310275dc8d2ac75ac9e`.

## Derivation

A word is a half-open codepoint span between U+0020, identical in mechanism to a
tajweed annotation:

```js
for (i in 0..text.length) {
  if (text[i] is not space and start === -1) start = i;
  if (text[i] is space and start !== -1) push({ start, end: i }), start = -1;
}
```

Verified across all 6,236 ayahs: only U+0020 appears, single, never leading or
trailing; spans are ordered, non-overlapping and trim to non-empty. 0 violations.

`wordId` is the running prefix sum of per-ayah word counts, so storing counts is
enough to reproduce the ids.

## Basmala: three cases

| Case                    | Surahs    | Stored text                  | `basmalaWords` | providerIndex                           |
| ----------------------- | --------- | ---------------------------- | -------------- | --------------------------------------- |
| Basmala is ayah 1       | 1         | the basmala is 1:1           | 0              | 1..4 are real words                     |
| No basmala              | 9         | 1:1 starts at براءة          | 0              | 1..9                                    |
| Basmala prefixes ayah 1 | other 112 | basmala + ayah in one string | 4              | `storedIndex − 4`, null for the first 4 |

Detection is by normalised letters, not by a surah list. The count of surahs with
a prefix must stay exactly 112; a change means the text version drifted.

## The four divergent ayahs

Two conventions exist for word boundaries. Ours is the Tanzil token; MP3Quran v4
uses printed mushaf words.

| Ayah   | Tanzil tokens | Quran Foundation | MP3Quran v4 |
| ------ | ------------- | ---------------- | ----------- |
| 2:181  | 13            | 13               | 14          |
| 8:6    | 11            | 11               | 12          |
| 13:37  | 19            | 19               | 20          |
| 37:130 | 4             | 4                | 4           |

MP3Quran v4 splits `بَعْدَمَا` into two words; Quran Foundation and Tanzil keep it
whole. The split position is not the same in every ayah, so the mapping is a
table, not one formula:

| Ayah  | Split after our word `k` | Mapping from MP3Quran v4 index `p`           |
| ----- | ------------------------ | -------------------------------------------- |
| 2:181 | 3                        | `p < 3` → p, `p` 3 or 4 → 3, `p > 4` → p − 1 |
| 8:6   | 4                        | `p < 4` → p, `p` 4 or 5 → 4, `p > 5` → p − 1 |
| 13:37 | 8                        | `p < 8` → p, `p` 8 or 9 → 8, `p > 9` → p − 1 |

In general, with the split after word `k`: `p < k → p`, `k ≤ p ≤ k+1 → k`,
`p > k+1 → p − 1`. The extra index always appears at the end of the verse,
because the split shifts every later word by one.

Note: Quran.com's _word list_ merges `إِلْ يَاسِينَ` into one entry (3 words for
37:130), but its _segments_ use 4, like Tanzil. Do not join it.

Independent check: Quran Foundation segment counts equal Tanzil tokens in 52 of
52 audited cases (14 reciters × 4 ayahs), except one anomaly, al-Shatri 8:6
returns 12 for 11 tokens, which the 85% fallback absorbs.

## Storage shape

Per ayah: verbatim `text`, `annotations`, `wordCount`, `basmalaWords`. Spans and
`wordId`s are computed at load; a manifest records `totalWords`, per-surah word
counts and the corpus hash. The alternative, writing every span, adds roughly
1.5–2 MB for values that are derivable and now verified.

## Invariants to test

1. 6,236 ayah ids, no gaps, equal to the CSV `id` and `(surah, ayah)`.
2. Exactly 112 surahs carry a basmala prefix; 1 and 9 do not.
3. Word counts reproduce Quran Foundation segment counts except the three
   ayahs where MP3Quran v4 splits `بَعْدَمَا`, and 37:130 which is kept at four.
4. Every annotation lies inside its ayah; every word span is ordered.
5. Regenerating from the pinned inputs yields the same digests.
