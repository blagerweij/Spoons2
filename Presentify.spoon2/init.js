// draw (default Ctrl + A): draw on screen with the left mouse button. Again or Escape stops (and clears).
// While drawing: F = free draw, L = line, R = rectangle, O = ellipse, 1-6 = color, + / - = thickness.
// A menu bar icon shows the tool and color; click it, or right-click anywhere, to change them.
// A crosshair in the current color follows the mouse (macOS doesn't let us replace the cursor itself).
// spotlight (default Ctrl + S): dims everything except a circle around the mouse. Again stops.
// highlight (default Ctrl + L): draws a circle around the mouse. Again stops.

const COLORS = [
    ["red", { red: 1 }],
    ["green", { green: 0.8 }],
    ["blue", { blue: 1, green: 0.4 }],
    ["yellow", { red: 1, green: 0.9 }],
    ["white", { red: 1, green: 1, blue: 1 }],
    ["black", {}],
]

const box = (a, b) => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) })

// each tool turns the dragged points into a canvas element
const TOOLS = {
    f: ["free draw", (points) => ({ type: "segments", coordinates: points })],
    l: ["line", (points) => ({ type: "segments", coordinates: [points[0], points[points.length - 1]] })],
    r: ["rectangle", (points) => ({ type: "rectangle", frame: box(points[0], points[points.length - 1]) })],
    o: ["ellipse", (points) => ({ type: "oval", frame: box(points[0], points[points.length - 1]) })],
}

const SPOTLIGHT_RADIUS = 150
const HIGHLIGHT_SIZE = 120
const PEN_SIZE = 32
const types = hs.eventtap.eventTypes
let tool = TOOLS.f
let color = COLORS[0][1]
let width = 4
let canvases = [] // one per screen: { canvas, frame }
let current = null // { canvas, frame, index, points } of the shape being drawn
let pen = null // crosshair that follows the mouse while annotating
let popup = null // hidden menu bar item that pops the same menu up at the mouse
let menu = null // menu bar item showing the current tool and color while annotating

let spotlights = [] // one per screen: { canvas, frame }
let highlight = null // small canvas that follows the mouse

let modeKeys = [] // keys that only work while annotating
let hotkeys = []

// one click-through, full-screen canvas per screen
function overlays(level) {
    const primaryH = hs.screen.primary().fullFrame.h
    return hs.screen.all().map((screen) => {
        const f = screen.fullFrame
        const frame = { x: f.x, y: f.y, w: f.w, h: f.h }
        // canvas windows use bottom-left origin
        const canvas = hs.canvas.create({ x: f.x, y: primaryH - f.y - f.h, w: f.w, h: f.h })
            .ignoreMouseEvents(true)
            .levelValue(level)
            .behavior("canJoinAllSpaces")
        return { canvas, frame }
    })
}

// event.location is top-left origin; elements are relative to their canvas
function canvasAt(list, p) {
    return list.find(({ frame: f }) => p.x >= f.x && p.x < f.x + f.w && p.y >= f.y && p.y < f.y + f.h)
}

function moveSpotlight(p) {
    const here = canvasAt(spotlights, p)
    for (const s of spotlights) {
        // the hole is parked off-canvas on the screens the mouse isn't on
        const center = s === here ? { x: p.x - s.frame.x, y: p.y - s.frame.y } : { x: -2 * SPOTLIGHT_RADIUS, y: 0 }
        s.canvas.setElementAttribute(1, "center", center)
    }
}

function toggleSpotlight() {
    if (spotlights.length) {
        spotlights.forEach(({ canvas }) => canvas.destroy())
        spotlights = []
        updateMouseTap()
        return
    }
    // below the annotation canvases, so drawings stay bright
    spotlights = overlays(hs.canvas.windowLevels.screenSaver - 1)
    for (const { canvas } of spotlights) {
        canvas.appendElements([
            { type: "rectangle", action: "build" },
            { type: "circle", action: "clip", center: { x: 0, y: 0 }, radius: SPOTLIGHT_RADIUS, reversePath: true },
            { type: "rectangle", action: "fill", fillColor: { alpha: 0.6 } },
            { type: "resetClip" },
        ]).show()
    }
    moveSpotlight(hs.mouse.absolutePosition())
    updateMouseTap()
}

// center a small canvas on the mouse
function moveTo(canvas, size, p) {
    const primaryH = hs.screen.primary().fullFrame.h
    canvas.setFrame({ x: p.x - size / 2, y: primaryH - p.y - size / 2 })
}

function toggleHighlight() {
    if (highlight) {
        highlight.destroy()
        highlight = null
    } else {
        highlight = hs.canvas.create({ x: 0, y: 0, w: HIGHLIGHT_SIZE, h: HIGHLIGHT_SIZE })
            .ignoreMouseEvents(true)
            .levelValue(hs.canvas.windowLevels.screenSaver + 1)
            .behavior("canJoinAllSpaces")
            .appendElements([{
                type: "circle", action: "stroke", radius: HIGHLIGHT_SIZE / 2 - 3, strokeWidth: 4,
                strokeColor: { blue: 1, green: 0.4, alpha: 0.9 },
            }])
        moveTo(highlight, HIGHLIGHT_SIZE, hs.mouse.absolutePosition())
        highlight.show()
    }
    updateMouseTap()
}

function followMouse(p) {
    if (spotlights.length) moveSpotlight(p)
    if (highlight) moveTo(highlight, HIGHLIGHT_SIZE, p)
    if (pen) moveTo(pen, PEN_SIZE, p)
}

// only listen to mouse moves while something follows the mouse
function updateMouseTap() {
    if (spotlights.length || highlight || pen) mouseTap.start()
    else mouseTap.stop()
}

const mouseTap = hs.eventtap.addWatcher([types.mouseMoved, types.leftMouseDragged], (event) => {
    followMouse(event.location)
}, true)

// the current tool's shape, in the current color, as a menu bar icon
const ICON_SIZE = 18
const ICON_POINTS = [{ x: 2, y: 15 }, { x: 6, y: 6 }, { x: 10, y: 12 }, { x: 16, y: 3 }]
function toolIcon() {
    const c = hs.canvas.create({ x: 0, y: 0, w: ICON_SIZE, h: ICON_SIZE })
        .appendElements([{ ...tool[1](ICON_POINTS), action: "stroke", strokeColor: color, strokeWidth: Math.min(width, 4) }])
    const image = c.imageFromCanvas()
    c.destroy()
    return image
}

function refresh(label) {
    pen.setElementAttribute(0, "strokeColor", { ...color, alpha: 0.9 })
    menu.setIcon(toolIcon())
    hs.ui.alert(label).show()
}

function setTool(t) {
    tool = t
    refresh(t[0])
}

function thicker(delta) {
    width = Math.max(1, Math.min(24, width + delta))
    refresh(`thickness ${width}`)
}

function setColor([name, c]) {
    color = c
    refresh(name)
}

// macOS gives no "menu closed" callback, so while the menu is open the tap passes every event through
let menuOpen = false
const menuItems = () => {
    menuOpen = true
    return menuEntries()
}
const menuEntries = () => [
    ...Object.entries(TOOLS).map(([key, t]) => ({ title: `${t[0]} (${key.toUpperCase()})`, checked: t === tool, fn: () => setTool(t) })),
    { title: "-" },
    ...COLORS.map((entry, i) => ({ title: `${entry[0]} (${i + 1})`, checked: entry[1] === color, fn: () => setColor(entry) })),
    { title: "-" },
    { title: `Thicker (+), now ${width}`, fn: () => thicker(2) },
    { title: "Thinner (-)", fn: () => thicker(-2) },
]

const tap = hs.eventtap.addWatcher([types.leftMouseDown, types.leftMouseDragged, types.leftMouseUp, types.rightMouseDown], (event) => {
    const p = event.location
    // let clicks on the menu bar through, so our menu can be opened
    const screen = canvasAt(canvases, p)
    const menuBarHeight = hs.screen.primary().frame.y - hs.screen.primary().fullFrame.y
    const inBar = screen && p.y - screen.frame.y < menuBarHeight
    if (menuOpen) {
        // clicking the menu bar again closes it; releasing anywhere below it chose an item or dismissed it
        if ((event.type === types.leftMouseDown && inBar) || (event.type === types.leftMouseUp && !inBar)) menuOpen = false
        return hs.eventtap.emit
    }
    if (inBar) return hs.eventtap.emit
    if (event.type === types.rightMouseDown) {
        // a hidden item pops its menu up at the mouse pointer; later, because the menu blocks while it is open
        menuOpen = true
        hs.timer.doAfter(0, () => popup && popup.popUpMenu(menuEntries()))
        return hs.eventtap.consume
    }
    // consumed drags never reach mouseTap
    if (event.type === types.leftMouseDragged) followMouse(p)
    if (event.type === types.leftMouseDown) {
        const c = canvasAt(canvases, p)
        if (c) {
            const points = [{ x: p.x - c.frame.x, y: p.y - c.frame.y }]
            current = { canvas: c.canvas, frame: c.frame, index: c.canvas.elementCount(), points }
        }
    } else if (event.type === types.leftMouseDragged && current) {
        // ponytail: free draw keeps every point and redraws the whole line per drag event; fine for sketches
        if (tool !== TOOLS.f) current.points.length = Math.min(current.points.length, 1)
        current.points.push({ x: p.x - current.frame.x, y: p.y - current.frame.y })
        const element = tool[1](current.points)
        current.canvas.assignElement({ ...element, action: "stroke", strokeColor: { ...color, alpha: 0.9 }, strokeWidth: width }, current.index)
    } else {
        current = null
    }
    return hs.eventtap.consume
}, false)

function stopDrawing() {
    tap.stop()
    modeKeys.forEach((k) => k.destroy())
    modeKeys = []
    canvases.forEach(({ canvas }) => canvas.destroy())
    canvases = []
    current = null
    pen.destroy()
    pen = null
    menu.destroy()
    popup.destroy()
    menu = popup = null
    menuOpen = false
    updateMouseTap()
}

function startDrawing() {
    canvases = overlays(hs.canvas.windowLevels.screenSaver)
    canvases.forEach(({ canvas }) => canvas.show())
    const m = PEN_SIZE / 2
    pen = hs.canvas.create({ x: 0, y: 0, w: PEN_SIZE, h: PEN_SIZE })
        .ignoreMouseEvents(true)
        .levelValue(hs.canvas.windowLevels.screenSaver + 1)
        .behavior("canJoinAllSpaces")
        .appendElements([{
            type: "segments", action: "stroke", strokeWidth: 2, strokeColor: { ...color, alpha: 0.9 },
            coordinates: [{ x: 0, y: m }, { x: PEN_SIZE, y: m }, { x: m, y: m }, { x: m, y: 0 }, { x: m, y: PEN_SIZE }],
        }])
    moveTo(pen, PEN_SIZE, hs.mouse.absolutePosition())
    pen.show()
    menu = hs.menubar.create()
    menu.setMenu(menuItems)
    popup = hs.menubar.create(true)
    menu.setIcon(toolIcon())
    // keys that only work while annotating
    modeKeys = [
        hs.hotkey.bind([], "escape", stopDrawing),
        ...Object.entries(TOOLS).map(([key, t]) => hs.hotkey.bind([], key, () => setTool(t))),
        ...COLORS.map((entry, i) => hs.hotkey.bind([], `${i + 1}`, () => setColor(entry))),
        // "+" is shift-"=" on most keyboards
        ...[[[], "="], [["shift"], "="], [[], "pad+"]].map(([mods, key]) => hs.hotkey.bind(mods, key, () => thicker(2))),
        ...["-", "pad-"].map((key) => hs.hotkey.bind([], key, () => thicker(-2))),
    ]
    tap.start()
    updateMouseTap()
}

module.exports = {
    // Actions for bindHotkeys(), e.g. hs.spoons.use("Presentify", { hotkeys: { draw: [["cmd", "shift"], "d"] } })
    bindings: {
        draw: { pressed: () => (canvases.length ? stopDrawing() : startDrawing()), message: "Toggle drawing on screen" },
        spotlight: { pressed: toggleSpotlight, message: "Toggle spotlight around the mouse" },
        highlight: { pressed: toggleHighlight, message: "Toggle highlight circle around the mouse" },
    },
    defaultHotkeys: {
        draw: [["ctrl"], "a"],
        spotlight: [["ctrl"], "s"],
        highlight: [["ctrl"], "l"],
    },

    bindHotkeys(mapping) {
        hotkeys.forEach(h => h.destroy())
        hotkeys = Object.entries(mapping).map(([action, [mods, key]]) => {
            const b = this.bindings[action]
            if (!b) throw new Error(`Presentify: unknown hotkey action '${action}'`)
            return hs.hotkey.bind(mods, key, b.pressed, b.released, b.repeat)
        }).filter(Boolean)
        return this
    },
    start() {
        hotkeys.forEach(h => h.enable())
        return this
    },
    stop() {
        if (canvases.length) stopDrawing()
        if (spotlights.length) toggleSpotlight()
        if (highlight) toggleHighlight()
        hotkeys.forEach(h => h.disable())
        return this
    },
}
