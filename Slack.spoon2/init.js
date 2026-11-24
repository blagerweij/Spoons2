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

module.exports = {
    // Hotkey actions, bound by Hammerspoon, e.g. hs.spoons.use("Slack", { hotkeys: { switchChannel: [["cmd", "shift"], "k"] } })
    bindings: {
        switchChannel: { pressed: switchChannel, message: "Switch to a Slack channel" },
    },
    defaultHotkeys: {
        switchChannel: [cah, "k"],
    },

    start() {
        return this
    },
    stop() {
        return this
    },
}
