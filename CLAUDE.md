# Potion Machine — HTML5/Canvas Port

## What this is
An HTML5/Canvas port of the GDevelop game **"Potion Machine"**, built to be embedded on
**mytrickortreat.com** and played on phones (tilt-only — no desktop slider needed).
Source of truth for the original game: `C:\Users\Rob\OneDrive\Desktop\game\Potion Machine - Copy.json`
Original art/audio: `C:\Users\Rob\OneDrive\Desktop\game\assets\`
This port lives in: `C:\Users\Rob\OneDrive\Desktop\game\html5-port\`

Rob (the owner) is not a programmer — explanations and status notes in this file and
in conversation should stay in plain language, not code jargon.

**Related prior project:** `C:\Users\Rob\Halloween-Platformer` ("Trick or Platform") is
Rob's other in-progress HTML5 Canvas game for the same site — a platformer with a
Cornfield Maze level, not yet deployed, no leaderboard of its own yet either. Worth
checking for reusable patterns (its CLAUDE.md documents good conventions: classic
`<script>` tags instead of ES modules so double-clicking `index.html` still works
locally, dt-scaled physics, responsive canvas fit for phones).

**mytrickortreat.com today** is a Squarespace-style storefront selling printable Halloween
PDFs (mazes/coloring/word-search) — no interactive games or leaderboard exist on it yet.
Potion Machine will be the first, so there's no existing system to match; see the
Leaderboard section below for the plan.

## Status
**Stage 5 (polish, partial) built and verified.** Fog parallax, ambient bubbles, and
the Free Play "Potion Blast" power-up are all in and working. Remaining Stage 5 items
(additional particle emitters, a few smaller tweened flourishes) are lower-value
polish, deferred — see the list at the end of that section. Next up: Stage 6
(leaderboard) whenever Rob wants to pick that up, or more Stage 5 polish.

---

## Plain-English summary of the original game

**The core idea:** You tilt your phone (or drag a slider on desktop) to balance a ball
on a see-saw platform mounted on a pole. A glass tube/vial sits on the platform and fills
with colored liquid as you play. Standing still near the center hinge scores points every
moment the ball touches it. The game gets progressively harder — the tube heats up through
stages (Warm → Hot → Fire), making the ball slipperier, and a "moon" appears above the
platform that makes tilting more sensitive. There are also periodic bursts of upward force
("jets") from spots on the platform that fling the ball around. You have 30 seconds
(Levels mode) or until you fall off (Free Play mode) to rack up score. At game over, the
score decides how "full" three potion bottles appear, and a high score can optionally be
submitted to a leaderboard.

### The 4 scenes (screens)
1. **Home** — Enter your name, choose Free Play or Levels, mute music, and a "calibrate
   motion" button (for phone tilt permission). Remembers your name and progress between
   visits.
2. **Level 1** — The only real playable level currently built. Fixed 30-second timer,
   fixed escalating difficulty schedule (tube/moon heat stages happen at fixed times).
   Ends on timeout or when the ball falls off the platform.
3. **Free Play** — Same core gameplay, but endless (no fixed timer — the clock just counts
   up), with a hand-authored script of 24 timed "phases" (each with a duration, tube heat
   stage, moon heat stage, and which of 4 jets are firing) that repeats/escalates over
   about 3 minutes. Also adds a "Potion Blast" — every 1000 points you earn a one-time
   upward boost you can trigger by clicking/tapping.
4. **Levels** — A level-select grid of 10 numbered buttons. **Only button 1 actually
   works** — buttons 2–10 exist visually and are wired to unlock progressively, but there
   are no "Level 2" through "Level 10" scenes built yet (see flag below).

### Main objects & what they do
- **Ball** — the physics ball you're balancing. Circle-shaped physics body, affected by a
  custom "gravity" vector that's really the tilt input, not real gravity.
- **Platform** — the see-saw. It doesn't use real physics rotation; its tilt angle is
  smoothly animated (tweened) back and forth to a new random angle every 3 seconds,
  and everything visually mounted on it (tube, liquid, highlights) repositions to match.
- **Hinge** — an invisible circular sensor at the platform's pivot point. Touching it with
  the ball scores 100 points/second and triggers a glow + sparkle effect.
- **Liquid / LiquidLeft / LiquidRight** — decorative liquid inside the tube that sloshes
  based on the platform's tilt (a simple spring-like follow formula, not real fluid physics).
- **4 "Plasma" jet emitters** — particle jets mounted at specific spots on the platform.
  When "active" (per the level/phase schedule) and the ball drifts near one, it gets a
  timed upward physics impulse, with a cooldown so it doesn't fire every frame.
- **MoonWarm / MoonHot / MoonFire** — three overlay images that fade in/out above the
  platform depending on difficulty stage; while one is showing, tilt sensitivity is
  multiplied (1×, 1.5×, 2.5×, or 4× depending on stage) and the ball itself fades out.
- Lots of decorative sprites: fog layers that scroll for a parallax background, particle
  "bubble"/"dust"/"sparkle" effects, a bottom HUD (score, timer, mute button, slider for
  desktop tilt), and a game-over panel (potion bottles, "try again," "next level,"
  "leaderboard," "home" buttons).

### Core game rules (both play modes share this)
1. On start: 3-2-1 countdown, then the timer/physics activate.
2. Tilting your phone (or moving the desktop slider) applies a sideways push to the ball.
   How strong that push is depends on: (a) a global "tilt force" number that changes with
   the tube's heat stage, and (b) a "moon tilt multiplier" that changes with the moon's stage.
3. The platform auto-tilts to a new random angle every 3 seconds regardless of what you do.
4. Touching the center hinge scores points continuously while touching it.
5. Every 5 seconds or so (schedule differs slightly per level/phase) the tube's heat stage
   advances, changing the ball's friction/"stickiness" (it gets slipperier as it heats up)
   and re-tinting the tube's glow color.
6. The moon stages similarly cycle in and out on their own timers, multiplying tilt
   sensitivity and fading the ball semi-transparent while a moon is visible.
7. Falling off the bottom of the screen, or the clock reaching 30s (Levels only), ends
   the run. A dark overlay fades in, score freezes, and the game-over panel appears with:
   - Three potion-bottle graphics whose "fill" animation frame depends on score thresholds.
   - "Try Again" (replay), "Next Level" (only unlocks past a score threshold, Levels only),
     "Leaderboard," and "Home" buttons.
   - Your final score, with a small pop/flash animation.
8. Free Play additionally: score milestones every 1000 points grant a "Potion Blast"
   charge — click/tap to fire a one-time upward impulse on the ball, consuming a charge.

### Global game state that carries between scenes
Player name and highest unlocked level are saved to local device storage and reloaded on
the Home screen. A few global numbers track overall state: current level, whether the
game is paused/running, mute on/off, and the two difficulty multipliers described above.

---

## Things that are GDevelop-specific and need a decision (see "Flags" below for detail)
See the "Custom/non-portable pieces" section below — nothing here blocks porting, but
several pieces need a JS-native replacement rather than a literal translation:
1. GDevelop's built-in cloud **Leaderboard** service (score submission + display) —
   no direct web equivalent; needs a replacement or removal.
2. **Device tilt input** (DeviceSensors) — portable to the web's DeviceOrientation /
   DeviceMotion APIs, but iOS requires an explicit permission-prompt button (the game
   already has a "Motion"/"Calibrate" button for this, good — same pattern needed in JS).
3. **Physics engine** (GDevelop's Physics2, which wraps Box2D) — needs a JS physics
   library (e.g. Matter.js or a minimal custom 2D circle-vs-box solver) since we're
   hand-rolling this outside GDevelop.
4. Several **community/marketplace GDevelop extensions** (buttons, sliders, tweening,
   flashing, masking, sticking objects together, score counter) are pre-built JS behind
   the scenes in GDevelop but their *behavior* is simple enough to hand-roll directly.
5. **9 fully custom extensions Rob(or a prior dev) built** for this game — these have no
   equivalent anywhere and their logic must be read out of the project file and
   reimplemented directly (already done — see behavior descriptions above: the jet
   impulses, and the tube/moon heat-stage cycles).
6. Decorative **"Scene3D" lighting effects** are attached to every layer, but the game
   has no actual 3D objects — near-certainly inert/left over from a GDevelop default and
   safe to skip.
7. An **Outline** filter effect on the main layer (thin outline around sprites) — minor
   visual polish, can be approximated later or skipped for now.
8. **Only Level 1 of 10 is actually built.** The level-select screen has 10 buttons wired
   up, but scenes "Level 2" through "Level 10" don't exist in the source file — only
   Free Play has real long-term escalation content authored.

---

## File structure
Multi-file, classic `<script>` tags (same pattern as Halloween-Platformer, so it can
still be tested by just double-clicking `index.html` locally, and stays consistent with
Rob's other game). Not one giant HTML file — this game has more moving parts (physics,
particles, a scripted timeline, a leaderboard call) than fits comfortably in one file.
```
html5-port/
  index.html      <- canvas, DOM overlay (name input), script load order   [Stage 1]
  css/style.css    <- @font-face, responsive canvas scaling, DOM overlay styling [Stage 1]
  js/
    storage.js      <- localStorage wrapper (player name, unlocked level, mute) [Stage 1]
    input.js         <- tilt input (deviceorientation + iOS permission flow)     [Stage 1]
    ui.js            <- per-screen draw + tap-hit-testing (Home/Levels/HUD/etc.) [Stage 1, growing]
    leaderboard.js    <- Firebase read/write for the online high-score list      [stub — Stage 6]
    game.js          <- CONFIG, asset loading, state machine, main loop         [Stage 1, growing]
    physics.js        <- ball physics body, gravity vector, collisions          [not built — Stage 2]
    platform.js        <- see-saw tween, liquid slosh, tube visuals             [not built — Stage 2/3]
    difficulty.js       <- tube/moon heat cycles, jets, Free Play phase timeline [not built — Stage 3]
  assets/           <- copied/resized art & audio actually used by the port
  CLAUDE.md         <- this file
```
(Two more files than originally sketched — `storage.js` and `input.js` — split out
because Stage 1 needed them before physics.js existed to hold them.)

## Build stages
1. **Skeleton & input** — canvas setup, scene/state switching, phone tilt input
   (DeviceOrientation/Motion + the required iOS permission-tap button), Home screen
   name-entry flow. No desktop slider — phone-only.
2. **Core physics & platform** — the see-saw platform tween, the ball's physics body,
   tilt-driven gravity, boundary bounce, hinge scoring collision.
3. **Difficulty systems** — tube heat-stage cycle, moon stage cycle, the 4 jet emitters,
   Free Play's scripted phase timeline.
4. **Game rules & UI chrome** — timer, scoring/potion-fill display, game-over panel,
   try-again/next-level/home flow, mute/music.
5. **Polish & art pass** — fog parallax, particle effects (bubbles, sparkles, dust,
   plasma), tweened glow/flash effects, outline effect (if wanted).
6. **Leaderboard** — wire up Firebase (see below).

## Leaderboard plan
No existing leaderboard exists anywhere on Rob's site to match (checked — see note up
top), so Potion Machine establishes the pattern, using a free-tier **Firebase Firestore**
database called directly from the game's JS:
- **Now:** one high score per player name, simple top-N list, submitted from the
  game-over panel (this replaces GDevelop's built-in `Leaderboards::SavePlayerScore` /
  `DisplayLeaderboard` calls).
- **Later (not now):** friend groups — players join/create a named group and see a
  leaderboard scoped to just that group. Deferred until the basic version is working.
- **Needs Rob's action when we reach Stage 6:** create a free Firebase project (Google
  account login, a few clicks in the Firebase console — I'll walk through it step by
  step) and hand me the project's config keys. Those keys are safe to put in the
  client-side game code; abuse-prevention is handled via Firestore security rules
  (e.g. score must be a plausible number, name length capped), not by hiding the keys.

## Backlog (explicitly deferred, not part of the current build)
- **Levels 2–10.** Free Play is the long-term/main mode; the Levels track (1 built,
  9 stubbed) exists to teach new players the mechanics. Level 1 alone covers that for now.
- **Expanding Free Play further** — Rob wants to eventually add more rotating/varied
  phases and new interactions/mechanics on top of the current 24-phase script. The Stage 3
  difficulty-timeline code should be built in a way that's easy to extend later (e.g. the
  phase list stays external data, not hardcoded logic), but no new mechanics beyond what's
  in the original game get built now.
- Friend-group leaderboards (see above).

---

## Decisions log
- Phone-only, tilt-based input — no desktop slider fallback needed.
- Multi-file classic-script structure (matches Halloween-Platformer's approach), not a
  single monolithic HTML file.
- Leaderboard: Firebase Firestore, single high score per player for launch, friend
  groups later. No existing system to match — this is the first one on the site.
- Free Play is the priority long-term mode; Levels 2–10 explicitly deferred.
- Future Free-Play content expansion (more phases/interactions) is wanted eventually —
  keep the phase-timeline data-driven so it's easy to extend, but don't build new
  mechanics now.
- Tilt input reads the standard `deviceorientation` event's `gamma` (left/right tilt
  in degrees), not GDevelop's raw-accelerometer math — simpler and more consistent
  across iOS/Android. Arrow-left/right keys are a desktop-only fallback purely so the
  game can be tested in a regular browser before ever touching a phone; harmless in
  production since nothing presses arrow keys on a phone.
- The original project's Home screen has a `MotionReady` variable that's checked but
  never actually set anywhere in the source events — the iOS motion-permission flow
  was left unfinished. The port completes it sensibly: tapping Free Play/Levels
  requests motion permission, and only proceeds to the chosen screen once that
  resolves (with a "permission denied" message if the player says no — the original
  had no handling for that case at all).
- Several source art files were far larger than they needed to be (e.g. the logo was
  a 2760×1504px, 5.9MB PNG for something that displays at 677×369) — resized to ~2x
  display resolution on copy into `html5-port/assets/`. Matters for real phone load
  times, not just local dev. Do this for every asset as it gets pulled in, not just
  the Home screen ones.
- Dropped the original's `NotoSansKR-Normal.otf` (a 4.7MB multi-language font file
  pulled in just to render one warning line of English text) — that label now uses
  the same font as the rest of the UI instead.
- Images load a few at a time (small worker-pool, not all-at-once) with automatic
  retry on failure — large all-at-once batches proved unreliable in local dev
  testing, and it's gentler on real mobile connections too.
- Added a `potion-machine` entry to Trend_Engine's `.claude/launch.json` (port 8643,
  serving `html5-port/`) for local preview during development, same pattern as
  Halloween-Platformer's entry. Unrelated to Trend_Engine itself. **Bound to
  `127.0.0.1` only** (`--bind 127.0.0.1`) — see the LAN-testing policy above; this
  should never be changed back to binding all interfaces.

## Phone/LAN testing — DO NOT DO THIS ANYMORE
Tried phone testing over the local dev server across a few sessions: plain HTTP over
LAN (phone loads the page, tilt doesn't work — expected, browsers withhold motion
sensors on insecure origins), then a self-signed-HTTPS workaround (port 8644, cert
generation needed `python -S` to dodge a Norton HTTPS-inspection quirk that otherwise
broke Python's ssl module). Never got tilt working on Rob's phone either way.

**After the self-signed-HTTPS attempt, Rob reported his mesh WiFi network got messed
up**, and asked to stop phone testing entirely. Investigated in that moment: nothing
in this project touches router/mesh/DNS/WiFi configuration — the two dev servers were
just local processes listening on ports 8643/8644, no different in kind from any dev
server — and confirmed both fully stopped (no python process running, nothing
listening on those ports). No confirmed causal mechanism was found, but the instruction
stands regardless: **don't start LAN-exposed dev servers or suggest phone testing
again unless Rob explicitly asks for it.** Testing goes through the desktop browser
preview only. When real device testing is eventually needed, the answer is a real
deploy with a proper HTTPS cert (even a free static host), not local network exposure.

## Progress log
- **Stage 1 done and verified in-browser:** canvas + responsive scaling shell, Home
  screen (matches original art/layout — background, logo, mode buttons, instructions,
  name entry with save/reload, mute toggle, warning message), tilt input with iOS
  permission flow and desktop keyboard fallback, Levels screen (grid of 10, only
  Level 1 unlocked/enterable, matches `HighestLevelUnlocked`), and placeholder
  Level 1 / Free Play screens with a live tilt readout (temporary — replaced by real
  gameplay in Stage 2+). Navigation between all screens and name/mute persistence
  across reloads confirmed working.
- **Not built yet (at end of Stage 1):** everything gameplay-related — ball physics,
  the see-saw platform, hinge scoring, tube/moon difficulty cycles, jets, HUD,
  game-over flow, leaderboard. That's Stages 2 onward.
- **Stage 2 done and verified:** `platform.js` (the see-saw's angle tween — retargets
  to a new random 5-20° angle, alternating direction, every 3 seconds, easeInOutSine,
  same timing as the original) and `physics.js` (a small hand-rolled 2D solver — ball
  free-falls under a constant downward pull + tilt-driven sideways push, rests on and
  slides along the rotating platform when in contact, bounces off the hinge-touch
  scoring zone at the pivot, drifts back in if it goes ~30px past a screen edge, and
  triggers a fall-off state past y=1100 — all thresholds matched to the original's
  values). `ui.js`'s `PlayScreen` ties it together with a score readout and a
  tap-anywhere "You fell! / try again" state; Level 1 and Free Play both use it as-is
  for now (they don't differ yet — that's Stage 3). Verified via direct state
  inspection + screenshots in-browser: platform rotates continuously, ball rests on
  the surface without tunneling through it, score accumulates only while overlapping
  the hinge, falling off and retrying both reset state correctly.
- Copied+resized the Stage 2 art (`Tube4.png`, `Ball.png`, `Hinge.png`,
  `NewSprite.png` for the pole) the same way as Stage 1's — `Tube4.png` was another
  oversized one (2687×210 for a 674×52 display), resized down.
- Physics constants (gravity, tilt strength, surface grip) are first-pass values tuned
  by feel in the desktop preview, not derived from the original's Box2D numbers (which
  don't translate directly — see the flagged Physics2-replacement decision). Expect to
  retune these once real phone testing is possible.
- **Added sloshing potion liquid inside the tube** (Rob asked for this after seeing
  Stage 2 — the original had a pink liquid sprite masked to the tube's shape, sliding
  side to side as the platform tilted; ours draws it directly in `platform.js` instead
  of replicating GDevelop's sprite-masking system). Went through two versions:
  1. First pass: a single rigid pill shape sliding side to side on a spring. Rob
     correctly called this out as "thick sludge that doesn't change shape" — a real
     liquid's surface reorients to stay level with gravity as its container tilts,
     it doesn't just translate as a fixed blob.
  2. Rebuilt properly as a **column-based water simulation** — the standard technique
     for convincing 2D liquid in canvas (confirmed via web search: a row of surface
     columns, each a spring with tension + damping toward a target height, plus a
     "spread" pass each frame that propagates each column's motion to its neighbors
     so disturbances travel across the surface as a wave instead of every column
     moving independently — see `Platform._updateLiquid()`/`_drawLiquid()`). The part
     that makes it specifically work *for a tilting tube*: each column's target isn't
     "flat relative to the tube," it's "flat relative to real gravity" — the
     world-horizontal plane re-expressed in the tube's own rotated local coordinates
     (`target = -x * tan(angle)`, clamped to the tube's wall bounds, per column at
     local-x `x`). Because the tube is long and thin relative to its tilt range, this
     naturally produces a pool that saturates full at the low end and empty at the
     high end with a soft sloped transition band between them (not two independent
     effects — the "half-full pill that slides" look emerges for free from the same
     per-column physics, no separate blob-position variable needed anymore).
  Verified in-browser: at rest the tube is uniformly half-full (matches the Home
  screen art), forcing a steep tilt pools it correctly toward the lowered end with a
  sloped (not rigid-capped) surface, and reversing the tilt shows it re-settling
  rather than snapping.
  3. **Follow-up bug, also caught by Rob**: "there's a line left at the top that
     doesn't pool down." Took a while to actually pin down — screenshots taken right
     after mutating state in the browser console kept showing inconsistent column
     data because of real-time races (the animation loop keeps running between tool
     calls, so a read a moment later doesn't reflect the state at the moment a
     screenshot was taken). Solved that by driving `Platform._updateLiquid()`
     manually in a fixed-step loop (e.g. 300 calls at dt=1/60) to deterministically
     settle the simulation with no wall-clock ambiguity, then sampling actual canvas
     pixels via `getImageData` at the rotated coordinates instead of eyeballing
     screenshots. That found the real cause: the shine-line stroke was drawn through
     every column's surface point unconditionally, including columns with almost no
     liquid depth — so a nearly-empty section of tube still got a full-brightness
     line traced across it, reading as "a line with no liquid under it" instead of
     just looking empty. Fixed by only stroking the surface where depth exceeds a
     small threshold, breaking into disconnected path segments at the empty/full
     boundary instead of one continuous line end-to-end. (Rob's own diagnosis —
     "it's hanging onto a point at the top, it should move down near the middle" —
     pointed at the right neighborhood of the bug, though the actual fix ended up
     being about the stroke's visibility condition rather than the target-height
     clamp range, which was already correct.)
  4. **Rob's next round of feedback, all addressed together:**
     - "still doesn't look natural" + "as the liquid moves forward it jumps a little
       bit at a time rather than smooth" — the binary depth cutoff from fix #3 was
       the actual cause: a whole line segment popped fully in/out of existence the
       instant a column crossed the threshold, which reads as a jump no matter how
       small the threshold gap is. Replaced with a continuous alpha fade
       (`smoothstep` over a depth range, not a single cutoff value) so segments
       fade in/out instead of popping. Also bumped `liquidColumnCount` 28→48 and
       switched both the fill edge and the shine from straight `lineTo` segments to
       `quadraticCurveTo` through each pair's midpoint — smooths the coarse
       faceted/polygonal look into an actual curve.
     - "is [the tube] a transparent layer in front of the pink liquid" — correctly
       spotted that one was missing. The original had exactly this: separate
       `TubeFront`/`TubeShadow.png` and `TubeHighlight`/`TubeHighlight3.png` glass
       layers drawn over the liquid, which this port had skipped in favor of the
       single flat `Tube4.png` base. Pulled both into `Platform._drawGlass()`,
       drawn after the liquid so the glass genuinely sits in front of it; the
       highlight also nudges a few px side to side with the current angle (matches
       the original's own small `Platform.Angle()`-based parallax on that layer)
       instead of sitting perfectly static.
     - "a slight slosh back and forth" — added a small continuous traveling ripple
       (`liquidAmbientAmplitude`/`liquidAmbientSpeed`, a sine term added to each
       column's target before the spring chases it) so the surface stays visibly
       alive even during the moments the platform's angle isn't actively changing,
       instead of going glassy-still.
     Rob confirmed this round looks good live in the viewer.
  5. **Ball doesn't spin while rolling** (Rob, watching it live) — `physics.js` was
     moving the ball but never rotating its sprite, so it visibly slid rather than
     rolled. Added `Physics.rotation`, integrated as `vx / radius` per second
     (rolling-without-slipping), applied via `ctx.rotate()` around the ball's own
     center in `draw()`. Confirmed by checking `Physics.rotation` numerically after
     forcing horizontal velocity (accumulates correctly) and visually (the moon
     sprite's crater pattern now visibly rotates instead of staying fixed).
  6. **Follow-up, also Rob watching it live**: the moon overlay (Stage 3's
     `Difficulty.drawMoon()`) draws *on top of* the ball during a moon phase without
     fading it out entirely (`ballOpacity` only dims to 0.4, doesn't hit 0) — but
     that draw call never applied `Physics.rotation` the way the ball's own draw
     does, so the moon overlay sat visually static while the rotation fix above only
     applied to the (mostly-hidden) ball underneath, reading as "stops rolling
     whenever a moon phase is active." Fixed by rotating the moon draw the same way,
     around `Physics.rotation`. Confirmed numerically (rotation still accumulating,
     `drawMoon`'s deployed source includes the rotate call) during a forced Fire-moon
     phase.
  7. **"The fluid in the tube is going bonkers" (Rob)** — a real numerical
     instability, not a perception thing. Checked the live column data and found
     levels at ~1e136 — the spring-mesh had blown up. Root cause: the spread pass
     (`liquidSpread * (level difference) * steps`, 4 passes/frame) is an explicit
     diffusion-style update, which is only numerically stable when
     `spread * steps` stays well under 1. `steps` is uncapped and can spike to 3 at
     `MAX_DT` after any frame stall or tab-throttle (exactly what my own heavy
     synchronous test scripts kept doing to this tab throughout this session) — at
     spread=0.28, that's a coefficient of ~0.84 per pass, well past the stability
     edge, and 4 compounding passes pushed it into runaway exponential growth.
     Fixed at the root: capped the `steps` value specifically for the spread
     calculation to a safe max (`Math.min(steps, 1)`), leaving the main
     tension/damping spring integration alone since that part isn't the same kind of
     unstable. Also added a hard clamp on `level`/`velocity` after each update as a
     defensive backstop, so any future edge case degrades gracefully instead of
     silently exploding again. Verified by deliberately hammering
     `Platform._updateLiquid()` with 500 frames of worst-case `MAX_DT` (0.05s) steps
     — previously guaranteed to blow up, now settles cleanly with levels correctly
     bounded within the tube's physical walls (±17) and near-zero velocity.
  8. **"The ball doesn't move enough with the gravity" (Rob)** — another real bug,
     the same class as #7 (dt not actually reaching where it needed to). In
     `physics.js`, `_resolvePlatformCollision(dt)` is *called* with `dt`, but the
     function's own signature was declared with no parameters (`_resolvePlatformCollision()`),
     so `dt` was silently discarded and `Difficulty.grip` — meant as "fraction of
     speed kept per second of contact" (see the original Stage 2 comment) — was
     applied as a flat multiplier *every single frame* instead. At 60fps that's
     `grip^60` retained per second (≈0.2% at grip=0.90, i.e. losing ~99.8% of the
     ball's along-surface speed every second), which is why gravity/tilt barely
     seemed to move it at all despite the forces themselves being fine. Fixed by
     actually receiving `dt` and applying `Math.pow(Difficulty.grip, dt)` instead
     (matching the frame-rate-independent pattern already used elsewhere in this
     file, e.g. `airDamping`). Verified numerically: a ball resting on the platform
     with a known speed now retains exactly the documented ~90% after one simulated
     second at grip=0.90 (was retaining ~100% *or* ~0% depending on exact contact
     framing before the fix, neither of which was the intended behavior).
     **Worth knowing:** every physics-feel tuning decision made earlier in this
     project (jet impulse height, tilt responsiveness, general "does this feel
     right" calls) was made *while this bug was active* — the ball was much
     stickier than intended the whole time. Now that grip actually behaves as
     designed, other constants (jet height, `tiltAccel`, `gravityY`) may need a
     fresh look, since the ball moves far more freely than it did during any
     earlier tuning pass.
  9. **"I can't enter my name" on the standalone phone-test file (Rob, on his
     actual phone)** — real bug, and a good one to have caught before this goes
     anywhere near mytrickortreat.com. `html, body` sets `touch-action: none` and
     `user-select: none` game-wide (needed so the canvas itself doesn't scroll/zoom
     under touch), and that inherits straight down onto `#nameInput` since it had no
     override. On a real touchscreen, `touch-action: none` on an ancestor can
     suppress the tap-to-focus gesture entirely for a text input, so the on-screen
     keyboard never appears — a mouse click on desktop doesn't go through the same
     gesture-recognition path, which is exactly why this never showed up in any of
     my own testing. Fixed by giving `#nameInput` its own
     `touch-action: manipulation` / `user-select: text`, overriding the page-wide
     rule for just that field. While fixing this, also caught that the CSS file
     itself wasn't cache-busted the way the JS files were (`index.html`'s
     `<link rel="stylesheet">` was a static tag with no version query) — same
     Browser-pane exact-URL caching issue as before, just on a file I'd missed.
     Converted it to the same dynamic-timestamp pattern as the scripts. Verified the
     actual computed styles (`touch-action`/`user-select`) on the deployed page
     confirm the fix took effect, and regenerated + reverified the standalone
     phone-test bundle with it included. Can't fully confirm this fixes real-device
     touch behavior without Rob's own phone, but this is a well-known category of
     mobile-web gotcha that matches the symptom exactly.
  10. **Deployed via Netlify Drop and confirmed tilt actually works on Rob's real
      phone** — first real on-device confirmation this whole port. Two feel issues
      showed up from that real play session, both a direct consequence of the grip
      bug fix above (#8) — the ball reaches the side walls far more than it used to
      now that it isn't artificially stuck to the platform:
      - **Wall bounce felt like "positive feedback," bounced too much.**
        `Physics._checkBoundaries()` was a full elastic reflection (bounces back at
        the same speed it hit the wall with) — fine as a rare safety-net edge case,
        but with the ball actually reaching the walls often now, that read as a
        springy, rewarding "boing" rather than a neutral correction, and could
        ping-pong a few times before settling. Added a `wallRestitution` of 0.35 —
        the bounce now keeps roughly a third of its speed. Verified numerically
        (500 px/s in → 175 px/s out, exactly the 0.35 ratio).
      - **Tube too long — ball couldn't actually fall down the gap between the
        tube's end and the screen edge.** The platform's ends sat only ~53px short
        of the wall-bounce trigger; a ball leaving the tube's end with any
        meaningful sideways speed would cover that in a fraction of a second,
        getting knocked back by the wall before it had fallen far enough vertically
        to visibly drop past the tube. Shortened `Platform.length` 674→520,
        widening the gap to 130px on each side (verified directly). This is a
        deliberate departure from the original's exact tube length — the original
        had the same tight fit, but Rob explicitly wants the fall-through gap to
        actually be usable in this version.
  11. **Follow-up: still too small.** The real fix Rob wanted wasn't more tube
      shortening — it's `_checkBoundaries()`'s off-screen margin (how far past the
      visible edge the ball travels before the wall bounce catches it), widened
      30px → 100px, giving the ball a lot more room/time to actually fall past the
      tube's end and drop vertically before the wall ever gets involved. Verified
      directly: at 90px past the edge it keeps falling untouched; past 100px it
      gets the soft bounce from fix #10.
  12. **Moved from Netlify Drop to real GitHub → Netlify continuous deployment.**
      Repo pushed to `github.com/kmonman/potion-machine`, connected to Netlify so
      every future push auto-rebuilds the live site — no more manual re-drag of a
      zip. Live at `https://lucent-baklava-e8131d.netlify.app`. One snag: Netlify's
      new-project default now puts sites behind a login wall ("Visitor access" →
      set to Private by default) — had to switch Project visibility to Public in
      Netlify's site settings before the game was reachable by anyone without a
      Netlify account.
  13. **Hinge bubbles and jet plume both too weak compared to the intro-screen art.**
      Rob pointed at the Home screen's own instructional illustration (the
      "Watch out for fissure bumps!" / "Tilt to collide..." image, drawn from a
      static asset — not live gameplay) as the target: a thick pink bubble cluster
      at the hinge, and a tall blue upward plume at each active jet. The live
      versions were much weaker than that reference:
      - **Hinge bubbles** were a thin trickle (1 bubble every 0.09s, thin purple
        outline only). Now spawns 3 at a time every 0.035s (~8x denser) with a
        filled pink core, not just a purple outline.
      - **Jets** only ever drew one static, motionless glow blob at the jet's
        position while active — no upward motion at all, nothing like the tall
        blue spike in the reference art. Added a continuous particle plume (small
        blue circles spawned every 0.025s while the jet is active, rising and
        drifting until they fade) layered on top of the existing glow. This is
        purely decorative/ambient — separate from the actual gameplay "puff"
        impulse that fires when the ball enters the jet's catch radius (fix #9's
        `wasInRange` logic, untouched here).
      Verified by manually driving both systems through ~40 update ticks each in
      the browser console and screenshotting the canvas directly (`js/fog.js`'s
      `HingeBubbles`, `js/difficulty.js`'s `Difficulty.jets[i].particles`) —
      confirmed particle counts and visual density before shipping.
  14. **Ball felt too floaty, not enough gravity.** `Physics.gravityY` raised
      900→1500 px/s². Verified numerically: 1s of free fall now covers 747px
      (vs. ~450px before). Confirmed on the live GitHub→Netlify pipeline, not a
      one-off Drop upload — Rob confirmed the auto-deploy pipeline itself is
      working correctly (right link this time).
  15. **Tube felt too small after the 674→520 shortening (fix #10).** Widened
      `Platform.length` back up to 620 — a middle ground that still leaves a real
      fall-through gap on each side (the 100px boundary margin from fix #11 is
      untouched) without feeling as stubby as 520. Verified visually in a live
      Free Play session (not just the static Home-screen art).
  16. **Music was never actually ported — only its mute *button* was.** The mute
      icon/toggle (`toggleMute()`, `state.muted`, Storage-persisted) has existed
      since Stage 1, but there was never an audio element for it to control — the
      original's looping background track (`Moonlit Drift.mp3`) was left behind in
      the source `assets/` folder and never copied into `html5-port/assets/`, and
      no playback code existed anywhere in `js/`. (There's also an unused
      "Moonlit Drift (Haunted Mix).mp3" in the original — checked the source JSON's
      events and confirmed it's never actually triggered by anything, just an
      uploaded-but-unwired asset, so it wasn't ported.)
      Copied the real track in and added a `Music` object in `game.js`: one
      `Audio` element, looped, volume 1. Browsers block audio autoplay-with-sound
      until the page has had a real user gesture, so it doesn't try to play
      immediately on boot — instead it attempts `.play()` on the first tap/keypress
      anywhere on the page, and keeps retrying on subsequent ones if the first
      attempt was still too early. `toggleMute()` now actually mutes/unmutes this
      element instead of just flipping a decorative icon. Verified live: clicked
      once, confirmed via the console that playback was actually running
      (`Music.started === true`, `Music.el.paused === false`) and pointed at the
      real copied file, not a 404.
  17. **Game Over screen's buttons and top HUD didn't match the original at all.**
      Rob sent a screenshot of the real original game (gd.games-hosted preview),
      and it turned out I'd wrongly assumed the original's Game Over button art
      was an unfinished placeholder back in Stage 4 — it wasn't, I just hadn't
      looked hard enough in the source `assets/` folder. Found the real assets and
      ported them:
      - **Bottom button row**: the original uses one combined pill image (icons +
        divider lines baked in, 3 equal tap-zones) rather than 3 separate button
        sprites — `Bottom Buttons.png` for Free Play (3rd icon = leaderboard
        shortcut) and `Bottom Buttons Levels.png` for Level 1 (3rd icon = levels
        grid shortcut). Replaced this port's own plain text "Try Again"/"Home"
        buttons with these, split into 3 equal hit-zones by x-position. Home and
        Restart are wired to the same real actions as before; Level 1's 3rd icon
        really does open the levels grid (that screen already existed); Free
        Play's 3rd icon shows a brief "Leaderboard coming soon!" message since the
        real leaderboard is still Stage 6, not yet built — didn't want a
        leaderboard-shaped icon that silently does nothing when tapped.
      - **Top HUD was missing the player's name entirely** — only the score
        bubble was ever drawn, but the original shows "Name · [score]" as one
        unit. Added the name (with a `·` separator) immediately left of the score
        bubble, width measured dynamically per name so it fits any length up to
        the 16-char input limit.
      - Widening that name+score pill for real names immediately collided with
        the mode label ("Free Play"/timer) that used to sit dead-center at the
        top — moved that label into the upper-right instead (near the mute
        button) and hid it entirely once the run is over, matching the
        reference screenshot (no mode label shown there) and giving the pill
        room regardless of name length.
      Verified live for both Free Play and Level 1 game-over states, plus active
      Free Play gameplay with a 6-letter test name, confirming no more overlap
      between the pill and the mode label.
  18. **Follow-up: still didn't match — wrong proportions.** Fix #17 ported the
      right button art but kept this port's own *invented* mid-screen "card"
      layout (a solid backing rect, "You fell!"/"Time's up!" text, a duplicate
      purple score number, a 3-potion fill row) — none of which exist in the real
      game. Went back to the original project's own scene file and read the
      actual x/y/width/height of every Game Over object instead of guessing:
      `GameOver` (the bold text, using `GameOverText3.png` — a real asset that
      was sitting right there in the source `assets/` folder, never ported)
      sits at roughly 44% down the screen completely on its own, not inside any
      card — the "card" (`GameOverBoard`/`GameOver11.png`) is just a very faint
      glow outline against an already-90%-dark background, easy to mistake for
      "no board at all" in a screenshot, which is effectively how Rob's reference
      reads. `BottomButtons` sits pinned near the very bottom of the screen
      (y≈914-1272 of 1280), nowhere near the card. Rebuilt `_drawGameOver` around
      those real coordinates: full-screen dark fade (no solid card), the real
      `GameOverText3.png` art sized/positioned proportionally to match, and the
      button pill corrected to its real 855:358 aspect ratio (was squashed to
      460:96 in fix #17, which read as flattened/wrong). Removed the now-unused
      `_potionsFilled()` and the old board/potion/ball-off asset references.
      Verified live — screenshot compared directly against Rob's reference,
      matching layout order and proportions top-to-bottom now.

  19. **Bottom button pill too small.** Scaled up 60% (`barW` 430→688, height
      follows the same 855:358 aspect ratio so it stays unsquashed), repositioned
      to stay pinned near the bottom with a small margin now that it's bigger
      (was a fixed `barY`, now computed from the canvas height so it can't run
      off the bottom edge as the size changes).
  20. **Added a dedicated score panel above "GAME OVER".** Rob wanted a more
      prominent score readout on this screen than the small top-left HUD pill —
      a bigger centered version of that same bubble-pill art, positioned directly
      above the "GAME OVER" art, matching the panel style from his reference
      screenshot rather than inventing a new visual language for it.
  21. **Follow-up: wrong panel.** Rob pointed at the exact same reference
      screenshot again and clarified — the panel he wanted was the real
      `GameOverBoard` card (fix #18 had removed it, believing it wasn't actually
      visible in the reference), positioned right where the original scene data
      already said it goes: x≈-20 y127 w759 h343, directly below the top-left HUD
      pill so the two read as one continuous panel. That also explains a detail
      in Rob's screenshot I'd misread the first time around — the faint "T"
      silhouette with a small colored dot inside the panel isn't a drawn icon at
      all, it's the actual platform pole + hinge showing through the board's
      genuinely transparent interior (no solid backing — restored that too).
      Put the 3 potion-fill icons back inside it at their real relative position
      (x428/497/562 y311), and removed the oversized centered pill from fix #20,
      which is what I'd built instead before this correction. Re-added
      `_potionsFilled()` and the board/potion asset references that fix #18 had
      dropped.
  22. **Game Over background was flat black, and the "fell off" icon was still
      missing.** Two follow-ups to fix #21's screenshot:
      - The original's `DarkOverlay` object turned out to just be `Background
        1.png` (the same Home-screen sky gradient — dark at the bottom, lighter
        at the top) redrawn at ~90% opacity, not a flat color. Swapped this
        port's flat `rgba(0,0,0,0.85)` fill for that same image (at the same
        oversized/offset framing the Home screen already uses) plus a lighter
        ~35% black wash on top for text contrast.
      - The faint "T + red dot" silhouette I'd written off as incidental
        platform bleed-through in fix #21 is actually a real, deliberately
        named asset — `Ball Off.png`, a small gray T-shaped platform icon with a
        pink dot beside it, literally illustrating "the ball fell off." Restored
        it at the original's real position (boardX+55, boardY+48).
      - Added a slight glow + flicker to the "GAME OVER" art itself (two
        overlapping sine waves driving shadowBlur/shadowColor, offset downward
        so the glow concentrates toward the bottom of the letters) — a Rob polish
        request, not something pulled from the original.
  23. **Small round of gameplay polish requests**, all straightforward: hinge
      bubbles recolored more saturated pink/magenta for contrast against the dark
      background (were leaning pale/washed-out lavender); the liquid's surface
      shine brightened further toward white with a higher opacity ceiling; and
      the ball's draw order moved to sit *behind* the hinge glow/sprite and the
      hinge bubbles instead of on top of both (`Platform.draw()` split into a
      base pass and a new `Platform.drawHinge()` so `Physics.draw()` — the ball —
      can run in between them).

**Dev tooling note:** hit a caching issue while verifying the fixes above — the
Browser-pane preview tool caches by *exact URL*, harder than a normal browser (even
`location.reload(true)` didn't bust it; only navigating to a URL with a new query
string did). Added a `Date.now()` cache-buster to index.html's own script loading
(see `index.html`) as a safety net, but the real fix when a change doesn't seem to
apply during dev is: navigate to `http://localhost:8643/?bust=<anything-new>`. Should
revisit removing the dev cache-buster before real deployment — it defeats normal
browser caching, which is a feature once this is live on mytrickortreat.com, not a
problem to work around.

Sources consulted for the water-column technique:
- [2D-Water-Javascript-Demo](https://github.com/anothrNick/2D-Water-Javascript-Demo/blob/master/index.html)
- [2D water simulation (CodePen)](https://codepen.io/ymoussaba/pen/jRXrGq)

## Stage 3: Difficulty systems

New file `js/difficulty.js`. Both play modes share it for now (Level 1 doesn't have
its own difficulty content built yet, same as Stage 2 — it just runs Free Play's
script too until Level 1 gets its real fixed schedule later).

- **`FREE_PLAY_PHASES`** — the original's 24-phase script, copied verbatim (duration,
  tube stage, moon stage, which of 4 jets are active) from the JSON I extracted while
  reading the original project. Advances on a timer in `Difficulty.update()`, loops
  back to phase 0 at the end rather than stopping (the original had no defined
  behavior past phase 24 — looping keeps Free Play actually endless).
- **Tube heat** (`TUBE_STAGE_PARAMS`) — each stage sets `tiltForce` (ported directly,
  it's just a multiplier) and a `grip` value that stands in for the original's
  separate friction + linearDamping (approximated by feel, see the earlier
  Physics2-replacement decision — not a unit conversion). Also drives the liquid's
  color, now lerped from `Difficulty.tubeColor` instead of the fixed pink from
  Stage 2's polish pass — `platform.js`'s `_drawLiquid()` derives its gradient from
  it live.
- **Moon phases** (`MOON_STAGE_PARAMS`) — set `moonTiltMultiplier` (ported directly)
  and cross-fade the ball's opacity down while fading in the corresponding moon
  overlay image (`Moon Warm/Hot/Fire.png`, drawn at the ball's own position/size).
  Both physics.js (`Difficulty.tiltForce * Difficulty.moonTiltMultiplier` scales the
  tilt-driven force) and the ball's own draw call (`Difficulty.ballOpacity`) read
  this directly.
- **Jets** — mount points ported directly from the original (`±215`/`±70` along the
  bar from the hinge); "inactive" parks a jet at a distance of 5000 (unreachable)
  rather than tracking a separate enabled flag, same trick the original used. On
  contact (ball within 25px of the jet's current world x, shared cooldown 0.4s
  across all 4 jets — also matches the original, which tracked the cooldown on the
  ball, not per-jet), gives the ball a flat upward velocity kick. Visual is just a
  soft glow circle for now — real particle jets are Stage 5 polish.
- Verified by deterministically stepping through 12 phase transitions and checking
  every value (phase index, tube/moon stage, tiltForce, grip, moonMult, jets-active)
  against the scripted phase data — all matched exactly, no drift. Separately
  confirmed a jet actually launches the ball (`vy` jumps to the impulse value,
  cooldown engages) and checked a Fire/Fire/3-jets phase visually (red tube, moon
  overlay + faded ball, three glowing jet positions, all matching that phase's spec).

**Not built yet:** Level 1's own (simpler, fixed-schedule) difficulty content — right
now it silently runs Free Play's script too, which is a placeholder, not the real
Level 1 design.

## Stage 4: HUD chrome & game-over flow

- **Hinge glow + sparkles** (`platform.js`) — the thing Rob asked about after seeing
  a screenshot of the original. `hingeGlow` lerps toward 1 while the ball is touching
  (matches the original's two different tween speeds — dims in ~0.7s, brightens back
  in ~0.3s) and drives a radial-gradient ring around the hinge; a small particle
  array spawns while touching and drifts outward with gravity, matching the
  original's `SparklesFront` burst. Verified by stepping the update loop with the
  ball pinned on the hinge and checking `hingeGlow`/`sparkles.length` climb, then
  visually.
- **In-game HUD** (`ui.js` `PlayScreen._drawHud`) — score in its bubble container
  (`bubblescore3.png`, with comma formatting over 1000), a timer (Level 1 counts
  down from 30 and times out; Free Play counts up and doesn't), and an in-game mute
  toggle sharing the same persisted state as Home's. Had one layout bug: the score
  bubble and the Home button were both anchored near the top-left and overlapped —
  moved Home below the bubble.
- **Game-over panel** — dark overlay fade-in, a pop-in animation (`easeOutBack`) on
  the panel and score, the 3-potion fill display (thresholds ported directly from
  the original: <500 empty, ≥500/1000/2000 → 1/2/3 filled), Try Again + Home.
  Two things worth knowing for later:
  - `GameOver11.png` (the board art) turned out to be a glowing border frame with a
    **transparent interior** — meant to sit over a solid card that isn't a separate
    asset in the original project. Added a solid backing rect behind it; without
    that it rendered as just an empty outline with the scene visible through it.
  - The original's own **Try Again / Home button art in this panel is blank** — two
    literal solid-black 64×64 placeholder squares (`NewSprite7.png`/`HomeButton.png`
    upscaled would just be black rectangles), never finished in the source project.
    Drew these as styled buttons instead (same outlined-rect pattern used
    elsewhere) rather than using broken art.
  Skipped for now (deferred, not needed yet): Leaderboard/Next Level/Submit-score
  buttons (need Stage 6 and Level 2+, neither exists), the animated bubble-particle
  decoration on the panel (Stage 5 polish territory).
- Verified: hit-testing on both buttons, a full tap-driven Try Again resetting score
  /fall-state/ball position, and Level 1's 30s timeout actually triggering game over
  with the distinct "Time's up!" (vs "You fell!") message.

## Stage 5: Polish (partial)

- **Fog parallax** (new `js/fog.js`) — 3 layers (back/mid/front) scrolling upward at
  different speeds (-6/-18/-42 px/s), each a pair of stacked images that swap past
  each other for endless vertical tiling — ported directly from the original's own
  FogBack1/2-style pairing and wrap logic. One deliberate deviation: the original
  drew its "front" fog layer *above* the gameplay; this port keeps all three layers
  behind the platform/ball, since a phone-sized screen makes fog-over-the-ball a
  real visibility risk the original (probably tested on a bigger canvas) didn't have
  to worry about as much.
- **Hinge bubbles** (same file, `HingeBubbles`) — small procedural circles with a
  slight wobble, streaming from the hinge while the ball is touching it and fading
  out over ~3s (was 1.3s — Rob asked for them to rise a lot higher before fading;
  also bumped rise speed 55-100→90-150 px/s, so total rise distance went from
  ~70-130px to ~270-450px). First pass had these as background ambience spawning
  randomly across the whole screen at all times (`AmbientBubbles`) — Rob caught that
  they should specifically be part of the hinge-touch feedback (alongside the glow
  and sparkles), same as the original's own bubble emitter tied to hinge contact.
  Rewrote to spawn only from the hinge position while `Physics.touchingHinge` is
  true. Still procedural circles rather than the original's `BubblesFinal.png` (a
  tall composed graphic that doesn't tile as individual particles).
- **Background vignette** (`Fog._drawVignette()`) — a gradient overlaid on the fog
  layers so it blends into the scene instead of reading as flat wallpaper, like the
  Home screen's background does. Several iterations to land on the current shape:
  solid background color (dark, no fog) from the top down well past the tube
  (`Platform.pivot.y` ≈ 652 — the dark zone extends to y≈704, further past it than
  earlier passes), then gradually getting lighter toward the bottom of the screen,
  pulled darker overall throughout for a spookier mood (floor of ~45% background
  tint at the very bottom — dim, never fully clears). Earlier passes tried: a radial
  fade (didn't reach full coverage near the platform), the fade direction reversed
  (fog visible up top instead of at the bottom — Rob corrected the direction), and
  a continuous-darkening-toward-the-bottom version that turned out to be a
  miscommunication and got reverted. The fog images themselves have no built-in
  fade of their own (fairly uniform alpha throughout), so there's still a faint
  transition band rather than a perfectly seamless blend — a fully seamless version
  would need the fade baked into the fog art itself.
- **Potion Blast** (Free Play only, in `ui.js`'s `PlayScreen` + `Physics.applyBlast()`)
  — a real mechanic, not just visual polish: every 1000 points grants a charge,
  tapping either blast button (dimmed to 35% opacity when no charge is available)
  spends one for an upward impulse in the platform's current angle direction (same
  formula shape as the original: sideways from `sin(angle)`, upward from
  `cos(angle)`). Verified score-threshold charge accumulation and that firing both
  consumes the charge and actually kicks the ball's velocity.
- **Jet tuning** — Rob calls these "fissures" (the Home screen's own hint text says
  "watch out for fissure bumps!"), noting them down under that name for future
  reference. Two rounds:
  1. First pass: reduced bounce height (`JET_IMPULSE_VY` -700 → -480) and the
     re-fire cooldown (0.4s → 0.3s). Confirmed the *timer* logic itself was already
     correct (traced frame-by-frame with the ball pinned at a jet: fired cleanly
     every ~0.3s, never faster) — but a pure time cooldown still lets the jet hit
     the ball repeatedly (once per cooldown tick) for as long as it happens to sit
     near the jet, which isn't what "one puff" means.
  2. Rob confirmed it was still too strong and still multi-hitting. Fixed properly
     this time: jets now fire on the *edge* of entering the catch zone (`wasInRange`
     false→true), not just "cooldown expired and still in range" — so a ball
     resting in the zone gets exactly one puff, and only gets another after it
     actually leaves and re-enters. The 0.2s cooldown left in `_updateJets` is now
     just a debounce safety net, not the primary gate. Also cut `JET_IMPULSE_VY`
     further, -480 → -360. Verified both behaviors directly: a ball held
     continuously in a jet's zone for 5 simulated seconds fires exactly once; a
     ball scripted to enter, leave, and re-enter fires exactly twice.

**Not built yet (deferred, lower value than what's done):** the smaller particle
emitters (PixiDust, Magic/HingeMagic sparkle bursts beyond the hinge-touch one
already built, explosion puffs), a few remaining tweened flourishes (flash effects
on some UI transitions), and the Outline filter effect on sprites (flagged back in
the original project summary as skippable). None of these are core gameplay —
worth revisiting only if there's a dedicated final visual-pass session.

**Asset weight note:** the 6 fog images together are ~1.3MB even after PNG
optimization (they're already at exact display resolution, so the only lever left
was compression level). Worth converting to WebP in a dedicated asset-optimization
pass before real deployment — PNG was fine for iterating quickly but this is the
single heaviest chunk of the download by far at this point.
