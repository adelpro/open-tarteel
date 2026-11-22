# Full SEO audit — Open Tarteel v2.0.0 (gstack seo-audit)

Date: 2026-11-22
Method: gstack `seo-audit` skill + `scripts/seo-audit.mjs` + rendered-page checks with Playwright. Missing inputs: no Search Console access and no field Core Web Vitals, so indexing status, crawl errors and real-user CWV are not verified.

Targets:
- Cloudflare test worker (v2.0.0, deployed from `cloudflare-deploy`): https://open-tarteel-cf-test.adelpro.workers.dev
- Production (older deploy): https://tarteel.quran.us.kg

## Result on the deployed v2.0.0 test worker

`CHECK_URL=https://open-tarteel-cf-test.adelpro.workers.dev node scripts/seo-audit.mjs` produced **9 problems, all of them "is not noindex"**. That is intentional: the test target is built with `SEO_NOINDEX=true` so it cannot compete with production. Every crawlability, canonical and hreflang check passed:

- sitemap answers 200 and names itself in `robots.txt`
- no duplicate `<loc>` values
- every paired URL has `ar`, `en`, `de` and `x-default`
- every hreflang target is present in the sitemap
- all checked pages have self-referencing canonicals
- `/en`, `/de`, `/en/about` answer 200 with correct locale content

Rendered-page checks:

| URL | Title | H1 | JSON-LD | Version |
|---|---|---|---|---|
| `/about` | حول تطبيق Quran.us.kg | حول تطبيق Quran.us.kg | 2 | `v2.0.0` visible in footer |
| `/` | القرآن الكريم \| Open Tarteel | القرآن الكريم | 1 | – |
| `/en` | The Holy Quran \| Open Tarteel | The Holy Quran | 1 | – |
| `/de` | Der Heilige Koran \| Open Tarteel | Der Heilige Koran | 1 | – |
| `/settings` | القرآن الكريم \| Open Tarteel | الإعدادات | 1 | `noindex, nofollow` (intended) |

The About page version is in sync with `package.json` (`2.0.0`) because it reads `packageJson.version` directly.

## Production comparison (stale deploy)

The same audit on `https://tarteel.quran.us.kg` produced **17 problems**:

- `/en`, `/de`, `/en/about` return 404 and show a not-found H1
- no page has a canonical tag
- sitemap has no hreflang alternates
- no JSON-LD on the rendered pages
- `robots.txt` points to `https://quran.us.kg/sitemap.xml` while the host is `tarteel.quran.us.kg`

These are stale-deploy symptoms: the current code fixes all of them, as the Cloudflare test worker shows.

## Action plan

1. **Critical:** deploy current v2.0.0 code to production. That resolves the locale 404s, canonicals, hreflang and structured-data findings together.
2. **High:** confirm the new production `robots.txt` names the `tarteel.quran.us.kg` origin's sitemap.
3. **High:** re-run `CHECK_URL=https://tarteel.quran.us.kg node scripts/seo-audit.mjs`; the target is 0 problems (excluding any intentional noindex).
4. **Medium:** submit the corrected sitemap in Search Console and check Pages/International reports after crawl (MISSING today: no console access).
5. **Medium:** keep the Cloudflare test worker `noindex` until it becomes the production host.

## Summary

- Deployed v2.0.0 test worker: technically clean SEO; 9 findings are intentional noindex only.
- Production: 17 real problems, all attributable to the older deploy.
- No code change is needed for these production SEO issues; deployment is the blocker.
