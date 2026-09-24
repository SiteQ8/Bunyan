// Draws a suggested architecture as an architectural floor plan.
//
// Zones are rooms, ordered by trust from the entrance side. Wall thickness shows
// how restricted a zone is. Doors are the points where policy is enforced. The
// admin path is a service corridor, the foundations run underneath, and the
// recovery vault stands apart, reachable one way only.
//
// The layout is computed in logical coordinates, where "start" is the entrance
// side, and mirrored for Arabic so that the plan reads right to left.
// Pure function: returns an SVG string, never touches the DOM.

const W = 1280;
const H = 620;
const B0 = 270; // building start
const B1 = 1060; // building end
const ROOM_TOP = 150;
const ROOM_BOTTOM = 470;
const WALL = { 1: 'w1', 2: 'w2', 3: 'w3', 4: 'w4' };

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function wrap(text, width, size) {
  const max = Math.max(6, Math.floor(width / (size * 0.56)));
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    if (!line) line = word;
    else if ((line + ' ' + word).length <= max) line += ' ' + word;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function renderPlan(plan, lang, ui) {
  const rtl = lang === 'ar';
  const t = (v) => (v && typeof v === 'object' ? v[lang] : v);
  const X = (x) => (rtl ? W - x : x);
  const out = [];
  const dir = rtl ? ' direction="rtl"' : '';

  const rect = (x, y, w, h, cls) =>
    out.push(`<rect x="${rtl ? W - x - w : x}" y="${y}" width="${w}" height="${h}" class="${cls}"/>`);
  const line = (x1, y1, x2, y2, cls, extra = '') =>
    out.push(`<line x1="${X(x1)}" y1="${y1}" x2="${X(x2)}" y2="${y2}" class="${cls}"${extra}/>`);
  const text = (x, y, content, cls, anchor = 'start') =>
    out.push(`<text x="${X(x)}" y="${y}" class="${cls}" text-anchor="${anchor}"${dir}>${esc(content)}</text>`);
  const lines = (x, y, list, cls, size, anchor = 'start') => {
    list.forEach((l, i) => text(x, y + i * (size + 3), l, cls, anchor));
  };
  // A door in a vertical wall at logical x, opening towards +x, between y0 and y0 + size.
  const doorV = (x, y0, size, cls) => {
    rect(x - 6, y0, 12, size, 'pl-gap');
    const hinge = [x, y0 + size];
    const open = [x + size, y0 + size];
    line(hinge[0], hinge[1], open[0], open[1], `pl-leaf ${cls}`);
    const sweep = rtl ? 0 : 1;
    out.push(`<path d="M ${X(x)} ${y0} A ${size} ${size} 0 0 ${sweep} ${X(open[0])} ${open[1]}" class="pl-swing"/>`);
  };
  const doorH = (cx, y, size) => {
    rect(cx - size / 2, y - 5, size, 10, 'pl-gap');
  };
  const priorityClass = (p) => `pl-${p || 'structural'}`;

  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="plan" role="img" aria-labelledby="plan-title plan-desc" lang="${lang}">`
  );
  const roomNames = plan.rooms.map((r) => t(r.label)).join(rtl ? '، ' : ', ');
  out.push(`<title id="plan-title">${esc(t(ui.planLabel))}</title>`);
  out.push(`<desc id="plan-desc">${esc(roomNames)}</desc>`);
  out.push(
    '<defs><marker id="pl-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pl-arrowhead"/></marker>' +
      '<pattern id="pl-ground" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="12" class="pl-hatch"/></pattern></defs>'
  );

  // Outside: the ground the building stands on.
  rect(0, 0, B0 - 24, H, 'pl-outside');
  text(24, 36, t(ui.planOutside), 'pl-zone-label');

  // Rooms, drawn from the least to the most restricted so thicker walls land on top.
  const n = plan.rooms.length;
  const roomW = (B1 - B0) / n;
  const rooms = plan.rooms.map((r, i) => ({ ...r, x: B0 + i * roomW, w: roomW }));
  for (const r of [...rooms].sort((a, b) => a.trust - b.trust)) {
    rect(r.x, ROOM_TOP, r.w, ROOM_BOTTOM - ROOM_TOP, `pl-room ${WALL[r.trust] || 'w4'}`);
  }
  rooms.forEach((r, i) => {
    const inset = i === 0 ? 40 : 18;
    lines(r.x + inset, ROOM_TOP + 26, wrap(t(r.label), r.w - inset - 14, 13), 'pl-room-label', 13);
    r.fixtures.forEach((f, j) => {
      const fx = r.x + inset;
      const fw = r.w - inset - 18;
      const fy = ROOM_TOP + 50 + j * 46;
      rect(fx, fy, fw, 36, `pl-fixture ${priorityClass(f.priority)}`);
      const l = wrap(t(f.label), fw - 12, 11).slice(0, 2);
      const baseY = l.length === 1 ? fy + 22 : fy + 15;
      lines(fx + fw / 2, baseY, l, `pl-fixture-label ${priorityClass(f.priority)}`, 11, 'middle');
    });
  });

  // Doors between rooms: the enforcement points.
  plan.doors.forEach((d, i) => {
    const x = rooms[i + 1].x;
    doorV(x, 372, 36, priorityClass(d.priority));
    const l = wrap(t(d.label), Math.min(roomW - 20, 190), 11).slice(0, 2);
    const w = Math.max(...l.map((s) => s.length)) * 6.2 + 12;
    rect(x - w / 2, 420, w, l.length * 14 + 8, 'pl-tag');
    lines(x, 433, l, 'pl-door-label', 11, 'middle');
  });

  // Entrances in the outer wall, with the people who use them outside.
  const openings = [...plan.entrances.map((e) => ({ ...e, kind: 'in' }))];
  if (plan.egress) openings.push({ ...plan.egress, kind: 'out' });
  const span = ROOM_BOTTOM - ROOM_TOP - 40;
  openings.forEach((o, i) => {
    const yc = ROOM_TOP + 20 + (i + 0.5) * (span / openings.length);
    doorV(B0, yc - 15, 30, priorityClass(o.priority));
    if (o.kind === 'in') {
      out.push(`<circle cx="${X(28)}" cy="${yc - 20}" r="5" class="pl-person"/>`);
      line(28, yc - 14, 28, yc - 2, 'pl-person-body');
      text(44, yc - 14, t(o.actor), 'pl-actor');
      lines(44, yc + 2, wrap(t(o.label), 172, 10.5).slice(0, 3), 'pl-entrance-label', 10.5);
      line(226, yc, B0 - 8, yc, 'pl-flow', ' marker-end="url(#pl-arrow)"');
    } else {
      lines(44, yc - 6, wrap(t(o.label), 172, 10.5).slice(0, 3), 'pl-entrance-label', 10.5);
      line(B0 - 8, yc + 14, 226, yc + 14, 'pl-flow', ' marker-end="url(#pl-arrow)"');
    }
  });

  // Management room and the service corridor for administration.
  const mgmtW = 170;
  rect(B0, 20, mgmtW, 104, 'pl-room w3');
  text(B0 + 12, 40, t(plan.management.label), 'pl-room-label');
  plan.management.fixtures.forEach((f, j) => {
    rect(B0 + 10, 50 + j * 34, mgmtW - 20, 28, `pl-fixture ${priorityClass(f.priority)}`);
    const l = wrap(t(f.label), mgmtW - 30, 10).slice(0, 2);
    lines(B0 + mgmtW / 2, 50 + j * 34 + (l.length === 1 ? 18 : 12), l, `pl-fixture-label ${priorityClass(f.priority)}`, 10, 'middle');
  });
  if (plan.corridor) {
    const c0 = B0 + mgmtW;
    line(c0, 46, B1, 46, 'pl-corridor');
    line(c0, 104, B1, 104, 'pl-corridor');
    line(B1, 46, B1, 104, 'pl-corridor');
    doorV(c0, 58, 34, priorityClass(plan.corridor.priority));
    const l = wrap(t(plan.corridor.label), B1 - c0 - 60, 11.5).slice(0, 2);
    lines((c0 + B1) / 2 + 10, l.length === 1 ? 80 : 72, l, 'pl-corridor-label', 11.5, 'middle');
    rooms.forEach((r) => {
      const cx = r.x + r.w / 2 + (r === rooms[0] ? 10 : 0);
      const from = cx < c0 ? 124 : 104;
      doorH(cx, ROOM_TOP, 22);
      line(cx, from, cx, ROOM_TOP - 4, 'pl-service', ' marker-end="url(#pl-arrow)"');
    });
  }

  // Foundations under every zone.
  rect(B0, 494, B1 - B0, 104, 'pl-foundation');
  text(B0 + 14, 514, t(ui.planFoundations), 'pl-zone-label');
  const fn = plan.foundations.length;
  if (fn) {
    const gap = 12;
    const bw = (B1 - B0 - 28 - gap * (fn - 1)) / fn;
    plan.foundations.forEach((f, i) => {
      const x = B0 + 14 + i * (bw + gap);
      rect(x, 526, bw, 58, `pl-fixture ${priorityClass(f.priority)}`);
      const l = wrap(t(f.label), bw - 12, 11).slice(0, 3);
      lines(x + bw / 2, 546 + (3 - l.length) * 6, l, `pl-fixture-label ${priorityClass(f.priority)}`, 11, 'middle');
    });
  }

  // The recovery vault stands apart and only receives.
  if (plan.vault) {
    rect(1100, 250, 168, 140, `pl-vault ${priorityClass(plan.vault.priority)}`);
    const l = wrap(t(plan.vault.label), 140, 11.5).slice(0, 4);
    lines(1184, 300, l, 'pl-vault-label', 11.5, 'middle');
    line(B1 + 6, 320, 1094, 320, 'pl-oneway', ' marker-end="url(#pl-arrow)"');
  }

  out.push('</svg>');
  return out.join('');
}
