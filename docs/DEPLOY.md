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
