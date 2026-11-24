// Find my mouse pointer: press the hotkey to draw ping rings around it
// (green = 8.8.8.8 answered, red = failure)

const pingResponses = {
    didStart: { alpha: 0.5, blue: 1 },
    didFail: { red: 1 },
    sendPacketFailed: { red: 1 },
    receivedPacket: { green: 1 },
}

let activePing = null // ping objects are weakly held; keep the running one alive

function showMouseCircle() {
    const p = hs.mouse.absolutePosition()
    // canvas windows use bottom-left origin, the mouse uses top-left
    const screenH = hs.screen.primary().fullFrame.h
    const canvas = hs.canvas.create({ x: p.x - 200, y: screenH - p.y - 200, w: 400, h: 400 })
    canvas.ignoreMouseEvents(true)
    canvas.show()
    let size = 100
    activePing = hs.network.ping("8.8.8.8", {
        count: 10, interval: 0.1, timeout: 1, family: "any",
        callback: (_, event) => {
            const color = pingResponses[event]
            if (!color) {
                canvas.destroy()
                activePing = null
            } else if (size > 0) {
                canvas.appendElements([{ action: "stroke", type: "circle", radius: size * 1.8, strokeColor: color, strokeWidth: 15 }])
                size -= 10
            }
        },
    })
}

module.exports = {
    // Hotkey actions, bound by Hammerspoon, e.g. hs.spoons.use("Mouse", { hotkeys: { show: [["cmd", "shift"], "m"] } })
    bindings: {
        show: { pressed: () => { if (!activePing) showMouseCircle() }, message: "Show mouse pointer" },
    },
    defaultHotkeys: {
        show: [["ctrl", "alt", "cmd"], "m"],
    },

    start() {
        return this
    },
    stop() {
        return this
    },
}
