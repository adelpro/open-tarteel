# Project notes for AI agents

Open Tarteel is a Next.js 15 Quran streaming PWA. Production is
`https://tarteel.quran.us.kg`; Netlify builds only from `main`.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. Route only to skills in the session's available-skills list; answer directly for quick questions or small scoped edits.

Key routing rules:

- Product ideas/brainstorming → invoke /office-hours
- QA/testing site behavior → invoke /qa
- Code review/diff check → invoke /review
- Ship/deploy/PR → invoke /ship

Do not suggest or auto-invoke other gstack skills: they run when the user types them, or when a running skill hands off to them (`gstack-config set proactive all` routes every skill).

## SEO

- URL policy and the deployed audit live in `docs/SEO.md`.
- `src/lib/seo/routes.ts` is the only source of public paths, indexability,
  sitemap inclusion, and locale prefixes.
- Run `CHECK_URL=https://tarteel.quran.us.kg npm run seo:audit` after a deploy.
