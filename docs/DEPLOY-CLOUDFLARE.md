# Cloudflare test deploy (OpenNext Worker)

Companion to `docs/DEPLOY.md`. Netlify remains the production host; this page
describes only the `cloudflare-deploy` branch test target.

## What is deployed

`@opennextjs/cloudflare` adapts the Next standalone build into a **Worker with
static assets**. The URL is `https://open-tarteel-cf-test.adelpro.workers.dev`.
No `quran.us.kg` hostname is linked.

## Local checks

```bash
CF_BUILD=true NEXT_PUBLIC_APP_URL=https://open-tarteel-cf-test.adelpro.workers.dev \
  SEO_NOINDEX=true corepack yarn build:cf
corepack yarn preview:cf --port 8790
```

## Deploy

```bash
corepack yarn deploy:cf
```

`wrangler.jsonc` sets `nodejs_compat`, `global_fetch_strictly_public`, the
static assets binding, the self-reference service binding, and
`upload_source_maps: false`. The last one matters: uploading the ~14 MB source
map stalled on this network, while the 11.7 MB Worker uploaded successfully.

`/api/reciters` must not gzip manually on Cloudflare. The edge already
compresses responses; gzip plus edge zstd left gzip bytes that the client could
not parse, which surfaced as "فشل في تحميل القراء". The route skips manual gzip
when the `cf-ray` header is present.

## Environment

Public values are inlined at build time from `.env.cloudflare.example`. Use
the workers.dev origin for `NEXT_PUBLIC_APP_URL` and keep `SEO_NOINDEX=true` so
the test target does not compete with production in search results. Secrets, if
added later, go through `wrangler pages secret put` or Worker secrets, never
into the repo.

## Known gap

`/api/send-feedback` uses `nodemailer` (TCP). It is expected to fail on Workers
even with `nodejs_compat`; the contact form needs a fetch-based email provider
before this can replace production.
