// Small wrapper around localStorage — replaces the original GDevelop project's
// "PotionGameSave" file storage (EcrireFichierTxt / ReadStringFromStorage).
const Storage = {
  KEY: 'potionMachineSave',

  _read() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  },

  _write(data) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
    } catch (e) {
      // Storage unavailable (private browsing, quota, etc.) — fail silently,
      // the game still works, it just won't remember progress next visit.
    }
  },

  getPlayerName() {
    return this._read().playerName || '';
  },

  setPlayerName(name) {
    const data = this._read();
    data.playerName = name;
    this._write(data);
  },

  getHighestLevelUnlocked() {
    return this._read().highestLevelUnlocked || 1;
  },

  setHighestLevelUnlocked(level) {
    const data = this._read();
    data.highestLevelUnlocked = Math.max(data.highestLevelUnlocked || 1, level);
    this._write(data);
  },

  getMuted() {
    return !!this._read().muted;
  },

  setMuted(muted) {
    const data = this._read();
    data.muted = muted;
    this._write(data);
  },
};
