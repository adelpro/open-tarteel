# Port the account ring from tilawah.cc

## Summary

Reproduce the account "ring" from
[`adelpro/open-tilawa`](https://github.com/adelpro/open-tilawa) in Open Tarteel.
An account is a Gun/SEA keypair generated on the device: no email, no password,
no server-side user row. A second device joins by scanning a 120-second,
single-use pairing code, and favourites and settings follow the key.

## Instruction

Reproduce the existing system. Do not redesign it.

1. Read `docs/AUTH_AND_RINGS.md` in `adelpro/open-tilawa` first. It records the
   failure modes the current code was rebuilt around.
2. Port the implementation from `apps/web/src/gun/` (auth, account-store,
   pairing, pairing-ticket), `apps/web/src/hooks/use-gun.ts`,
   `apps/web/src/hooks/use-user-sync.ts` and `apps/web/src/components/account/`.
3. Keep the contract: ticket v2 only, 120 s TTL, 10 s redeem deadline,
   single redemption, envelope burned on read, last-device sign-out guard.
4. Change only paths, storage keys and UI placement where Tarteel differs.

## Current state

- No `gun.user()`, `gun/sea` or `SEA` anywhere in `src/`.
- Favourites and settings are `localStorage`-only (`src/jotai/atom.ts`,
  `src/hooks/use-recently-played.ts`).
- The relay is `https://gundb-relay.quran.us.kg/gun`
  (`src/constants/gun-config.ts`).

## Work

- [ ] Single `src/gun/index.ts` exporting `gun`, `user` (session recall) and
      `SEA`; point the counter modules at it.
- [ ] Stored keypair, auth bridge, create / rename / sign out.
- [ ] Pairing: seal, publish to `open-tarteel-pairing/<id>`, QR + paste,
      camera scan on a keyless device, burn on read.
- [ ] Device list and 5-minute heartbeat (`devices/<id>`, `devices/meta`).
- [ ] Sync favourites (union across relay, local mirror and signed-out state)
      and a settings subset with LWW on `updatedAt`.
- [ ] "Account" group in `src/app/(ar)/settings/page.tsx`, strings in `ar`,
      `en`, `de`, unit tests and a two-context Playwright link test.

## Acceptance

- [ ] Create a ring with only a name; reopening the browser keeps it.
- [ ] A second device joins by QR and by pasting the code.
- [ ] Expired or reused codes fail with a specific error, not a spinner.
- [ ] A's popup closes when B's device row appears.
- [ ] Favourites and settings reach both devices; signed-out favourites
      survive the first sign-in.
- [ ] Signing out is one click with 2+ devices and needs the confirmation word
      on the last one.
- [ ] The public favourite counter does not change on sync.
- [ ] `npx tsc --noemit`, lint and existing suites stay green.

## Out of scope

- Server accounts, passwords, recovery, device revocation, key rotation.
- Cross-device playhead/resume.
- Encrypting the graph: Gun merges per field, a ciphertext blob would break it.
- Syncing the anonymous view/favourite counters.

## Notes

- **Counter trap:** `useFavorites().toggleFavorite` also bumps the global
  counter. Sync remote favourites into the atom directly, or add a path that
  skips `syncFavorite`.
- **Privacy:** the graph is signed, not encrypted; the relay can read it. The QR
  is the account for 120 s. Say both in the UI and the privacy policy.
- **Interop is separate:** tilawah.cc uses `wss://gun.tilawah.cc/gun`, Tarteel
  uses the relay above. A keypair can auth on both but sees a different graph.
  Decide shared-ring support separately from this port.
- **Storage keys:** existing keys are unprefixed. Add `tarteel:` only for new
  keys unless a copy-forward migration is included.
- **Settings:** sync appearance, sources, sort, visualizer and speed; keep
  volume, playback mode, fullscreen and selection device-local.

## References

- Design: `docs/AUTH_AND_RINGS.md` in `adelpro/open-tilawa`.
- Implementation: `apps/web/src/gun/`, `apps/web/src/components/account/`.
- Live product: <https://tilawah.cc>.
