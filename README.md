# Open Tarteel

![GitHub Stars](https://img.shields.io/github/stars/adelpro/open-tarteel?style=social)
![Forks](https://img.shields.io/github/forks/adelpro/open-tarteel?style=social)
[![Twitter Follow](https://img.shields.io/twitter/follow/adelpro?style=social)](https://twitter.com/adelpro)

![Next.JS](https://img.shields.io/badge/Next.js-3178C6?logo=next.js&logoColor=fff&style=flat)
![PWA](https://img.shields.io/badge/PWA-1B1F23?logo=pwa&logoColor=fff&style=flat)
[![Athar](https://img.shields.io/static/v1?label=Athar&message=%F0%9F%8C%99&color=blue)](https://community.itqan.dev/d/257/20)

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/270e870a48f342ef9ba384229681db23)](https://app.codacy.com/gh/adelpro/open-tarteel/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)

[<img src="https://raw.githubusercontent.com/adelpro/open-tarteel/refs/heads/main/explore-in-deepwiki.svg" title="Explore in DeepWiki" width="150" height="25" alt="DeepWiki">](https://deepwiki.com/adelpro/open-tarteel)

Open Tarteel is an open-source Quran application designed to provide an optimal Quran audio streaming experience across various platforms. Recent updates include significant UI/UX improvements for a more intuitive and engaging user interface, enhanced audio player controls, and smoother navigation. Built with modern web technologies, it ensures performance and responsive design.

## Features

- **Responsive Design**: Ensures a seamless experience across devices of all sizes.
- **Tailwind CSS Styling**: Utilizes Tailwind CSS for efficient and customizable styling.
- **Improved UI/UX**: Redesigned interface with better accessibility, smoother animations, and enhanced user interactions.
- **Advanced Audio Player**: New player controls with playlist management, repeat, shuffle, and visual audio feedback.

## Technologies Used

- **Next.js**: For server-side rendering and optimized performance.
- **TypeScript**: Ensuring type safety and a better developer experience.
- **Tailwind CSS**: For utility-first CSS styling.
- **Jotai**: For state management and global state.
- **PWA**: Provides offline capabilities and an app-like experience.

## Installation

**Requirements:** Node.js >= 20.9 and Yarn 4 (via Corepack).

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/adelpro/open-tarteel.git
   cd open-tarteel
   ```

2. **Enable Corepack and install dependencies**:

   ```bash
   corepack enable
   yarn install --immutable
   ```

3. **Configure the environment**:

   ```bash
   cp .env.example .env.local
   ```

   At minimum set `NEXT_PUBLIC_APP_URL`. The feedback form is optional and is
   disabled when the `FEED_BACK_*` variables are empty.

4. **Run the App**:

   ```bash
   yarn dev
   ```

## Production deployment

### Environment variables

| Variable                            | Required | Description                                                                                                                   |
| ----------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`               | Yes      | Canonical public URL, e.g. `https://tarteel.quran.us.kg` (no trailing slash). Used for metadata, sitemap, robots and sharing. |
| `NEXT_PUBLIC_APP_NAME`              | No       | Application name shown in metadata and emails.                                                                                |
| `NEXT_PUBLIC_APP_VERSION`           | No       | Version shown in the UI/health endpoint.                                                                                      |
| `NEXT_PUBLIC_DEBUG`                 | No       | `"true"` to show verbose errors. Keep `"false"` in production.                                                                |
| `PORT`                              | No       | Port for the standalone server (default `3000`).                                                                              |
| `FEED_BACK_EMAIL`                   | No       | Mailbox that receives feedback.                                                                                               |
| `FEED_BACK_PASSWORD`                | No       | Mailbox/app password.                                                                                                         |
| `FEED_BACK_SERVICE`                 | No       | Nodemailer service name (e.g. `gmail`).                                                                                       |
| `FEED_BACK_HOST` / `FEED_BACK_PORT` | No       | Alternative SMTP host/port when not using a service.                                                                          |

> `NEXT_PUBLIC_*` values are inlined at **build time**. Rebuild the app after
> changing them; setting them only at runtime has no effect on the client
> bundle.

### Build and run

```bash
yarn build
yarn start
```

The build produces a self-contained server in `.next/standalone` (`output:
"standalone"`). The CI workflow runs the same production build, so a broken
build cannot be merged.

### Docker

```bash
docker build \
  --build-arg NEXT_PUBLIC_APP_URL=https://tarteel.quran.us.kg \
  --build-arg NEXT_PUBLIC_APP_VERSION="$(git describe --tags --always)" \
  -t open-tarteel .

docker run --rm -p 3000:3000 \
  -e FEED_BACK_EMAIL=... \
  -e FEED_BACK_PASSWORD=... \
  -e FEED_BACK_SERVICE=gmail \
  open-tarteel
```

The image runs as a non-root user and exposes `GET /api/health` for liveness
and readiness checks.

### Production notes

- The sitemap and reciter pages are generated at build time from the upstream
  reciter APIs. A build machine needs outbound network access; the sitemap
  falls back gracefully if an upstream API is unavailable.
- Feedback rate limiting is in-memory and per instance. If you run multiple
  replicas, put a shared limiter (Redis/Upstash or your edge provider) in
  front of `/api/send-feedback`.
- View/favorite counters are stored in the public GunDB relay and are
  client-reported. Treat them as approximate, not authoritative.
- Security headers (HSTS, `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`) are configured in `next.config.ts`.
  Add a Content-Security-Policy once your CDN/analytics requirements are known.
- SEO, the URL locale policy, and the Search Console runbook live in
  [`docs/SEO.md`](docs/SEO.md). Preview deploys are `noindex` via
  `SEO_NOINDEX` or the Netlify preview header.

## Contributing

We welcome contributions from the community. Please follow the [Contributing Guidelines](https://github.com/adelpro/open-tarteel/blob/main/CONTRIBUTING.md).

## License

This project is licensed under the [MIT License](https://choosealicense.com/licenses/mit/)

## Acknowledgments

Special thanks to the [ITQAN Community](https://community.itqan.dev) for their support and contribution to the Quran technology ecosystem.

<p align="center">
  <a href="https://itqan.dev">
    <img src="https://itqan.dev/logo.svg" alt="ITQAN Community Logo" width="150" />
  </a>
</p>

## Contact

For any inquiries or suggestions, please contact [contact@quran.us.kg](mailto:contact@quran.us.kg)
