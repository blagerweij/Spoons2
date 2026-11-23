// New reminder (default Ctrl-Alt-Cmd + R)
const cah = ["cmd", "alt", "ctrl"]

function addReminder() {
    const id = "com.apple.reminders"
    hs.application.launchOrFocus(id).then(() => {
        hs.application.matchingBundleID(id)?.selectMenuItemByName("New Reminder")
    })
}

let hotkeys = []

module.exports = {
    // Actions for bindHotkeys(), e.g. hs.spoons.use("Reminder", { hotkeys: { add: [["cmd", "shift"], "r"] } })
    bindings: {
        add: { pressed: addReminder, message: "New reminder" },
    },
    defaultHotkeys: {
        add: [cah, "r"],
    },

    bindHotkeys(mapping) {
        hotkeys.forEach(h => h.destroy())
        hotkeys = Object.entries(mapping).map(([action, [mods, key]]) => {
            const b = this.bindings[action]
            if (!b) throw new Error(`Reminder: unknown hotkey action '${action}'`)
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
