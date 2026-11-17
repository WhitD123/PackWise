// Lookups into the packaging library and materials list.

import type { Catalog, ComponentType, Dimensions, Material, PackagingComponent, ResolvedSetup, Setup } from "./types.ts";

export interface CatalogIndex {
  component(id: string): PackagingComponent | undefined;
  material(id: string): Material | undefined;
  byType(type: ComponentType): PackagingComponent[];
}

export function indexCatalog(catalog: Catalog): CatalogIndex {
  const components = new Map(catalog.components.map((c) => [c.id, c]));
  const materials = new Map(catalog.materials.map((m) => [m.id, m]));
  return {
    component: (id) => components.get(id),
    material: (id) => materials.get(id),
    byType: (type) => catalog.components.filter((c) => c.type === type),
  };
}

/** Inside size of a box, mailer or insert; null if the record has no size. */
export function dimsOf(c: PackagingComponent): Dimensions | null {
  if (c.length_in === undefined || c.width_in === undefined || c.height_in === undefined) return null;
  return { length: c.length_in, width: c.width_in, height: c.height_in };
}

/**
 * Turn ids into components and check the combination makes sense:
 * outer is a box or mailer, fill is a filler (boxes only), wrap is a wrap,
 * insert is an insert. Returns null if anything is missing or mismatched.
 */
export function resolveSetup(setup: Setup, index: CatalogIndex): ResolvedSetup | null {
  const outer = index.component(setup.outer_id);
  if (!outer || (outer.type !== "box" && outer.type !== "mailer") || !dimsOf(outer)) return null;
  const pick = (id: string | null, type: ComponentType) => {
    if (id === null) return null;
    const c = index.component(id);
    return c && c.type === type ? c : undefined;
  };
  const fill = pick(setup.fill_id, "filler");
  const wrap = pick(setup.wrap_id, "wrap");
  const insert = pick(setup.insert_id, "insert");
  if (fill === undefined || wrap === undefined || insert === undefined) return null;
  if (fill && outer.type !== "box") return null; // loose fill does nothing in a mailer
  if (insert && !dimsOf(insert)) return null;
  return { outer, fill, wrap, insert };
}

export function setupKey(s: Setup): string {
  return [s.outer_id, s.insert_id, s.wrap_id, s.fill_id].filter(Boolean).join("+");
}

export function describeSetup(parts: ResolvedSetup): string {
  const extras = [parts.insert, parts.wrap, parts.fill].filter((p): p is PackagingComponent => p !== null);
  if (extras.length === 0) return parts.outer.name;
  return `${parts.outer.name} with ${extras.map((p) => p.name.toLowerCase()).join(" and ")}`;
}
