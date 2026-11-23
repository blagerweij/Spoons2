//
// Alternative for Apple Spotlight: apps + recent IntelliJ projects
//
const cah = ["cmd", "alt", "ctrl"]
const home = hs.fs.homeDirectory()
const reloadApplication = { text: "Reload applications", uuid: "reload" }

function buildApplicationChoices(apps, directory) {
    for (const name of hs.fs.list(directory) ?? []) {
        const path = `${directory}/${name}`
        if (name.endsWith(".app")) {
            apps.push({ text: name.slice(0, -4), uuid: path, image: HSImage.iconForFile(path) })
        } else if (hs.fs.isDirectory(path) && !hs.fs.isSymlink(path)) {
            buildApplicationChoices(apps, path)
        }
    }
}

function findIntellijProjects(apps) {
    // pick the newest IntelliJIdeaXXXX.X config dir instead of reading the app version
    const base = `${home}/Library/Application Support/JetBrains`
    const dir = (hs.fs.list(base) ?? []).filter(d => /^intellijidea/i.test(d)).pop()
    const file = dir && `${base}/${dir}/options/recentProjects.xml`
    if (!file || !hs.fs.exists(file)) return
    const image = HSImage.fromAppBundle("com.jetbrains.intellij")
    for (const [, key] of hs.fs.read(file).matchAll(/entry key="([^"]*)"/g)) {
        const path = key.replace("$USER_HOME$", home)
        apps.push({ text: path.split("/").pop(), uuid: path, idea: true, image })
    }
}

function initializeApplicationChoices() {
    const choices = [{
        text: "Finder",
        uuid: "/System/Library/CoreServices/Finder.app",
        image: HSImage.fromAppBundle("com.apple.finder"),
    }]
    buildApplicationChoices(choices, "/Applications")
    buildApplicationChoices(choices, "/System/Applications")
    findIntellijProjects(choices)
    choices.reverse()
    choices.push(reloadApplication)
    return choices
}

const chooseApplication = hs.chooser.create()
chooseApplication.placeholder = "Search apps"
chooseApplication.visibleRows = 10
chooseApplication.onSelect = (result) => {
    if (!result) return
    if (result.uuid === reloadApplication.uuid) {
        chooseApplication.setChoices(initializeApplicationChoices())
    } else if (result.idea) {
        const exe = hs.application.pathForBundleID("com.jetbrains.intellij")
        hs.task.runAsync(`${exe}/Contents/MacOS/idea`, [result.uuid])
    } else {
        hs.task.runAsync("/usr/bin/open", [result.uuid])
    }
}

let hotkeys = []

module.exports = {
    // Actions for bindHotkeys(), e.g. hs.spoons.use("Spotlight", { hotkeys: { show: [["cmd"], "space"] } })
    bindings: {
        show: { pressed: () => chooseApplication.show(), message: "Search apps and IntelliJ projects" },
    },
    defaultHotkeys: {
        show: [cah, "space"],
    },

    bindHotkeys(mapping) {
        hotkeys.forEach(h => h.destroy())
        hotkeys = Object.entries(mapping).map(([action, [mods, key]]) => {
            const b = this.bindings[action]
            if (!b) throw new Error(`Spotlight: unknown hotkey action '${action}'`)
            return hs.hotkey.bind(mods, key, b.pressed, b.released, b.repeat)
        }).filter(Boolean)
        return this
    },
    start() {
        chooseApplication.setChoices(initializeApplicationChoices())
        hotkeys.forEach(h => h.enable())
        return this
    },
    stop() {
        hotkeys.forEach(h => h.disable())
        chooseApplication.hide()
        return this
    },
}
