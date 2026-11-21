// Turns the vision model's parts into a packaging setup from the library
// (docs/CLAUDE.md section 9). Pure code, no AI: the model only reads the photo,
// this decides which library item each part is. Anything uncertain is flagged so the
// review screen can ask the user.

import type { Catalog, PackagingComponent } from "../types.ts";
import type { ScanPart } from "./schema.ts";

export interface PartMatch {
  part: ScanPart;
  /** The library item chosen for this part, or null if none fits. */
  component_id: string | null;
  /** True when the match is a guess the user should check. */
  ambiguous: boolean;
  /** One plain sentence for the review screen. */
  reason: string;
}

export interface ScanSetup {
  outer_id: string | null;
  fill_id: string | null;
  wrap_id: string | null;
  insert_id: string | null;
}

export interface ParsedScan {
  setup: ScanSetup;
  matches: PartMatch[];
  warnings: string[];
}

const CONFIDENCE_RANK = { high: 2, medium: 1, low: 0 } as const;
/** How close the runner-up's size error may be (as a share of the best) before we call the match a guess. */
const CLOSE_CALL = 1.25;

/** Sum of absolute differences between two size lists, each sorted largest first. */
function sizeError(a: number[], b: number[]): number {
  const x = [...a].sort((p, q) => q - p);
  const y = [...b].sort((p, q) => q - p);
  return x.reduce((s, v, i) => s + Math.abs(v - (y[i] ?? 0)), 0);
}

function componentSize(c: PackagingComponent): number[] {
  // A mailer's height is "thickest item that fits", not a size you can see in a photo.
  return c.type === "mailer" ? [c.length_in ?? 0, c.width_in ?? 0] : [c.length_in ?? 0, c.width_in ?? 0, c.height_in ?? 0];
}

function partSize(part: ScanPart): number[] | null {
  const d = part.approx_dims_in;
  if (!d) return null;
  const all = [d.length_in, d.width_in, d.height_in].sort((p, q) => q - p);
  return part.type === "mailer" ? all.slice(0, 2) : all;
}

/** Word stems of 4+ letters ("crinkled" and "crinkle" both give "crink"), for matching a part's name to the library. */
function stems(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((w) => w.length >= 4)
      .map((w) => w.slice(0, 5)),
  );
}

/** The one candidate whose name shares the most word stems with the part's name, or null if none or a tie. */
export function bestByName<T extends { id: string; name: string }>(partName: string, candidates: T[]): T | null {
  const want = stems(partName);
  const scored = candidates
    .map((c) => ({ c, n: [...stems(`${c.name} ${c.id}`)].filter((s) => want.has(s)).length }))
    .sort((a, b) => b.n - a.n);
  if (!scored[0] || scored[0].n === 0) return null;
  if (scored[1] && scored[1].n === scored[0].n) return null;
  return scored[0].c;
}

export function matchPart(part: ScanPart, catalog: Catalog): PartMatch {
  if (part.type === "product_packaging") {
    return {
      part,
      component_id: null,
      ambiguous: false,
      reason: "Part of the product itself (jar, lid). We count it from the product's own details, not the library.",
    };
  }

  // Jar-shipper boxes with fitted inserts only suit one specific jar, so they are never auto-matched.
  const candidates = catalog.components.filter(
    (c) => c.type === part.type && c.material === part.material && !c.has_fitted_insert,
  );
  if (candidates.length === 0) {
    return { part, component_id: null, ambiguous: true, reason: `No ${part.type} made of ${part.material} in our library. Pick one or add your own.` };
  }

  const size = partSize(part);
  if ((part.type === "box" || part.type === "mailer" || part.type === "insert") && size) {
    const ranked = candidates
      .map((c) => ({ c, err: sizeError(componentSize(c), size) }))
      .sort((a, b) => a.err - b.err);
    const [best, second] = ranked;
    const close = second !== undefined && second.err <= best.err * CLOSE_CALL + 0.5;
    const ambiguous = close || part.confidence === "low";
    return {
      part,
      component_id: best.c.id,
      ambiguous,
      reason: ambiguous
        ? `Closest size in our library is ${best.c.name}. Check the size.`
        : `Matched to ${best.c.name} by material and size.`,
    };
  }

  if (candidates.length === 1) {
    return { part, component_id: candidates[0].id, ambiguous: part.confidence === "low", reason: `Matched to ${candidates[0].name}.` };
  }

  // Several options and no size: the part's own name often settles it ("crinkled paper" vs "crumpled paper").
  const byName = bestByName(part.part_name, candidates);
  if (byName) {
    return {
      part,
      component_id: byName.id,
      ambiguous: part.confidence === "low",
      reason: `Matched to ${byName.name} by its name.`,
    };
  }

  // Still several options: take the cheapest per unit and ask.
  const cheapest = [...candidates].sort((a, b) => a.price_usd - b.price_usd)[0];
  return {
    part,
    component_id: cheapest.id,
    ambiguous: true,
    reason: `${candidates.length} ${part.material} ${part.type} options in our library. We picked ${cheapest.name}. Check it.`,
  };
}

const SLOT_OF: Record<ScanPart["type"], keyof ScanSetup | null> = {
  box: "outer_id",
  mailer: "outer_id",
  filler: "fill_id",
  wrap: "wrap_id",
  insert: "insert_id",
  product_packaging: null,
};

/**
 * Put matched parts into the four setup slots (box or mailer, fill, wrap, insert), in the order
 * given: the first of each kind wins. Used by parseScan and by the review screen after edits.
 */
export function fillSetup(matches: PartMatch[], catalog: Catalog): { setup: ScanSetup; matches: PartMatch[]; warnings: string[] } {
  const warnings: string[] = [];
  const setup: ScanSetup = { outer_id: null, fill_id: null, wrap_id: null, insert_id: null };
  const out: PartMatch[] = [];
  for (const m of matches) {
    const slot = SLOT_OF[m.part.type];
    if (slot && m.component_id) {
      if (setup[slot] === null) setup[slot] = m.component_id;
      else {
        const kind = slot === "outer_id" ? "outer containers" : `${m.part.type}s`;
        warnings.push(`Two ${kind} found. We use one of each, so "${m.part.part_name}" was left out.`);
        out.push({ ...m, component_id: null, ambiguous: true, reason: "A second one of this kind was found. Only one is used." });
        continue;
      }
    }
    out.push(m);
  }

  // Loose fill does nothing inside a mailer.
  const outer = catalog.components.find((c) => c.id === setup.outer_id);
  if (outer?.type === "mailer" && setup.fill_id) {
    warnings.push("Loose fill isn't used inside a mailer, so the fill was left out.");
    setup.fill_id = null;
  }
  if (setup.outer_id === null && matches.length > 0) warnings.push("No box or mailer was identified. Choose one to continue.");
  return { setup, matches: out, warnings };
}

/** Match every part to the library and fill the setup. Most confident parts are placed first. */
export function parseScan(parts: ScanPart[], catalog: Catalog): ParsedScan {
  const ordered = [...parts].sort((a, b) => CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence]);
  return fillSetup(ordered.map((p) => matchPart(p, catalog)), catalog);
}
