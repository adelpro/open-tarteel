# Deploying to Netlify

Netlify uses the OpenNext adapter. `netlify.toml` already sets the build
command, Node version, publish directory, skew protection, and the `/sw.js`
headers.

## One-time setup

```bash
npx netlify-cli login
npx netlify-cli init
```

`netlify init` links the repository and creates the site. Choose:

- Build command: `corepack yarn build` (already in `netlify.toml`)
- Publish directory: `.next`
- Node: 22

## Deploy a test/staging build

```bash
npx netlify-cli deploy --build
```

The CLI prints a draft URL. This is a live staging deploy; it does not affect
production.

## Permanent staging hostname

Staging should not depend on the generated `staging--open-tarteel.netlify.app`
URL. Preferred hostname: **`staging-tarteel.quran.us.kg`**. Fallback:
`next-tarteel.quran.us.kg`.

### Cloudflare DNS

In the `quran.us.kg` zone:

| Type  | Name              | Target                              | Proxy    |
| ----- | ----------------- | ----------------------------------- | -------- |
| CNAME | `staging-tarteel` | `staging--open-tarteel.netlify.app` | DNS only |

Leave `tarteel.quran.us.kg` (production) untouched. Enable the Cloudflare proxy
only after Netlify issues the certificate and SSL/TLS mode is **Full (strict)**.
If the zone has redirect or cache rules for staging, scope them to this
hostname and bypass cache for `/sw.js`, `/api/*`, and `/.netlify/*`.

### Netlify staging channel

1. Open the `open-tarteel` site → **Domain management**.
2. Add `staging-tarteel.quran.us.kg` to the **`staging` branch deploy**
   context, not the production context.
3. Keep `staging--open-tarteel.netlify.app` as a fallback alias.
4. Set `NEXT_PUBLIC_APP_URL=https://staging-tarteel.quran.us.kg` for the
   **branch-deploy** scope only. Deploy previews continue to derive their
   origin from `DEPLOY_PRIME_URL`.

### Verify

```bash
curl -fsS https://staging-tarteel.quran.us.kg/api/health
curl -fsS https://staging-tarteel.quran.us.kg/sitemap.xml | head
curl -fsSI https://staging-tarteel.quran.us.kg/sw.js
```

Expected: health `{"status":"ok",...}`, sitemap and OG URLs use
`staging-tarteel.quran.us.kg`, `sw.js` is `no-cache`, and a push to `staging`
updates this hostname while PR previews keep their own origins.

## Production

```bash
npx netlify-cli deploy --build --prod
```

## Environment variables

| Variable                                 | Scope      | Required           | Notes                                                                                         |
| ---------------------------------------- | ---------- | ------------------ | --------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                    | all        | no                 | Auto-derived from `DEPLOY_PRIME_URL`/`URL` if unset. Set it only to force a canonical origin. |
| `NEXT_PUBLIC_APP_NAME`                   | all        | no                 | Defaults to `Open Tarteel`.                                                                   |
| `FEED_BACK_*`                            | production | no                 | Contact form returns 503 when unset.                                                          |
| `QURAN_FOUNDATION_CLIENT_ID` / `_SECRET` | production | only if QF enabled | Server-only.                                                                                  |
| `MP3QURAN_V4_BASE_URL`                   | all        | no                 | Defaults to the staging v4 API.                                                               |

`DEPLOY_PRIME_URL` is used automatically for deploy previews, so metadata,
sitemap, robots, and share links point at the preview origin.

## Verify a deploy

```bash
curl -fsS https://<deploy-url>/api/health
curl -fsS https://<deploy-url>/sitemap.xml | head
curl -fsSI https://<deploy-url>/sw.js
```

Expected: health `{"status":"ok",...}`, sitemap origin equals the deploy URL,
and `sw.js` has `Cache-Control: no-cache, no-store, must-revalidate`.

## Notes

- `output: 'standalone'` is disabled when `NETLIFY=true` so the adapter can
  build its own server. Docker still uses standalone.
- Deploy previews require the Git repository to be connected in the Netlify
  UI. A CLI draft deploy is enough for a single staging URL.
- The temporary tunnel (`*.loca.lt`) is not a substitute for Netlify; it dies
  with the tunnel process.
