# Feed Games — Pubky Vibe

An experimental Pubky app fork with playable, remixable games **inside feed posts**.

- Hosting: Vercel, existing Pubky staging services; no Docker or custom backend.
- Upstream: `pubky/pubky-app`, branch `dev`.
- Fork point: `8bf6088a3520d9f93608a691e68ec17fd4f800e5`.
- Experiment branch: `codex/feed-games-arcade`.
- Public source: https://github.com/jacobo-synonym/pubky-feed-games/tree/codex/feed-games-arcade
- Vibes directory submission remains on hold.

## Try it

Open https://pubky-feed-games.vercel.app/home. Choose a sample and **Play in feed**:

- **Pigeon Lunch Run:** hop cones and collect fries; Space, Up, or Jump. A run lasts up to 30 seconds.
- **Pocket Pairs:** find matching cards in as few moves as possible. Difficulty sets the number of pairs.
- **Signal Sprint:** wait for green and tap. Early and missed taps score zero; difficulty sets the number of rounds.

**Make a game** opens the creator. Pick a template, title, world, difficulty and course number; runners also have balanced, hurdles and snack trail styles. Shuffle chooses a new course number. Preview before publishing. **Remix** on an authored post retains its source link. Existing composers also have an **Add game** button: it inserts the configured challenge, preserves the draft and attachments, and does not auto-publish.

**All posts** preserves the normal home feed. **Games** uses Pubky's native tagged search for `feed-games`. New game and score posts start with that tag. The composer insertion adds it when there is room within Pubky's existing tag limit. Tags are editable, so this is discovery, not a verified game-only index.

The samples are fixtures, not authored network posts. Published game posts use `PostContentBase → PostLinkEmbeds → FeedGameCard`, retaining the existing author, reply, tag, repost, bookmark, deletion, and blur behavior.

Finish an authored game and choose **Reply with score**: the native Pubky reply composer opens with the result and exact game reference. Nothing posts automatically. A sample instead offers **Share challenge**, which prepares a new post because it has no original post to reply to. Scores are explicitly self-reported; there is no verified leaderboard or reward system.

Sign in at https://pubky-feed-games.vercel.app/sign-in using Pubky Ring. Desktop displays its native QR flow; narrow screens offer the Ring authorization button. An existing staging identity is needed for the remaining end-to-end checks. Creating a disposable staging identity was attempted and the homeserver returned `400 Token required`. Never share recovery phrases with the agent.

## Where it lives

1. **GitHub fork:** the full Pubky frontend plus this experiment's components and fixed game runtimes.
2. **Vercel:** serves this modified Pubky frontend at the public preview URL.
3. **Pubky staging services:** handle identity, posts, replies, tags and indexing through the app's existing data flow.
4. **Vibes directory:** can list the experiment's metadata and URL after submission and review. Listing does not deploy it into, or merge it with, the official Pubky frontend.

A normal Pubky text post stores a versioned reference with bounded declarative settings. This client recognizes it and renders a bundled engine inline. No homeserver schema, database version or indexer changes are required. Other Pubky clients show the normal text and link until they adopt a compatible renderer.

The course number, engine version, game kind, theme, difficulty and runner style travel in the reference. Remixes retain a validated source post ID and visible attribution. Post editing can change the reference; there is no immutable revision service. Old version-1 runner posts retain runtime `1.0.0` unchanged. Newly created games and remixes use `2.0.0`.

## Isolation and rollback

`src/config/feedGames.ts` provides one feature switch. Disabling it removes the introduction, composer action, game renderer and studio event handlers; game posts retain their ordinary text and links. The default home timeline and the existing network write path are unchanged.

No game iframe or audio starts on scrolling. Play mounts only a bundled player with `sandbox="allow-scripts"` and no same-origin permission. The player receives settings, never Pubky identity/session data. Its CSP blocks network connections, forms and external scripts. Parent messages check the exact iframe source, opaque origin, protocol version, random channel and score bounds. Off-screen/background play pauses; starting another game closes the previous player. Scores stay in memory until explicitly shared through a native composer.

## Development and verification

```sh
npm ci --ignore-scripts
npm run dev
npm run lint
npm run typecheck
npm test
```

Use the upstream supported Node version in CI. On Node 25, use `NODE_OPTIONS=--no-experimental-webstorage npm test` to avoid its experimental global Web Storage conflicting with jsdom. Production builds require all nine `PUBKY_RUNTIME_*` network variables documented in `docs/environment.md`. The Vercel project already uses the staging endpoints.

Automated coverage includes versioned references, malformed settings, legacy runner compatibility, deterministic/solvable decks, reaction timing rules, full sandbox memory/reaction sessions, native POST vs REPLY routing, attribution, sign-in gating, draft-preserving composer insertion and the optional Games timeline.

Browser checks cover inline memory play, reaction scoring and the share flow, narrow-screen creator/settings/preview, discard protection, and the tagged Games view. Actual staging publication and cross-account reply/remix verification remain pending account access.

Home and composer visual surfaces change intentionally. Their pixel baselines must be refreshed through the **VRT Update Baselines** workflow on the feature branch. The matching browser binary is not installed locally; no large browser downloads or local baseline files are added. Full checks and the hosted deployment result are recorded in the task handoff.

### Arcade verification (2026-09-15)

- Full unit suite: **784 files passed; 13,486 tests passed, 2 skipped**.
- Repository-wide lint passed.
- TypeScript check passed after resolving the creator prop and test harness typing; the affected arcade/studio suites were rerun: **31 tests passed**.
- Existing runtime `1.0.0` files remain byte-for-byte unchanged.
- No account publication or Vibes directory submission has been performed for this milestone.
