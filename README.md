# Spoons2

Spoons for [Hammerspoon 2](https://github.com/Hammerspoon/Hammerspoon2). Each `*.spoon2` folder is one Spoon.

```js
// default hotkeys
hs.spoons.use("WindowManagement", { source: "blagerweij/Spoons2", hotkeys: "default", start: true })

// your own hotkeys: map action names (see table) to [modifiers, key]; unmapped actions stay unbound
hs.spoons.use("WindowManagement", {
    source: "blagerweij/Spoons2",
    hotkeys: { maximize: [["cmd", "alt"], "up"], left: [["cmd", "alt"], "left"] },
    start: true,
})
```

Each Spoon lists its actions in `bindings` (`pressed`, optional `released` / `repeat`, and a `message` describing it)
and its default keys in `defaultHotkeys`. `start()` / `stop()` enable / disable the hotkeys.

`cah` below is `ctrl⌥⌘`.

| Spoon | Actions (default key) | Settings (`config`) |
|-------|-----------------------|---------------------|
| WindowManagement | `maximize` (`⌥⌘ Return`), `left` (`cah Left`), `right` (`cah Right`) | |
| ScreenManagement | `next` (`cah Up`), `previous` (`cah Down`): move window to another screen | |
| TerminalSwitch | `toggle` (`⌥ Space`): terminal / previous app | `terminalApp` (bundle ID) |
| Spotlight | `show` (`cah Space`): app / IntelliJ project launcher | |
| Mouse | `show` (`ctrl-alt-cmd-M`): shows the mouse pointer (ping rings to 8.8.8.8) | |
| TimeMachine | none; excludes caches and build folders from Time Machine on start | `rootDir`, `excludeDirs` |
| Zoom | `meetings` (`cah Z`): join from Outlook, `share` (`⇧⌘ S`): start Zoom share | `meetings`, `microsoft` (see `init.js`) |
| Calendar | `meetings` (`cah X`): join from macOS Calendar | `meetings` |
| Mute | `toggle` (`ctrl⌥ Space`), `toggleAlt` (`F20`): microphone mute (also Zoom / Teams) | |
| Spotify | `playpause` (`cah P`) | |
| Reminder | `add` (`cah R`): new reminder | |
| Presentify | `draw` (`ctrl A`), `spotlight` (`ctrl S`), `highlight` (`ctrl L`) | |
| Slack | `switchChannel` (`cah K`) | |
| Clipboard | `show` (`cah V`): pick one of the last 10 copies (text / image) and paste it | `maxItems`, `maxAgeHours`, `thumbnailSize`, `chooserWidth`, `placeholder`, `skipTypes`, `secretTypes`, `passwordManagerExtensions` |

Presentify's drawing keys (`Esc`, `F` `L` `R` `O`, `1`-`6`, `+` `-`) only exist while drawing and are fixed.
