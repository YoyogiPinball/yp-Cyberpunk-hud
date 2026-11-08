# yp-cyberpunk

A dark HUD-style window for running several AI agents at once. Terminals fill the left, each with a header strip that says what the agent is doing; the right column shows the current project, a monitor card for every agent (the ones waiting on you first) and the machine name. Colors come from the active theme; it was made for the `cyberpunk-hud` theme in this repo.

## What you see

Top to bottom, left to right:

- Window background: a 165° gradient from `#241a24` to `#14141c`. No title bar; terminal padding 14px × 12px.
- Top bar, 42px, draggable (`yp-cyberpunk-topbar`), on `chrome` with a 1px `border` line under it:
  - A 4×20px `accent` bar and "HERDR" in 18px bold `accent`.
  - Spaces as tabs, uppercased, 13.5px semibold, max 160px each. The active one is on `selected` with a 2px `accent` underline; a 6px square in the space's status color when it is working, blocked or done.
  - The active space's tabs as 24px outlined chips: a two-digit index (`01`) in `accent` when active, the tab name if it has one, a status square; then a `+` button.
  - `FILES` and `CHANGES` toggles on the right, then minimize / maximize / close when the window has its own buttons.
- Body, 8px padding and 8px gaps, three columns:
  - Terminals (`main`): panes with 8px gaps, square corners, a 1px `border` outline that turns `accent` on focus. Each pane has a 32px header (`yp-cyberpunk-pane`) on `surface`: a 3×14px bar (`accent` when focused, else `dim`), a `FOCUS` tag on `accent` for the focused pane, the program name uppercased 13.5px bold, the folder with `~` for home, `⎇ branch` in `ansi4`, and on the right the status label: `◢ WORKING` in `working`, `◢ NEEDS YOU` in `blocked`, `◢ DONE` in `done`.
  - Panel (`panel`), hidden at start, 368px (280–900): a stack of the shipped `files` and `changes` mods.
  - Side column, 360px (240–640), 10px gaps:
    - Current job, 160px (`yp-cyberpunk-job`): "CURRENT JOB" in 12px bold `ansi2`, the project folder name uppercased 20px bold, and a `GIT` row with the branch in `ansi2`.
    - Agent monitor, fills the rest (`yp-cyberpunk-monitor`): "AGENT MONITOR" in 14px bold `accent`, a rule, and "N LIVE". A red "N NEEDS YOU" line when any agent is blocked. Then one card per agent and a 200px "HISTORY // SPACE" list of past agent titles.
    - Machine, 26px (`yp-cyberpunk-machine`): the machine name uppercased on an `accent` block, right-aligned.

## How it behaves

- Agent status colors: working is `working` (yellow), blocked is `blocked` (red), done is `done` (cyan), idle is `dim`. Only the monitor shows idle (`◇ IDLE`); pane headers show no label for an idle agent.
- Monitor cards: sorted blocked > done > working > idle, then newest first. Each card has a 3px status-colored left edge, an 88px badge (filled for working and blocked, outlined otherwise), the program icon, "SPACE · TAB" uppercased, and the time the state last changed (`HH:MM` today, `M/D HH:MM` before). The second line is `// ` and the agent's title. Blocked cards get a `blocked` border, the focused one an `accent` border on `selected`. Click a card to focus its pane. Sub-agents started with `hc run` get a card too (`↳ parent space · name`); clicking peeks at them. Card order also drives `agent.next` / `agent.prev`.
- History: each new agent title is kept once per space with its time, newest first, up to 300 entries and 90 days. Titles that only repeat the program or space name are skipped.
- Top bar: click a space or tab to select it; right-click opens the shipped `menu` popup; double-click a tab to rename it; scroll the wheel over the bar to move between spaces. `+` opens the shipped `new-menu`. `FILES` / `CHANGES` show the panel on that view, or hide it when it is already showing.
- Pane header: hover shows split right, split down, zoom and close buttons; click focuses the pane.
- Current job follows the focused terminal (checked every 0.5s).

## Built from

- Layout `yp-cyberpunk.json`: `root` column (gradient background, `titlebar: none`) → `topbar` block 42px (`yp-cyberpunk-topbar`) → `work-body` row → `main` block (`tab: active`, pane header `yp-cyberpunk-pane` 32px, `reveal: always`), `panel` column (hidden, stack `panel-body` with `files` and `changes`), `side` column (`job` 160px `yp-cyberpunk-job`, `monitor` `yp-cyberpunk-monitor`, `machine` 26px `yp-cyberpunk-machine`). `yp-cyberpunk.svg` is the layout's picker icon.
- Mods, all `place: none`: `yp-cyberpunk-topbar`, `yp-cyberpunk-pane` (gets `props().pane`), `yp-cyberpunk-job`, `yp-cyberpunk-monitor`, `yp-cyberpunk-machine`.
- Shipped mods used: `files`, `changes`, `menu`, `new-menu`, and the icons in `mods/pane/`.
- herdr calls: `spaces`, `panes`, `agents`, `terminals`, `focused`, `layout`, `shared("workspace.panels")`, `window`, `theme`, `home`, `setAgentOrder`, `openOverlay`, and `run` with `space.select`, `space.next`, `space.prev`, `tab.select`, `tab.rename`, `pane.focus`, `pane.split`, `pane.zoom`, `pane.close`, `terminal.peek`, `layout.show`, `layout.hide`, `layout.select`, `window.minimize`, `window.maximize`, `window.close`.
- Programs: `yp-cyberpunk-machine` runs `hostname` once; it shows the active space's `machine` when there is one and the local hostname otherwise. Nothing reaches the network.
- Storage: `yp-cyberpunk-monitor` uses `localStorage` keys `changed` (state times; entries for agents gone for 30 days are dropped the next time any state changes) and `history`.

## Watch out

- The look depends on the theme's `working`, `blocked`, `done`, `accent`, `chrome`, `surface`, `selected`, `ansi2` and `ansi4`. Other themes work but lose the HUD look.
- `yp-cyberpunk-machine` shows the raw hostname; edit `short()` to map long names to short labels.
- The pane header buttons load icons from the shipped `pane` mod. If that mod is renamed or removed, the buttons render empty.
- The monitor's state times start when the mod first sees an agent, so after installing, every agent shows the install time.

## Done when

- `herdr-app check` passes for each of the 5 mods.
- `layout.switch` with `yp-cyberpunk` shows the top bar, terminals and the right column.
- Starting an agent shows a card in the monitor and a `◢ WORKING` label on its pane; when it waits for you, the card moves to the top with `◢ NEEDS YOU`.
- `FILES` opens the panel and clicking it again hides it.
