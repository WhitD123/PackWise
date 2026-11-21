# Findings: estimated USPS zones for any ship-from ZIP

Written 2026-11-21. Code: `src/lib/shipping/estimateZone.ts` and `src/lib/shipping/getZone.ts`. Tests: `tests/zones.test.ts`.

## The question

Shipping prices depend on the USPS zone between the ship-from ZIP and each destination. We hold the exact chart for one origin only (972, Portland). A seller who ships from anywhere else would get Portland's zones, which is wrong. We need a zone for any ship-from ZIP, and we must say when it is an estimate.

## Method

USPS defines a zone by the distance between the centers of two 3-digit ZIP areas (DMM G030). We store each ZIP3 area's center point (`data/rules/zip3-centroids.json`, 896 areas), measure the straight-line distance, and apply the distance bands:

| Distance (miles) | Zone |
| --- | --- |
| Same ZIP3 area | 1 |
| Up to 150 | 2 |
| Up to 300 | 3 |
| Up to 600 | 4 |
| Up to 1,000 | 5 |
| Up to 1,400 | 6 |
| Up to 1,800 | 7 |
| Over 1,800 | 8 |

When only the destination state is known (the Shopify export has `Shipping Province` and no ZIP), the state stands in for its anchor ZIP3, the area of its largest metro (`zones_from_origin.states[XX].dest_zip3` in `shipping.json`).

## Where each zone comes from

| Case | Zone | Label shown |
| --- | --- | --- |
| Ship-from ZIP3 is 972 | The real USPS chart in `shipping.json` | Exact USPS zone |
| Any other ship-from ZIP | The distance estimate above | Estimated zone, typically within one zone of USPS's chart |
| Blank or unknown ship-from ZIP, or unknown destination | Zone 5 | Zone assumed (add your ship-from ZIP for a better estimate) |

Zone 5 is a fallback, not a typical zone. Zone 9 (ZIP3 969, Guam and nearby) is priced as Zone 8, because the price table gives them the same price. The estimate never returns 9.

## How accurate is it

Tested against the real USPS charts for three origins, copied 2026-11-17 (`tests/fixtures/usps-zone-charts.json`). The test compares the estimate with the chart for every ZIP3 area that the chart lists (894 per origin, Zone 9 left out).

| Ship-from | Exact zone match | Within one zone | Worst miss |
| --- | --- | --- | --- |
| Portland (972) | 98.9% | 100% | 1 zone |
| Houston (770) | 98.1% | 100% | 1 zone |
| New York (100) | 93.4% | 100% | 1 zone |

Most New York misses are USPS Zone 1 areas estimated as Zone 2, which cost about the same. The test asserts the exact-match minimums (97% for 972 and 770, 93% for 100) and that no estimate is more than 2 zones off; the table shows the measured values. The price error (about 1 cent from Portland, 2 cents from Houston and 3 cents from New York for a 2 lb package, about 1 cent per package weighted by the sample orders) comes from the research session's earlier check and is not recomputed by a test.

Example (the sample order mix, shipped from other ZIPs): the fitted jar box costs $9.98 per order from Portland (exact), $9.23 from Atlanta (30303, estimated), $9.41 from New York (10001, estimated) and $9.46 from Houston (77001, estimated).

## Known limits

- Validated from only three origins (West coast, Gulf coast, Northeast). Midwest and Mountain origins are untested.
- USPS Zone 1 covers specific ZIP groups, not only distance, so a real Zone 1 can come out as Zone 2.
- Alaska, Hawaii, territories and Zone 9 are not modelled beyond the Portland chart.
- The distance bands come from a 2004 archived Domestic Mail Manual page. USPS says its charts update quarterly.
- The estimate is not a quote. The app always labels it "Estimated zone".
- Scope line for the app: shipping estimates cover the 50 states and DC, USPS Ground Advantage only.

## Sources

See `SOURCES.md`, section "Ship-from ZIP and estimated zones": the USPS zone chart FAQ, the DMM G030 archive page, the USPS zone charts for origins 100 and 770, and `us-zips` (MIT, Census ZCTA centers).
