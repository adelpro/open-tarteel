# Follow-along (تتبّع التلاوة)

Status: design locked, implementation started on `feat/follow-along`.

A player mode that follows a recitation: the word being recited is highlighted,
tajweed rules are coloured on those same glyphs, and a live pitch contour is
drawn from the same audio. It is a listening and teaching aid. It does not judge
a recitation, score it, or detect mistakes.

## Naming

| Layer            | Name                         | Why                              |
| ---------------- | ---------------------------- | -------------------------------- |
| Mode             | تتبّع التلاوة / Follow-along | names the user's task            |
| Capability badge | كلمة بكلمة / Word-by-word    | names what the provider supplies |
| Graph panel      | منحنى الصوت / Pitch contour  | names the technical artefact     |

"Pitch" was rejected as the mode name: it is audio-engineering vocabulary, and in
Arabic it sits next to نغمة / تلحين, which reads as musicalising recitation. The
technical term stays where it is accurate — on the graph.

## Scope

- One mode inside the existing player, reachable from the mode switcher.
- Word-level highlight, tajweed colouring, pitch contour, optional English line.
- Word timings from Quran Foundation and a curated MP3Quran v4 set.
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
| Word timings | MP3Quran v4          | 12 audited recitations, staging host     |

Hashes, URLs and licences: [data-sources.md](data-sources.md).

## Documents

- [decisions.md](decisions.md) — what was decided and why.
- [data-sources.md](data-sources.md) — provenance, hashes, licences.
- [reference-index.md](reference-index.md) — ayah and word identity.
- [timing-alignment.md](timing-alignment.md) — provider payloads and the repair.
- [audit-results.md](audit-results.md) — every measured number.
- [implementation-plan.md](implementation-plan.md) — phases and exit criteria.

## Honest accuracy

Word timings cover 99.45% of words for the locked Quran Foundation set and
99.99% for the audited MP3Quran v4 set. The pitch contour is an estimate from
compressed audio. Colours mark where a rule applies, not whether it was applied
correctly. These numbers ship in the About page and are computed from the data,
never typed by hand.
