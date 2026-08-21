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
    }
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
    HingeBubbles.draw(ctx);
    Physics.draw(ctx, images);
    Difficulty.drawMoon(ctx, images);

    this._drawHud(ctx, images, sceneLabel);

    if (this.isOver) this._drawGameOver(ctx, images);
  },

  _drawHud(ctx, images, sceneLabel) {
    // Score, in its bubble container.
    if (images.bubbleScore) {
      ctx.drawImage(images.bubbleScore, 20, 20, 238, 104);
    }
    drawCenteredText(ctx, this._scoreText(), 60, 55, 170, { size: 34, font: 'PotionTitle', color: '#fff' });

    drawCenteredText(ctx, sceneLabel, 0, 40, 720, { size: 26, font: 'PotionTitle', color: 'rgba(255,255,255,0.6)' });
    drawCenteredText(ctx, this._timeText(), 0, 78, 720, { size: 30, font: 'PotionBody', color: COLOR.instructions });

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

  _drawGameOver(ctx, images) {
    const t = easeOutBack(this.gameOverT);
    ctx.fillStyle = `rgba(0,0,0,${0.65 * Math.min(1, this.gameOverT * 2)})`;
    ctx.fillRect(0, 0, 720, 1280);

    const boardW = 759, boardH = 343, boardX = (720 - boardW) / 2, boardY = 460;
    // GameOver11.png is a glowing border frame with a transparent interior (meant
    // to sit over a solid card, which isn't a separate asset in the original) — fill
    // a solid backing behind it or the panel looks like an empty outline.
    roundRectPath(ctx, boardX + 20, boardY + 20, boardW - 40, boardH - 40, 30);
    ctx.fillStyle = 'rgba(20, 8, 32, 0.92)';
    ctx.fill();
    if (images.gameOverBoard) drawImg(ctx, images.gameOverBoard, boardX, boardY, boardW, boardH);
    if (images.gameOverBallOff) {
      ctx.globalAlpha = 0.5;
      drawImg(ctx, images.gameOverBallOff, boardX + 55, boardY + 48, 100, 62);
      ctx.globalAlpha = 1;
    }

    drawCenteredText(ctx, this.timedOut ? "Time's up!" : 'You fell!', 0, boardY - 90, 720,
      { size: 44, font: 'PotionTitle', color: '#fff' });

    ctx.save();
    ctx.translate(360, boardY + 90);
    ctx.scale(t, t);
    drawCenteredText(ctx, this._scoreText(), -300, -22, 600, { size: 46, font: 'PotionTitle', color: COLOR.purple });
    ctx.restore();

    // Potion fill row.
    const filled = this._potionsFilled();
    const potionY = boardY + 170, potionW = 72, potionH = 88, gap = 20;
    const totalW = potionW * 3 + gap * 2;
    let px = 360 - totalW / 2;
    for (let i = 0; i < 3; i++) {
      const img = i < filled ? images.potionFilled : images.potionEmpty;
      if (img) drawImg(ctx, img, px, potionY, potionW, potionH);
      px += potionW + gap;
    }

    // Buttons — the original's own art for these was an unfinished blank
    // placeholder, so these are drawn in this port's own button style instead.
    this.retryBtn = { x: 220, y: boardY + 280, w: 130, h: 56 };
    this.gameOverHomeBtn = { x: 370, y: boardY + 280, w: 130, h: 56 };
    drawButton(ctx, this.retryBtn, 'Try Again');
    drawButton(ctx, this.gameOverHomeBtn, 'Home');
  },

  hitTest(x, y) {
    if (this.isOver) {
      if (this.gameOverT < 1) return null;
      if (this.retryBtn && rectContains(this.retryBtn.x, this.retryBtn.y, this.retryBtn.w, this.retryBtn.h, x, y)) return { target: 'retry' };
      if (this.gameOverHomeBtn && rectContains(this.gameOverHomeBtn.x, this.gameOverHomeBtn.y, this.gameOverHomeBtn.w, this.gameOverHomeBtn.h, x, y)) return { target: 'home' };
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

function drawButton(ctx, b, label) {
  ctx.fillStyle = 'rgba(144, 19, 254, 0.18)';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.strokeStyle = COLOR.purple;
  ctx.lineWidth = 2;
  ctx.strokeRect(b.x, b.y, b.w, b.h);
  drawCenteredText(ctx, label, b.x, b.y + b.h / 2 - 12, b.w, { size: 22, font: 'PotionBody', color: '#fff' });
}

function easeOutBack(t) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
