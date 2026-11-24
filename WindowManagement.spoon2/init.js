//
// Window manipulation
//
const cah = ["cmd", "alt", "ctrl"]

// Resize the focused window to a fraction of its screen (unit rect: 0..1)
const gridset = (x, y, w, h) => () => {
    const win = hs.window.focusedWindow()
    if (win) win.frame = new HSRect(x, y, w, h).fromUnitRect(win.screen.frame)
}

module.exports = {
    // Hotkey actions, bound by Hammerspoon, e.g. hs.spoons.use("WindowManagement", { hotkeys: { left: [["cmd", "alt"], "left"] } })
    bindings: {
        maximize: { pressed: gridset(0, 0, 1, 1), message: "Maximize window" },
        left: { pressed: gridset(0, 0, 0.5, 1), message: "Window to left half of the screen" },
        right: { pressed: gridset(0.5, 0, 0.5, 1), message: "Window to right half of the screen" },
    },
    defaultHotkeys: {
        maximize: [["cmd", "alt"], "return"],
        left: [cah, "left"],
        right: [cah, "right"],
    },

    start() {
        return this
    },
    stop() {
        return this
    },
}
