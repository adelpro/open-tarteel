# Language switcher fix + Google SEO guidance check

Date: 2026-11-21
Branch: `develop` at `de1d5b7`

## Fix applied

`src/components/language-switcher.tsx`: `h-10` → `h-11` (44px) and the ad-hoc `focus:ring-2 focus:ring-primary/35` chain → the shared `.focus-ring` utility. `aria-label` and the `MdExpandMore` affordance are unchanged.

Verified: `corepack yarn build` ✓, `corepack yarn type-check` ✓, `corepack yarn lint` ✓, `corepack yarn test:run` 516 passed / 6 skipped.

## Google guidance check (local production build on port 3100)

Basis: Google Search Central localized-page guidance and the seo-audit international SEO reference. Evidence is from the rendered production build and its `sitemap.xml`/`robots.txt`.

### Pass

- **Locale URL structure:** Arabic bare, `/en`, `/de` subdirectories. No `?lang=` parameters or Accept-Language negotiation.
- **`<html lang>`:** `/` → `ar`, `/en` → `en`, `/de` → `de`; `/en/about` → `en`, `/de/about` → `de`.
- **Titles and descriptions:** distinct and translated per locale (`القرآن الكريم...` / `The Holy Quran...` / `Der Heilige Koran...`).
- **Canonicals:** self-referencing on `/`, `/en`, `/de`, `/about`, `/en/about`; no cross-locale canonical. The canonical URL appears in each hreflang set.
- **Hreflang placement:** sitemap `xhtml:link` only, which Google accepts as equivalent to HTML `<link>` or HTTP `Link` headers. No conflicting HTML annotations were found.
- **Hreflang integrity:** 12 sitemap entries carry alternates (`ar`, `en`, `de`, `x-default`); XML parser check found 0 errors: every target is in the sitemap, every pair is reciprocal, every entry self-references, and all 12 unique target URLs return 200.
- **Noindex hygiene:** `/settings`, `/en/settings`, `/de/settings` return `noindex, nofollow`; settings is absent from the sitemap.
- **No duplicate language codes:** valid `ar`, `en`, `de`, `x-default` only.
- **Switcher behaviour:** `/settings` renders Arabic, `/en/settings` English, `/de/settings` German after hydration; translated labels are present in `ar.json`, `en.json`, `de.json`.

### Findings

1. **Staging is correctly noindexed** — `robots.txt` on `staging-tarteel.quran.us.kg` is `Disallow: /`. Intentional; not a defect.
2. **Production robots/sitemap mismatch (outside this branch)** — `https://tarteel.quran.us.kg/robots.txt` points to `https://quran.us.kg/sitemap.xml`, and that sitemap has no `xhtml:link` alternates and a stale `lastmod`. This is a deployment/config issue on the production site, not in this code; on staging the generated URLs use the correct `https://staging-tarteel.quran.us.kg` origin. Fix during the next production deploy by setting `NEXT_PUBLIC_APP_URL=https://tarteel.quran.us.kg` and verifying `robots.txt` and `sitemap.xml`.
3. **Server HTML for prefixed settings URLs is Arabic** — middleware rewrites `/en/settings` and `/de/settings` to the Arabic tree; the locale switches after hydration. Those URLs are `noindex`, so the impact is limited to first paint. Acceptable as-is.
4. **No HTML-level hreflang** — sitemap-only is valid per Google; adding `<link rel="alternate">` would give a second signal but risks conflicts if the two methods drift. No action needed.

### Recommended next step

Verify the production robots/sitemap after the next deploy (finding 2). No code change is required for the language switcher or hreflang implementation from this check.
