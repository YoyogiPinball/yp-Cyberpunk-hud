// Pane header for the "yp-cyberpunk" layout: a HUD-style strip with the program,
// folder, branch and the agent's status as a label. Hover shows the pane buttons.

import { View, div, svg } from "gpui-kit";
import { h_flex } from "gpui-base";
import { panes, props, run, theme, home } from "herdr";

function folder(cwd) {
  if (!cwd) return "";
  const h = home();
  return cwd === h ? "~" : cwd.startsWith(h + "/") ? "~" + cwd.slice(h.length) : cwd;
}

export default class CmdPane extends View {
  init() { this.hovered = false; }

  button(t, id, icon, command, args) {
    return div().id(id).p(3).text_color(t.dim)
      .hover((s) => s.bg(t.hover).text_color(t.foreground))
      .on_click((_e, cx) => { cx.stop_propagation(); run(command, args); })
      .child(svg(`mods/pane/${icon}.svg`).size(14));
  }

  render() {
    const t = theme();
    const p = panes().find((x) => x.pane === props()?.pane);
    if (!p) return div();
    const name = ((p.program?.agent || p.program?.shell) && p.program.name) || p.title || p.program?.name || "shell";
    const pane = p.pane;
    const st = p.status;
    const label = {
      working: { text: "◢ WORKING", fg: t.working },
      blocked: { text: "◢ NEEDS YOU", fg: t.blocked },
      done: { text: "◢ DONE", fg: t.done },
    }[st];
    return h_flex().id(`cmd-head-${pane}`).size_full().px(10).gap(10).items_center()
      .bg(t.surface).border_b(1).border_color(t.border).text_size(12)
      .on_hover((hovered, cx) => { this.hovered = hovered; cx.notify(); })
      .on_click(() => run("pane.focus", { pane }))
      .child(div().w(3).h(14).flex_none().bg(p.focused ? t.accent : t.dim))
      .when(p.focused, (el) => el.child(div().px(5).flex_none().bg(t.accent).text_color(t.accent_foreground).text_size(11).font_bold().child("FOCUS")))
      .child(h_flex().flex_1().min_w(0).gap(10).items_center().overflow_hidden()
        .child(div().flex_shrink_0().truncate().max_w(260).text_size(13.5).font_bold().text_color(p.focused ? t.foreground : t.muted).child(name.toUpperCase()))
        .child(div().min_w(0).truncate().text_color(t.dim).child(folder(p.cwd)))
        .when(Boolean(p.branch), (el) => el.child(div().min_w(0).truncate().max_w(160).text_color(t.ansi4).child(`⎇ ${p.branch}`))))
      .when(Boolean(label), (el) => el.child(div().flex_none().text_size(12).font_bold().text_color(label.fg).child(label.text)))
      .when(this.hovered, (el) => el
        .child(this.button(t, `ch-r-${pane}`, "split-right", "pane.split", { direction: "right", pane }))
        .child(this.button(t, `ch-d-${pane}`, "split-down", "pane.split", { direction: "down", pane }))
        .child(this.button(t, `ch-z-${pane}`, p.zoomed ? "unzoom" : "zoom", "pane.zoom", { pane }))
        .child(this.button(t, `ch-x-${pane}`, "close", "pane.close", { pane })));
  }
}
