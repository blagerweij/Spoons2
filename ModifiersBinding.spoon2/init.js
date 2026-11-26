// Run a function when a modifier key is tapped 2x or 3x in a row (e.g. triple-tap ctrl).
//
// Settings (pass via `config` in hs.spoons.use, defaults are in module.exports below):
//   modifier: "ctrl" | "alt" (or "opt") | "cmd" | "shift"
//   presses:  2 | 3
//   interval: max seconds between two presses
//   action:   function called when the sequence is completed
// e.g. hs.spoons.use("ModifiersBinding", { config: { modifier: "ctrl", presses: 3, action: () => hs.alert.show("hi") }, start: true })

let tap = null
let down = false // modifier currently held (so only the press counts, not other modifiers changing)
let count = 0
let last = 0 // time of the previous press, ns

const MODIFIERS = ["ctrl", "alt", "cmd", "shift"]

function onFlags(event) {
    const modifier = spoon.modifier === "opt" ? "alt" : spoon.modifier
    const isDown = event.flags.includes(modifier)
    if (!isDown || down) {
        down = isDown
        return
    }
    down = true
    const now = hs.timer.absoluteTime()
    count = now - last <= spoon.interval * 1e9 ? count + 1 : 1
    last = now
    if (count >= spoon.presses) {
        count = 0
        spoon.action()
    }
}

const spoon = module.exports = {
    modifier: "ctrl",
    presses: 3,
    interval: 1,
    action: () => console.warn("ModifiersBinding: no action configured"),

    start() {
        const modifier = spoon.modifier === "opt" ? "alt" : spoon.modifier
        if (!MODIFIERS.includes(modifier)) throw new Error(`ModifiersBinding: unknown modifier "${spoon.modifier}"`)
        if (![2, 3].includes(spoon.presses)) throw new Error(`ModifiersBinding: presses must be 2 or 3, got ${spoon.presses}`)
        if (typeof spoon.action !== "function") throw new Error("ModifiersBinding: action must be a function")
        spoon.stop()
        const types = hs.eventtap.eventTypes
        tap = hs.eventtap.addWatcher([types.flagsChanged, types.keyDown], (event) => {
            if (event.type === types.keyDown) count = 0 // modifier+key (e.g. ctrl+A) is a shortcut, not a tap
            else onFlags(event)
        }, true)
        tap.start()
        return this
    },
    stop() {
        tap?.stop()
        tap = null
        down = false
        count = 0
        return this
    },
}
