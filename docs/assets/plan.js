// Draws a suggested architecture as an architectural floor plan.
//
// Zones are rooms, ordered by trust from the entrance side. Wall thickness shows
// how restricted a zone is. Doors are the points where policy is enforced. The
// admin path is a service corridor, the foundations run underneath, and the
// recovery vault stands apart, reachable one way only.
//
// The plan is laid out for the width it will be shown at, one unit to one CSS
// pixel, so its labels always print at their true size. A wide frame gets the
// landscape sheet, with the rooms side by side; a narrow one gets the portrait
// sheet, with the rooms stacked from the entrance down. Both are computed in
// logical coordinates, where "start" is the entrance side, and mirrored for
// Arabic so that the plan reads right to left.
// Pure functions: they return geometry and SVG strings, and never touch the DOM.

// The landscape sheet is drawn at least this wide, which fits four rooms side by side,
// and is used down to the frame width where it still prints its labels at 13px or more.
export const LANDSCAPE_DRAW = 1240;
export const LANDSCAPE_MIN = 1160;
export const PRINT_WIDTH = 1280;
const FS = 14; // label size
const LH = 18; // label line height
const RS = 15; // room and zone name size
const RLH = 20;
const MIN_BOX = 150; // the narrowest box a 14px label is set in
const GAP = 10;
const FACTOR = { en: 0.56, ar: 0.6 }; // average advance of a character, in ems, measured in the site fonts
const WALL = { 1: 'w1', 2: 'w2', 3: 'w3', 4: 'w4' };

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function wrap(text, width, size, factor = FACTOR.en) {
  const max = Math.max(6, Math.floor(width / (size * factor)));
  const lines = [];
  let line = '';
  const put = (piece, glued) => {
    const joined = line ? line + (glued ? '' : ' ') + piece : piece;
    if (!line || joined.length <= max) line = joined;
    else {
      lines.push(line);
      line = piece;
    }
  };
  for (const word of String(text).split(/\s+/)) {
    // A word too long for the line breaks after its hyphens, as in print.
    const pieces = word.length > max && word.includes('-') ? word.split(/(?<=-)/) : [word];
    pieces.forEach((piece, i) => put(piece, i > 0));
  }
  if (line) lines.push(line);
  return lines;
}

// Boxes of one row share a height, so a band of fixtures reads as one course.
function grid(items, x0, width, y0, cols, f) {
  const perRow = Math.max(1, cols);
  const bw = (width - GAP * (perRow - 1)) / perRow;
  const rows = [];
  items.forEach((item, i) => {
    const r = Math.floor(i / perRow);
    (rows[r] ||= []).push({ item, col: i % perRow, lines: wrap(item.text, bw - 16, FS, f) });
  });
  let y = y0;
  const boxes = [];
  for (const row of rows) {
    const h = Math.max(...row.map((c) => c.lines.length)) * LH + 14;
    for (const c of row) boxes.push({ ...c.item, x: x0 + c.col * (bw + GAP), y, w: bw, h, lines: c.lines });
    y += h + GAP;
  }
  return { boxes, bottom: rows.length ? y - GAP : y0, bw };
}

// The layout: every room, door, label and box with its position, for the drawing and the tests.
export function layoutPlan(plan, lang, ui, width = PRINT_WIDTH) {
  const W = Math.round(clamp(width, 300, 1600));
  return W >= LANDSCAPE_MIN ? landscape(plan, lang, ui, Math.max(W, LANDSCAPE_DRAW)) : portrait(plan, lang, ui, W);
}

function texts(plan, lang) {
  const t = (v) => (v && typeof v === 'object' ? v[lang] : v);
  return { t, f: FACTOR[lang] || FACTOR.en };
}

function landscape(plan, lang, ui, W) {
  const { t, f } = texts(plan, lang);
  const M = 16;
  const OUT = clamp(Math.round(W * 0.19), 220, 260);
  const B0 = OUT + 24;
  const VW = clamp(Math.round(W * 0.14), 160, 190);
  const B1 = W - M - VW - 40;
  const L = { kind: 'landscape', W, rooms: [], doors: [], openings: [], boxes: [], labels: [] };

  // Management room and the service corridor, above the building.
  const MW = 204;
  const mg = { x: B0, y: 20, w: MW, label: t(plan.management.label) };
  let my = mg.y + 34;
  mg.fixtures = plan.management.fixtures.map((fx) => {
    const lines = wrap(t(fx.label), MW - 36, FS, f);
    const box = { src: fx, kind: 'fixture', x: B0 + 10, y: my, w: MW - 20, h: lines.length * LH + 14, lines };
    my += box.h + 8;
    return box;
  });
  mg.h = my - mg.y + 4;
  L.management = mg;
  if (plan.corridor) {
    const c0 = B0 + MW;
    const lines = wrap(t(plan.corridor.label), B1 - c0 - 70, FS, f);
    const h = lines.length * LH + 26;
    const cy = mg.y + 24;
    L.corridor = { src: plan.corridor, x0: c0, x1: B1, y0: cy, y1: cy + h, lines };
  }
  const top = Math.max(mg.y + mg.h, L.corridor ? L.corridor.y1 : 0) + 40;

  // Rooms side by side, ordered by trust from the entrance.
  const n = plan.rooms.length;
  const roomW = (B1 - B0) / n;
  let content = 0;
  plan.rooms.forEach((r, i) => {
    const inset = i === 0 ? 40 : 16;
    const label = wrap(t(r.label), roomW - inset - 14, RS, f);
    let y = top + 18 + label.length * RLH + 12;
    const fixtures = r.fixtures.map((fx) => {
      const lines = wrap(t(fx.label), roomW - inset - 16 - 16, FS, f);
      const box = { src: fx, kind: 'fixture', x: B0 + i * roomW + inset, y, w: roomW - inset - 16, h: lines.length * LH + 14, lines };
      y += box.h + 8;
      return box;
    });
    content = Math.max(content, y - top);
    L.rooms.push({ src: r, x: B0 + i * roomW, w: roomW, label, lx: B0 + i * roomW + inset, fixtures });
  });

  // Entrances in the outer wall, with the people who use them outside.
  const openings = plan.entrances.map((e) => ({ src: e, out: false }));
  if (plan.egress) openings.push({ src: plan.egress, out: true });
  for (const o of openings) {
    o.actor = o.out ? '' : t(o.src.actor);
    o.lines = wrap(t(o.src.label), OUT - 44 - 30, FS, f);
    o.h = (o.out ? 0 : LH) + o.lines.length * LH;
  }
  const need = openings.reduce((s, o) => s + o.h, 0) + Math.max(0, openings.length - 1) * 26 + 60;
  const H0 = Math.max(content + 120, need, 300);
  const bottom = top + H0;
  let oy = top + 30 + (H0 - need) / 2;
  for (const o of openings) {
    o.y = oy;
    o.yc = oy + o.h / 2;
    oy += o.h + 26;
  }
  L.openings = openings;

  // Doors between rooms: the enforcement points.
  L.doors = plan.doors.map((d, i) => {
    const x = B0 + (i + 1) * roomW;
    const tagW = Math.min(roomW - 24, 210);
    const lines = wrap(t(d.label), tagW - 16, FS, f);
    const w = Math.min(tagW, Math.max(...lines.map((s) => s.length)) * FS * f + 18);
    return { src: d, x, y: bottom - 108, size: 36, tag: { x: x - w / 2, y: bottom - 62, w, h: lines.length * LH + 10, lines } };
  });

  // The recovery vault stands apart and only receives.
  if (plan.vault) {
    const lines = wrap(t(plan.vault.label), VW - 34, FS, f);
    const h = Math.max(140, lines.length * LH + 64);
    L.vault = { src: plan.vault, x: B1 + 40, y: top + (H0 - h) / 2, w: VW, h, lines };
  }

  // Foundations under every zone, running on under the vault.
  const y0 = bottom + 28;
  const bandW = W - M - B0;
  const cols = clamp(Math.floor((bandW - 28 + GAP) / (MIN_BOX + GAP)), 1, 8);
  const items = plan.foundations.map((fd) => ({ src: fd, kind: fd.across ? 'across' : 'foundation', text: t(fd.label) }));
  const rows = Math.max(1, Math.ceil(items.length / cols));
  const g = grid(items, B0 + 14, bandW - 28, y0 + 38, Math.ceil(items.length / rows), f);
  L.band = { x: B0, y: y0, w: bandW, h: g.bottom - y0 + 16, label: t(ui.planFoundations) };
  L.foundations = g.boxes;

  L.outside = { x: 0, y: 0, w: B0 - 24, label: t(ui.planOutside) };
  L.B0 = B0;
  L.B1 = B1;
  L.top = top;
  L.bottom = bottom;
  L.H = Math.ceil(L.band.y + L.band.h + 16);
  return L;
}

function portrait(plan, lang, ui, W) {
  const { t, f } = texts(plan, lang);
  const M = W < 480 ? 10 : 16;
  const X0 = M;
  const X1 = W - M;
  const CW = plan.corridor ? 30 : 0;
  const L = { kind: 'portrait', W, rooms: [], doors: [], openings: [], labels: [] };
  L.outside = { x: 0, y: 0, w: W, label: t(ui.planOutside) };

  // Who comes in, listed outside the outer wall.
  const openings = plan.entrances.map((e) => ({ src: e, out: false }));
  if (plan.egress) openings.push({ src: plan.egress, out: true });
  const cols = W >= 900 ? 3 : W >= 600 ? 2 : 1;
  const colW = (X1 - X0 - 8 - (cols - 1) * 18) / cols;
  let y = 52;
  for (let i = 0; i < openings.length; i += cols) {
    const row = openings.slice(i, i + cols);
    for (const [j, o] of row.entries()) {
      o.actor = o.out ? '' : t(o.src.actor);
      o.lines = wrap(t(o.src.label), colW - 30 - 26, FS, f);
      o.h = (o.out ? 0 : LH) + o.lines.length * LH;
      o.x = X0 + 4 + j * (colW + 18);
      o.w = colW;
      o.y = y;
    }
    y += Math.max(...row.map((o) => o.h)) + 16;
  }
  L.openings = openings;
  const BT = y + 22; // the outer wall
  L.outside.h = BT - 10;

  // Rooms stacked from the entrance down, with the service corridor along the end side.
  const RW = X1 - CW - X0;
  const fcols = clamp(Math.floor((RW - 28 + GAP) / (MIN_BOX + GAP)), 1, 4);
  let ry = BT;
  plan.rooms.forEach((r, i) => {
    const label = wrap(t(r.label), RW - 28, RS, f);
    const ly = ry + (i === 0 ? 46 : 52);
    const items = r.fixtures.map((fx) => ({ src: fx, kind: 'fixture', text: t(fx.label) }));
    const g = grid(items, X0 + 14, RW - 28, ly + (label.length - 1) * RLH + 16, Math.min(fcols, items.length || 1), f);
    const h = Math.max(g.bottom - ry + 34, 120);
    L.rooms.push({ src: r, x: X0, y: ry, w: RW, h, label, lx: X0 + 14, ly, fixtures: g.boxes });
    ry += h;
  });
  const BB = ry; // the bottom of the building

  // Doors between rooms, in the shared walls, each with its rule beside it.
  L.doors = plan.doors.map((d, i) => {
    const wy = L.rooms[i + 1].y;
    const tagW = Math.min(RW - 96, 320);
    const lines = wrap(t(d.label), tagW - 16, FS, f);
    const w = Math.min(tagW, Math.max(...lines.map((s) => s.length)) * FS * f + 18);
    const h = lines.length * LH + 10;
    return { src: d, x: X0 + 30, y: wy, size: 34, tag: { x: X0 + 80, y: wy - h / 2, w, h, lines } };
  });

  // Doors in the outer wall, one for each way in or out, spread along it.
  const span = RW - 60;
  openings.forEach((o, i) => {
    o.dx = X0 + 30 + (openings.length > 1 ? (i * (span - 34)) / (openings.length - 1) : 0);
  });

  // Under the building: the vault at the start, and the management room at the
  // foot of the corridor. A narrow sheet stacks them, vault first, so the
  // corridor runs on past the vault and nothing crosses the one-way path.
  const side = W >= 540;
  const MWp = side ? Math.min(Math.max((X1 - X0) / 2 - 10, 190), 300) : X1 - X0;
  let vault = null;
  if (plan.vault) {
    const vw = side ? X1 - X0 - MWp - 34 : RW - 8;
    const lines = wrap(t(plan.vault.label), vw - 34, FS, f);
    const vh = Math.max(110, lines.length * LH + 56);
    vault = { src: plan.vault, x: X0, y: BB + 34, w: vw, h: vh, lines };
  }
  const below = vault && !side ? vault.y + vault.h + 30 : BB + 34;
  const mgx = X1 - MWp;
  let my = below + 34;
  const mfix = plan.management.fixtures.map((fx) => {
    const lines = wrap(t(fx.label), MWp - 36, FS, f);
    const box = { src: fx, kind: 'fixture', x: mgx + 10, y: my, w: MWp - 20, h: lines.length * LH + 14, lines };
    my += box.h + 8;
    return box;
  });
  const clines = plan.corridor ? wrap(t(plan.corridor.label), MWp - 24, FS, f) : [];
  const mh = my - below + (clines.length ? 12 + clines.length * LH + 12 : 4);
  L.management = { x: mgx, y: below, w: MWp, h: mh, label: t(plan.management.label), fixtures: mfix, note: clines, noteY: my + 12 };
  if (plan.corridor) L.corridor = { src: plan.corridor, x0: X1 - CW, x1: X1, y0: BT, y1: below, lines: clines };
  L.vault = vault;
  const next = Math.max(below + mh, vault ? vault.y + vault.h : 0);

  // Foundations under everything.
  const y0 = next + 30;
  const items = plan.foundations.map((fd) => ({ src: fd, kind: fd.across ? 'across' : 'foundation', text: t(fd.label) }));
  const bcols = clamp(Math.floor((X1 - X0 - 28 + GAP) / (MIN_BOX + GAP)), 1, 6);
  const g = grid(items, X0 + 14, X1 - X0 - 28, y0 + 38, bcols, f);
  L.band = { x: X0, y: y0, w: X1 - X0, h: g.bottom - y0 + 16, label: t(ui.planFoundations) };
  L.foundations = g.boxes;
  L.BT = BT;
  L.BB = BB;
  L.H = Math.ceil(L.band.y + L.band.h + 14);
  return L;
}

// Drawing

export function renderPlan(plan, lang, ui, width = PRINT_WIDTH) {
  const L = layoutPlan(plan, lang, ui, width);
  const { t } = texts(plan, lang);
  const rtl = lang === 'ar';
  const W = L.W;
  const X = (x) => Math.round((rtl ? W - x : x) * 10) / 10;
  const R = (v) => Math.round(v * 10) / 10;
  const out = [];
  const dir = rtl ? ' direction="rtl"' : '';

  const rect = (x, y, w, h, cls) =>
    out.push(`<rect x="${R(rtl ? W - x - w : x)}" y="${R(y)}" width="${R(w)}" height="${R(h)}" class="${cls}"/>`);
  const line = (x1, y1, x2, y2, cls, extra = '') =>
    out.push(`<line x1="${X(x1)}" y1="${R(y1)}" x2="${X(x2)}" y2="${R(y2)}" class="${cls}"${extra}/>`);
  const text = (x, y, content, cls, anchor = 'start') =>
    out.push(`<text x="${X(x)}" y="${R(y)}" class="${cls}" text-anchor="${anchor}"${dir}>${esc(content)}</text>`);
  const lines = (x, y, list, cls, step = LH, anchor = 'start') => list.forEach((l, i) => text(x, y + i * step, l, cls, anchor));
  const arrow = ' marker-end="url(#pl-arrow)"';
  // A door in a vertical wall at logical x, opening towards +x, between y0 and y0 + size.
  const doorV = (x, y0, size, cls) => {
    rect(x - 6, y0, 12, size, 'pl-gap');
    line(x, y0 + size, x + size, y0 + size, `pl-leaf ${cls}`);
    out.push(`<path d="M ${X(x)} ${R(y0)} A ${size} ${size} 0 0 ${rtl ? 0 : 1} ${X(x + size)} ${R(y0 + size)}" class="pl-swing"/>`);
  };
  // A door in a horizontal wall at y, hinged at x and opening down into the room below.
  const doorT = (x, y, size, cls) => {
    rect(x, y - 6, size, 12, 'pl-gap');
    line(x, y, x, y + size, `pl-leaf ${cls}`);
    out.push(`<path d="M ${X(x + size)} ${R(y)} A ${size} ${size} 0 0 ${rtl ? 0 : 1} ${X(x)} ${R(y + size)}" class="pl-swing"/>`);
  };
  const gapH = (cx, y, size) => rect(cx - size / 2, y - 5, size, 10, 'pl-gap');
  const pc = (p) => `pl-${p || 'structural'}`;
  // Each piece of the plan is a group that names the pattern it comes from, so
  // the page can point at it, light it up, explain it, and reach it from the keyboard.
  const open = (src, kind) =>
    out.push(
      src.pattern
        ? `<g class="pl-item" data-pattern="${src.pattern}" data-kind="${kind}" data-label="${esc(t(src.label))}" tabindex="-1" role="button" aria-label="${esc(t(src.label))}">`
        : '<g>'
    );
  const close = () => out.push('</g>');
  const box = (b) => {
    open(b.src, b.kind);
    rect(b.x, b.y, b.w, b.h, `pl-fixture ${pc(b.src.priority)}`);
    lines(b.x + b.w / 2, b.y + 7 + LH * 0.72, b.lines, `pl-fixture-label ${pc(b.src.priority)}`, LH, 'middle');
    close();
  };

  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${L.H}" class="plan plan-${L.kind}" role="group" aria-labelledby="plan-title plan-desc" lang="${lang}">`
  );
  const roomNames = plan.rooms.map((r) => t(r.label)).join(rtl ? '، ' : ', ');
  out.push(`<title id="plan-title">${esc(t(ui.planLabel))}</title>`);
  out.push(`<desc id="plan-desc">${esc(roomNames)}</desc>`);
  out.push(
    '<defs><marker id="pl-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pl-arrowhead"/></marker>' +
      '<pattern id="pl-ground" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="12" class="pl-hatch"/></pattern></defs>'
  );

  if (L.kind === 'landscape') {
    const { B0, B1, top, bottom } = L;
    rect(0, 0, L.outside.w, L.H, 'pl-outside');
    text(24, 38, L.outside.label, 'pl-zone-label');

    for (const r of [...L.rooms].sort((a, b) => a.src.trust - b.src.trust)) rect(r.x, top, r.w, bottom - top, `pl-room ${WALL[r.src.trust] || 'w4'}`);
    for (const r of L.rooms) {
      lines(r.lx, top + 18 + RS, r.label, 'pl-room-label', RLH);
      r.fixtures.forEach(box);
    }
    for (const d of L.doors) {
      open(d.src, 'door');
      doorV(d.x, d.y, d.size, pc(d.src.priority));
      rect(d.tag.x, d.tag.y, d.tag.w, d.tag.h, 'pl-tag');
      lines(d.x, d.tag.y + 5 + LH * 0.72, d.tag.lines, 'pl-door-label', LH, 'middle');
      close();
    }
    for (const o of L.openings) {
      open(o.src, o.out ? 'exit' : 'entrance');
      doorV(B0, o.yc - 15, 30, pc(o.src.priority));
      if (!o.out) {
        out.push(`<circle cx="${X(28)}" cy="${R(o.y + 6)}" r="5" class="pl-person"/>`);
        line(28, o.y + 12, 28, o.y + 24, 'pl-person-body');
        text(44, o.y + 12, o.actor, 'pl-actor');
        lines(44, o.y + 12 + LH, o.lines, 'pl-entrance-label');
        line(B0 - 50, o.yc, B0 - 8, o.yc, 'pl-flow', arrow);
      } else {
        lines(44, o.y + 12, o.lines, 'pl-entrance-label');
        line(B0 - 8, o.yc + 18, B0 - 50, o.yc + 18, 'pl-flow', arrow);
      }
      close();
    }

    const mg = L.management;
    rect(mg.x, mg.y, mg.w, mg.h, 'pl-room w3');
    text(mg.x + 12, mg.y + 22, mg.label, 'pl-room-label');
    mg.fixtures.forEach(box);
    if (L.corridor) {
      const c = L.corridor;
      open(c.src, 'corridor');
      line(c.x0, c.y0, c.x1, c.y0, 'pl-corridor');
      line(c.x0, c.y1, c.x1, c.y1, 'pl-corridor');
      line(c.x1, c.y0, c.x1, c.y1, 'pl-corridor');
      doorV(c.x0, c.y0 + 10, Math.min(34, c.y1 - c.y0 - 16), pc(c.src.priority));
      lines((c.x0 + c.x1) / 2 + 12, c.y0 + 13 + LH * 0.72, c.lines, 'pl-corridor-label', LH, 'middle');
      for (const r of L.rooms) {
        const cx = r.x + r.w / 2 + (r === L.rooms[0] ? 12 : 0);
        const from = cx < c.x0 ? mg.y + mg.h : c.y1;
        gapH(cx, top, 22);
        line(cx, from, cx, top - 4, 'pl-service', arrow);
      }
      close();
    }

    rect(L.band.x, L.band.y, L.band.w, L.band.h, 'pl-foundation');
    text(L.band.x + 14, L.band.y + 24, L.band.label, 'pl-zone-label');
    L.foundations.forEach(box);

    if (L.vault) {
      const v = L.vault;
      open(v.src, 'vault');
      rect(v.x, v.y, v.w, v.h, `pl-vault ${pc(v.src.priority)}`);
      lines(v.x + v.w / 2, v.y + v.h / 2 - ((v.lines.length - 1) * LH) / 2 + 5, v.lines, 'pl-vault-label', LH, 'middle');
      line(B1 + 6, v.y + v.h / 2, B1 + 34, v.y + v.h / 2, 'pl-oneway', arrow);
      close();
    }
  } else {
    const { BT, BB } = L;
    rect(0, 0, W, L.outside.h, 'pl-outside');
    text(16, 30, L.outside.label, 'pl-zone-label');
    for (const r of [...L.rooms].sort((a, b) => a.src.trust - b.src.trust)) rect(r.x, r.y, r.w, r.h, `pl-room ${WALL[r.src.trust] || 'w4'}`);
    const mg = L.management;
    rect(mg.x, mg.y, mg.w, mg.h, 'pl-room w3');
    for (const o of L.openings) {
      open(o.src, o.out ? 'exit' : 'entrance');
      if (!o.out) {
        out.push(`<circle cx="${X(o.x + 8)}" cy="${R(o.y + 6)}" r="5" class="pl-person"/>`);
        line(o.x + 8, o.y + 12, o.x + 8, o.y + 24, 'pl-person-body');
        text(o.x + 26, o.y + 12, o.actor, 'pl-actor');
        lines(o.x + 26, o.y + 12 + LH, o.lines, 'pl-entrance-label');
      } else {
        lines(o.x + 26, o.y + 12, o.lines, 'pl-entrance-label');
      }
      // Who comes in, and who goes out, at the door that serves them.
      if (o.out) line(o.dx + 17, BT - 8, o.dx + 17, BT - 30, 'pl-flow', arrow);
      else line(o.dx + 17, BT - 30, o.dx + 17, BT - 10, 'pl-flow', arrow);
      doorT(o.dx, BT, 30, pc(o.src.priority));
      close();
    }
    for (const r of L.rooms) {
      lines(r.lx, r.ly, r.label, 'pl-room-label', RLH);
      r.fixtures.forEach(box);
    }
    for (const d of L.doors) {
      open(d.src, 'door');
      doorT(d.x, d.y, d.size, pc(d.src.priority));
      rect(d.tag.x, d.tag.y, d.tag.w, d.tag.h, 'pl-tag');
      lines(d.tag.x + 9, d.tag.y + 5 + LH * 0.72, d.tag.lines, 'pl-door-label');
      close();
    }

    if (L.corridor) {
      const c = L.corridor;
      open(c.src, 'corridor');
      line(c.x0 + 4, c.y0, c.x0 + 4, c.y1, 'pl-corridor');
      line(c.x1, c.y0, c.x1, c.y1, 'pl-corridor');
      for (const r of L.rooms) {
        const cy = r.y + Math.min(r.h / 2, 56);
        rect(c.x0 - 5, cy - 11, 10, 22, 'pl-gap');
        line(c.x0 + 17, cy, c.x0 - 4, cy, 'pl-service', arrow);
      }
      gapH((c.x0 + c.x1) / 2 + 2, mg.y, 22);
      lines(mg.x + 12, mg.noteY + LH * 0.72, c.lines, 'pl-corridor-label');
      close();
    }
    text(mg.x + 12, mg.y + 22, mg.label, 'pl-room-label');
    mg.fixtures.forEach(box);

    if (L.vault) {
      const v = L.vault;
      open(v.src, 'vault');
      rect(v.x, v.y, v.w, v.h, `pl-vault ${pc(v.src.priority)}`);
      lines(v.x + v.w / 2, v.y + v.h / 2 - ((v.lines.length - 1) * LH) / 2 + 5, v.lines, 'pl-vault-label', LH, 'middle');
      line(v.x + 40, BB + 6, v.x + 40, v.y - 6, 'pl-oneway', arrow);
      close();
    }

    rect(L.band.x, L.band.y, L.band.w, L.band.h, 'pl-foundation');
    text(L.band.x + 14, L.band.y + 24, L.band.label, 'pl-zone-label');
    L.foundations.forEach(box);
  }

  out.push('</svg>');
  return out.join('');
}
