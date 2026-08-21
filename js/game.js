// Core loop, screen/state switching, asset loading, resize handling. Ties together
// input.js (tilt), storage.js (save data), leaderboard.js (stub for now) and ui.js
// (drawing). Physics/platform/difficulty gameplay itself arrives in later stages —
// this stage proves the skeleton (screens, navigation, tilt input) works end to end.

const CONFIG = {
  WIDTH: 720,
  HEIGHT: 1280,
};

const ASSET_PATHS = {
  sky: 'assets/Background 1.png',
  logo: 'assets/Potion Logo 7.11.png',
  liveGame: 'assets/LiveGame4.png',
  freePlayButton: 'assets/FreePlay.png',
  levelModeButton: 'assets/LevelsButton.png',
  motionButton: 'assets/MotionButton.png',
  muteUnmuted: 'assets/Mute P.png',
  muteMuted: 'assets/Mute P1.png',
  pole: 'assets/NewSprite.png',
  platform: 'assets/Tube4.png',
  hinge: 'assets/Hinge.png',
  ball: 'assets/Ball.png',
  tubeShadow: 'assets/TubeShadow.png',
  tubeHighlight: 'assets/TubeHighlight3.png',
  moonWarm: 'assets/Moon Warm.png',
  moonHot: 'assets/Moon Hot.png',
  moonFire: 'assets/Moon Fire.png',
  gameOverText: 'assets/GameOverText3.png',
  gameOverBoard: 'assets/GameOver11.png',
  potionFilled: 'assets/Pink Potion Final_1.png',
  potionEmpty: 'assets/Pink Potion Empty.png',
  bubbleScore: 'assets/bubblescore3.png',
  fogBack: 'assets/FogBack3.png',
  fogBackFlip: 'assets/FogBack3Flip.png',
  fogMid: 'assets/FogMid3.png',
  fogMidFlip: 'assets/FogMid3Flip.png',
  fogFront: 'assets/FogFront3.png',
  fogFrontFlip: 'assets/FogFront3Flip.png',
  potionBlast: 'assets/Blast2.png',
  // Game Over's row of 3 round buttons — one combined pill image (icons + dividers
  // baked in, tap zones split into thirds) rather than 3 separate button sprites.
  // Two variants matching the original: Free Play's 3rd icon is a leaderboard
  // shortcut, Level 1's is a levels-grid shortcut.
  bottomButtonsFreeplay: 'assets/Bottom Buttons.png',
  bottomButtonsLevels: 'assets/Bottom Buttons Levels.png',
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameWrap = document.getElementById('gameWrap');
const nameInput = document.getElementById('nameInput');

const state = {
  screen: 'home', // 'home' | 'levels' | 'level1' | 'freeplay'
  playerName: Storage.getPlayerName(),
  gameMode: '',
  highestLevelUnlocked: Storage.getHighestLevelUnlocked(),
  muted: Storage.getMuted(),
  showNameWarning: false,
  requestingMotion: false,
  motionDenied: false,
};

// ---------- Background music ----------
// Original plays "Moonlit Drift.mp3" on a continuous loop from boot, across every
// screen (there's no per-scene music, just one persistent track). Mobile/desktop
// browsers block audio autoplay-with-sound until the page has seen at least one
// real user gesture, so the element is created immediately but .play() is only
// attempted starting with the first tap/keypress — and retried on every one after
// that until it actually succeeds (a single blocked attempt shouldn't give up for good).
const Music = {
  el: new Audio('assets/Moonlit Drift.mp3'),
  started: false,
  tryStart() {
    if (this.started) return;
    this.el.play().then(() => { this.started = true; }).catch(() => {});
  },
};
Music.el.loop = true;
Music.el.volume = 1;
Music.el.muted = state.muted;
window.addEventListener('pointerdown', () => Music.tryStart());
window.addEventListener('keydown', () => Music.tryStart());

const images = {};

// Retries on failure — matters on real phones with flaky mobile connections,
// not just for local dev testing.
function loadImage(src, attemptsLeft = 3) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      if (attemptsLeft > 1) {
        setTimeout(() => loadImage(src, attemptsLeft - 1).then(resolve, reject), 300);
      } else {
        reject(new Error(`Failed to load image: ${src}`));
      }
    };
    img.src = src;
  });
}

// Loaded a few at a time rather than all at once — large batches of simultaneous
// image requests were unreliable in local dev testing, and this is gentler on
// mobile connections in production too.
async function loadAssets() {
  const entries = Object.entries(ASSET_PATHS);
  const CONCURRENCY = 3;
  let cursor = 0;
  async function worker() {
    while (cursor < entries.length) {
      const i = cursor++;
      const [key, path] = entries[i];
      images[key] = await loadImage(path);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  if (document.fonts) {
    await Promise.all([
      document.fonts.load('20px PotionTitle'),
      document.fonts.load('20px PotionBody'),
    ]).catch(() => {}); // fonts still render with fallback if this fails
  }
}

// ---------- Screen navigation ----------
function goHome() {
  state.screen = 'home';
  nameInput.style.display = '';
  nameInput.value = state.playerName;
  state.showNameWarning = false;
  state.requestingMotion = false;
  state.motionDenied = false;
}

async function tryEnterGame(mode) {
  const name = nameInput.value.trim();
  if (!name) {
    state.showNameWarning = true;
    return;
  }
  state.playerName = name;
  Storage.setPlayerName(name);
  state.gameMode = mode;
  state.showNameWarning = false;
  state.requestingMotion = true;
  nameInput.style.display = 'none';

  const granted = await Input.requestPermission();
  state.requestingMotion = false;

  if (!granted) {
    state.motionDenied = true;
    return;
  }
  if (mode === 'FreePlay') enterPlayScreen('freeplay');
  else state.screen = 'levels';
}

function enterPlayScreen(screen) {
  state.screen = screen;
  PlayScreen.enter(screen);
}

function toggleMute() {
  state.muted = !state.muted;
  Storage.setMuted(state.muted);
  Music.el.muted = state.muted;
}

// ---------- Input wiring ----------
function canvasPointFromEvent(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = CONFIG.WIDTH / rect.width;
  const scaleY = CONFIG.HEIGHT / rect.height;
  return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
}

function handleTap(clientX, clientY) {
  const { x, y } = canvasPointFromEvent(clientX, clientY);

  if (state.screen === 'home') {
    const target = HomeScreen.hitTest(x, y);
    if (target === 'freePlay') tryEnterGame('FreePlay');
    else if (target === 'levelMode') tryEnterGame('Levels');
    else if (target === 'mute') toggleMute();
    return;
  }

  if (state.screen === 'levels') {
    const hit = LevelsScreen.hitTest(x, y, state);
    if (hit && hit.target === 'home') goHome();
    else if (hit && hit.target === 'playLevel1') enterPlayScreen('level1');
    return;
  }

  if (state.screen === 'level1' || state.screen === 'freeplay') {
    const hit = PlayScreen.hitTest(x, y);
    if (hit && hit.target === 'home') goHome();
    else if (hit && hit.target === 'retry') PlayScreen.enter(state.screen);
    else if (hit && hit.target === 'mute') toggleMute();
    else if (hit && hit.target === 'blast') PlayScreen.fireBlast();
    else if (hit && hit.target === 'levels') state.screen = 'levels';
    else if (hit && hit.target === 'leaderboard') PlayScreen.showLeaderboardComingSoon();
    return;
  }
}

canvas.addEventListener('pointerdown', (e) => handleTap(e.clientX, e.clientY));

// ---------- Resize (keeps the fixed 720x1280 internal coordinate space; only
// the CSS box around it scales — matches the approach used in Halloween-Platformer) ----------
function fitGameWrap() {
  const scale = Math.min(window.innerWidth / CONFIG.WIDTH, window.innerHeight / CONFIG.HEIGHT);
  gameWrap.style.transform = `scale(${scale})`;
  gameWrap.style.left = `${(window.innerWidth - CONFIG.WIDTH * scale) / 2}px`;
  gameWrap.style.top = `${(window.innerHeight - CONFIG.HEIGHT * scale) / 2}px`;
  gameWrap.style.position = 'absolute';
}
window.addEventListener('resize', fitGameWrap);

// ---------- Main loop ----------
const MAX_DT = 1 / 20; // clamp so a stalled tab doesn't cause a huge physics jump on return

function update(dt) {
  Input.update();
  if (state.screen === 'level1' || state.screen === 'freeplay') {
    PlayScreen.update(dt, Input.tiltX);
  }
}

function render() {
  if (state.screen === 'home') {
    HomeScreen.draw(ctx, images, state);
  } else if (state.screen === 'levels') {
    LevelsScreen.draw(ctx, images, state);
  } else if (state.screen === 'level1') {
    PlayScreen.draw(ctx, images, 'Level 1');
  } else if (state.screen === 'freeplay') {
    PlayScreen.draw(ctx, images, 'Free Play');
  }
}

let lastTime = null;
function loop(now) {
  if (lastTime === null) lastTime = now;
  const dt = Math.min(MAX_DT, (now - lastTime) / 1000);
  lastTime = now;

  update(dt);
  render();
  requestAnimationFrame(loop);
}

// ---------- Boot ----------
async function main() {
  fitGameWrap();
  nameInput.value = state.playerName;
  await loadAssets();
  requestAnimationFrame(loop);
}

main();
