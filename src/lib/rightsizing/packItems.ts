// Fitting items into a box or a mailer.
//
// Boxes: a 3D "extreme point" heuristic. Items go in largest first; each one is
// tried in every rotation at every candidate corner, lowest position first. Any
// packing it returns is valid (inside the box, nothing overlapping, padding
// respected). It can miss a packing that a human would find, so it errs toward
// a bigger box, never toward one that is too small.
//
// Padding: fragile items need space from the walls (for filler) and from each
// other. We shrink the box by the wall padding and grow every item by the gap.
//
// Mailers: a flat pouch can hold an item of l x w x h when
//   l + h <= mailer length  and  w + h <= mailer width
// because the thickness eats into the flat size as the pouch wraps around it.
// For multiple items we try laying them in a row or stacking them.

import type { Dimensions, Fragility, Placement } from "../types.ts";

/** A flat mailer: length x width when flat, and the thickest bundle it closes around. */
export interface MailerSize {
  length: number;
  width: number;
  maxThickness: number;
}

const EPS = 1e-9;

export interface Clearance {
  /** Inches of space between items and every wall (filled with filler). */
  wall: number;
  /** Inches of space between two items. */
  gap: number;
}

/** Placeholder values; the scoring spec (docs/scoring-spec.md) should confirm them. */
export const CLEARANCE_IN: Record<Fragility, Clearance> = {
  low: { wall: 0, gap: 0 },
  medium: { wall: 1, gap: 0.5 },
  high: { wall: 2, gap: 1 },
};

/** Thickness of one layer of wrap (bubble wrap, honeycomb paper) around each item. */
export const WRAP_THICKNESS_IN = 0.5;

/** Wall thickness per side of boxes and inserts: inside size + 2x this = outside size. */
export const WALL_IN = 0.125;

export function volume(d: Dimensions): number {
  return d.length * d.width * d.height;
}

/** The distinct ways to rotate a block (up to 6). */
export function orientations(d: Dimensions): Dimensions[] {
  const { length: a, width: b, height: c } = d;
  const perms: [number, number, number][] = [
    [a, b, c], [a, c, b], [b, a, c], [b, c, a], [c, a, b], [c, b, a],
  ];
  const seen = new Set<string>();
  const out: Dimensions[] = [];
  for (const [l, w, h] of perms) {
    const key = `${l},${w},${h}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ length: l, width: w, height: h });
  }
  return out;
}

interface Block {
  item: number;
  x: number;
  y: number;
  z: number;
  l: number;
  w: number;
  h: number;
}

interface Point {
  x: number;
  y: number;
  z: number;
}

function overlaps(a: Omit<Block, "item">, b: Omit<Block, "item">): boolean {
  return (
    a.x < b.x + b.l - EPS && b.x < a.x + a.l - EPS &&
    a.y < b.y + b.w - EPS && b.y < a.y + a.w - EPS &&
    a.z < b.z + b.h - EPS && b.z < a.z + a.h - EPS
  );
}

function covers(b: Block, p: Point): boolean {
  return (
    p.x >= b.x - EPS && p.x < b.x + b.l - EPS &&
    p.y >= b.y - EPS && p.y < b.y + b.w - EPS &&
    p.z >= b.z - EPS && p.z < b.z + b.h - EPS
  );
}

type Axis = "x" | "y" | "z";

/** Which far edge to keep smallest first when choosing a rotation. */
const AXIS_PRIORITIES: Axis[][] = [
  ["z", "y", "x"], // stay low
  ["x", "z", "y"], // stay short along the length (rows)
  ["y", "z", "x"], // stay narrow (rows the other way)
  ["z", "x", "y"],
  ["x", "y", "z"],
  ["y", "x", "z"],
];

function farEdge(b: Omit<Block, "item">, axis: Axis): number {
  return axis === "x" ? b.x + b.l : axis === "y" ? b.y + b.w : b.z + b.h;
}

function better(a: Omit<Block, "item">, b: Omit<Block, "item">, priority: Axis[]): boolean {
  for (const axis of priority) {
    const ea = farEdge(a, axis);
    const eb = farEdge(b, axis);
    if (ea < eb - EPS) return true;
    if (ea > eb + EPS) return false;
  }
  return false;
}

function packInOrder(
  order: number[],
  items: Dimensions[],
  space: Dimensions,
  priority: Axis[],
): Block[] | null {
  const placed: Block[] = [];
  let points: Point[] = [{ x: 0, y: 0, z: 0 }];

  for (const idx of order) {
    points.sort((p, q) => p.z - q.z || p.y - q.y || p.x - q.x);
    let chosen: Block | null = null;

    for (const p of points) {
      let best: Omit<Block, "item"> | null = null;
      for (const o of orientations(items[idx])) {
        if (
          p.x + o.length > space.length + EPS ||
          p.y + o.width > space.width + EPS ||
          p.z + o.height > space.height + EPS
        ) continue;
        const cand = { x: p.x, y: p.y, z: p.z, l: o.length, w: o.width, h: o.height };
        if (placed.some((b) => overlaps(cand, b))) continue;
        if (!best || better(cand, best, priority)) best = cand;
      }
      if (best) {
        chosen = { ...best, item: idx };
        break;
      }
    }

    if (!chosen) return null;
    placed.push(chosen);

    const next: Point[] = [
      { x: chosen.x + chosen.l, y: chosen.y, z: chosen.z },
      { x: chosen.x, y: chosen.y + chosen.w, z: chosen.z },
      { x: chosen.x, y: chosen.y, z: chosen.z + chosen.h },
    ];
    for (const np of next) {
      const inside =
        np.x < space.length - EPS && np.y < space.width - EPS && np.z < space.height - EPS;
      const dup = points.some(
        (p) => Math.abs(p.x - np.x) < EPS && Math.abs(p.y - np.y) < EPS && Math.abs(p.z - np.z) < EPS,
      );
      if (inside && !dup) points.push(np);
    }
    points = points.filter((p) => !placed.some((b) => covers(b, p)));
  }
  return placed;
}

/** A few item orders to try; the first one that fits wins. */
function candidateOrders(items: Dimensions[]): number[][] {
  const idx = items.map((_, i) => i);
  const sorted = (key: (d: Dimensions) => number) =>
    [...idx].sort((i, j) => key(items[j]) - key(items[i]) || i - j);
  const dimsDesc = (d: Dimensions) => [d.length, d.width, d.height].sort((a, b) => b - a);
  const orders = [
    sorted(volume),
    sorted((d) => dimsDesc(d)[0]),
    sorted((d) => dimsDesc(d)[0] * dimsDesc(d)[1]),
  ];
  const seen = new Set<string>();
  return orders.filter((o) => {
    const k = o.join(",");
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Try to fit every item into a box with the given inside size.
 * Returns where each item goes, or null if the heuristic cannot fit them.
 */
export function packIntoBox(
  items: Dimensions[],
  inner: Dimensions,
  clearance: Clearance,
): Placement[] | null {
  if (items.length === 0) return [];
  const { wall, gap } = clearance;
  const space: Dimensions = {
    length: inner.length - 2 * wall + gap,
    width: inner.width - 2 * wall + gap,
    height: inner.height - 2 * wall + gap,
  };
  if (space.length <= EPS || space.width <= EPS || space.height <= EPS) return null;

  const grown = items.map((d) => ({
    length: d.length + gap,
    width: d.width + gap,
    height: d.height + gap,
  }));
  const total = grown.reduce((s, d) => s + volume(d), 0);
  if (total > volume(space) + EPS) return null;

  // Greedy choices can paint themselves into a corner, so try a few
  // item orders x rotation preferences and keep the first that works.
  for (const priority of AXIS_PRIORITIES) {
    for (const order of candidateOrders(grown)) {
      const blocks = packInOrder(order, grown, space, priority);
      if (blocks) {
        return blocks.map((b) => ({
          item: b.item,
          x: b.x + wall,
          y: b.y + wall,
          z: b.z + wall,
          dims: { length: b.l - gap, width: b.w - gap, height: b.h - gap },
        }));
      }
    }
  }
  return null;
}

export interface MailerFit {
  /** Size of the bundle going into the mailer (items + wrap). */
  bundle: Dimensions;
  placements: Placement[];
}

export function pouchFits(bundle: Dimensions, mailer: MailerSize): boolean {
  const t = bundle.height;
  if (t > mailer.maxThickness + EPS) return false;
  const L = mailer.length;
  const W = mailer.width;
  const fits = (l: number, w: number) => l + t <= L + EPS && w + t <= W + EPS;
  return fits(bundle.length, bundle.width) || fits(bundle.width, bundle.length);
}

/**
 * Try to fit items into a flat mailer, each wrapped in `wrap` inches of padding.
 * Items lie flat (thinnest side up), either in a row or in a stack.
 */
export function fitMailer(
  items: Dimensions[],
  mailer: MailerSize,
  wrap: number,
): MailerFit | null {
  if (items.length === 0) return null;
  // Each item laid flat: a >= b >= c, c is the thickness.
  const flat = items.map((d) => {
    const [a, b, c] = [d.length, d.width, d.height].sort((p, q) => q - p);
    return { a: a + 2 * wrap, b: b + 2 * wrap, c: c + 2 * wrap };
  });

  type Layout = { bundle: Dimensions; place: (i: number, offset: number) => Placement };
  const sum = (f: (v: (typeof flat)[number]) => number) => flat.reduce((s, v) => s + f(v), 0);
  const max = (f: (v: (typeof flat)[number]) => number) => Math.max(...flat.map(f));
  const real = (i: number, l: number, w: number, h: number): Dimensions => ({
    length: l - 2 * wrap,
    width: w - 2 * wrap,
    height: h - 2 * wrap,
  });

  const layouts: Layout[] = [
    {
      // Row, short sides touching.
      bundle: { length: sum((v) => v.b), width: max((v) => v.a), height: max((v) => v.c) },
      place: (i, off) => ({ item: i, x: off + wrap, y: wrap, z: wrap, dims: real(i, flat[i].b, flat[i].a, flat[i].c) }),
    },
    {
      // Row, long sides touching.
      bundle: { length: sum((v) => v.a), width: max((v) => v.b), height: max((v) => v.c) },
      place: (i, off) => ({ item: i, x: off + wrap, y: wrap, z: wrap, dims: real(i, flat[i].a, flat[i].b, flat[i].c) }),
    },
    {
      // Stacked.
      bundle: { length: max((v) => v.a), width: max((v) => v.b), height: sum((v) => v.c) },
      place: (i, off) => ({ item: i, x: wrap, y: wrap, z: off + wrap, dims: real(i, flat[i].a, flat[i].b, flat[i].c) }),
    },
  ];

  const fitting = layouts
    .filter((l) => pouchFits(l.bundle, mailer))
    .sort((p, q) => p.bundle.height - q.bundle.height || volume(p.bundle) - volume(q.bundle));
  if (fitting.length === 0) return null;

  const best = fitting[0];
  const stacked = best === layouts[2];
  let offset = 0;
  const placements = flat.map((v, i) => {
    const p = best.place(i, offset);
    offset += stacked ? v.c : best === layouts[0] ? v.b : v.a;
    return p;
  });
  return { bundle: best.bundle, placements };
}
