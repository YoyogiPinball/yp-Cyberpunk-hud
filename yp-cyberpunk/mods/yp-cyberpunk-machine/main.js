// Machine name for the bottom right of the "yp-cyberpunk" layout: the machine the
// active space runs on, or this computer's name for a local space.

import { View, div } from "gpui-kit";
import { h_flex } from "gpui-base";
import { spaces, theme, exec } from "herdr";

// Shown as reported. Map long hostnames to short labels here if you like,
// e.g. (host) => (/^my-laptop/i.test(host) ? "LAPTOP" : host).
const short = (host) => host;

export default class CmdMachine extends View {
  init(_props, cx) {
    this.local = "";
    cx.spawn(async (cx) => {
      const r = await exec("hostname", []).catch(() => null);
      this.local = short((r?.stdout ?? "").trim());
      cx.notify();
    });
  }

  render() {
    const t = theme();
    const space = spaces().find((s) => s.active);
    const name = space?.machine ? short(space.machine) : this.local;
    return h_flex().size_full().justify_end().items_center()
      .when(Boolean(name), (el) => el.child(div().px(10).py(2).bg(t.accent).text_color(t.accent_foreground).text_size(13).font_bold().child(name.toUpperCase())));
  }
}
