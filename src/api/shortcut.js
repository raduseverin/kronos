export const shortcut = {
  /** @param {string} key — Electron accelerator string, e.g. 'CmdOrCtrl+Shift+Space' */
  configure: (key) => window.kronos.shortcut.configure(key),
}
