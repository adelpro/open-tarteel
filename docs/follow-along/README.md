# Follow-along (تتبّع التلاوة)

Status: implemented on `feat/follow-along`, behind `NEXT_PUBLIC_ENABLE_FOLLOW_ALONG`.

A player mode that follows a recitation: the word being recited is highlighted
and tajweed rules are coloured on those same glyphs, under the spectrum. It is a
listening and learning aid only: not for correcting a recitation, and it does not
use artificial intelligence. It does not score a recitation or detect mistakes.

## Naming

| Layer            | Name                         | Why                              |
| ---------------- | ---------------------------- | -------------------------------- |
| Mode             | تتبّع التلاوة / Follow-along | names the user's task            |
| Capability badge | كلمة بكلمة / Word-by-word    | names what the provider supplies |

"Pitch" was rejected as the mode name: it is audio-engineering vocabulary, and in
Arabic it sits next to نغمة / تلحين, which reads as musicalising recitation. The
mode no longer draws pitch at all; see [D21](decisions.md).

## Scope

- One mode inside the existing player, reachable from the mode switcher.
- Word-level highlight and tajweed colouring, shown under the spectrum. The
  mode itself can be switched off in settings, which hides it entirely.
- Word timings from Quran Foundation and the MP3Quran v4 recitations that pass
  the sampled word-timing probe.
- Hafs ʿan ʿĀṣim only. Every other riwayah sees the mode disabled with a reason.

## Non-goals

- No recitation judgement, scoring, or mistake detection.
- No full mushaf page view (only the line data is reused).
- No timings for non-Hafs riwayat.
- No modified or reformatted copy of the English translation (CC BY-ND).
- No derived npm package; this ships inside Open Tarteel.

## Locked sources

| Layer        | Source               | Identity                                 |
| ------------ | -------------------- | ---------------------------------------- |
| Text         | Tanzil, Uthmani      | v1.0.2, pinned copy, CC BY 3.0           |
| Tajweed      | cpfair/quran-tajweed | commit `6689c33`, CC BY 4.0              |
| English      | Itqan CMS asset 9    | Al-Hilali & Khan, v1.1.1-csv.1, CC BY-ND |
| Word timings | Quran Foundation     | 13 chapter reciters, OAuth               |
| Word timings | MP3Quran v4          | 168 probe-verified recitations, staging  |

Hashes, URLs and licences: [data-sources.md](data-sources.md).

## Documents

- [decisions.md](decisions.md): what was decided and why.
- [data-sources.md](data-sources.md): provenance, hashes, licences.
- [reference-index.md](reference-index.md): ayah and word identity.
- [timing-alignment.md](timing-alignment.md): provider payloads and the repair.
- [audit-results.md](audit-results.md): every measured number.
- [implementation-plan.md](implementation-plan.md): phases and exit criteria.

## Honest accuracy

Word timings cover 99.45% of words for the locked Quran Foundation set. The
MP3Quran v4 set was verified by a ten-surah probe over 168 recitations, not by a
full-census audit, so no single coverage percentage is claimed for it; per-ayah
coverage is checked again during playback. Colours mark where a rule applies,
not whether it was applied correctly. The Quran Foundation figure ships in the
About page and is computed from the data, never typed by hand.
