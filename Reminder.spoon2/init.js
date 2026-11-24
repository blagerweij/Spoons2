// New reminder (default Ctrl-Alt-Cmd + R)
const cah = ["cmd", "alt", "ctrl"]

function addReminder() {
    const id = "com.apple.reminders"
    hs.application.launchOrFocus(id).then(() => {
        hs.application.matchingBundleID(id)?.selectMenuItemByName("New Reminder")
    })
}

module.exports = {
    // Hotkey actions, bound by Hammerspoon, e.g. hs.spoons.use("Reminder", { hotkeys: { add: [["cmd", "shift"], "r"] } })
    bindings: {
        add: { pressed: addReminder, message: "New reminder" },
    },
    defaultHotkeys: {
        add: [cah, "r"],
    },

    start() {
        return this
    },
    stop() {
        return this
    },
}
