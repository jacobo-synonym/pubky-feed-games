# Feed Games — Pubky Vibe

An experimental Pubky app fork with playable games **inside feed posts**.

- Hosting: Vercel, existing Pubky staging services; no Docker or custom backend.
- Upstream: `pubky/pubky-app`, branch `dev`.
- Fork point: `8bf6088a3520d9f93608a691e68ec17fd4f800e5`.
- Experiment branch: `codex/feed-games-arcade`.
- Public source: https://github.com/jacobo-synonym/pubky-feed-games/tree/codex/feed-games-arcade
- Vibes directory submission remains on hold.

## Try it

Open https://pubky-feed-games.vercel.app/home. Choose **Content → Games** in the left filters (or mobile filter drawer), then **Play in feed** on a post:

- **Pigeon Lunch Run:** hop cones and collect fries; Space, Up, or Jump. A run lasts up to 30 seconds.
- **Pocket Pairs:** find matching cards in as few moves as possible. Difficulty sets the number of pairs.
- **Maze Munch:** an original maze chase with dots, power-ups, and pursuing enemies.
- **Falling Blocks:** rotate and drop pieces, clear rows, and watch the next piece.
- **Brick Breaker:** a paddle, 40 bricks, and three lives.
- **Snake:** eat, grow, and avoid the walls and your own tail.
- **Signal Sprint:** wait for green and tap. Early and missed taps score zero; difficulty sets the number of rounds.

The existing post composer has an **Add game** button. Its compact picker searches titles and game styles, with a scrollable list that can grow. Pick a game, title, world, difficulty and course number; runners also have balanced, hurdles and snack trail styles. Preview before inserting into the draft, then publish through the normal composer.

The normal feed has no game banner, button, or sample selector above it. **Games** is a UI alias for native `feed-games` tag search, not a new backend content kind. Selecting another Content option returns to Home. The tag is editable and anyone can use it, so results may include scores or other discussion. One starter post for every game is published from Swift-Wolf-Hawk; previous test posts remain available too. Shared challenge URLs still open a playable preview.

The Remix action has been removed because changing preset settings did not provide meaningful creative remixing. Previously published references and their source links remain readable. Creation, play and score replies are the supported actions.

Composer templates are fixtures; the starter feed contains real authored network posts. Published game posts use `PostContentBase → PostLinkEmbeds → FeedGameCard`, retaining the existing author, reply, tag, repost, bookmark, deletion, and blur behavior.

Finish an authored game and choose **Reply with score**: the native Pubky reply composer opens with the result and exact game reference. Nothing posts automatically. A sample instead offers **Share challenge**, which prepares a new post because it has no original post to reply to. Scores are explicitly self-reported; there is no verified leaderboard or reward system.

Sign in at https://pubky-feed-games.vercel.app/sign-in using Pubky Ring. Desktop displays its native QR flow; narrow screens offer the Ring authorization button. An existing staging identity was used for the single-account end-to-end checks below. Creating a disposable staging identity was attempted and the homeserver returned `400 Token required`. Never share recovery phrases with the agent.

## Where it lives

1. **GitHub fork:** the full Pubky frontend plus this experiment's components and fixed game runtimes.
2. **Vercel:** serves this modified Pubky frontend at the public preview URL.
3. **Pubky staging services:** handle identity, posts, replies, tags and indexing through the app's existing data flow.
4. **Vibes directory:** can list the experiment's metadata and URL after submission and review. Listing does not deploy it into, or merge it with, the official Pubky frontend.

A normal Pubky text post stores a versioned reference with bounded declarative settings. This client recognizes it and renders a bundled engine inline. No homeserver schema, database version or indexer changes are required. Other Pubky clients show the normal text and link until they adopt a compatible renderer.

The course number, engine version, game kind, theme, difficulty and runner style travel in the reference. Remixes retain a validated source post ID and visible attribution. Post editing can change the reference; there is no immutable revision service. Old version-1 runner posts retain runtime `1.0.0` unchanged. Version-2 references now use presentation runtime `3.0.0`; the original runner, memory, and reaction rules are unchanged. Runtime folders `1.0.0` and `2.0.0` remain untouched. Four new classic arcade kinds use original, seeded engines in `3.0.0`.

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

Browser checks cover inline memory play, reaction scoring and the share flow, narrow-screen creator/settings/preview, discard protection, and the tagged Games view. Single-account staging publication, score replies and attributed remixes are verified below. A second-account check remains outstanding.

Home and composer visual surfaces change intentionally. Their pixel baselines must be refreshed through the **VRT Update Baselines** workflow on the feature branch. The matching browser binary is not installed locally; no large browser downloads or local baseline files are added. Full checks and the hosted deployment result are recorded in the task handoff.

### Arcade verification (2026-09-15)

- Full unit suite: **784 files passed; 13,486 tests passed, 2 skipped**.
- Repository-wide lint passed.
- TypeScript check passed after resolving the creator prop and test harness typing; the affected arcade/studio suites were rerun: **31 tests passed**.
- Existing runtime `1.0.0` files remain byte-for-byte unchanged.
- Vibes directory submission remains on hold. Authenticated verification followed deployment; see below.

### Authenticated verification (2026-09-15)

After the user signed in as Swift-Wolf-Hawk, the deployed app completed this flow using its native UI:

1. Published [Feed Games test · Lunch Run](https://pubky-feed-games.vercel.app/post/xxczmnpzqqz5o3ywmdefcc6f7f3pkg6g4x3hhpgd3wgy11fk5wgo/0035Q2T35BHX0) with the `feed-games` tag and played it directly in the feed.
2. Posted the actual run's zero-fries [score reply](https://pubky-feed-games.vercel.app/post/xxczmnpzqqz5o3ywmdefcc6f7f3pkg6g4x3hhpgd3wgy11fk5wgo/0035Q2T6MBXP0). The original post's reply count became one.
3. Published [Feed Games test · Midnight Remix](https://pubky-feed-games.vercel.app/post/xxczmnpzqqz5o3ywmdefcc6f7f3pkg6g4x3hhpgd3wgy11fk5wgo/0035Q2TAAH7MG), changing the world to midnight, course to 817 and style to snacks. Its attribution link opened the original post.
4. Confirmed all three posts appear in the tagged Games view.
5. Independently fetched all three from the public staging Nexus `/v0/post/{author}/{id}` API without browser credentials. The reply's `relationships.replied` is the original post URI; the remix preserves its source ID and changed settings.

These are real, publicly indexed staging posts, not only optimistic browser-cache entries. All actions used one account; cross-account behavior has not yet been verified. The test posts remain available for review. No Vibes listing was submitted.

### Discovery simplification (2026-09-15)

Removed Remix actions and creator remix copy, the large Feed Games heading, the arcade slogan and the All posts / Games selector. Samples are closed by default behind **Try a game**; direct shared-game links still open their player preview immediately. **#feed-games** leads to the existing native tag search. This gives an empty feed a small playable starting point while actual game posts, reposts and tags provide ongoing discovery. No additional posts were published for this UI change.

### Expanded arcade (2026-09-16)

- Seven games in the chooser and native composer. New classics support keyboard and touch and cap rounds at two minutes.
- “Try a game” is now a secondary Home button and a link on game cards, including post details and tag search. `/home?play=1` opens the chooser directly.
- Results recommend three other games plus the native `#feed-games` search. Suggestions are sample challenges, not fabricated network posts, and never auto-play.
- Player controls and overlays use Pubky's dark neutrals, rounded controls, and lime action accent. Game artwork can keep its own colors.
- No new dependencies, Docker, server services, database changes, or Vibes submission.

Verification for this update: 73 targeted tests passed; full suite had 13,514 passes, 2 skips, and one localhost socket test blocked by sandbox `EPERM`. That test file passed all 53 tests when rerun with socket permission. Lint and typecheck passed. Browser checks covered all four new game launches, Falling Blocks results and recommendation navigation, mobile Snake pause/resume and results, mobile maze sizing, and the new-game creator preview. No new network posts were published. The Home visual baseline needs the existing manual VRT workflow refresh.

### Games content filter (2026-09-16)

Removed all **Try a game** controls and the above-feed sample selector. Home and Search filters now expose **Games** using native tag search; the same option is available in the phone drawer. Creation uses a collapsed searchable picker instead of the thumbnail grid. Game-over recommendations now link to real starter posts, preserving the social context.

Published six tagged starter posts through the authenticated UI and reused the existing runner. Independently verified all six contents and tags through public staging Nexus reads:

| Game           | Post ID         |
| -------------- | --------------- |
| Pocket Pairs   | `0035Q8CJ5YR0G` |
| Signal Sprint  | `0035Q8CMV4MH0` |
| Maze Munch     | `0035Q8CB9M6TG` |
| Falling Blocks | `0035Q8CS2NFTG` |
| Brick Breaker  | `0035Q8CV050RG` |
| Snake          | `0035Q8CWWE560` |

Author: `xxczmnpzqqz5o3ywmdefcc6f7f3pkg6g4x3hhpgd3wgy11fk5wgo`. No Vibes directory submission. Home/Search visual baselines need the manual **VRT Update Baselines** workflow.

Verification: 115 focused game/navigation tests passed, lint and typecheck passed. Full regression run: 13,511 passed, 2 skipped, with nine Search filter tests failing because their router mock lacked `useRouter`. After updating that mock and the five intentional Games-row snapshots, the Search suite passed 9/9. Browser checks covered desktop selection, returning to All, phone filter availability, seeded posts visible while signed out, and post-based result recommendations.
