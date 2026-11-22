// The disposal insert: a small printed card that goes in the box and tells the customer what to do with each part.
// Every sentence comes from data/materials.json (`disposal_text`, `curbside_recyclable`); nothing here is written by hand
// per material, so the card can never say something the data does not.
//
// Honest-claims rules (FTC Green Guides, 16 CFR 260.12): "recycle at the curb" only for materials the data marks as
// curbside recyclable, and every card ends with a "rules vary, check locally" line. We never print How2Recycle labels:
// they are licensed, and most of ours were inferred rather than looked up.

import type { Material, PackagingComponent, ResolvedSetup } from "../types.ts";

export type BinKind = "curbside" | "not-curbside";

export interface DisposalLine {
  /** What the customer sees in the box, e.g. "Box" or "Bubble wrap". */
  part: string;
  materialId: string;
  materialName: string;
  bin: BinKind;
  /** The instruction, straight from materials.json. */
  text: string;
}

export interface DisposalCard {
  lines: DisposalLine[];
  /** Parts whose material is missing from materials.json (should never happen with our data). */
  unknown: string[];
  curbsideCount: number;
}

/** Product packaging that travels with the item, e.g. a candle's jar and lid. */
export interface ExtraPart {
  label: string;
  material: string;
}

export const CHECK_LOCALLY_TEXT = "Recycling rules vary by town. If you are not sure, check your local program before you toss it.";

export const BIN_TEXT: Record<BinKind, string> = {
  curbside: "Curbside recycling",
  "not-curbside": "Not for the curbside bin",
};

/**
 * A short, plain name for a part, as a customer would call it. Library names carry supplier detail after a comma or
 * bracket ("Bubble wrap, 3/16 in bubble, 12 in roll"), so the card keeps only the part before it ("Bubble wrap").
 */
export function partLabel(c: PackagingComponent): string {
  if (c.type === "box") return c.has_fitted_insert ? "Box and its built-in insert" : "Box";
  if (c.type === "mailer") return "Mailer";
  return c.name.split(/,| \(/)[0].trim() || c.name;
}

/**
 * The card lines for one setup, outer packaging first, then what was inside it, then the product's own packaging.
 * Parts made of the same material with the same instruction are kept as separate lines: a customer holding
 * bubble wrap wants to find "bubble wrap", not a material name.
 */
export function buildDisposalCard(parts: ResolvedSetup, materials: Material[], extras: ExtraPart[] = []): DisposalCard {
  const byId = new Map(materials.map((m) => [m.id, m]));
  const items: { label: string; material: string }[] = [
    { label: partLabel(parts.outer), material: parts.outer.material },
    ...[parts.insert, parts.wrap, parts.fill]
      .filter((p): p is PackagingComponent => p !== null)
      .map((p) => ({ label: partLabel(p), material: p.material })),
    ...extras.map((e) => ({ label: e.label, material: e.material })),
  ];

  const lines: DisposalLine[] = [];
  const unknown: string[] = [];
  for (const item of items) {
    const m = byId.get(item.material);
    if (!m) {
      unknown.push(item.label);
      continue;
    }
    lines.push({
      part: item.label,
      materialId: m.id,
      materialName: m.name,
      bin: m.curbside_recyclable ? "curbside" : "not-curbside",
      text: m.disposal_text,
    });
  }
  return { lines, unknown, curbsideCount: lines.filter((l) => l.bin === "curbside").length };
}

/** Rebuild a setup from its key (ids joined by "+", see setupKey), placing each id by its component type. */
export function setupFromKey(key: string, components: PackagingComponent[]): ResolvedSetup | null {
  const byId = new Map(components.map((c) => [c.id, c]));
  const parts: ResolvedSetup = { outer: null as unknown as PackagingComponent, fill: null, wrap: null, insert: null };
  for (const id of key.split("+")) {
    const c = byId.get(id);
    if (!c) return null;
    if (c.type === "box" || c.type === "mailer") {
      if (parts.outer) return null;
      parts.outer = c;
    } else if (c.type === "filler") parts.fill = c;
    else if (c.type === "wrap") parts.wrap = c;
    else if (c.type === "insert") parts.insert = c;
  }
  return parts.outer ? parts : null;
}
