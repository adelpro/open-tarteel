# Data sources

Everything the mode reads is pinned by identity and hash. A build that cannot
reproduce these digests must fail, not warn.

## 1. Arabic text: Tanzil Uthmani v1.0.2

| Field       | Value                                                              |
| ----------- | ------------------------------------------------------------------ |
| Name        | Tanzil Quran Text (Uthmani, version 1.0.2)                         |
| Origin      | <https://tanzil.net>                                               |
| Pinned copy | `github.com/cpfair/quran-tajweed/files/7281388/quran-uthmani.txt`  |
| SHA-256     | `abe6447a5d29bb126383ba9120628060cf96dc9ef5b402a506fc251f6ed0b9a2` |
| Size        | 1,376,504 bytes, 28 comment lines                                  |
| Records     | 6,236 ayahs, 114 surahs (1:7, 2:286, 9:129, 112:4, 114:6)          |
| Licence     | CC BY 3.0 + Tanzil terms of use                                    |

The file must stay verbatim: no stripping, no normalisation, no reordering. The
basmala stays inside ayah 1 exactly as Tanzil stores it.

Verified: all 6,236 stored ayah strings are byte-identical to this copy.

## 2. Tajweed: cpfair/quran-tajweed

| Field   | Value                                                              |
| ------- | ------------------------------------------------------------------ |
| Repo    | <https://github.com/cpfair/quran-tajweed>                          |
| Commit  | `6689c33bf3d903d1ef75bef62a83750e0a5a7737` (2017-04-16)            |
| Path    | `output/tajweed.hafs.uthmani-pause-sajdah.json`                    |
| SHA-256 | `151d616ad37a4cc21a80f20d5e1104c5b408375107ddd4d71247dea4c05ebf67` |
| Records | 6,236 ayah records, 60,057 annotations, 18 distinct rules          |
| Licence | CC BY 4.0 (annotations)                                            |

Shape: `{annotations: [{rule, start, end}], ayah, surah}` in mushaf order.
Offsets are half-open codepoint ranges into that ayah's text, **basmala
included**. 40 overlapping pairs exist; the later annotation wins when building
a per-character map.

Two rule ids differ from the historical consumer map:
`idghaam_mutajanisayn` and `idghaam_mutaqaribayn` (the map had
`idghaam_mutajaanisain`, `idghaam_mutaqaaribain`), leaving 71 annotations
unstyled until the map is fixed.

## 3. English: Itqan CMS asset 9

| Field            | Value                                                                            |
| ---------------- | -------------------------------------------------------------------------------- |
| Catalogue        | <https://api.cms.itqan.dev/packages/>                                            |
| Package          | `english-translation`, asset_version_id **9**, resolved 1.0.0                    |
| Download         | `storage.cms.itqan.dev/media/uploads/assets/9/versions/None/tr-ab-en_hilali.csv` |
| SHA-256          | `598d2890df64e4246b3f80734b54516b8ea1108fe141da362cfcb4f4ccc23a56`               |
| Internal version | `english_hilali_khan`, `v1.1.1-csv.1`, updated 2025-01-15                        |
| Rows             | 6,236, `id` 1..6236, all ayahs present                                           |
| Publisher field  | IslamHouse (distributor); text: Al-Hilali & Khan, Darussalam                     |
| Licence          | **CC BY-ND**, not verifiable through the API, recorded from the gallery page     |

Real CSV header is `id,sura,aya,translation,footnotes`, not the
`surah,ayah,text` the package metadata declares. Validate the header, never the
manifest.

### CC BY-ND constraints

| Allowed                           | Not allowed                                                     |
| --------------------------------- | --------------------------------------------------------------- |
| Verbatim copies, whole or in part | Edited text                                                     |
| Format shifting for display       | Removing verse numbers or footnote markers from the stored copy |
| Rendering choices in the UI       | Merging commentary into the text                                |

So: one file, unmodified, hash-pinned, header intact. Parsing happens in memory;
the leading `N. ` prefix and `[n]` markers are hidden at render time only.

## 4. Word timings: Quran Foundation

| Field    | Value                                                                    |
| -------- | ------------------------------------------------------------------------ |
| Endpoint | `/content/api/v4/chapter_recitations/{id}/{chapter}?segments=true`       |
| Auth     | OAuth2 client credentials, token at `oauth2.quran.foundation`            |
| Reciters | 14 chapter reciters; id 168 excluded (repeats for children)              |
| Shape    | `audio_file.timestamps[].segments = [[wordIndex, start, end]]` per verse |

OAuth responses return segment times as floats and a negative `duration` field;
never trust `duration`. The public API (`api.quran.com/api/v4`) returns the same
content with integer times.

## 5. Word timings: MP3Quran v4

| Field     | Value                                                                      |
| --------- | -------------------------------------------------------------------------- |
| Endpoint  | `/v4/recitations/{id}/surahs/{n}/word-timings`                             |
| Host      | `api-staging.mp3quran.net`, **no production host exists**                  |
| Flag      | `NEXT_PUBLIC_ENABLE_MP3QURAN_V4`, beta in the capability registry          |
| Catalogue | 297 recitations, 235 Hafs                                                  |
| Shape     | `data.words = [[ayah, position, start, end, flag]]`, `data.estimated = []` |
| Basmala   | `ayah: 0` row in `ayah-timings`; absent for surah 1 and surah 9            |

`flag` was `1` in every sampled row and `estimated` was always empty; both are
undocumented, so neither is relied upon.

## Provider logos (About page)

The four marks in `public/images/providers/` are local typographic wordmarks
drawn for this app, not copied trademark artwork. They are served from the app
so the credits section works offline.

| File                  | Provider         | Source        |
| --------------------- | ---------------- | ------------- |
| `mp3quran.svg`        | MP3Quran         | local wordmark |
| `quran-foundation.svg`| Quran Foundation | local wordmark |
| `itqan.svg`           | Itqan            | local wordmark |
| `qurani-ai.svg`       | Qurani.ai        | local wordmark |

## Attribution block (About page)

- Tanzil Quran Text (Uthmani v1.0.2): CC BY 3.0 + Tanzil terms.
- quran-tajweed @ `6689c33`: CC BY 4.0.
- English: _The Noble Qur'an_, Al-Hilali & Khan (Darussalam), via QuranEnc -
  CC BY-ND, unmodified.
- Quran.com / Quran Foundation and MP3Quran: provider terms.
  (ICMC 2005).
