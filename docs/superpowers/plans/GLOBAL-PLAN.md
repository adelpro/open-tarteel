# Open Tarteel — Global Plan

> Local working plan, superpowers-style. **Not committed to git.**
> Last updated: 2026-11-21.

This file tracks Open Tarteel work whose decisions are settled across sessions.
"Settled" means the shape and approach are agreed — it does **not** mean
implemented. When a phase is resumed, write the usual spec and plan under
`docs/superpowers/specs/` and `docs/superpowers/plans/` before touching code.

## Settled phases

### Provider health notifications — settled 2026-11-21 — **PAUSED**

**Intent:** Alert the maintainer (not users) when an upstream recitation
provider is down, so they can investigate. This is deliberately an operational
alert, not a user-facing status feature.

**Settled decisions:**

- **Delivery:** email, reusing `src/utils/node-mailer.ts` (nodemailer) and the
  `FEED_BACK_*` credentials already configured in production. No new service.
- **Detection:** server-side only. Nothing in the browser feeds the alert, so a
  visitor's failing internet can never trigger it. The client-side
  `network-status-indicator` stays user-facing and separate.
- **Where it runs:** a Netlify Scheduled Function (available on all plans,
  enabled by default) probing providers every ~10 min on the published deploy;
  per-provider counters and state kept in **Netlify Blobs** so cold starts do
  not reset them.
- **Noise control:** per-provider consecutive-failure counter; flip `up → down`
  only after 3 consecutive failed probes (~30 min); **no repeat emails while it
  stays down**; one `down → up` recovery email; short cooldown to stop flapping.
- **Email payload:** every alert contains the **full health snapshot** of all
  providers — status, consecutive failures, last success, last response time,
  last error — with the changed provider highlighted at the top.
- **Probing:** go through the existing adapters in `src/services/reciters/` as
  the single source of truth; run the five probes in parallel with short
  timeouts. Scheduled functions have a hard 30-second execution limit.
- **Cost:** free on the current plan (scheduled functions + Blobs are included;
  ~4,320 runs/month is well within limits), and reliable (real cron, state
  persists across cold starts).

**Ruled out:**

- GitHub Actions: free on the public repo, but scheduled runs are best-effort —
  delays, dropped runs, and public-repo schedules auto-disable after 60 days of
  inactivity. Fails the "reliable" requirement.
- In-process `setInterval`: unreliable on serverless.
- Hanging alerts off the weekly `.github/workflows/provider-contracts.yml` run:
  weekly cadence and single-run failures are exactly the noise to avoid.
- Client-side detection or browser-sent email: violates the server-only rule.
- Home-server systemd timer: free and reliable, but adds one-time setup and
  lives outside the repo. Fallback only.

**Non-goals for this phase:** user-facing banners, status pages, or Slack/Discord
webhooks.

**Status:** PAUSED before the design doc. No files were changed other than this
plan; nothing was committed or pushed.

**Resume checklist:**

- [ ] Write the spec:
      `docs/superpowers/specs/2026-11-21-provider-health-notifications-design.md`
- [ ] Get the user's approval of that spec.
- [ ] Invoke `superpowers:writing-plans`, then implement and verify.
- [ ] Do not commit or push until explicitly asked.
