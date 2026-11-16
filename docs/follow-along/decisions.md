# Decisions

Numbered so later discussions can cite them. Each is a call, not a preference.

| #   | Decision                                                                 | Why                                                               |
| --- | ------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| D1  | Ship inside Open Tarteel as a player mode, not a separate package        | One codebase, one release; the provider layer already exists here |
| D2  | Mode name is تتبّع التلاوة / Follow-along                                | Describes the task; avoids musical framing                        |
| D3  | Keep "Pitch contour" for the graph panel only                            | Accurate where it belongs                                         |
| D4  | Store Tanzil text verbatim, never edit it                                | Tanzil terms allow verbatim copies; no modification               |
| D5  | Word index is derived from the verbatim text, not stored as text         | One coordinate space with tajweed offsets                         |
| D6  | Only word-timing providers can serve the mode                            | Ayah-only providers cannot follow a word                          |
| D7  | Quran Foundation is locked; MP3Quran v4 is locked to audited recitations | v4 has no word-timing flag, so curation is the only honest gate   |
| D8  | Exclude MP3Quran/QF recitation id 168                                    | Repeats words for children; 5,516 malformed rows                  |
| D9  | Repetitions are index → interval list, not one interval                  | Reciters repeat phrases; first-wins would blank the repeat        |
| D10 | Malformed segment rows are dropped before counting                       | Providers ship `[12231]`-style rows and negative durations        |
| D11 | Fall back to ayah-level below 85% index coverage                         | One threshold, measurable, visible in the About page              |
| D12 | Hafs only, enforced by `moshaf.riwaya`                                   | No other riwayah has word timings today                           |
| D13 | English translation is served unmodified                                 | CC BY-ND: no edits, no derived corpus                             |
| D14 | Percentages are computed at build time and shipped                       | Typed numbers rot; derived ones cannot                            |
| D15 | Pitch detection uses pitchy (McLeod Pitch Method)                        | Fast in JS, clarity score per frame, 0BSD                         |
| D16 | New analyser node for pitch, same AudioContext                           | The shared analyser is tuned for the bars (1024/0.75)             |
| D17 | Mode is behind `NEXT_PUBLIC_ENABLE_FOLLOW_ALONG`                         | Kill switch, on in staging first                                  |
| D18 | Badge "Word-by-word" only for word _timings_                             | Qurani.ai has word audio, not word timings                        |
| D19 | Ahkam rail is word-granularity, sound rules only                         | Rule position inside a word is unknown; text facts, not voice     |
| D20 | No durations or harakat counts are displayed                             | Both are scoring inputs; the mode is explicitly not judgement     |
