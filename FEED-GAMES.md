# Feed Games — Pubky Vibe

An experimental Pubky app fork with playable, remixable games **inside feed posts**.

- Hosting: Vercel, existing Pubky staging services; no Docker or custom backend.
- Upstream: `pubky/pubky-app`, branch `dev`.
- Fork point: `8bf6088a3520d9f93608a691e68ec17fd4f800e5`.
- Experiment branch: `codex/feed-games`.
- Public source: https://github.com/jacobo-synonym/pubky-feed-games/tree/codex/feed-games

## Try it

Open https://pubky-feed-games.vercel.app/home. The labeled sample is playable without authentication. Choose **Play in feed**, then **Let's fly**. Jump with Space, Up, or the on-screen button. Replay stays in the card. **Remix** opens the native dialog; change the title, world, or difficulty and preview your game. Sign in with a staging test identity to publish through the existing Pubky composer.

The sample is a fixture, not an authored network post. Published game posts use `PostContentBase → PostLinkEmbeds → FeedGameCard`, retaining the existing author, reply, tag, repost, bookmark, deletion, and blur behavior.

## How the integration works

A normal Pubky text post stores a versioned game reference with bounded, declarative settings. This client recognizes it and renders a fixed reviewed engine inline. No homeserver schema or indexer changes are required. Other Pubky clients show the normal text and link until they adopt a compatible renderer. Registry acceptance lists this hosted experiment; it does not automatically add games to the main Pubky app.

The course seed, engine version, theme, and difficulty travel in the reference. Remixes from authored posts retain a validated source post ID and a visible attribution link. Post editing can change the reference; there is no separate immutable revision service in this milestone.

## Isolation

No game iframe or audio starts on scrolling. Play mounts only the bundled player with `sandbox="allow-scripts"` and no same-origin permission. The player receives settings, never Pubky identity/session data. Its CSP blocks network connections, forms, and external scripts. Parent messages check the exact iframe source, opaque origin, protocol version, and random session channel. Off-screen/background play pauses; another game closes the previous player. Scores are temporary and unverified, with no leaderboard or rewards.

## Development and checks

```
npm ci --ignore-scripts
npm run dev
npm run lint
npm run typecheck
npm test
```

Node 25 adds experimental global Web Storage that conflicts with jsdom. On that version run tests with `NODE_OPTIONS=--no-experimental-webstorage npm test`; use the upstream supported Node version in CI. Production builds require all nine `PUBKY_RUNTIME_*` network variables documented in `docs/environment.md`.

Home's visual baseline changes intentionally. Regenerate it through the upstream **VRT Update Baselines** workflow on the feature branch; no locally generated pixel baselines are included. Full staging account publishing and Cypress stack tests must be reported separately from component/browser checks.

## Verification for this milestone

- Public Vercel deployment responds HTTP 200 without a Vercel login.
- Production Next build and TypeScript check passed on Vercel.
- Repository lint and typecheck passed locally.
- A full unit run completed with 13,455 passing tests; its failures were the changed Home test, a test edited during the run, and an upstream localhost-listening test blocked by the sandbox. The corrected affected suites and network test were rerun together: 359 tests passed.
- Browser checks: local mouse/touch-style play, result, replay, and midnight remix; hosted player load and keyboard start; desktop and narrow layouts inspected.
- Home VRT was attempted but its matching Playwright browser executable is not installed. CI must refresh the Home baseline.
- A real staging-account publication, cross-account remix, and source-post attribution round trip have not yet been verified.
