//
// Window manipulation
//
const cah = ["cmd", "alt", "ctrl"]

// Resize the focused window to a fraction of its screen (unit rect: 0..1)
const gridset = (x, y, w, h) => () => {
    const win = hs.window.focusedWindow()
    if (win) win.frame = new HSRect(x, y, w, h).fromUnitRect(win.screen.frame)
}

let hotkeys = []

module.exports = {
    // Actions for bindHotkeys(), e.g. hs.spoons.use("WindowManagement", { hotkeys: { left: [["cmd", "alt"], "left"] } })
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

    bindHotkeys(mapping) {
        hotkeys.forEach(h => h.destroy())
        hotkeys = Object.entries(mapping).map(([action, [mods, key]]) => {
            const b = this.bindings[action]
            if (!b) throw new Error(`WindowManagement: unknown hotkey action '${action}'`)
            return hs.hotkey.bind(mods, key, b.pressed, b.released, b.repeat)
        }).filter(Boolean)
        return this
    },
    start() {
        hotkeys.forEach(h => h.enable())
        return this
    },
    stop() {
        hotkeys.forEach(h => h.disable())
        return this
    },
}
