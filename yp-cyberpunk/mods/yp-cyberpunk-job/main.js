// "Current job" card for the "yp-cyberpunk" layout: the focused terminal's folder
// and branch. Model, context use, diff and cost stay in Claude Code's own
// status line.

import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { focused, panes, theme } from "herdr";

export default class CmdJob extends View {
  init(_props, cx) {
    // Focus changes: redraw for the newly focused terminal.
    this.id = null;
    cx.spawn(async (cx) => {
      for (;;) {
        const id = focused()?.terminal ?? null;
        if (id !== this.id) { this.id = id; cx.notify(); }
        await cx.sleep(500);
      }
    });
  }

  render() {
    const t = theme();
    const f = focused();
    const pane = panes().find((p) => p.pane === f?.pane);
    const project = (f?.cwd ?? "").split("/").pop() || "—";
    const branch = pane?.branch;
    const row = (name, value) => h_flex().h(24).items_center()
      .child(div().w(44).flex_none().text_size(12).font_bold().text_color(t.dim).child(name))
      .child(value);
    const val = (text, color) => div().min_w(0).truncate().text_size(13.5).font_bold().text_color(color ?? t.foreground).child(text);

    return v_flex().size_full().p(12).gap(0).bg(t.background).border_1().border_color(t.border)
      .child(h_flex().items_center()
        .child(div().text_size(12).font_bold().text_color(t.ansi2).child("CURRENT JOB"))
        .child(div().flex_1()))
      .child(div().pb(6).truncate().text_size(20).font_bold().text_color(t.foreground).child(project.toUpperCase()))
      .when(Boolean(branch), (el) => el.child(row("GIT", val(branch, t.ansi2))));
  }
}
