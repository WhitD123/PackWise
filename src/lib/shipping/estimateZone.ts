// Estimates the USPS Ground Advantage zone between two 3-digit ZIP areas.
// USPS defines zones by distance between ZIP3 area centers (DMM G030). We measure the
// straight-line distance between ZIP3 centers and apply the DMM distance bands.
// Validated against real USPS zone charts for origins 972, 100 and 770: see docs/findings-zones.md.
// Always label the result "Estimated zone". It is not a quote.
//
// Known limits:
//   - Validated from only three origins (West coast, Gulf coast, Northeast). Midwest and Mountain origins are untested.
//   - USPS Zone 1 covers specific ZIP groups, not only distance, so a real Zone 1 can come out as Zone 2 here.
//   - Alaska, Hawaii, territories and Zone 9 are not modelled beyond the Portland chart in shipping.json.
//   - The distance bands come from a 2004 archived Domestic Mail Manual page; USPS says its charts update quarterly.
import centroids from "../../../data/rules/zip3-centroids.json" with { type: "json" };

type Centroid = { lat: number; lng: number; n: number };
const ZIP3 = centroids as Record<string, Centroid>;

// [upper limit in miles, zone]. Anything beyond the last band is zone 8.
export const ZONE_BANDS: ReadonlyArray<readonly [number, number]> = [
  [150, 2],
  [300, 3],
  [600, 4],
  [1000, 5],
  [1400, 6],
  [1800, 7],
];

export function milesBetween(a: Centroid, b: Centroid): number {
  const R = 3958.8; // Earth radius in miles
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export type ZoneEstimate = { zone: number; miles: number; estimated: true };

/** True if we have a center point for this 3-digit ZIP area. */
export function knowsZip3(zip: string): boolean {
  return ZIP3[zip.slice(0, 3)] !== undefined;
}

/** originZip and destZip can be 3 or 5 digits; only the first 3 are used. Returns null if either is unknown. */
export function estimateZone(originZip: string, destZip: string): ZoneEstimate | null {
  const o = originZip.slice(0, 3);
  const d = destZip.slice(0, 3);
  const a = ZIP3[o];
  const b = ZIP3[d];
  if (!a || !b) return null;
  if (o === d) return { zone: 1, miles: 0, estimated: true };
  const miles = milesBetween(a, b);
  const hit = ZONE_BANDS.find(([limit]) => miles <= limit);
  return { zone: hit ? hit[1] : 8, miles: Math.round(miles), estimated: true };
}
