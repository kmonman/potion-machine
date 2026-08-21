// Ball physics — a small hand-rolled 2D solver (not a general physics engine; the
// only real interaction in this game is "one circle resting on one rotating bar",
// so a full library like Matter.js would be overkill — see CLAUDE.md's flagged
// GDevelop-Physics2-replacement decision).
//
// Gravity here isn't "the world tilts" — it's a constant downward pull plus a
// sideways push from the tilt sensor, same idea as the original's per-object
// custom gravity vector. The ball then either free-falls or rests on the platform
// depending on where it is relative to the bar.

const Physics = {
  x: 0, y: 0,
  vx: 0, vy: 0,
  radius: 32,
  rotation: 0, // radians — visual spin, doesn't affect physics

  gravityY: 1500, // px/s^2, constant downward pull — was 900, felt too floaty (Rob's feedback)
  tiltAccel: 1400, // px/s^2 at full tilt (tiltX = ±1)
  airDamping: 0.999,

  touchingHinge: false,
  fellOff: false,

  reset() {
    this.x = Platform.pivot.x + 120;
    this.y = Platform.pivot.y - 140;
    this.vx = 0;
    this.vy = 0;
    this.rotation = 0;
    this.touchingHinge = false;
    this.fellOff = false;
  },

  update(dt, tiltX) {
    if (this.fellOff) return;

    // --- integrate free motion ---
    // Tilt strength is scaled by the current difficulty stage — heat and moon
    // phases both make the controls twitchier, matching the original's combined
    // TiltForce * MoonTiltMultiplier.
    const difficultyMultiplier = Difficulty.tiltForce * Difficulty.moonTiltMultiplier;
    const gx = tiltX * this.tiltAccel * difficultyMultiplier;
    const gy = this.gravityY;
    this.vx += gx * dt;
    this.vy += gy * dt;
    const damp = Math.pow(this.airDamping, dt * 60);
    this.vx *= damp;
    this.vy *= damp;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Rolling without slipping: a ball moving at vx across a surface below it spins
    // at vx/radius. Using this continuously (not just while touching the platform)
    // also keeps it spinning sensibly through the air, which looks right too.
    this.rotation += (this.vx / this.radius) * dt;

    this._resolvePlatformCollision(dt);
    this._checkBoundaries();
    this._checkHinge();

    if (this.y > 1100) {
      this.fellOff = true;
    }
  },

  _resolvePlatformCollision(dt) {
    const p = Platform;
    const dir = p.dir;
    const normal = p.normal;
    const rx = this.x - p.pivot.x;
    const ry = this.y - p.pivot.y;

    const along = rx * dir.x + ry * dir.y;
    const perp = rx * normal.x + ry * normal.y;

    const restPerp = -(p.thickness / 2 + this.radius);
    const halfLength = p.length / 2;

    if (Math.abs(along) <= halfLength && perp > restPerp) {
      // Push the ball back to rest on the surface.
      const clampedAlong = along;
      const clampedPerp = restPerp;
      this.x = p.pivot.x + dir.x * clampedAlong + normal.x * clampedPerp;
      this.y = p.pivot.y + dir.y * clampedAlong + normal.y * clampedPerp;

      // Decompose velocity into along-bar / into-bar components.
      let vAlong = this.vx * dir.x + this.vy * dir.y;
      let vNormal = this.vx * normal.x + this.vy * normal.y;
      if (vNormal > 0) vNormal = 0; // stop moving into the surface
      // Difficulty.grip is meant as "fraction of speed kept per second of contact"
      // (hotter tube = less grip = harder to control) — Math.pow(grip, dt) makes
      // that true regardless of frame rate. A bug here (dt not actually reaching
      // this function, despite being passed in) meant grip was applied as a flat
      // per-*frame* multiplier instead: at 60fps that's grip^60 retained per
      // second, crushing well over 99% of the ball's along-surface speed every
      // second — which is why it barely seemed to move under gravity/tilt at all.
      vAlong *= Math.pow(Difficulty.grip, dt);

      this.vx = dir.x * vAlong + normal.x * vNormal;
      this.vy = dir.y * vAlong + normal.y * vNormal;
    }
  },

  // Lets the ball drift off-screen before bouncing it back, rather than a hard
  // wall right at the visible edge — the platform's ends already reach fairly
  // close to the screen edges, so a wall exactly at the edge made the ball feel
  // like it could get pinned against the platform's tip. Margin widened 30→100px
  // (Rob's ask) so the ball has real room to fall past the tube's end and drop
  // vertically before the wall ever catches it, rather than being caught right
  // away with barely any time to fall.
  //
  // Bounce is deliberately soft (loses most of its speed), not a full elastic
  // reflection — a full-speed bounce (Rob's phone test) felt like the wall was
  // actively rewarding/launching the ball rather than just a neutral edge
  // correction, and could ping-pong back and forth several times before settling.
  _checkBoundaries() {
    const wallRestitution = 0.35;
    const margin = 100;
    if (this.x < -margin) {
      this.vx = Math.abs(this.vx) * wallRestitution;
    } else if (this.x > CONFIG.WIDTH + margin) {
      this.vx = -Math.abs(this.vx) * wallRestitution;
    }
  },

  _checkHinge() {
    const dx = this.x - Platform.pivot.x;
    const dy = this.y - Platform.pivot.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.touchingHinge = dist < (32 + this.radius);
  },

  // Free Play's "Potion Blast" power-up — a player-triggered impulse, direction
  // taken from the platform's current angle (same formula shape as the original:
  // sideways component from sin(angle), upward component from cos(angle)).
  applyBlast(force) {
    const rad = Platform.angleRad;
    this.vx += Math.sin(rad) * force;
    this.vy -= Math.cos(rad) * force;
  },

  draw(ctx, images) {
    if (images.ball) {
      const s = this.radius * 2.1875; // display art is slightly larger than the collision circle, matches original
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = Difficulty.ballOpacity; // fades out while a moon phase is active
      ctx.drawImage(images.ball, -s / 2, -s / 2, s, s);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = COLOR.purple;
      ctx.fill();
    }
  },
};
