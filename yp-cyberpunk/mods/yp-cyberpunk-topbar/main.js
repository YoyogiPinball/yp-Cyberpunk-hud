// Top bar for the "yp-cyberpunk" layout: brand, spaces as tabs, the shown space's
// tabs, the Files/Changes panel toggles and the window buttons.

import { View, div, svg } from "gpui-kit";
import { h_flex } from "gpui-base";
import { spaces, run, openOverlay, theme, window, layout, shared } from "herdr";

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

export default class CmdTopbar extends View {
  render() {
    const t = theme();
    const all = spaces();
    const space = all.find((s) => s.active);
    const stop = (_e, cx) => cx.stop_propagation();
    const dot = (status) => status === "working" || status === "blocked" || status === "done"
      ? div().size(6).flex_none().bg(t[status]) : null;

    const spaceItem = (s) => h_flex().id(`sp-${s.id}`).h_full().px(12).gap(6).min_w(0).flex_shrink_1().items_center()
      .text_size(13.5).font_semibold()
      .bg(s.active ? t.selected : t.chrome).text_color(s.active ? t.foreground : t.muted)
      .border_b(2).border_color(s.active ? t.accent : t.chrome)
      .hover((st) => st.bg(t.hover).text_color(t.foreground))
      .on_mouse_down("left", stop)
      .on_click(() => run("space.select", { id: s.id }))
      .on_mouse_down("right", (_e, cx) => { cx.stop_propagation(); openOverlay({ mod: "menu", kind: "popup", width: 200, props: { tab: "space", target: { id: s.id } } }); })
      .child(div().min_w(0).max_w(160).truncate().child(s.name.toUpperCase()))
      .when(Boolean(dot(s.status)), (el) => el.child(dot(s.status)));

    const tabs = space?.tabs ?? [];
    const tabItem = (c) => h_flex().id(`tb-${c.id}`).h(24).px(8).gap(5).flex_none().items_center()
      .text_size(12).font_semibold()
      .border(1).border_color(c.active ? t.accent : t.border)
      .text_color(c.active ? t.foreground : t.muted)
      .hover((st) => st.bg(t.hover))
      .on_mouse_down("left", (e, cx) => { cx.stop_propagation(); if (e.click_count === 2) run("tab.rename", { id: c.id }); })
      .on_click(() => run("tab.select", { id: c.id }))
      .on_mouse_down("right", (_e, cx) => { cx.stop_propagation(); openOverlay({ mod: "menu", kind: "popup", width: 200, props: { tab: "tab", target: { id: c.id, space: space.id } } }); })
      .child(div().text_color(c.active ? t.accent : t.dim).child(String(c.index).padStart(2, "0")))
      .when(c.named, (el) => el.child(div().max_w(120).truncate().child(c.name)))
      .when(Boolean(dot(c.status)), (el) => el.child(dot(c.status)));

    const button = (id, label, action) => div().id(id).size(26).flex_none().flex().items_center().justify_center()
      .text_color(t.dim).hover((s) => s.bg(t.hover).text_color(t.foreground))
      .on_mouse_down("left", stop).on_click(action).child(label);

    const root = layout(), panel = find(root, "panel"), body = find(root, "panel-body");
    const enabled = shared("workspace.panels") ?? ["files", "changes"];
    const panelButton = (id, label) => {
      const on = panel && !panel.hidden && body?.active === id;
      return div().id(`panel-${id}`).h(26).px(8).flex_none().flex().items_center()
        .text_size(12.5).font_semibold()
        .bg(on ? t.selected : t.chrome).text_color(on ? t.foreground : t.muted)
        .hover((s) => s.bg(t.hover)).on_mouse_down("left", stop)
        .on_click(() => {
          if (on) run("layout.hide", { id: "panel" });
          else { run("layout.select", { stack: "panel-body", child: id }); run("layout.show", { id: "panel" }); }
        }).child(label);
    };
    const w = window();

    return h_flex().size_full().min_w(0).gap(0).items_center().bg(t.chrome).border_b(1).border_color(t.border)
      .on_scroll_wheel((e) => { if (Math.abs(e.delta.y) >= 1) run(e.delta.y > 0 ? "space.next" : "space.prev"); })
      .child(h_flex().h_full().px(14).gap(8).flex_none().items_center()
        .child(div().w(4).h(20).bg(t.accent))
        .child(div().text_size(18).font_bold().text_color(t.accent).child("HERDR")))
      .child(div().w(1).h(20).bg(t.border).flex_none())
      .child(h_flex().h_full().min_w(0).flex_shrink_1().items_center().overflow_hidden().children(all.map(spaceItem)))
      .child(div().w(1).h(20).mx(8).bg(t.border).flex_none())
      .child(h_flex().id("tab-scroll").flex_1().min_w(120).h_full().gap(4).items_center().overflow_x_scrollbar().children(tabs.map(tabItem))
        .child(button("tab-new", "+", () => openOverlay({ mod: "new-menu", kind: "popup", width: 250, height: 512 }))))
      .child(h_flex().h_full().px(8).gap(4).flex_none().items_center()
        .when(enabled.includes("files"), (el) => el.child(panelButton("files", "FILES")))
        .when(enabled.includes("changes"), (el) => el.child(panelButton("changes", "CHANGES")))
        .when(Boolean(w?.buttons), (el) => el
          .child(div().w(1).h(16).mx(4).bg(t.border))
          .child(button("minimize", "−", () => run("window.minimize")))
          .child(button("maximize", "□", () => run("window.maximize")))
          .child(button("close-window", svg("mods/pane/close.svg").size(13), () => run("window.close")))));
  }
}
