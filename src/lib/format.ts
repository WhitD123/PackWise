// Number formatting shared by the screens.

export function usd(n: number, digits = 2): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function usdWhole(n: number): string {
  return usd(n, 0);
}

export function num(n: number, digits = 0): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function grams(g: number): string {
  if (g === 0) return "0 g";
  return g >= 1000 ? `${num(g / 1000, 2)} kg` : `${num(g, g < 10 ? 1 : 0)} g`;
}

export function pounds(lb: number): string {
  return `${num(lb, Math.abs(lb) < 10 ? 1 : 0)} lb`;
}

export function dims(d: { length: number; width: number; height: number }): string {
  return d.height > 0 ? `${num(d.length, 1)} x ${num(d.width, 1)} x ${num(d.height, 1)} in` : `${num(d.length, 1)} x ${num(d.width, 1)} in`;
}
