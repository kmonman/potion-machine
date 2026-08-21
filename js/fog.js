// Three scrolling fog layers for parallax depth (back/mid/front, each drifting
// upward at a different speed). Each layer is two stacked copies of the same image
// that swap past each other as they scroll off — the standard endless-vertical-tile
// trick, ported directly from the original's own FogBack1/2 etc. pairing and
// cross-referencing wrap logic.
//
// All three are drawn behind the gameplay (platform/ball) — the original layered
// "front" fog above the action, but that risks obscuring the ball on a phone
// screen, so this port keeps every fog layer as background atmosphere only.
const Fog = {
  layers: [
    { key: 'fogBack', speed: -6, y1: 0, y2: -1280 },
    { key: 'fogMid', speed: -18, y1: 0, y2: -1280 },
    { key: 'fogFront', speed: -42, y1: 0, y2: -1280 },
  ],

  reset() {
    for (const l of this.layers) { l.y1 = 0; l.y2 = -1280; }
  },

  update(dt) {
    for (const l of this.layers) {
      l.y1 += l.speed * dt;
      l.y2 += l.speed * dt;
      if (l.y1 < -1280) l.y1 = l.y2 + 1280;
      if (l.y2 < -1280) l.y2 = l.y1 + 1280;
    }
  },

  draw(ctx, images) {
    for (const l of this.layers) {
      const img = images[l.key];
      const imgFlip = images[l.key + 'Flip'];
      if (img) ctx.drawImage(img, 0, l.y1, 720, 1280);
      if (imgFlip) ctx.drawImage(imgFlip, 0, l.y2, 720, 1280);
    }
    this._drawVignette(ctx);
  },

  // The fog layers alone read as a flat, uniform texture — nothing like the Home
  // screen's background. This overlays a fade on top of the fog: solid background
  // color (dark, no fog) from the top down past the tube (Platform.pivot.y ≈ 652)
  // and further still for a deeper dark zone, then gradually getting lighter toward
  // the bottom of the screen. Pulled darker overall throughout for a spookier feel
  // — even at its clearest, near the bottom, it stays fairly dim.
  _drawVignette(ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 1280);
    grad.addColorStop(0, 'rgba(10, 4, 16, 1)');
    grad.addColorStop(0.55, 'rgba(10, 4, 16, 1)'); // solid dark extends further past the tube
    grad.addColorStop(0.68, 'rgba(10, 4, 16, 0.78)');
    grad.addColorStop(0.82, 'rgba(10, 4, 16, 0.6)');
    grad.addColorStop(1, 'rgba(10, 4, 16, 0.45)'); // darker floor than before — stays dim, never fully clears
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 720, 1280);
  },
};

// Bubbles that stream up from the hinge while the ball is touching it — not an
// ambient background effect. (First pass had these spawning randomly across the
// whole screen at all times; Rob caught that they should specifically be part of
// the hinge-touch feedback, alongside the glow and sparkles.)
const HingeBubbles = {
  bubbles: [],
  spawnTimer: 0,

  reset() {
    this.bubbles = [];
    this.spawnTimer = 0;
  },

  update(dt, emitting, x, y) {
    if (emitting) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        // Dense cluster while touching — matches the intro art's thick bubble
        // burst around the hinge, not a thin trickle (Rob: "a lot should flow up").
        this.spawnTimer = 0.035;
        for (let i = 0; i < 3; i++) {
          this.bubbles.push({
            x: x + (Math.random() - 0.5) * 34,
            y: y + (Math.random() - 0.5) * 14,
            r: 3 + Math.random() * 6,
            speed: 90 + Math.random() * 70,
            wobblePhase: Math.random() * Math.PI * 2,
            wobbleAmp: 8 + Math.random() * 14,
            life: 3,
            maxLife: 3,
          });
        }
      }
    }
    for (const b of this.bubbles) {
      b.y -= b.speed * dt;
      b.wobblePhase += dt * 1.5;
      b.life -= dt;
    }
    this.bubbles = this.bubbles.filter((b) => b.life > 0);
  },

  draw(ctx) {
    for (const b of this.bubbles) {
      const x = b.x + Math.sin(b.wobblePhase) * b.wobbleAmp;
      const t = b.life / b.maxLife;
      const alpha = 0.5 * Math.min(1, (1 - t) * 5) * Math.min(1, t * 2.5);
      ctx.beginPath();
      ctx.arc(x, b.y, b.r, 0, Math.PI * 2);
      // Filled pink core + brighter rim — reads as a much thicker bubble cluster
      // than the old thin purple outline, matching the intro art's look.
      ctx.fillStyle = `rgba(230, 90, 220, ${Math.max(0, alpha * 0.35)})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 170, 245, ${Math.max(0, alpha)})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  },
};
