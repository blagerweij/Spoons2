//
// Screen manipulation
//
const cah = ["cmd", "alt", "ctrl"]

// macOS fullscreen transitions are animated; give them time to finish
const FULLSCREEN_ANIMATION = 1

const move = (win, pick) => {
    const from = win.screen
    win.frame = win.frame.toUnitRect(from.frame).fromUnitRect(pick(from).frame)
}

// Move the focused window to another screen, keeping its relative position/size.
// Fullscreen windows leave fullscreen, move, then go fullscreen again on the new screen.
const moveTo = (pick) => () => {
    const win = hs.window.focusedWindow()
    if (!win) return
    if (!win.isFullscreen) return move(win, pick)
    win.toggleFullscreen()
    hs.timer.doAfter(FULLSCREEN_ANIMATION, () => {
        move(win, pick)
        hs.timer.doAfter(0.2, () => win.toggleFullscreen())
    })
}

module.exports = {
    // Hotkey actions, bound by Hammerspoon, e.g. hs.spoons.use("ScreenManagement", { hotkeys: { next: [cah, "right"] } })
    bindings: {
        next: { pressed: moveTo(s => s.next()), message: "Move window to the next screen" },
        previous: { pressed: moveTo(s => s.previous()), message: "Move window to the previous screen" },
    },
    defaultHotkeys: {
        next: [cah, "up"],
        previous: [cah, "down"],
    },

    start() {
        return this
    },
    stop() {
        return this
    },
}
