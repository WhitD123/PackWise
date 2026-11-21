"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Term } from "@/components/ui/Term";
import {
  countByType,
  DEFAULT_FILTERS,
  filterComponents,
  filtersFromQuery,
  filtersToQuery,
  priceText,
  SORT_LABELS,
  sizeText,
  TYPE_LABELS,
  TYPE_ORDER,
  weightText,
  type LibraryFilters,
  type SortKey,
} from "@/lib/library/browse";
import type { Material, PackagingComponent } from "@/lib/types";

import { Silhouette } from "./Silhouette";

const pct = (x: number) => `${Math.round(x * 100)}%`;
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Item({ c, m }: { c: PackagingComponent; m: Material | undefined }) {
  const rate = c.recycle_rate ?? m?.recycle_rate;
  return (
    <li>
      <details className="group border-b border-line">
        <summary className="grid cursor-pointer list-none grid-cols-[96px_1fr] items-center gap-x-4 gap-y-2 py-4 hover:bg-kraft/15 sm:grid-cols-[96px_1fr_14rem] [&::-webkit-details-marker]:hidden">
          <div className="row-span-2 flex items-center sm:row-span-1">
            <Silhouette c={c} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold leading-snug text-ink">{c.name}</p>
            <p className="text-sm text-muted">
              {TYPE_LABELS[c.type].one}, {m?.name ?? c.material}. {sizeText(c)}.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {m?.is_plastic ? <Badge tone="brick">Plastic</Badge> : <Badge tone="moss">Plastic-free</Badge>}
              {m?.curbside_recyclable && <Badge tone="moss">Curbside recyclable</Badge>}
              {c.has_fitted_insert && <Badge tone="forest">Made for one product</Badge>}
              {c.is_estimate && <Badge tone="ochre">Estimate</Badge>}
            </div>
          </div>
          <div className="col-start-2 text-sm sm:col-start-3 sm:text-right">
            <p className="font-semibold text-forest">{priceText(c)}</p>
            <p className="text-muted">{weightText(c)}</p>
            <p className="mt-1 text-forest underline decoration-1 underline-offset-4">
              <span className="group-open:hidden">Show details</span>
              <span className="hidden group-open:inline">Hide details</span>
            </p>
          </div>
        </summary>

        <div className="grid gap-6 pb-6 sm:pl-[112px] md:grid-cols-2">
          <div className="space-y-2 text-sm">
            <h3 className="font-serif text-base font-semibold text-forest">{m?.name ?? c.material}</h3>
            {rate !== undefined && (
              <p>
                {pct(rate)} of this material is recycled from US homes (national residential rate).
              </p>
            )}
            {m && <p>{m.curbside_recyclable ? "Accepted in most curbside recycling bins." : "Not accepted in most curbside bins."}</p>}
            {m?.disposal_text && (
              <p>
                <span className="font-semibold">How to dispose of it: </span>
                {m.disposal_text}
              </p>
            )}
            {m?.why_it_matters && <p className="text-muted">{m.why_it_matters}</p>}
          </div>

          <div className="space-y-2 text-sm">
            <h3 className="font-serif text-base font-semibold text-forest">This product</h3>
            <p>
              <Term id="protection">Protection</Term>: {capitalize(c.protection)}
              {c.has_fitted_insert && c.fitted_insert
                ? `. Insert holds ${c.fitted_insert.cells} item${c.fitted_insert.cells > 1 ? "s" : ""} up to ${c.fitted_insert.cell_length_in} x ${c.fitted_insert.cell_width_in} x ${c.fitted_insert.cell_height_in} in.`
                : "."}
            </p>
            {c.type === "mailer" && <p>The thickest item it holds is an estimate, worked out from its width.</p>}
            {c.shaped_for && (
              <p>
                Shaped for a {c.shaped_for}. Packwise does not know your product&rsquo;s shape, so it never recommends this
                insert; you can still enter it as what you use today.
              </p>
            )}
            {c.weight_range_g && (
              <p>
                Weight is uncertain: published figures run from {c.weight_range_g[0].toLocaleString("en-US")} to{" "}
                {c.weight_range_g[1].toLocaleString("en-US")} g per cubic foot. We use {weightText(c)} until it is weighed.
              </p>
            )}
            <p>
              Recycled content:{" "}
              {c.recycled_content_rate == null
                ? "not stated by the supplier"
                : `${pct(c.recycled_content_rate)}${c.post_consumer_rate != null ? ` (${pct(c.post_consumer_rate)} from consumers)` : ""}`}
              .
            </p>
            <p>
              {c.claim_wording ? (
                <>
                  Supplier says: <q>{c.claim_wording.replace(/^'|'$/g, "")}</q>
                </>
              ) : (
                "No recyclability claim on the supplier page."
              )}
            </p>
            {c.certifications && c.certifications.length > 0 && <p>Certifications: {c.certifications.join(", ")}.</p>}
            <p>
              <a href={c.source_url} target="_blank" rel="noreferrer" className="font-semibold text-forest underline underline-offset-4">
                Supplier page ({c.supplier})
              </a>
              <span className="text-muted">, checked {c.last_checked}</span>
            </p>
            {c.notes && (
              <details className="text-muted">
                <summary className="cursor-pointer text-forest underline underline-offset-4">How we got these numbers</summary>
                <p className="mt-2">{c.notes}</p>
              </details>
            )}
          </div>
        </div>
      </details>
    </li>
  );
}

export function LibraryBrowser({ components, materials }: { components: PackagingComponent[]; materials: Material[] }) {
  const [f, setF] = useState<LibraryFilters>(DEFAULT_FILTERS);
  const counts = useMemo(() => countByType(components), [components]);
  const mat = useMemo(() => new Map(materials.map((m) => [m.id, m])), [materials]);
  const shown = useMemo(() => filterComponents(components, materials, f), [components, materials, f]);
  const usedMaterials = useMemo(() => materials.filter((m) => components.some((c) => c.material === m.id)), [components, materials]);
  const isDefault = filtersToQuery(f) === "";

  // Filters live in the page address: read them once on arrival, then write them on every change. Writing waits
  // until the read has happened, so the address is never wiped before it is read (React runs effects twice in dev).
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time read of the address bar after hydration */
    setF(filtersFromQuery(new URLSearchParams(window.location.search), materials));
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [materials]);
  useEffect(() => {
    if (hydrated) window.history.replaceState(null, "", `${window.location.pathname}${filtersToQuery(f)}`);
  }, [f, hydrated]);

  const set = (patch: Partial<LibraryFilters>) => setF((old) => ({ ...old, ...patch }));

  return (
    <div>
      <div className="space-y-4 border-y border-line bg-surface p-4">
        <fieldset>
          <legend className="sr-only">Type of packaging</legend>
          <div className="flex flex-wrap gap-2">
            {(["all", ...TYPE_ORDER] as const).map((t) => (
              <label key={t} className="cursor-pointer">
                <input type="radio" name="type" checked={f.type === t} onChange={() => set({ type: t })} className="peer sr-only" />
                <span className="block rounded-sm border border-forest px-3 py-1.5 text-sm text-forest hover:bg-forest/10 peer-checked:bg-forest peer-checked:text-paper peer-checked:hover:bg-forest peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-forest">
                  {t === "all" ? "Everything" : TYPE_LABELS[t].many} ({counts[t]})
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-end">
          <label className="text-sm">
            <span className="mb-1 block font-semibold">Search</span>
            <input
              type="search"
              value={f.query}
              placeholder="Try: 12 x 10, jar, kraft"
              onChange={(e) => set({ query: e.target.value.slice(0, 60) })}
              className="w-full rounded-sm border border-line bg-paper px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold">Material</span>
            <select
              value={f.material}
              onChange={(e) => set({ material: e.target.value })}
              className="w-full rounded-sm border border-line bg-paper px-3 py-2"
            >
              <option value="all">All materials</option>
              {usedMaterials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold">Sort</span>
            <select
              value={f.sort}
              onChange={(e) => set({ sort: e.target.value as SortKey })}
              className="w-full rounded-sm border border-line bg-paper px-3 py-2"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 py-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={f.plasticFree}
              onChange={(e) => set({ plasticFree: e.target.checked })}
              className="h-4 w-4 accent-[var(--forest)]"
            />
            Plastic-free only
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-sm">
            Showing <strong>{shown.length}</strong> of {components.length}
          </p>
          {!isDefault && (
            <Button variant="ghost" onClick={() => setF(DEFAULT_FILTERS)}>
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="py-10">
          <p className="text-lg">Nothing in the library matches those filters.</p>
          <Button className="mt-3" variant="secondary" onClick={() => setF(DEFAULT_FILTERS)}>
            Clear filters
          </Button>
        </div>
      ) : (
        <ul className="mt-2">
          {shown.map((c) => (
            <Item key={c.id} c={c} m={mat.get(c.material)} />
          ))}
        </ul>
      )}
    </div>
  );
}
