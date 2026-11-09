# Open Tarteel SEO Design

Date: 2026-11-09
Status: proposed

## Intent

Make Open Tarteel rank for reciter and Quran-listening searches, and make shared links and social cards describe the page the visitor actually lands on. The reference is the SEO work in `adelpro/open-tilawa`: real HTML per route, one canonical URL, language twins with `hreflang`, structured data, a sitemap that only lists indexable pages, and automated checks.

## Goals

- Crawlers get real server-rendered HTML for home, reciter, about, contact, and privacy.
- Every indexable page has one canonical URL, a unique title, a description, an H1, and an OG card.
- Arabic is the default and `x-default`; English and German have their own URLs and reciprocal `hreflang`.
- Structured data covers the site, the organisation, the app, breadcrumbs, the reciter's surah list, and the About FAQ.
- `sitemap.xml` lists only indexable pages; `robots.txt` names it; preview/branch deploys are `noindex`.
- Tests fail when a page loses its canonical, title, JSON-LD, or language twin.

## Non-goals

- Per-surah indexable pages. This follows the current open-tilawa model: the reciter is the unit of grouping.
- Changing audio providers, playback, or the tahfeez engine.
- Paid SEO, backlinks, or analytics.
- Translating the recitation names into new languages.

## Constraints

- Next.js App Router, React 19, `react-intl`, existing locales `ar`, `en`, `de`.
- Keep existing Arabic URLs (bare paths) so crawl history is not thrown away.
- No new runtime dependency unless a task explicitly names one.
- Metadata is generated on the server; no client-only titles.
- Every indexable page must have a visible H1 and unique title/description.
- JSON-LD must escape `<` so page copy cannot close the script element.

## Decisions

1. **Use Next server components and ISR, not a prerender script.** open-tilawa's `prerender.mjs` exists because it is a Vite SPA. Next already writes server HTML; the work is making the server components render the words and metadata.
2. **Arabic is `x-default` at bare paths.** English is `/en/...`, German is `/de/...`. A middleware rewrite keeps the existing route tree, sets a request locale header, and keeps the locale cookie for client preference. This preserves `/`, `/about`, `/reciter/...` and adds twins.
3. **One indexable page per reciter id.** `?moshafId` and `?surah` are player state; the canonical is `/reciter/[id]`. The page lists every moshaf and the 114 surah names, so the page is not a thin duplicate.
4. **One route table is the source of truth.** `src/lib/seo/routes.ts` owns paths, indexability, sitemap inclusion, and locale prefixing. Metadata, sitemap, links, and tests read it; no page builds a canonical by string concatenation.
5. **Static OG image first.** Replace the 1024×1024 Twitter image with a 1200×630 card and reuse the existing 1200×630 OG image. Per-reciter OG images are a later polish.
6. **Previews are not indexable.** Deploy previews and branch deploys get `X-Robots-Tag: noindex, nofollow` and do not advertise a sitemap.

## Approaches considered

- **A. Prerender script like open-tilawa** — rejected. Next's server components already produce HTML; a second build step would duplicate the router and drift.
- **B. Cookie-only locale** — rejected for SEO. One URL cannot rank in three languages, and `hreflang` has nothing to point at.
- **C. URL locales with Arabic bare and `/en` + `/de`** — chosen. It preserves existing Arabic URLs and matches the open-tilawa pattern.
- **D. Per-surah indexable pages** — rejected. The content is the same 114 names with a different reciter; open-tilawa deliberately groups by reciter. `?surah` remains a shareable player state, not an indexable page.

## Current gaps

- `src/app/page.tsx` is client-only and auto-redirects to the last reciter. A crawler sees a shell and a client navigation, not a stable home document.
- `src/app/reciter/[id]/page.tsx` returns a generic “Reciter” title for every reciter; the server HTML is a skeleton, and an unknown id is a 200 error state rather than a 404.
- There is no URL-based locale, so `hreflang`, localized titles, and separate language rankings are impossible.
- `sitemap.ts` has no language alternates; `robots.ts` is fine but previews are not noindex.
- JSON-LD has `WebApplication` and `Organization` only; no `WebSite`, `@id` graph, breadcrumbs on static pages, reciter `ItemList`, or About FAQ.
- `twitter-image.png` is 1024×1024 while the OG image is 1200×630.
- Static page metadata is hardcoded English and says “Arabic Privacy page” even in English.
- No SEO regression tests or deployed-page audit.

## Success measures

- `/`, `/about`, `/contact`, `/privacy`, and every `/reciter/[id]` return 200 with a unique title, canonical, H1, and JSON-LD.
- `/en/...` and `/de/...` return 200 with the right `lang`, canonical, and reciprocal `hreflang`.
- `/settings`, `/offline`, `/design-preview`, and preview hosts are `noindex`.
- `sitemap.xml` lists every indexable URL and no noindex URL; every listed URL answers 200.
- Search Console accepts the sitemap with no “couldn’t fetch”, “noindex”, or “canonical mismatch” errors.
