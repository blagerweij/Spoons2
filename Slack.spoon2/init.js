//
// From any app: focus Slack and press Cmd+K ("Go" -> "Switch to Channel"); default Ctrl+Alt+Cmd+K
//
const cah = ["cmd", "alt", "ctrl"]
const slackBundleID = "com.tinyspeck.slackmacgap"

function switchChannel() {
    // Delay so the hotkey's own modifiers are released before the synthetic Cmd+K
    const sendKey = () => hs.timer.doAfter(0.2, () => hs.eventtap.keyStroke(["cmd"], "k"))
    if (hs.application.frontmost()?.bundleID === slackBundleID) {
        sendKey()
        return
    }
    hs.application.once("didActivate", sendKey)
    hs.application.launchOrFocus(slackBundleID)
}

let hotkeys = []

module.exports = {
    // Actions for bindHotkeys(), e.g. hs.spoons.use("Slack", { hotkeys: { switchChannel: [["cmd", "shift"], "k"] } })
    bindings: {
        switchChannel: { pressed: switchChannel, message: "Switch to a Slack channel" },
    },
    defaultHotkeys: {
        switchChannel: [cah, "k"],
    },

    bindHotkeys(mapping) {
        hotkeys.forEach(h => h.destroy())
        hotkeys = Object.entries(mapping).map(([action, [mods, key]]) => {
            const b = this.bindings[action]
            if (!b) throw new Error(`Slack: unknown hotkey action '${action}'`)
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
