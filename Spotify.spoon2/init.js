// Spotify play/pause (default Ctrl-Alt-Cmd + P)
const cah = ["cmd", "alt", "ctrl"]

function playpause() {
    hs.osascript.applescript('tell application "Spotify" to playpause')
        .then(r => console.log(JSON.stringify(r)))
}

let hotkeys = []

module.exports = {
    // Actions for bindHotkeys(), e.g. hs.spoons.use("Spotify", { hotkeys: { playpause: [[], "f8"] } })
    bindings: {
        playpause: { pressed: playpause, message: "Spotify play/pause" },
    },
    defaultHotkeys: {
        playpause: [cah, "p"],
    },

    bindHotkeys(mapping) {
        hotkeys.forEach(h => h.destroy())
        hotkeys = Object.entries(mapping).map(([action, [mods, key]]) => {
            const b = this.bindings[action]
            if (!b) throw new Error(`Spotify: unknown hotkey action '${action}'`)
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
