//
// Switch between terminal and a different application
//

let previousOpenedApp = null

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

    // Hotkey actions, bound by Hammerspoon, e.g. hs.spoons.use("TerminalSwitch", { hotkeys: { toggle: [["cmd"], "escape"] } })
    bindings: {
        toggle: { pressed: toggle, message: "Toggle between the terminal and the previous app" },
    },
    defaultHotkeys: {
        toggle: [["alt"], "space"],
    },

    start() {
        return this
    },
    stop() {
        return this
    },
}
