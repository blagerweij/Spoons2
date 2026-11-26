// Find my mouse pointer: press the hotkey to draw ping rings around it
// (green = 8.8.8.8 answered, red = failure). A ring closes in on the pointer,
// then every ping sends out a ripple that grows and fades

const pingResponses = {
    didStart: { alpha: 0.5, blue: 1 },
    didFail: { red: 1 },
    sendPacketFailed: { red: 1 },
    receivedPacket: { green: 1 },
}

let activePing = null // ping objects are weakly held; keep the running one alive

const R = 190 // outer radius of the effects, in a 400x400 canvas
const withAlpha = (c, alpha) => ({ red: 0, green: 0, blue: 0, ...c, alpha })

function showMouseCircle() {
    const p = hs.mouse.absolutePosition()
    const canvas = hs.canvas.create({ x: p.x - 200, y: p.y - 200, w: 400, h: 400 })
    canvas.ignoreMouseEvents(true)
    // 0: a dot on the pointer, 1: a white ring that closes in on it
    canvas.appendElements([
        { action: "fill", type: "circle", radius: 5, fillColor: { white: 1, alpha: 0 } },
        { action: "stroke", type: "circle", radius: R, strokeColor: { white: 1, alpha: 0 }, strokeWidth: 2 },
    ])
    canvas.show()
    hs.canvas.animate({ duration: 0.6, curve: "easeOut" }, () => {
        canvas.setElementAttribute(0, "fillColor", { white: 1, alpha: 0.9 })
        canvas.setElementAttribute(1, "strokeColor", { white: 1, alpha: 0.9 })
        canvas.setElementAttribute(1, "radius", 22)
        canvas.setElementAttribute(1, "strokeWidth", 6)
    })

    activePing = hs.network.ping("8.8.8.8", {
        count: 10, interval: 0.1, timeout: 1, family: "any",
        callback: (_, event) => {
            const color = pingResponses[event]
            if (color) {
                // each ping sends out a ripple that grows, thins and fades away
                const i = canvas.elementCount()
                canvas.appendElements([{ action: "stroke", type: "circle", radius: 22, strokeColor: withAlpha(color, 1), strokeWidth: 14 }])
                hs.canvas.animate({ duration: 1, curve: "easeOut" }, () => {
                    canvas.setElementAttribute(i, "radius", R)
                    canvas.setElementAttribute(i, "strokeColor", withAlpha(color, 0))
                })
            } else {
                // done: let the last ripples play out, then fade away
                hs.canvas.animate({ duration: 0.8, curve: "easeIn" }, () => canvas.setAlpha(0))
                    .then(() => { canvas.destroy(); activePing = null })
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
