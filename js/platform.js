// The see-saw platform (a rotating bar mounted on a fixed pole). It isn't a physics
// object — like the original, its angle is driven by a smooth tween that continuously
// retargets to a new random angle every 3 seconds. Ball physics (physics.js) reads
// Platform.angle each frame to know what it's balancing on.

function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

const Platform = {
  pivot: { x: 360, y: 652 },
  // Shortened from the original's 674 (Rob's phone test: the tube reached close
  // enough to the screen edges that the ball couldn't actually fall down the gap
  // between the tube's end and the side wall — it would hit the wall-bounce trigger
  // and get knocked back before it had cleared the tube's end and dropped far
  // enough to fall past it). Widened back up 520→620 (Rob: felt too small) — the
  // 100px fall-through margin (Physics._checkBoundaries) still gives room to drop.
  length: 620,
  thickness: 52,
  poleHeight: 630,

  angle: 0, // degrees; positive = right end tilts down
  startAngle: 0,
  targetAngle: 0,
  tweenDuration: 3,
  tweenElapsed: 0,
  timer: 0,
  direction: 1,

  // Hinge glow + reticle ring + sparkle burst while the ball is touching it.
  // Rob's real reference screenshots (a "not touching" and a "touching" shot of
  // the actual original game) showed this port's version was backwards (dimmer
  // while touched — an earlier, unverified guess) and too flat at idle. A first
  // attempt at fixing it added small *rotating* emitter dots, but Rob caught
  // that the reference doesn't show anything moving like that — it's a static
  // gauge/reticle ring of fixed tick marks that brightens, not orbiting points.
  hingeGlow: 0, // 0 = idle, 1 = touched — brighter/warmer at 1, not dimmer
  sparkles: [],

  reset() {
    this.angle = 0;
    this.direction = 1;
    this.startAngle = 0;
    this.targetAngle = (5 + Math.random() * 15) * this.direction;
    this.tweenElapsed = 0;
    this.timer = 0;
    this.hingeGlow = 0;
    this.sparkles = [];
    this._initLiquid();
  },

  update(dt) {
    this.timer += dt;
    this.tweenElapsed = Math.min(this.tweenElapsed + dt, this.tweenDuration);
    const t = this.tweenElapsed / this.tweenDuration;
    this.angle = this.startAngle + (this.targetAngle - this.startAngle) * easeInOutSine(t);

    if (this.timer >= this.tweenDuration) {
      this.direction *= -1;
      this.startAngle = this.targetAngle;
      this.targetAngle = (5 + Math.random() * 15) * this.direction;
      this.tweenElapsed = 0;
      this.timer = 0;
    }

    this._updateLiquid(dt);
    this._updateHinge(dt);
  },

  _updateHinge(dt) {
    // Dims quickly-ish while touched (~0.7s), brightens back a bit faster (~0.3s) —
    // matches the original's two different tween durations for the two directions.
    const target = Physics.touchingHinge ? 1 : 0;
    const speed = target > this.hingeGlow ? 1 / 0.7 : 1 / 0.3;
    this.hingeGlow += (target - this.hingeGlow) * Math.min(1, dt * speed * 3);

    if (Physics.touchingHinge) {
      for (let i = 0; i < 2; i++) {
        const angle = Math.random() * Math.PI * 2;
        this.sparkles.push({
          x: this.pivot.x, y: this.pivot.y,
          vx: Math.cos(angle) * 60, vy: Math.sin(angle) * 60 - 30,
          life: 0.5, maxLife: 0.5,
        });
      }
    }
    for (const s of this.sparkles) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 80 * dt;
      s.life -= dt;
    }
    this.sparkles = this.sparkles.filter((s) => s.life > 0);
  },

  get angleRad() { return this.angle * Math.PI / 180; },
  // Unit vector along the bar (from pivot toward the "positive/right" end).
  get dir() { return { x: Math.cos(this.angleRad), y: Math.sin(this.angleRad) }; },
  // Unit vector perpendicular to the bar, pointing toward its underside.
  get normal() { return { x: -Math.sin(this.angleRad), y: Math.cos(this.angleRad) }; },

  draw(ctx, images) {
    const { x, y } = this.pivot;

    // Pole (static, drawn from the pivot straight down).
    if (images.pole) {
      ctx.drawImage(images.pole, x - 25, y, 50, this.poleHeight);
    }

    // Platform bar, rotated around the pivot.
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.angleRad);
    if (images.platform) {
      ctx.drawImage(images.platform, -this.length / 2, -this.thickness / 2, this.length, this.thickness);
    }
    this._drawLiquid(ctx);
    this._drawGlass(ctx, images);
    ctx.restore();
  },

  // Hinge glow + sprite + sparkles + jets — split out from draw() so the ball can
  // be drawn in between (Rob: the ball should render behind the hinge and its
  // bubbles, not on top of them like it did when everything here was one call
  // that ran before Physics.draw()).
  drawHinge(ctx, images) {
    const { x, y } = this.pivot;
    const g = this.hingeGlow; // 0 idle .. 1 touched — brighter/warmer at 1

    // Cool purple idle -> warm pink/magenta touched.
    const c = [
      Math.round(150 + (255 - 150) * g),
      Math.round(80 + (55 - 80) * g),
      Math.round(255 + (190 - 255) * g),
    ];
    const rgb = c.join(',');

    // Ambient fill glow behind everything — present at idle (not just a fade-in
    // on touch), stronger while touched.
    const fill = ctx.createRadialGradient(x, y, 0, x, y, 52);
    fill.addColorStop(0, `rgba(${rgb}, ${0.28 + g * 0.32})`);
    fill.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, 52, 0, Math.PI * 2);
    ctx.fill();

    // Crisp glowing outer ring — a real bright rim (not just a soft blur),
    // thickening and lighting up further on touch.
    ctx.save();
    ctx.shadowColor = `rgba(${rgb}, 0.9)`;
    ctx.shadowBlur = 12 + g * 16;
    ctx.beginPath();
    ctx.arc(x, y, 46, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${rgb}, ${0.5 + g * 0.4})`;
    ctx.lineWidth = 3 + g * 2.5;
    ctx.stroke();
    ctx.restore();

    // Static reticle/gauge ring — fixed short tick marks, not moving points
    // (an earlier pass had these as slowly rotating dots; Rob caught that
    // nothing in the reference actually moves like that — it's a fixed pattern
    // that just brightens with the rest of the hinge).
    const tickCount = 8;
    for (let i = 0; i < tickCount; i++) {
      const a = (i / tickCount) * Math.PI * 2;
      const x1 = x + Math.cos(a) * 25, y1 = y + Math.sin(a) * 25;
      const x2 = x + Math.cos(a) * 33, y2 = y + Math.sin(a) * 33;
      ctx.save();
      ctx.shadowColor = `rgba(${rgb}, 1)`;
      ctx.shadowBlur = 4 + g * 8;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.55 + g * 0.4})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }

    // Hinge sprite (doesn't rotate) + a bright core glow on top that intensifies
    // on touch, matching "the center ball of the hinge... increases" from Rob's
    // description.
    if (images.hinge) {
      const s = 112;
      ctx.drawImage(images.hinge, x - s / 2, y - s / 2, s, s);
    }
    const core = ctx.createRadialGradient(x, y, 0, x, y, 17);
    core.addColorStop(0, `rgba(255, 255, 255, ${0.4 + g * 0.45})`);
    core.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(x, y, 17, 0, Math.PI * 2);
    ctx.fill();

    this._drawSparkles(ctx);

    // Jets are already positioned in world space (Difficulty computes them from
    // the pivot directly), so they're drawn outside the rotated block above.
    Difficulty.drawJets(ctx);
  },

  _drawSparkles(ctx) {
    for (const s of this.sparkles) {
      const t = s.life / s.maxLife;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 3 * t, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220, 190, 255, ${t})`;
      ctx.fill();
    }
  },

  // ---------- Liquid: a "2D water" column simulation ----------
  // Standard technique (springs between a row of surface columns, tension pulls each
  // column toward a target, damping bleeds energy, and a spread pass propagates
  // changes to neighbors so disturbances ripple across the surface as a wave rather
  // than every column snapping independently). What makes it look like liquid *in a
  // tilting tube* specifically: the per-column target isn't "flat relative to the
  // tube" — it's "flat relative to real gravity", i.e. the world-horizontal plane
  // re-expressed in the tube's own (rotated) local coordinates. On top of that, a
  // small continuous ambient ripple (`_ambientWave`) keeps the surface visibly alive
  // even while the platform briefly isn't changing angle, instead of freezing solid.
  liquidColumns: [],
  liquidColumnCount: 48,
  liquidTension: 0.22,
  liquidDamping: 0.10,
  liquidSpread: 0.28,
  liquidSpreadPasses: 4,
  liquidAmbientAmplitude: 2.2,
  liquidAmbientSpeed: 1.6,
  liquidTime: 0,

  _liquidHalfLength() { return this.length / 2 - 15; },
  _liquidHalfThickness() { return this.thickness / 2 - 9; },

  _initLiquid() {
    const halfL = this._liquidHalfLength();
    const n = this.liquidColumnCount;
    this.liquidColumns = [];
    for (let i = 0; i < n; i++) {
      const x = -halfL + (2 * halfL) * (i / (n - 1));
      this.liquidColumns.push({ x, level: 0, velocity: 0 });
    }
    this.liquidTime = 0;
  },

  _updateLiquid(dt) {
    const steps = dt * 60; // constants tuned per-frame at ~60fps, like the physics elsewhere
    const halfT = this._liquidHalfThickness();
    const tanA = Math.tan(this.angleRad);
    const cols = this.liquidColumns;
    this.liquidTime += dt;

    // Spring each column toward "where real gravity puts the surface here", plus a
    // gentle traveling ripple so the liquid never looks perfectly frozen even when
    // the tube's angle is momentarily steady.
    for (const col of cols) {
      const gravityTarget = clamp(-col.x * tanA, -halfT, halfT);
      const ripple = Math.sin(this.liquidTime * this.liquidAmbientSpeed + col.x * 0.012) * this.liquidAmbientAmplitude;
      const target = clamp(gravityTarget + ripple, -halfT, halfT);
      col.velocity += (target - col.level) * this.liquidTension * steps;
      col.velocity *= Math.pow(1 - this.liquidDamping, steps);
      col.level += col.velocity * steps;
    }

    // Spread pass — propagate each column's motion to its neighbors so a change
    // travels across the surface as a wave instead of every column moving in
    // lockstep independence. This is an explicit diffusion-style update, which
    // only stays numerically stable if spread*steps stays well under 1 — with 4
    // passes compounding each other, an uncapped `steps` (which can spike to 3 at
    // MAX_DT after any frame stall/tab-throttle) blew this up exponentially (levels
    // reaching ~1e136). Cap the steps used here specifically, separate from the
    // main spring integration above which doesn't have this stability problem.
    const spreadSteps = Math.min(steps, 1);
    for (let pass = 0; pass < this.liquidSpreadPasses; pass++) {
      const leftDelta = new Array(cols.length).fill(0);
      const rightDelta = new Array(cols.length).fill(0);
      for (let i = 0; i < cols.length; i++) {
        if (i > 0) {
          leftDelta[i] = this.liquidSpread * (cols[i].level - cols[i - 1].level) * spreadSteps;
          cols[i - 1].velocity += leftDelta[i];
        }
        if (i < cols.length - 1) {
          rightDelta[i] = this.liquidSpread * (cols[i].level - cols[i + 1].level) * spreadSteps;
          cols[i + 1].velocity += rightDelta[i];
        }
      }
      for (let i = 0; i < cols.length; i++) {
        if (i > 0) cols[i - 1].level += leftDelta[i];
        if (i < cols.length - 1) cols[i + 1].level += rightDelta[i];
      }
    }

    // Defensive backstop — physically nothing should ever put the surface much
    // beyond the tube's walls, so clamp hard rather than let any future edge case
    // (or another dt spike this analysis missed) silently blow up again.
    const maxLevel = halfT * 3;
    const maxVelocity = 4000;
    for (const col of cols) {
      col.level = clamp(col.level, -maxLevel, maxLevel);
      col.velocity = clamp(col.velocity, -maxVelocity, maxVelocity);
    }
  },

  // Called while already translated+rotated to the platform's local space (origin
  // at the pivot, +X along the bar). Tube4.png is a fully opaque "empty tube" image,
  // so the liquid is drawn as a clipped overlay on top of it rather than behind it.
  _drawLiquid(ctx) {
    const halfL = this._liquidHalfLength();
    const halfT = this._liquidHalfThickness();
    const cols = this.liquidColumns;
    if (!cols.length) return;

    ctx.save();
    roundRectPath(ctx, -halfL, -halfT, halfL * 2, halfT * 2, halfT);
    ctx.clip();

    // Fill polygon, surface edge smoothed through quadratic curves between column
    // midpoints (a plain lineTo-per-column polyline looked faceted/segmented —
    // "jumpy" — especially with a coarse column count).
    ctx.beginPath();
    ctx.moveTo(cols[0].x, halfT);
    ctx.lineTo(cols[0].x, cols[0].level);
    smoothCurveThrough(ctx, cols);
    ctx.lineTo(cols[cols.length - 1].x, halfT);
    ctx.closePath();

    // Liquid color follows the current tube heat stage (cool purple → fire red-pink),
    // lerped smoothly by Difficulty rather than snapping between stages.
    const [tr, tg, tb] = Difficulty.tubeColor;
    const grad = ctx.createLinearGradient(0, -halfT, 0, halfT);
    grad.addColorStop(0, `rgba(${lighten(tr, 90)}, ${lighten(tg, 90)}, ${lighten(tb, 20)}, 0.9)`);
    grad.addColorStop(0.35, `rgba(${tr | 0}, ${tg | 0}, ${tb | 0}, 0.95)`);
    grad.addColorStop(1, `rgba(${darken(tr, 0.55)}, ${darken(tg, 0.55)}, ${darken(tb, 0.55)}, 0.92)`);
    ctx.fillStyle = grad;
    ctx.fill();

    // Bright surface shine, faded by depth rather than a hard on/off cutoff — a
    // binary threshold made whole segments pop in and out of existence as columns
    // crossed it, which read as the liquid "jumping" instead of moving smoothly.
    // Drawn as short per-segment strokes so each one can carry its own opacity.
    const maxDepth = halfT * 2;
    for (let i = 0; i < cols.length - 1; i++) {
      const a = cols[i], b = cols[i + 1];
      const depthA = halfT - a.level, depthB = halfT - b.level;
      const depth = Math.min(depthA, depthB);
      // Lightened toward white with a higher ceiling (was 220,250 @ 0.75) —
      // Rob wanted the surface reflection brighter.
      const alpha = smoothstep(0, maxDepth * 0.22, depth) * 0.9;
      if (alpha <= 0.01) continue;
      ctx.beginPath();
      ctx.moveTo(a.x, a.level);
      ctx.lineTo(b.x, b.level);
      ctx.strokeStyle = `rgba(255, 245, 255, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.restore();
  },

  // A glass layer drawn *in front of* the liquid — a subtle shadow along the lower
  // inside edge and a brighter shine streak near the top, both semi-transparent, so
  // the liquid reads as sitting inside/behind glass rather than being the top-most
  // surface. The shine drifts very slightly side to side as the tube rotates (a
  // cheap parallax cue, matching how the original's TubeHighlight layer nudged
  // itself based on Platform.Angle()) instead of sitting perfectly static.
  _drawGlass(ctx, images) {
    const parallax = -this.angle * 3;
    if (images.tubeShadow) {
      ctx.globalAlpha = 0.8;
      ctx.drawImage(images.tubeShadow, -this.length / 2, -this.thickness / 2, this.length, this.thickness);
    }
    if (images.tubeHighlight) {
      ctx.globalAlpha = 0.9;
      ctx.drawImage(images.tubeHighlight, -this.length / 2 + parallax, -this.thickness / 2, this.length, this.thickness);
    }
    ctx.globalAlpha = 1;
  },
};

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function smoothstep(lo, hi, v) {
  const t = clamp((v - lo) / (hi - lo), 0, 1);
  return t * t * (3 - 2 * t);
}

// Smooths a polyline by drawing quadratic curves through the midpoints of each
// consecutive pair of points, using the points themselves as control points —
// the standard cheap way to turn a coarse point sequence into a soft curve.
function smoothCurveThrough(ctx, pts) {
  for (let i = 1; i < pts.length - 1; i++) {
    const midX = (pts[i].x + pts[i + 1].x) / 2;
    const midY = (pts[i].level + pts[i + 1].level) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].level, midX, midY);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last.x, last.level);
}

function lighten(v, amt) { return Math.min(255, Math.round(v + amt)) | 0; }
function darken(v, factor) { return Math.round(v * factor) | 0; }

// Rounded-rect path helper (drawn manually rather than relying on ctx.roundRect
// for wider browser support).
function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
