// Spotify play/pause (default Ctrl-Alt-Cmd + P)
const cah = ["cmd", "alt", "ctrl"]

function playpause() {
    hs.osascript.applescript('tell application "Spotify" to playpause')
        .then(r => console.log(JSON.stringify(r)))
}

module.exports = {
    // Hotkey actions, bound by Hammerspoon, e.g. hs.spoons.use("Spotify", { hotkeys: { playpause: [[], "f8"] } })
    bindings: {
        playpause: { pressed: playpause, message: "Spotify play/pause" },
    },
    defaultHotkeys: {
        playpause: [cah, "p"],
    },

    start() {
        return this
    },
    stop() {
        return this
    },
}
