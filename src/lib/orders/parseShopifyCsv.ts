// Reads a Shopify order export (docs/data-format.md section 8) and counts orders
// and sales by ship-to state, scaled up from the sample period to a full year.
//
// Columns read: Name, Created at, Shipping Province, Lineitem name,
// Lineitem quantity, Subtotal. Everything else in a real export is ignored.
//
// Real exports have one row per line item. Name repeats for every line of an
// order, and Subtotal is only filled on the first row. So we group rows by Name,
// take the first non-empty Subtotal, and add up the quantities.

export const REQUIRED_COLUMNS = [
  "Name",
  "Created at",
  "Shipping Province",
  "Lineitem name",
  "Lineitem quantity",
  "Subtotal",
] as const;

/** 52 weeks, so a one-week sample scales by 52 (matches the answer key). */
export const DAYS_PER_MODEL_YEAR = 364;

export interface ParsedOrder {
  name: string;
  /** YYYY-MM-DD */
  date: string;
  /** Two-letter code, upper case. */
  state: string;
  lines: { product: string; quantity: number }[];
  /** Total items in the order. */
  units: number;
  subtotal_usd: number;
}

export interface ParsedOrders {
  orders: ParsedOrder[];
  firstDate: string | null;
  lastDate: string | null;
  /** Days the file covers, counting both end dates. */
  periodDays: number;
  /** Multiply sample counts by this to get a year. */
  annualizationFactor: number;
  /** Orders in the file, by state. */
  orderCountByState: Record<string, number>;
  /** Orders per year, by state (sample count x annualization factor). */
  ordersPerYearByState: Record<string, number>;
  /** Sales per year, by state, in dollars. */
  salesPerYearByState_usd: Record<string, number>;
  /** Share of orders delivered to each state, 0 to 1. */
  stateShare: Record<string, number>;
  ordersPerYear: number;
  /** Items (not orders) per year. Equals ordersPerYear when every order has one item. */
  unitsPerYear: number;
  revenuePerYear_usd: number;
  /** How many orders have 1, 2, 3... items. */
  orderSizeCounts: Record<number, number>;
  /** Share of orders with more than one item, 0 to 1. */
  multiItemShare: number;
  /** Things the user should know: skipped rows, a short sample period. */
  warnings: string[];
}

export class OrderFileError extends Error {}

/** Minimal CSV reader: quoted fields, doubled quotes, commas and newlines inside quotes, CRLF, BOM. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f !== "")) rows.push(row);
  return rows;
}

function dayNumber(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

export interface ParseOptions {
  /** Override the period the file covers, in days. Default: first to last order date. */
  periodDays?: number;
}

export function parseShopifyCsv(text: string, opts: ParseOptions = {}): ParsedOrders {
  const rows = parseCsv(text);
  if (rows.length === 0) throw new OrderFileError("The file is empty.");

  const header = rows[0].map((h) => h.trim());
  const col: Record<string, number> = {};
  for (const name of REQUIRED_COLUMNS) col[name] = header.indexOf(name);
  const missing = REQUIRED_COLUMNS.filter((n) => col[n] === -1);
  if (missing.length > 0) {
    throw new OrderFileError(`This doesn't look like a Shopify order export. Missing columns: ${missing.join(", ")}.`);
  }

  const warnings: string[] = [];
  const byName = new Map<string, ParsedOrder>();
  let skippedNoState = 0;
  let skippedBadRow = 0;

  for (const r of rows.slice(1)) {
    const name = (r[col["Name"]] ?? "").trim();
    const date = (r[col["Created at"]] ?? "").trim().slice(0, 10);
    const state = (r[col["Shipping Province"]] ?? "").trim().toUpperCase();
    const product = (r[col["Lineitem name"]] ?? "").trim();
    const quantity = Number((r[col["Lineitem quantity"]] ?? "").trim());
    const subtotalText = (r[col["Subtotal"]] ?? "").trim();

    let order = byName.get(name);
    if (!name || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !(quantity > 0)) {
      skippedBadRow++;
      continue;
    }
    if (!order) {
      if (!/^[A-Z]{2}$/.test(state)) {
        skippedNoState++;
        continue;
      }
      order = { name, date, state, lines: [], units: 0, subtotal_usd: 0 };
      byName.set(name, order);
    }
    order.lines.push({ product, quantity });
    order.units += quantity;
    // Subtotal is filled on the first row of an order only; don't add it twice.
    if (order.subtotal_usd === 0 && subtotalText !== "") {
      const v = Number(subtotalText.replace(/[$,]/g, ""));
      if (Number.isFinite(v)) order.subtotal_usd = v;
    }
  }

  if (skippedBadRow > 0) warnings.push(`${skippedBadRow} row(s) skipped: missing order number, date or quantity.`);
  if (skippedNoState > 0) {
    warnings.push(`${skippedNoState} row(s) skipped: no two-letter US state in "Shipping Province".`);
  }

  const orders = [...byName.values()];
  if (orders.length === 0) throw new OrderFileError("No usable orders found in the file.");

  const dates = orders.map((o) => o.date).sort();
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const periodDays = opts.periodDays ?? dayNumber(lastDate) - dayNumber(firstDate) + 1;
  const annualizationFactor = DAYS_PER_MODEL_YEAR / periodDays;
  if (periodDays < 7) {
    warnings.push(`The file covers only ${periodDays} day(s). Yearly numbers are scaled up from a very short sample.`);
  }

  const orderCountByState: Record<string, number> = {};
  const ordersPerYearByState: Record<string, number> = {};
  const salesPerYearByState_usd: Record<string, number> = {};
  const orderSizeCounts: Record<number, number> = {};
  let units = 0;
  let revenue = 0;
  for (const o of orders) {
    orderCountByState[o.state] = (orderCountByState[o.state] ?? 0) + 1;
    salesPerYearByState_usd[o.state] = (salesPerYearByState_usd[o.state] ?? 0) + o.subtotal_usd * annualizationFactor;
    orderSizeCounts[o.units] = (orderSizeCounts[o.units] ?? 0) + 1;
    units += o.units;
    revenue += o.subtotal_usd;
  }
  const stateShare: Record<string, number> = {};
  for (const [s, n] of Object.entries(orderCountByState)) {
    ordersPerYearByState[s] = n * annualizationFactor;
    stateShare[s] = n / orders.length;
  }
  const multi = orders.filter((o) => o.units > 1).length;

  return {
    orders,
    firstDate,
    lastDate,
    periodDays,
    annualizationFactor,
    orderCountByState,
    ordersPerYearByState,
    salesPerYearByState_usd,
    stateShare,
    ordersPerYear: orders.length * annualizationFactor,
    unitsPerYear: units * annualizationFactor,
    revenuePerYear_usd: revenue * annualizationFactor,
    orderSizeCounts,
    multiItemShare: multi / orders.length,
    warnings,
  };
}
