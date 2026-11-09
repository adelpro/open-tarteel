# SEO runbook

## URL policy

- Arabic is the default and lives at bare paths: `/`, `/about`, `/reciter/[id]`.
- English lives under `/en`, German under `/de`.
- `x-default` is always Arabic.
- Reciter pages are Arabic documents. `/en/reciter/[id]` and `/de/reciter/[id]` exist as canonicalised twins, are excluded from the sitemap, and declare no `hreflang` pair. This follows the open-tilawa model: a translated reciter page is a thin twin of the Arabic document.
- `?moshafId` and `?surah` are player state, not separate documents. Their canonical is `/reciter/[id]`.

## Source of truth

`src/lib/seo/routes.ts` owns the public paths, indexability, sitemap inclusion, and locale prefixing. Metadata, the sitemap, links, and tests read it. Do not build a canonical URL by string concatenation.

## Adding a page

1. Add the route to `ROUTES` with `index` and `sitemap` flags.
2. Add a `generateMetadata` that calls `buildPageMetadata`.
3. Server-render an H1 and the page copy. Client components are for interaction only.
4. If the page is private, set `robots: { index: false, follow: false }` and `index: false` in `ROUTES`.
5. Run `npx vitest --run` and the Playwright SEO tests.

## Checks

```bash
npx tsc --noemit
npx eslint src tests scripts --max-warnings=0
npx vitest --run
npx playwright test tests/seo.spec.ts tests/sitemap.spec.ts
```

Deployed audit:

```bash
CHECK_URL=https://tarteel.quran.us.kg npm run seo:audit
```

The audit fetches `/sitemap.xml`, checks the language twins, samples every hub page and two reciter pages, verifies self-canonicals, and confirms that no listed page is `noindex`.

## Search Console

1. Verify the domain property for the production origin.
2. Set `GOOGLE_SITE_VERIFICATION` in the production environment, or use the DNS verification method.
3. Submit `https://<origin>/sitemap.xml`.
4. Check **Page indexing** for the reciter pages and the three language homes.
5. Check **Core Web Vitals** after a week of traffic.
6. Keep preview/branch deploys out of the index with `SEO_NOINDEX=true` or the Netlify preview header already added in `next.config.ts`.

## Common failures

- A page is listed in the sitemap but returns `noindex`: remove it from `ROUTES.sitemap` or remove the robots override.
- A canonical points at `/`: the page is missing `buildPageMetadata`.
- A language twin is missing: check `withLocale` and `alternatesFor` in `src/lib/seo/routes.ts`.
- An unknown reciter returns 200: do not add a root `loading.tsx` back; it turns `notFound()` into a streamed 200. Use the per-route loading files under `about`, `contact`, `privacy`, and `settings`.
