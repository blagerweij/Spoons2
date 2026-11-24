// Pick a Zoom/Teams meeting (default Ctrl-Alt-Cmd + X) from the macOS Calendar (hs.eventkit),
// covering meetings in progress or starting within the next 15 minutes,
// plus the fixed meetings in the `meetings` setting.
// NOTE: requires hs.eventkit support !!!

const cah = ["cmd", "alt", "ctrl"]
const WINDOW_MS = 15 * 60 * 1000
const TEAMS = "com.microsoft.teams2"
const ZOOM = "us.zoom.xos"

function openMeeting(m) {
    if (!m) return
    if (m.id) {
        const pwd = m.pwd ? `&pwd=${m.pwd}` : ""
        hs.urlevent.openURLWithBundle(`zoommtg://zoom.us/join?confno=${m.id}${pwd}&zc=0`, ZOOM)
    } else if (m.joinUrl) {
        hs.urlevent.openURL(m.joinUrl)
    } else if (m.teamsUrl) {
        hs.urlevent.openURLWithBundle(m.teamsUrl, TEAMS)
        hs.pasteboard.writeString(m.teamsUrl)
    }
}

// event -> chooser entry, or null when it holds no Zoom/Teams link
function toChoice(e) {
    const text = `${e.title} (${e.startDate.toTimeString().slice(0, 5)})`
    const all = [e.location, e.url, e.notes].filter(Boolean).join(" ")
    const j = all.match(/https:\/\/[\w.-]*zoom\.us\/j\/(\d+)(?:\?pwd=([^&#\s<>"]+))?/)
    if (j) return { id: j[1], pwd: j[2], text, image: HSImage.fromAppBundle(ZOOM) }
    const my = all.match(/https:\/\/[\w.-]*zoom\.us\/my\/[^\s<>"]+/)
    if (my) return { joinUrl: my[0], text, image: HSImage.fromAppBundle(ZOOM) }
    const t = all.match(/https:\/\/teams\.(?:microsoft|live)\.com\/(?:l\/meetup-join|meet)\/[^\s<>"]+/)
    if (t) return { teamsUrl: t[0], text, image: HSImage.fromAppBundle(TEAMS) }
    return null
}

const chooser = hs.chooser.create()
chooser.placeholder = "Select meeting"
chooser.onSelect = openMeeting

function showMeetings() {
    const now = new Date()
    const events = hs.eventkit.events(now, new Date(now.getTime() + WINDOW_MS))
    const choices = events.filter(e => !e.allDay).map(toChoice).filter(Boolean)
    chooser.setChoices([...choices, ...spoon.meetings]).show()
}

function pickMeeting() {
    if (hs.eventkit.hasAccess()) return showMeetings()
    hs.eventkit.requestAccess().then(granted => {
        if (granted) showMeetings()
        else hs.ui.alert("No calendar access for Hammerspoon").show()
    })
}

const spoon = module.exports = {
    // fixed meetings, e.g. { text: "My Meeting", id: "123456789", pwd: "secret" }
    meetings: [],

    // Hotkey actions, bound by Hammerspoon, e.g. hs.spoons.use("Calendar", { hotkeys: { meetings: [["cmd", "alt"], "m"] } })
    bindings: {
        meetings: { pressed: pickMeeting, message: "Pick a Zoom/Teams meeting from the calendar" },
    },
    defaultHotkeys: {
        meetings: [cah, "x"],
    },

    start() {
        return this
    },
    stop() {
        chooser.hide()
        return this
    },
}
