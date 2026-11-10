# Deploying to Netlify

Netlify uses the OpenNext adapter. `netlify.toml` already sets the build
command, Node version, publish directory, skew protection, and the `/sw.js`
headers.

## Branch policy (Netlify free quota)

Netlify deploys are reserved for **production only**:

- `main` → production (`tarteel.quran.us.kg`) and is the only branch that
  should trigger a Netlify build.
- `develop` and `staging` are tested **locally**. Do not push to `staging` to
  deploy; the `open-tarteel-staging` site has no auto-publish budget for it.
- While the Netlify quota is exhausted, turn **Auto publishing off** on the
  `open-tarteel-staging` site (Site configuration → Build & deploy → Branches)
  so a push cannot start a build. Re-enable it only when there is quota and a
  real staging deploy is wanted.

### Local runs

```bash
# develop: fast iteration
corepack yarn dev            # http://localhost:3000

# staging: production build, local
corepack yarn build
npx next start -p 3200       # http://localhost:3200
```

Use separate ports if both branches are checked out at once (e.g. a second
worktree, or `git switch staging` in another shell). Audio, the reciter API and
the service worker behave the same locally; only metadata origins follow
`NEXT_PUBLIC_APP_URL`.

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

Staging uses a **separate Netlify site** — `open-tarteel-staging`
(`b996c706-0085-4e41-82a4-12f5f50a694f`, `open-tarteel-staging.netlify.app`),
production branch `staging` — because `quran.us.kg` is on Cloudflare DNS and
Netlify branch-deploy custom domains on a custom primary domain require Netlify
DNS. Preferred hostname: **`staging-tarteel.quran.us.kg`**. Fallback:
`next-tarteel.quran.us.kg`.

### Cloudflare DNS (manual)

In the `quran.us.kg` zone:

| Type  | Name              | Target                             | Proxy    |
| ----- | ----------------- | ---------------------------------- | -------- |
| CNAME | `staging-tarteel` | `open-tarteel-staging.netlify.app` | DNS only |

Leave `tarteel.quran.us.kg` (production) untouched. Enable the Cloudflare proxy
only after Netlify issues the certificate and SSL/TLS mode is **Full (strict)**.
If the zone has redirect/cache rules for staging, scope them to this hostname
and bypass cache for `/sw.js`, `/api/*`, and `/.netlify/*`.

### Netlify staging site (configured)

- Site: `open-tarteel-staging`, repo `adelpro/open-tarteel`, branch `staging`,
  build `corepack yarn build`, publish `.next`, `@netlify/plugin-nextjs` v5.
- Custom domain `staging-tarteel.quran.us.kg` added on the site.
- Env: provider secrets, `NEXT_PUBLIC_APP_URL=https://staging-tarteel.quran.us.kg`,
  `NEXT_PUBLIC_ENABLE_MP3QURAN_V4=true`.
- Build hook: `https://api.netlify.com/build_hooks/6aed9bb06ddd4a8f48a6eab6`.

### Verify

```bash
curl -fsS https://open-tarteel-staging.netlify.app/api/health   # before DNS
curl -fsS https://staging-tarteel.quran.us.kg/api/health        # after DNS/TLS
curl -fsS https://staging-tarteel.quran.us.kg/sitemap.xml | head
curl -fsSI https://staging-tarteel.quran.us.kg/sw.js
```

Expected: health `{"status":"ok",...}`, sitemap/manifest/OG URLs use the
staging hostname, `sw.js` is `no-cache`, and a push to `staging` updates the
hostname while PR previews keep their own origins.

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
