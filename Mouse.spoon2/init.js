// Find my mouse pointer: press the hotkey to draw ping rings around it
// (green = 8.8.8.8 answered, red = failure). A ring closes in on the pointer,
// then every ping sends out a ripple that grows and fades

const pingResponses = {
    didStart: { alpha: 0.5, blue: 1 },
    didFail: { red: 1 },
    sendPacketFailed: { red: 1 },
    receivedPacket: { green: 1 },
}

const noResponse = { red: 0.6, green: 0.6, blue: 0.6 }

let activePing = null // ping objects are weakly held; keep the running one alive

const R = 190 // radius of the white outer ring, in a 400x400 canvas
const RIPPLE = 150 // ripples fade out inside it
const withAlpha = (c, alpha) => ({ red: 0, green: 0, blue: 0, ...c, alpha })

function showMouseCircle() {
    const p = hs.mouse.absolutePosition()
    const canvas = hs.canvas.create({ x: p.x - 200, y: p.y - 200, w: 400, h: 400 })
    canvas.ignoreMouseEvents(true)
    // 0: a dot on the pointer, 1: a white ring that grows out to the edge
    canvas.appendElements([
        { action: "fill", type: "circle", radius: 5, fillColor: { white: 1, alpha: 0 } },
        { action: "stroke", type: "circle", radius: 22, strokeColor: { white: 1, alpha: 0 }, strokeWidth: 6 },
    ])
    canvas.show()
    hs.canvas.animate({ duration: 1.5, curve: "easeOut" }, () => {
        canvas.setElementAttribute(0, "fillColor", { white: 1, alpha: 0.9 })
        canvas.setElementAttribute(1, "strokeColor", { white: 1, alpha: 0.9 })
        canvas.setElementAttribute(1, "radius", R)
        canvas.setElementAttribute(1, "strokeWidth", 3)
    })

    // a ripple that grows, thins and fades away
    const ripple = (color) => {
        const i = canvas.elementCount()
        canvas.appendElements([{ action: "stroke", type: "circle", radius: 22, strokeColor: withAlpha(color, 1), strokeWidth: 14 }])
        return hs.canvas.animate({ duration: 1, curve: "easeOut" }, () => {
            canvas.setElementAttribute(i, "radius", RIPPLE)
            canvas.setElementAttribute(i, "strokeWidth", 1)
            canvas.setElementAttribute(i, "strokeColor", withAlpha(color, 0))
        })
    }

    let answered = false
    activePing = hs.network.ping("8.8.8.8", {
        count: 10, interval: 0.1, timeout: 1, family: "any",
        callback: (_, event) => {
            const color = pingResponses[event]
            if (color) {
                answered ||= event === "receivedPacket"
                ripple(color)
            } else if (event === "didFinish") {
                // timeouts raise no event, so show grey if nothing ever answered
                const last = answered ? Promise.resolve() : ripple(noResponse)
                last.then(() => hs.canvas.animate({ duration: 0.8, curve: "easeIn" }, () => canvas.setAlpha(0)))
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
