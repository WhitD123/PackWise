// Filtering, sorting and plain-word descriptions for the packaging library page. Pure functions over the data,
// so the page and the tests agree. Units stay in the wording: a filler is priced per cubic foot, a wrap per square foot.

import type { ComponentType, Material, PackagingComponent } from "../types.ts";

export const TYPE_ORDER: ComponentType[] = ["box", "mailer", "filler", "wrap", "insert"];

export const TYPE_LABELS: Record<ComponentType, { one: string; many: string }> = {
  box: { one: "Box", many: "Boxes" },
  mailer: { one: "Mailer", many: "Mailers" },
  filler: { one: "Filler", many: "Fillers" },
  wrap: { one: "Wrap", many: "Wraps" },
  insert: { one: "Insert", many: "Inserts" },
};

export type SortKey = "name" | "price" | "weight" | "size" | "recycling";

export const SORT_LABELS: Record<SortKey, string> = {
  name: "Type, then size",
  price: "Cheapest first",
  weight: "Lightest first",
  size: "Smallest first",
  recycling: "Most recycled material first",
};

export interface LibraryFilters {
  type: ComponentType | "all";
  material: string | "all";
  plasticFree: boolean;
  query: string;
  sort: SortKey;
}

export const DEFAULT_FILTERS: LibraryFilters = { type: "all", material: "all", plasticFree: false, query: "", sort: "name" };

const fmt = (n: number) => Number(n.toFixed(2)).toString();

/** Footprint used to sort by size: inside volume for boxes and inserts, flat area for mailers. */
export function footprint(c: PackagingComponent): number {
  if (c.length_in === undefined || c.width_in === undefined) return Infinity;
  return c.type === "mailer" ? c.length_in * c.width_in : c.length_in * c.width_in * (c.height_in ?? 1);
}

/** "12 x 10 x 8 in inside", "Flat 13 x 10 in", or "Sold by the cubic foot". */
export function sizeText(c: PackagingComponent): string {
  if (c.unit === "cubic_ft") return "Sold by the cubic foot";
  if (c.unit === "square_ft") return "Sold by the square foot";
  if (c.length_in === undefined || c.width_in === undefined) return "Size not listed";
  if (c.type === "mailer") return `Flat ${fmt(c.length_in)} x ${fmt(c.width_in)} in`;
  return `${fmt(c.length_in)} x ${fmt(c.width_in)} x ${fmt(c.height_in ?? 0)} in inside`;
}

/** "$1.02 each, buying 500", "$1.85 per cubic foot", "$0.11 per square foot". */
export function priceText(c: PackagingComponent): string {
  const p = `$${c.price_usd.toFixed(2)}`;
  if (c.unit === "cubic_ft") return `${p} per cubic foot`;
  if (c.unit === "square_ft") return `${p} per square foot`;
  return `${p} each, buying ${c.price_basis_qty.toLocaleString("en-US")}`;
}

/** "304 g", "94 g per cubic foot", "9 g per square foot". */
export function weightText(c: PackagingComponent): string {
  const g = `${c.weight_g < 10 ? c.weight_g.toFixed(1) : Math.round(c.weight_g).toLocaleString("en-US")} g`;
  if (c.unit === "cubic_ft") return `${g} per cubic foot`;
  if (c.unit === "square_ft") return `${g} per square foot`;
  return g;
}

export function filterComponents(
  components: PackagingComponent[],
  materials: Material[],
  f: LibraryFilters,
): PackagingComponent[] {
  const mat = new Map(materials.map((m) => [m.id, m]));
  const words = f.query.toLowerCase().replace(/×/g, "x").split(/\s+/).filter(Boolean);
  const out = components.filter((c) => {
    if (f.type !== "all" && c.type !== f.type) return false;
    if (f.material !== "all" && c.material !== f.material) return false;
    if (f.plasticFree && mat.get(c.material)?.is_plastic) return false;
    if (words.length) {
      const hay = `${c.name} ${sizeText(c)} ${mat.get(c.material)?.name ?? ""} ${c.supplier}`.toLowerCase();
      if (!words.every((w) => hay.includes(w))) return false;
    }
    return true;
  });
  const rate = (c: PackagingComponent) => c.recycle_rate ?? mat.get(c.material)?.recycle_rate ?? 0;
  const by: Record<SortKey, (a: PackagingComponent, b: PackagingComponent) => number> = {
    name: (a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) || footprint(a) - footprint(b) || a.name.localeCompare(b.name),
    price: (a, b) => a.price_usd - b.price_usd,
    weight: (a, b) => a.weight_g - b.weight_g,
    size: (a, b) => footprint(a) - footprint(b),
    recycling: (a, b) => rate(b) - rate(a),
  };
  return out.sort((a, b) => by[f.sort](a, b) || a.name.localeCompare(b.name));
}

/** How many components of each type, for the tab labels. */
export function countByType(components: PackagingComponent[]): Record<ComponentType | "all", number> {
  const counts = { all: components.length, box: 0, mailer: 0, filler: 0, wrap: 0, insert: 0 };
  for (const c of components) counts[c.type]++;
  return counts;
}

/** Read and write the filters in the page address, so a filtered view can be shared or bookmarked. */
export function filtersFromQuery(q: URLSearchParams, materials: Material[]): LibraryFilters {
  const type = q.get("type");
  const material = q.get("material");
  const sort = q.get("sort");
  return {
    type: TYPE_ORDER.includes(type as ComponentType) ? (type as ComponentType) : "all",
    material: materials.some((m) => m.id === material) ? material! : "all",
    plasticFree: q.get("plastic") === "free",
    query: (q.get("q") ?? "").slice(0, 60),
    sort: sort && sort in SORT_LABELS ? (sort as SortKey) : "name",
  };
}

export function filtersToQuery(f: LibraryFilters): string {
  const q = new URLSearchParams();
  if (f.type !== "all") q.set("type", f.type);
  if (f.material !== "all") q.set("material", f.material);
  if (f.plasticFree) q.set("plastic", "free");
  if (f.query) q.set("q", f.query);
  if (f.sort !== "name") q.set("sort", f.sort);
  const s = q.toString();
  return s ? `?${s}` : "";
}
