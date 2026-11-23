//
// Switch between terminal and a different application
//

let previousOpenedApp = null
let hotkeys = []

// Toggle between the terminal and the previously focussed app
function toggle() {
    const win = hs.window.focusedWindow()
    const focussedApp = win?.application?.bundleID
    if (focussedApp !== spoon.terminalApp) {
        if (focussedApp) previousOpenedApp = focussedApp
        hs.application.launchOrFocus(spoon.terminalApp)
    } else if (previousOpenedApp) {
        hs.application.launchOrFocus(previousOpenedApp)
    }
}

const spoon = module.exports = {
    // Bundle ID of the terminal, e.g. "com.apple.Terminal", "io.alacritty", "com.googlecode.iterm2"
    terminalApp: "com.apple.Terminal",

    // Actions for bindHotkeys(), e.g. hs.spoons.use("TerminalSwitch", { hotkeys: { toggle: [["cmd"], "escape"] } })
    bindings: {
        toggle: { pressed: toggle, message: "Toggle between the terminal and the previous app" },
    },
    defaultHotkeys: {
        toggle: [["alt"], "space"],
    },

    bindHotkeys(mapping) {
        hotkeys.forEach(h => h.destroy())
        hotkeys = Object.entries(mapping).map(([action, [mods, key]]) => {
            const b = this.bindings[action]
            if (!b) throw new Error(`TerminalSwitch: unknown hotkey action '${action}'`)
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
