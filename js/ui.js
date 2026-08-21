// Drawing + tap-handling for each screen. Stage 1 scope: Home screen is built to
// match the original layout/art; Levels/Level1/FreePlay are simple placeholders
// (real art & gameplay land in later stages) so navigation + tilt input can be
// verified end-to-end on a phone before the physics/gameplay work begins.

const COLOR = {
  purple: 'rgb(144, 19, 254)',
  purpleDim: 'rgba(144, 19, 254, 0.55)',
  warn: 'rgb(189, 16, 224)',
  instructions: 'rgb(119, 163, 252)',
  locked: 'rgb(155, 155, 155)',
  bg: '#0a0410',
};

function rectContains(x, y, w, h, px, py) {
  return px >= x && px <= x + w && py >= y && py <= y + h;
}

function drawImg(ctx, img, x, y, w, h) {
  if (!img) return;
  ctx.drawImage(img, x, y, w, h);
}

function drawCenteredText(ctx, text, x, y, w, opts) {
  ctx.save();
  ctx.font = `${opts.size}px ${opts.font || 'PotionBody'}`;
  ctx.fillStyle = opts.color || '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const lines = String(text).split('\n');
  lines.forEach((line, i) => {
    ctx.fillText(line, x + w / 2, y + i * (opts.size * 1.15));
  });
  ctx.restore();
}

// ---------- Home screen ----------
const HomeScreen = {
  layout: {
    sky: { x: -19, y: -17, w: 752, h: 1309 },
    logo: { x: 11, y: -12, w: 677, h: 369 },
    liveGame: { x: -10, y: 286, w: 692, h: 721 },
    freePlayBtn: { x: 45, y: 721, w: 285, h: 285 },
    levelModeBtn: { x: 390, y: 721, w: 285, h: 285 },
    instrFreePlay: { x: 81, y: 970, w: 209, h: 135 },
    instrLevels: { x: 390, y: 970, w: 283, h: 135 },
    nameWarning: { x: 133, y: 1132, w: 454, h: 60 },
    muteHit: { x: 631, y: 1184, w: 64, h: 64 },
    muteBtn: { x: 637, y: 1186, w: 57, h: 68 },
    motionOverlay: { x: -21, y: 504, w: 756, h: 237 },
  },

  draw(ctx, images, state) {
    const L = this.layout;
    ctx.fillStyle = COLOR.bg;
    ctx.fillRect(0, 0, 720, 1280);
    drawImg(ctx, images.sky, L.sky.x, L.sky.y, L.sky.w, L.sky.h);
    drawImg(ctx, images.liveGame, L.liveGame.x, L.liveGame.y, L.liveGame.w, L.liveGame.h);
    drawImg(ctx, images.logo, L.logo.x, L.logo.y, L.logo.w, L.logo.h);
    drawImg(ctx, images.freePlayButton, L.freePlayBtn.x, L.freePlayBtn.y, L.freePlayBtn.w, L.freePlayBtn.h);
    drawImg(ctx, images.levelModeButton, L.levelModeBtn.x, L.levelModeBtn.y, L.levelModeBtn.w, L.levelModeBtn.h);

    drawCenteredText(ctx, 'FREE PLAY for high score', L.instrFreePlay.x, L.instrFreePlay.y, L.instrFreePlay.w,
      { size: 22, font: 'PotionBody', color: COLOR.instructions });
    drawCenteredText(ctx, 'Make potion to advance LEVELS', L.instrLevels.x, L.instrLevels.y, L.instrLevels.w,
      { size: 22, font: 'PotionBody', color: COLOR.instructions });

    if (state.showNameWarning) {
      drawCenteredText(ctx, 'Enter name before starting game', L.nameWarning.x, L.nameWarning.y, L.nameWarning.w,
        { size: 24, font: 'PotionBody', color: COLOR.warn });
    }

    const muteImg = state.muted ? images.muteMuted : images.muteUnmuted;
    drawImg(ctx, muteImg, L.muteBtn.x, L.muteBtn.y, L.muteBtn.w, L.muteBtn.h);

    if (state.requestingMotion) {
      drawImg(ctx, images.motionButton, L.motionOverlay.x, L.motionOverlay.y, L.motionOverlay.w, L.motionOverlay.h);
      drawCenteredText(ctx, 'Requesting motion access…', L.motionOverlay.x, L.motionOverlay.y + L.motionOverlay.h + 10,
        L.motionOverlay.w, { size: 22, font: 'PotionBody', color: '#fff' });
    }

    if (state.motionDenied) {
      drawCenteredText(ctx,
        'Motion access was denied.\nPlease allow motion access in your\nbrowser settings, then reload the page.',
        40, 560, 640, { size: 24, font: 'PotionBody', color: COLOR.warn });
    }
  },

  // Returns the tap target name, or null.
  hitTest(x, y) {
    const L = this.layout;
    if (rectContains(L.freePlayBtn.x, L.freePlayBtn.y, L.freePlayBtn.w, L.freePlayBtn.h, x, y)) return 'freePlay';
    if (rectContains(L.levelModeBtn.x, L.levelModeBtn.y, L.levelModeBtn.w, L.levelModeBtn.h, x, y)) return 'levelMode';
    if (rectContains(L.muteHit.x, L.muteHit.y, L.muteHit.w, L.muteHit.h, x, y)) return 'mute';
    return null;
  },
};

// ---------- Levels screen (placeholder — only Level 1 is real for now) ----------
const LevelsScreen = {
  buttonSize: 132,
  positions: [
    { x: 9, y: 270, n: 1 }, { x: 149, y: 270, n: 2 }, { x: 289, y: 270, n: 3 },
    { x: 429, y: 270, n: 4 }, { x: 569, y: 270, n: 5 },
    { x: 9, y: 417, n: 6 }, { x: 149, y: 417, n: 7 }, { x: 289, y: 417, n: 8 },
    { x: 429, y: 417, n: 9 }, { x: 569, y: 417, n: 10 },
  ],
  homeBtn: { x: 20, y: 40, w: 100, h: 50 },

  draw(ctx, images, state) {
    ctx.fillStyle = COLOR.bg;
    ctx.fillRect(0, 0, 720, 1280);
    drawCenteredText(ctx, 'Levels', 0, 130, 720, { size: 64, font: 'PotionTitle', color: '#fff' });

    const s = this.buttonSize;
    this.positions.forEach((pos) => {
      const unlocked = pos.n <= state.highestLevelUnlocked;
      const built = pos.n === 1; // only Level 1 exists so far
      ctx.fillStyle = unlocked ? 'rgba(144, 19, 254, 0.25)' : 'rgba(155, 155, 155, 0.15)';
      ctx.fillRect(pos.x, pos.y, s, s);
      ctx.strokeStyle = unlocked ? COLOR.purple : COLOR.locked;
      ctx.lineWidth = 3;
      ctx.strokeRect(pos.x, pos.y, s, s);
      drawCenteredText(ctx, String(pos.n), pos.x, pos.y + s / 2 - 24, s,
        { size: 48, font: 'PotionTitle', color: unlocked ? COLOR.purple : COLOR.locked });
      if (unlocked && !built) {
        drawCenteredText(ctx, 'soon', pos.x, pos.y + s - 26, s, { size: 16, font: 'PotionBody', color: COLOR.locked });
      }
    });

    this.drawHomeButton(ctx);
  },

  drawHomeButton(ctx) {
    const b = this.homeBtn;
    ctx.strokeStyle = COLOR.purple;
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    drawCenteredText(ctx, 'Home', b.x, b.y + 14, b.w, { size: 22, font: 'PotionBody', color: COLOR.purple });
  },

  hitTest(x, y, state) {
    const b = this.homeBtn;
    if (rectContains(b.x, b.y, b.w, b.h, x, y)) return { target: 'home' };
    const s = this.buttonSize;
    for (const pos of this.positions) {
      if (rectContains(pos.x, pos.y, s, s, x, y)) {
        if (pos.n === 1) return { target: 'playLevel1' };
        return null; // locked or not built yet
      }
    }
    return null;
  },
};

// Mask region for the Game Over score's bubble-up effect (shared between the
// update tick that spawns/moves the particles and the draw call that clips them).
const GO_BUBBLE_MASK = { x: 430, y: 175, w: 100, h: 118 };

// ---------- Play screen (Level 1 / Free Play) ----------
// Core ball-on-a-see-saw mechanic. Both modes still share the same difficulty
// script (Level 1's own fixed schedule isn't built yet — see CLAUDE.md), but they
// do differ here: Level 1 has a 30s countdown and times out, Free Play just counts
// up and only ends when the ball falls.
const PlayScreen = {
  homeBtn: { x: 20, y: 138, w: 100, h: 44 },
  muteBtn: { x: 656, y: 30, w: 44, h: 44 },
  score: 0,
  elapsed: 0,
  mode: 'freeplay',
  timedOut: false,
  gameOverT: 0, // 0-1 pop-in progress once the run has ended
  leaderboardMsgT: 0, // >0 while the "coming soon" message is showing
  goBubbles: [], // continuously-bubbling particles next to the Game Over score
  goBubbleTimer: 0,

  // Free Play only: a charge every 1000 points, tap a blast button to spend one.
  blastCharges: 0,
  blastThreshold: 0,
  blastLeftBtn: { x: 75, y: 950, w: 100, h: 100 },
  blastRightBtn: { x: 545, y: 950, w: 100, h: 100 },

  enter(mode) {
    this.mode = mode || this.mode;
    Difficulty.reset();
    Platform.reset();
    Physics.reset();
    Fog.reset();
    HingeBubbles.reset();
    this.score = 0;
    this.elapsed = 0;
    this.timedOut = false;
    this.gameOverT = 0;
    this.leaderboardMsgT = 0;
    this.goBubbles = [];
    this.goBubbleTimer = 0;
    this.blastCharges = 0;
    this.blastThreshold = 0;
  },

  get isOver() { return Physics.fellOff || this.timedOut; },
  get timeLimit() { return this.mode === 'level1' ? 30 : Infinity; },

  update(dt, tiltX) {
    Fog.update(dt);
    if (!this.isOver) {
      Platform.update(dt);
      Difficulty.update(dt);
      Physics.update(dt, tiltX);
      HingeBubbles.update(dt, Physics.touchingHinge, Platform.pivot.x, Platform.pivot.y);
      if (Physics.touchingHinge) this.score += 100 * dt;
      this.elapsed += dt;
      if (this.elapsed >= this.timeLimit) this.timedOut = true;

      if (this.mode === 'freeplay' && this.score >= this.blastThreshold + 1000) {
        this.blastCharges++;
        this.blastThreshold += 1000;
      }
    } else {
      HingeBubbles.update(dt, false, Platform.pivot.x, Platform.pivot.y);
      this.gameOverT = Math.min(1, this.gameOverT + dt / 0.35);
      if (this.leaderboardMsgT > 0) this.leaderboardMsgT = Math.max(0, this.leaderboardMsgT - dt);
      this._updateGoBubbles(dt);
    }
  },

  // Small continuous bubble-up effect next to the Game Over score, clipped to a
  // mask so bubbles appear to rise up out of the panel rather than float freely
  // (matches the original's own "BubbleMask" object over its equivalent effect).
  _updateGoBubbles(dt) {
    const m = GO_BUBBLE_MASK;
    this.goBubbleTimer -= dt;
    if (this.goBubbleTimer <= 0) {
      this.goBubbleTimer = 0.12;
      this.goBubbles.push({
        x: m.x + m.w / 2 + (Math.random() - 0.5) * m.w * 0.7,
        y: m.y + m.h + 10,
        r: 4 + Math.random() * 7,
        speed: 30 + Math.random() * 25,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleAmp: 6 + Math.random() * 10,
        life: 0,
        maxLife: (m.h + 30) / (30 + 12.5), // roughly the time to drift from bottom to top
      });
    }
    for (const b of this.goBubbles) {
      b.y -= b.speed * dt;
      b.wobblePhase += dt * 1.4;
      b.life += dt;
    }
    this.goBubbles = this.goBubbles.filter((b) => b.y > m.y - 10);
  },

  showLeaderboardComingSoon() {
    this.leaderboardMsgT = 1.6;
  },

  fireBlast() {
    if (this.mode !== 'freeplay' || this.blastCharges <= 0 || this.isOver) return;
    this.blastCharges--;
    Physics.applyBlast(600);
  },

  _timeText() {
    if (this.mode === 'level1') return String(Math.max(0, Math.ceil(this.timeLimit - this.elapsed)));
    return String(Math.floor(this.elapsed));
  },

  _potionsFilled() {
    if (this.score >= 2000) return 3;
    if (this.score >= 1000) return 2;
    if (this.score >= 500) return 1;
    return 0;
  },

  draw(ctx, images, sceneLabel) {
    ctx.fillStyle = COLOR.bg;
    ctx.fillRect(0, 0, 720, 1280);

    Fog.draw(ctx, images);
    Platform.draw(ctx, images);
    // Ball (and its moon-phase overlay, same position) drawn behind the hinge
    // glow/sprite and the hinge bubbles (Rob's ask) — previously drawn last, so
    // both rendered on top instead of appearing to sit under/against the hinge.
    Physics.draw(ctx, images);
    Difficulty.drawMoon(ctx, images);
    Platform.drawHinge(ctx, images);
    HingeBubbles.draw(ctx);

    this._drawHud(ctx, images, sceneLabel);

    if (this.isOver) this._drawGameOver(ctx, images);
  },

  _drawHud(ctx, images, sceneLabel) {
    // Player name + score pill — hidden once the run is over. What I originally
    // read as a "T ·" player-name prefix in Rob's reference screenshot turned out
    // to actually be the *fell-off icon* (Ball Off.png, a T-shaped platform +
    // dot), not a name at all — the real Game Over screen shows no player name,
    // just that icon and the score, both positioned inside the board itself (see
    // _drawGameOver). Keeping the name+score pill for active gameplay, since
    // there's no evidence either way there and it's a reasonable HUD addition.
    if (!this.isOver) {
      ctx.save();
      ctx.font = '28px PotionBody';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const nameStr = state.playerName + ' ·';
      ctx.fillText(nameStr, 20, 72);
      const nameWidth = ctx.measureText(nameStr).width;
      ctx.restore();

      const pillX = 20 + nameWidth + 14;
      if (images.bubbleScore) {
        ctx.drawImage(images.bubbleScore, pillX, 20, 238, 104);
      }
      drawCenteredText(ctx, this._scoreText(), pillX + 40, 55, 170, { size: 34, font: 'PotionTitle', color: '#fff' });
    }

    // Hidden once the run is over — matches the reference Game Over screenshot
    // (no mode/timer text up top there). Shifted into the upper-right (was
    // dead-center) so it no longer collides with the name+score pill, which
    // grows wider than the old score-only pill for longer player names.
    if (!this.isOver) {
      drawCenteredText(ctx, sceneLabel, 400, 40, 320, { size: 22, font: 'PotionTitle', color: 'rgba(255,255,255,0.6)' });
      drawCenteredText(ctx, this._timeText(), 400, 74, 320, { size: 26, font: 'PotionBody', color: COLOR.instructions });
    }

    // In-game mute toggle — same shared mute state as Home.
    const muteImg = state.muted ? images.muteMuted : images.muteUnmuted;
    drawImg(ctx, muteImg, this.muteBtn.x, this.muteBtn.y, this.muteBtn.w, this.muteBtn.h * (68 / 57));

    LevelsScreen.drawHomeButton.call({ homeBtn: this.homeBtn }, ctx);

    if (this.mode === 'freeplay' && !this.isOver) this._drawBlastButtons(ctx, images);
  },

  _drawBlastButtons(ctx, images) {
    const active = this.blastCharges > 0;
    ctx.save();
    ctx.globalAlpha = active ? 1 : 0.35;
    for (const btn of [this.blastLeftBtn, this.blastRightBtn]) {
      if (images.potionBlast) drawImg(ctx, images.potionBlast, btn.x, btn.y, btn.w, btn.h);
      else {
        ctx.beginPath();
        ctx.arc(btn.x + btn.w / 2, btn.y + btn.h / 2, btn.w / 2, 0, Math.PI * 2);
        ctx.strokeStyle = COLOR.purple;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
    ctx.restore();
    if (active) {
      drawCenteredText(ctx, `x${this.blastCharges}`, this.blastLeftBtn.x, this.blastLeftBtn.y + this.blastLeftBtn.h + 6,
        this.blastLeftBtn.w, { size: 20, font: 'PotionBody', color: '#fff' });
    }
  },

  _scoreText() {
    const s = Math.floor(this.score);
    return s >= 1000 ? `${Math.floor(s / 1000)},${String(s % 1000).padStart(3, '0')}` : String(s);
  },

  // Rebuilt to match the original's actual layout, pulled from the source project's
  // own scene coordinates (not guessed) — a full-screen dark fade, the real "GAME
  // OVER" art positioned about 44% down the screen (x50 y563 w624 out of the
  // 720x1280 scene, independent of any card/board — there's no solid panel behind
  // it, just the dark fade), and the button pill pinned near the bottom. The first
  // version of this screen invented its own mid-screen "card" with a solid backing,
  // a duplicate purple score readout, and a potion-fill row — none of which
  // actually appear in the real game (confirmed against Rob's screenshot of it).
  _drawGameOver(ctx, images) {
    const fadeIn = Math.min(1, this.gameOverT * 2);

    // Backdrop: the same gradient used behind the Home screen (dark at the
    // bottom, lighter toward the top) — the original's own "DarkOverlay" object
    // reuses this exact image at ~90% opacity rather than a flat black fill,
    // which is what this port was doing before (that read as a plain black
    // screen instead of the moody gradient in Rob's reference).
    if (images.sky) {
      ctx.save();
      ctx.globalAlpha = 0.92 * fadeIn;
      drawImg(ctx, images.sky, -19, -17, 752, 1309);
      ctx.restore();
    }
    ctx.fillStyle = `rgba(0,0,0,${0.35 * fadeIn})`;
    ctx.fillRect(0, 0, 720, 1280);

    const t = easeOutBack(this.gameOverT);

    // The board: a glow-outline frame (GameOver11.png) with a genuinely
    // transparent interior — no solid backing behind it. Positioned at the
    // original's own coordinates (x≈-20 y127 w759 h343 in the 720x1280 scene) —
    // it sits directly below the small top-left HUD pill (which ends at y124),
    // close enough that the two read as one continuous panel, matching Rob's
    // reference screenshot.
    const boardX = (720 - 759) / 2, boardY = 127, boardW = 759, boardH = 343;
    if (images.gameOverBoard) {
      ctx.save();
      ctx.globalAlpha = fadeIn;
      drawImg(ctx, images.gameOverBoard, boardX, boardY, boardW, boardH);

      // "Ball fell off the platform" icon — a real asset (Ball Off.png: a small
      // gray T-shaped platform silhouette with a pink dot beside it), object name
      // "GameOver2" in the source. Real position is x=92 y=261 w=172 h=106 in the
      // 720x1280 scene — my first pass at this (boardX+55, boardY+48, 100x62) was
      // an unverified guess made before I'd actually found this object in the
      // source file, and sat noticeably too high/small.
      if (images.gameOverBallOff) drawImg(ctx, images.gameOverBallOff, 92, 261, 172, 106);

      // Bubble-up effect immediately left of the score, clipped to a mask so
      // the bubbles read as rising up out of the panel rather than floating
      // freely (Rob: "masked by the panel and bubbling up") — matches the
      // original's own "BubbleMask" object over its equivalent effect.
      ctx.save();
      ctx.beginPath();
      ctx.rect(GO_BUBBLE_MASK.x, GO_BUBBLE_MASK.y, GO_BUBBLE_MASK.w, GO_BUBBLE_MASK.h);
      ctx.clip();
      for (const b of this.goBubbles) {
        const x = b.x + Math.sin(b.wobblePhase) * b.wobbleAmp;
        const edgeFade = Math.min(1, (b.y - (GO_BUBBLE_MASK.y - 10)) / 20);
        ctx.beginPath();
        ctx.arc(x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(243, 55, 190, ${0.4 * edgeFade})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 108, 218, ${0.9 * edgeFade})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();

      // Final score — the source's own "FinalScoreText" object, anchored at
      // x=586 y=253, i.e. inside the board on the same row as the icon above,
      // not the small top-left HUD pill (which is hidden entirely once the run
      // is over — see _drawHud). Bigger and grey (matching "GAME OVER" itself)
      // per Rob's follow-up — it started out sized/colored like the small HUD
      // pill's number instead of matching the big Game Over art.
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 3;
      drawCenteredText(ctx, this._scoreText(), 555, 233, 165, { size: 68, font: 'PotionTitle', color: '#c7c7c9' });
      ctx.restore();

      // 3 potion-fill icons inside the board, at the original's own relative
      // position (x428/497/562 y311 out of the 720-wide scene).
      const filled = this._potionsFilled();
      const potionXs = [428, 497, 562];
      potionXs.forEach((px, i) => {
        const img = i < filled ? images.potionFilled : images.potionEmpty;
        if (img) drawImg(ctx, img, px, 311, 72, 88);
      });
      ctx.restore();
    }

    if (images.gameOverText) {
      const w = 560, h = w * (images.gameOverText.height / images.gameOverText.width);
      // Slight glow + flicker concentrated toward the bottom of the letters —
      // two overlapping sine waves so it doesn't read as a perfectly regular
      // pulse, more like an unstable neon sign. White and more subtle per Rob's
      // follow-up (was purple-tinted and too strong).
      const now = Date.now();
      const flicker = 0.7 + 0.3 * (0.6 * Math.sin(now / 180) + 0.4 * Math.sin(now / 47));
      ctx.save();
      ctx.globalAlpha = fadeIn;
      ctx.translate(360, 560 + h / 2);
      ctx.scale(t, t);
      ctx.shadowColor = `rgba(255, 255, 255, ${Math.max(0, 0.35 * flicker)})`;
      ctx.shadowBlur = 12 * flicker;
      ctx.shadowOffsetY = 8;
      drawImg(ctx, images.gameOverText, -w / 2, -h / 2, w, h);
      ctx.restore();
    }

    // Row of 3 round buttons (home / restart / 3rd shortcut) — one combined pill
    // image with 3 equal tap-zones, matching the original (previously this port
    // substituted its own plain text buttons because I'd assumed the original had
    // no real art here — it did, just uncopied). Free Play's 3rd icon opens the
    // leaderboard; Level 1's opens the levels grid. Sized at the source art's own
    // aspect ratio (855x358 in the original scene) instead of the squashed 460x96
    // this port used at first.
    const barW = 430 * 1.6, barH = barW * (358 / 855); // Rob: 60% bigger
    const barX = (720 - barW) / 2, barY = 1280 - barH - 20; // pinned near the bottom with a small margin
    const bottomImg = this.mode === 'level1' ? images.bottomButtonsLevels : images.bottomButtonsFreeplay;
    if (bottomImg) drawImg(ctx, bottomImg, barX, barY, barW, barH);
    this.bottomButtonsRect = { x: barX, y: barY, w: barW, h: barH };

    if (this.leaderboardMsgT > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.leaderboardMsgT);
      drawCenteredText(ctx, 'Leaderboard coming soon!', 0, barY - 40, 720,
        { size: 24, font: 'PotionBody', color: '#fff' });
      ctx.restore();
    }
  },

  hitTest(x, y) {
    if (this.isOver) {
      if (this.gameOverT < 1) return null;
      const b = this.bottomButtonsRect;
      if (b && rectContains(b.x, b.y, b.w, b.h, x, y)) {
        const third = Math.floor((x - b.x) / (b.w / 3));
        if (third === 0) return { target: 'home' };
        if (third === 1) return { target: 'retry' };
        return { target: this.mode === 'level1' ? 'levels' : 'leaderboard' };
      }
      return null;
    }
    if (rectContains(this.muteBtn.x, this.muteBtn.y, this.muteBtn.w, this.muteBtn.h, x, y)) return { target: 'mute' };
    const b = this.homeBtn;
    if (rectContains(b.x, b.y, b.w, b.h, x, y)) return { target: 'home' };
    if (this.mode === 'freeplay') {
      if (rectContains(this.blastLeftBtn.x, this.blastLeftBtn.y, this.blastLeftBtn.w, this.blastLeftBtn.h, x, y)) return { target: 'blast' };
      if (rectContains(this.blastRightBtn.x, this.blastRightBtn.y, this.blastRightBtn.w, this.blastRightBtn.h, x, y)) return { target: 'blast' };
    }
    return null;
  },
};

function easeOutBack(t) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
