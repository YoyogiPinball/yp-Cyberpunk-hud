// Agent monitor for the "yp-cyberpunk" layout: every agent as a card, most urgent
// first (blocked > done > working > idle), with its space, title and how long
// it has been in that state. Sub-agents without a pane (started with `hc run`)
// get cards too. Click a card to jump to its pane, or peek a sub-agent.

import { View, div, svg, image } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { agents, terminals, spaces, run, theme, setAgentOrder } from "herdr";

const RANK = { blocked: 3, done: 2, working: 1, idle: 0 };

// The program's icon from the app's program table: a one-color glyph or a picture.
function icon(p, size, color) {
  if (!p?.icon) return null;
  return p.tint ? svg(p.icon).size(size).flex_none().text_color(color) : image(p.icon).w(size).h(size).flex_none();
}

// When the state changed, as a clock time: "HH:MM" today, "M/D HH:MM" before.
function stamp(ms) {
  if (!ms) return "";
  const d = new Date(ms);
  const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return d.toDateString() === new Date().toDateString() ? hm : `${d.getMonth() + 1}/${d.getDate()} ${hm}`;
}

// A sub-agent reports a raw word: error counts as blocked, and its done is its
// parent's news, so it shows as idle.
function kidStatus(s) {
  return s === "error" ? "blocked" : s === "done" ? "idle" : RANK[s] === undefined ? "idle" : s;
}

export default class CmdMonitor extends View {
  init(_props, cx) {
    // Each terminal's last state and when it changed (ms), kept across restarts.
    this.changed = JSON.parse(localStorage.getItem("changed") ?? "{}");
    // Titles agents have had, per space, newest first: { space, title, at }.
    this.history = JSON.parse(localStorage.getItem("history") ?? "[]");
    this.seen = new Set();
    cx.timer.every(30000, (cx) => cx.notify());
  }

  // Keep each new title once per space, with when it first showed up. Titles
  // that only name the program or the space say nothing about the work.
  record(list) {
    const now = Date.now();
    let dirty = false;
    for (const a of list) {
      const title = (a.title ?? "").trim();
      const plain = [a.program?.name, a.program?.key, a.space_name].map((s) => (s ?? "").toLowerCase());
      if (!title || plain.includes(title.toLowerCase())) continue;
      // `seen` also covers titles already cut by the cap, so they aren't added again.
      const key = `${a.space}\t${title}`;
      if (this.seen.has(key)) continue;
      this.seen.add(key);
      if (this.history.some((h) => h.space === a.space && h.title === title)) continue;
      this.history.unshift({ space: a.space, title, at: now });
      dirty = true;
    }
    const kept = this.history.filter((h) => now - h.at < 90 * 86400000).slice(0, 300);
    if (!dirty && kept.length === this.history.length) return;
    this.history = kept;
    localStorage.setItem("history", JSON.stringify(this.history));
  }

  track(items) {
    const now = Date.now();
    let dirty = false;
    for (const it of items) {
      // Done and idle count as one: looking at a finished agent turns done into idle.
      const s = it.status === "done" ? "idle" : it.status;
      if (this.changed[it.address]?.s === s) continue;
      this.changed[it.address] = { s, at: now };
      dirty = true;
    }
    if (!dirty) return;
    const listed = new Set(items.map((it) => it.address));
    for (const [k, c] of Object.entries(this.changed)) if (!listed.has(k) && now - c.at > 30 * 86400000) delete this.changed[k];
    localStorage.setItem("changed", JSON.stringify(this.changed));
  }

  render() {
    const t = theme();
    const list = agents();
    const listed = new Set(list.map((a) => a.address));
    const byAddr = new Map(list.map((a) => [a.address, a]));
    const items = list.map((a) => ({
      address: a.address, status: a.status, focused: a.focused, seq: a.seq, program: a.program,
      where: `${a.space_name} · ${a.tab_name || a.tab_index}`,
      detail: a.title || a.program?.name || a.address,
      open: () => run("pane.focus", { pane: a.pane }),
    }));
    for (const k of terminals()) {
      if (k.state !== "live" || !k.parent || listed.has(k.address)) continue;
      const parent = byAddr.get(k.parent);
      items.push({
        address: k.address, status: kidStatus(k.status), focused: false, seq: parent?.seq ?? 0, program: k.program,
        where: `↳ ${parent ? parent.space_name : k.parent} · ${k.name || k.template || k.program?.name || k.address}`,
        detail: k.program?.name || k.address,
        open: () => run("terminal.peek", { terminal: k.address }),
      });
    }
    this.track(items);
    items.sort((x, y) => (RANK[y.status] ?? 0) - (RANK[x.status] ?? 0) || y.seq - x.seq);
    setAgentOrder(items.filter((it) => listed.has(it.address)).map((it) => it.address));

    const color = (status) => (status === "working" || status === "blocked" || status === "done" ? t[status] : t.dim);
    // Fixed width so the space names line up whatever the word's length.
    const badge = (status) => {
      const word = { working: "◢ WORKING", blocked: "◢ NEEDS YOU", done: "◢ DONE" }[status] ?? "◇ IDLE";
      const base = div().w(88).flex_none().flex().justify_center().text_size(11).font_bold().border(1).border_color(color(status));
      return status === "working" || status === "blocked"
        ? base.bg(color(status)).text_color(t.background).child(word)
        : base.text_color(color(status)).child(word);
    };

    const card = (it) => h_flex().id(`mon-${it.address}`).flex_none().items_stretch()
      .bg(it.focused ? t.selected : t.background)
      .border(1).border_color(it.focused ? t.accent : it.status === "blocked" ? t.blocked : t.border)
      .hover((s) => s.bg(t.hover))
      .on_click(it.open)
      .child(div().w(3).flex_none().bg(color(it.status)))
      .child(v_flex().flex_1().min_w(0).gap(4).py(8).px(10)
        .child(h_flex().gap(8).items_center()
          .child(badge(it.status))
          .when(Boolean(it.program?.icon), (el) => el.child(icon(it.program, 16, t.foreground)))
          .child(div().flex_1().min_w(0).truncate().text_size(12.5).font_bold().text_color(t.foreground).child(it.where.toUpperCase()))
          .child(div().flex_none().text_size(11.5).font_semibold().text_color(t.dim).child(stamp(this.changed[it.address]?.at))))
        .child(h_flex().gap(6).min_w(0)
          .child(div().flex_none().text_size(12).text_color(t.dim).child("//"))
          .child(div().flex_1().min_w(0).truncate().text_size(12).text_color(t.muted).child(it.detail))));

    this.record(list);
    const space = spaces().find((s) => s.active);
    const past = this.history.filter((h) => h.space === space?.id);
    const entry = (h, i) => h_flex().id(`hist-${i}`).flex_none().gap(8).min_w(0).py(2).items_center()
      .child(div().w(76).flex_none().text_size(11.5).font_semibold().text_color(t.dim).child(stamp(h.at)))
      .child(div().flex_none().text_size(12).text_color(t.dim).child("//"))
      .child(div().flex_1().min_w(0).truncate().text_size(12).text_color(t.muted).child(h.title));

    const blocked = items.filter((it) => it.status === "blocked").length;
    return v_flex().size_full().min_h(0).gap(8)
      .child(h_flex().flex_none().gap(8).px(2).pt(2).items_center()
        .child(div().text_size(14).font_bold().text_color(t.accent).child("AGENT MONITOR"))
        .child(div().flex_1().h(1).bg(t.border))
        .child(div().text_size(11).text_color(t.dim).child(`${items.length} LIVE`)))
      .when(blocked > 0, (el) => el.child(div().flex_none().px(2).text_size(12).font_semibold().text_color(t.blocked).child(`${blocked} NEEDS YOU`)))
      .child(v_flex().id("mon-list").flex_1().min_h(0).gap(6).overflow_y_scrollbar().children(items.map(card))
        .when(items.length === 0, (el) => el.child(div().p(8).text_size(12).text_color(t.dim).child("NO AGENTS"))))
      .child(h_flex().flex_none().gap(8).px(2).pt(4).items_center()
        .child(div().flex_none().max_w(240).truncate().text_size(14).font_bold().text_color(t.ansi2).child(`HISTORY // ${(space?.name ?? "").toUpperCase()}`))
        .child(div().flex_1().h(1).bg(t.border)))
      .child(v_flex().id("mon-history").flex_none().h(200).px(2).overflow_y_scrollbar().children(past.map(entry))
        .when(past.length === 0, (el) => el.child(div().py(2).text_size(12).text_color(t.dim).child("NO RECORDS YET"))));
  }
}
