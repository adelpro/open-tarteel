# Timing alignment

## What providers return

| Provider         | Endpoint                                     | Shape                                      | Bashmala                                     |
| ---------------- | -------------------------------------------- | ------------------------------------------ | -------------------------------------------- |
| Quran Foundation | `chapter_recitations/{id}/{n}?segments=true` | per verse, `[[wordIndex, start, end]]`     | absorbed into word 1, or a duplicate index 1 |
| MP3Quran v4      | `/recitations/{id}/surahs/{n}/word-timings`  | flat, `[ayah, position, start, end, flag]` | separate `ayah: 0` row in `ayah-timings`     |
| MP3Quran v3      | `/v3/ayat_timing?surah&read`                 | per ayah, plus polygons and page images    | `ayah: 0` row                                |
| Itqan            | `/recitations/{asset_id}/…`                  | per ayah                                   | none                                         |
| Qurani.ai        | `?includeTimings=true`                       | per ayah                                   | none                                         |

Only the first two carry word indices, so only they can drive the mode.

## The repair

Provider output is not one interval per word. Measured shapes:

- exact: one segment per word
- marker: one extra segment (ayah end, or a finer split): ignore out-of-range
- replay: the same index again, e.g. `1…15, 12…15, 16…18`
- gap: a word index is never timed, e.g. `2…16`

Algorithm, per verse:

```
N = reference word count for that ayah
for each segment:
  drop it if it is not [index, start, end] with finite numbers
  drop it if end <= start
  drop it if index < 1 or index > N
  map[index].push([start, end])        // every occurrence, not just the first
coverage = map.size / N
fallback to ayah highlighting when coverage < 0.85
```

Two rules matter:

1. **Every occurrence is kept.** A reciter repeating a phrase should highlight
   it again, not go dark. Lookup is "the interval containing t" over the list.
2. **Out-of-range indices are dropped, not clamped.** They are markers or finer
   splits, never words.

Reciter-level exclusions are separate: an entire recitation is dropped when it
cannot be repaired at all (id 168), not merged into the per-verse path.

## v4 exception table

For 2:181, 8:6 and 13:37, v4 splits `بَعْدَمَا` into two words:

```
stored = p <= 2 ? p : p <= 4 ? 3 : p - 1
```

Implemented as data (`FOLLOW_ALONG_V4_SHIFTS`), tested against the audited
set, and harmless for every other ayah.

## Basmala windows

- v4 exposes `ayah: 0` as its own row; word timings start at ayah 1, so the
  opening 4–8 seconds have no word. Show the basmala statically, unhighlighted.
- Quran Foundation has no basmala row; it is folded into verse 1. Do not
  highlight a basmala word that does not exist in the index.
- Surah 1 and 9 have no `ayah: 0` anywhere; surah 1's basmala is ayah 1 itself.

## Eligibility

```ts
canUseFollowAlong(source, moshaf) =
  getCapabilities(source).timing === 'word' &&
  moshaf.riwaya === Riwaya.Hafs &&
  moshaf.hasTimings !== false &&
  (source !== MP3QURAN_V4 || FOLLOW_ALONG_V4_RECITER_IDS.has(moshaf.id));
```

The UI composes this with `canUseAudioAnalyser(track.link)` for the graph, and
with the feature flag. Each failing term produces its own disabled reason:
offline, no word timings, not Hafs, recitation not audited, audio not analysable.

## Percentage definition

Coverage is a count, not a claim about timing accuracy, there is no ground truth
for that.

```
coverage   = Σ distinct provider indices in 1..N  /  Σ N
fallback % = verses with coverage < 0.85          /  verses
```

Over the locked sets only, each word counted once, malformed rows dropped before
summing, Hafs only. The build writes these numbers into the manifest; the About
page reads them from there.
