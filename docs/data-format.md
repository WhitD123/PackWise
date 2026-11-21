# Packwise Data Format

Draft for Tyler and Whitman to approve. Once approved, this file is the contract: Tyler writes data in exactly this shape, and Whitman writes code that reads exactly this shape. Change it only if you both agree.

**All numbers in the examples below are placeholders to show the format. Real values come from research.**

---

## 1. Ground rules

### Units: the unit is always in the field name

Every number field ends with its unit, so nobody ever has to guess. `weight_g` is grams, `price_usd` is dollars, `length_in` is inches.

| What | Unit | Field ending | Why this unit |
| --- | --- | --- | --- |
| Size of boxes, mailers, products | inches | `_in` | US carriers and suppliers use inches |
| Weight of packaging and products | grams | `_g` | Packaging is light; grams avoid tiny decimals, and kitchen scales show grams |
| Shipping weight and state fees | pounds | `_lb` | Carriers and state fee schedules use pounds. Code converts: pounds = grams ÷ 453.592 |
| Money | US dollars | `_usd` | Decimals, like `0.35` |
| Shares and percentages | 0 to 1 | `_rate` | `0.80` means 80% |
| Carbon | kg CO2e per kg of material | `_kg_co2e_per_kg` | How emission factors are published |
| Dates | YYYY-MM-DD | `_date` or in a `date` field | Sorts correctly, no confusion |

### Naming

- **Field names:** lowercase with underscores, like `price_usd` and `is_estimate`.
- **IDs:** lowercase with dashes, unique, and never changed once used, like `poly-mailer-10x13`. Other files point to items by ID, so changing one breaks links.
- **Allowed word lists** (like `type` or `material`) use only the values listed in this file. Adding a new value means updating this file first.

### Every data file carries its source

Any record built from research has `source_url`, `last_checked` (a date), and `is_estimate` (true or false). This feeds SOURCES.md and the "data last updated" note in the app.

---

## 2. Where each file lives

| File | What's in it | Owner |
| --- | --- | --- |
| `data/library/components.json` | Every box, mailer, filler, and wrap the app can recommend | Tyler |
| `data/materials.json` | One record per material: recycling rate, carbon, plastic or not, disposal text | Tyler |
| `data/fees/<state>-<year>.json` (`oregon-2026`, `oregon-2027`, `colorado-2026`, `colorado-2027`; `california.json`) | Fee rate per material for that state and year | Tyler |
| `data/rules/state-coverage.json` | Exemption rules and status for all 50 states plus DC (51 records) | Tyler |
| `data/rules/state-population.json` | Census population per state, used to spread the sample orders | Tyler |
| `data/rules/packing-rules.json` | Cushioning, wrap, box strength and drop-test rules for the box picker (UPS, FedEx, ISTA), each marked sourced or interpretation | Tyler |
| `data/rules/epr-logic.json` | Answers on fee basis, producer definition, candle jars, exemption years, categories, with sources | Tyler |
| `data/samples/demo-products.json` | Maya's 8 oz and 12 oz candles (sourced jar, lid and wax weights) plus jar options | Tyler |
| `data/rules/environment.json` | EU empty-space rule, empty-space and right-sizing benchmarks, reuse studies, void fill densities, impact baseline facts, the 1,000-seller projection formula | Tyler |
| `data/rules/shipping.json` | Carrier size-pricing rules and a simple rate table | Tyler |
| `data/rules/zip3-centroids.json` | Center point (`lat`, `lng`) of each of 896 three-digit ZIP areas, and `n`, the count of ZIPs averaged. Used to estimate USPS zones for any ship-from ZIP other than 972 | Tyler |
| `data/samples/shopify-orders.csv` | Fake order file for the demo | Tyler |
| `src/lib/types.ts` | The same shapes, written in code | Whitman |

**Changes from the original skeleton:** `carbon-factors.json` and `disposal-guidance.json` are merged into one `data/materials.json`, since both describe materials. `box-sizes.json` is not needed, because boxes live in `components.json` with everything else. `carrier-dim-weight.json` is renamed `shipping.json` because it now also holds rates.

---

## 3. Materials (`data/materials.json`)

The fixed list of materials. Every component points to one of these by its `id`. Fees, recycling, carbon, and disposal text all hang off the material, so they're entered once, not 50 times.

### Allowed material IDs

| id | What it covers |
| --- | --- |
| `corrugated` | Corrugated cardboard boxes and pads |
| `kraft-paper` | Paper mailers, kraft paper fill, crinkle paper, tissue |
| `paperboard` | Thin cardboard, folding cartons, chipboard |
| `molded-pulp` | Molded paper inserts and trays |
| `paper-plastic-mix` | Paper bonded to plastic, like bubble-lined kraft mailers |
| `pe-film` | Poly mailers, bubble wrap, air pillows, stretch wrap (HDPE/LDPE film) |
| `pp-film` | Polypropylene film and bags |
| `plastic-laminate` | Multi-layer pouches and other mixed flexible plastic |
| `eps-foam` | Foam packing peanuts, foam inserts |
| `glass` | Glass jars and bottles |
| `aluminum` | Aluminum tins and lids |
| `steel` | Steel tins and lids |

### Fields

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | text | From the list above |
| `name` | text | Display name |
| `is_plastic` | true or false | Counts toward "plastic avoided" |
| `recycle_rate` | 0 to 1 | Share that actually gets recycled, used in the waste score |
| `curbside_recyclable` | true or false | Accepted in most curbside bins, used on the disposal insert |
| `carbon_kg_co2e_per_kg` | number | Emission factor; always an estimate |
| `disposal_text` | text | One sentence for the disposal insert |
| `source_url`, `last_checked`, `is_estimate` | | Required |

### Example

```json
[
  {
    "id": "pe-film",
    "name": "Plastic film (HDPE/LDPE)",
    "is_plastic": true,
    "recycle_rate": 0.05,
    "curbside_recyclable": false,
    "carbon_kg_co2e_per_kg": 2.5,
    "disposal_text": "Not accepted curbside. Return to a store drop-off bin if clean and dry.",
    "source_url": "https://example.com/source",
    "last_checked": "2026-11-20",
    "is_estimate": true
  }
]
```

---

## 4. Packaging components (`data/library/components.json`)

The library: about 50 items the app can recommend. One record per item.

### Allowed `type` values

| type | Meaning | How size works |
| --- | --- | --- |
| `box` | Rigid outer container | Inside dimensions in inches |
| `mailer` | Soft or padded outer bag or envelope | Width and length when flat, plus the thickest item it fits in `height_in` |
| `filler` | Loose void fill (paper, air pillows, peanuts) | Measured per cubic foot of empty space, not per piece |
| `wrap` | Wraps around the product (bubble wrap, paper wrap) | Measured per square foot |
| `insert` | Custom-fit insert (molded pulp, cardboard divider) | Inside dimensions in inches |

### Allowed `protection` values

`low`, `medium`, `high`. How much this item protects on its own. A poly mailer is `low`, a padded mailer is `medium`, and a double-wall box is `high`. Fillers and wraps rate how much cushion they add.

### Fields

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `id` | text | yes | Unique, never changed |
| `name` | text | yes | What sellers see, like "Kraft paper mailer, 10 x 13 in" |
| `type` | text | yes | From the type list |
| `material` | text | yes | A material `id` from section 3 |
| `length_in`, `width_in`, `height_in` | number | boxes, mailers, inserts | Inside size. Mailers: `height_in` = thickest item that fits |
| `unit` | text | yes | `each`, `cubic_ft` (fillers), or `square_ft` (wraps) |
| `weight_g` | number | yes | Weight of one unit |
| `price_usd` | number | yes | Price of one unit |
| `price_basis_qty` | number | yes | The order quantity that price assumes, like 500 |
| `protection` | text | yes | `low`, `medium`, or `high` |
| `recycle_rate` | 0 to 1 | no | Only if this item differs from its material's default |
| `supplier` | text | yes | Like "Uline" or "EcoEnclose" |
| `source_url` | link | yes | The product page |
| `is_estimate` | true or false | yes | `true` if weight or price was estimated |
| `last_checked` | date | yes | When you looked it up |
| `notes` | text | no | Anything odd, like "weight estimated from dimensions" |

### Example

```json
[
  {
    "id": "poly-mailer-10x13",
    "name": "Poly mailer, 10 x 13 in",
    "type": "mailer",
    "material": "pe-film",
    "length_in": 13,
    "width_in": 10,
    "height_in": 2,
    "unit": "each",
    "weight_g": 15,
    "price_usd": 0.12,
    "price_basis_qty": 500,
    "protection": "low",
    "supplier": "Uline",
    "source_url": "https://example.com/product",
    "is_estimate": false,
    "last_checked": "2026-11-20"
  },
  {
    "id": "box-8x6x6-single",
    "name": "Corrugated box, 8 x 6 x 6 in, single wall",
    "type": "box",
    "material": "corrugated",
    "length_in": 8,
    "width_in": 6,
    "height_in": 6,
    "unit": "each",
    "weight_g": 110,
    "price_usd": 0.55,
    "price_basis_qty": 500,
    "protection": "high",
    "supplier": "Uline",
    "source_url": "https://example.com/product",
    "is_estimate": true,
    "last_checked": "2026-11-20",
    "notes": "Weight estimated from board area"
  },
  {
    "id": "crinkle-paper-fill",
    "name": "Crinkle paper fill",
    "type": "filler",
    "material": "kraft-paper",
    "unit": "cubic_ft",
    "weight_g": 140,
    "price_usd": 0.40,
    "price_basis_qty": 1,
    "protection": "medium",
    "supplier": "EcoEnclose",
    "source_url": "https://example.com/product",
    "is_estimate": true,
    "last_checked": "2026-11-20"
  }
]
```

### What the library needs to cover

About 30 items for the candle and glass-jar demo, plus about 20 general items:

- **Mailers:** poly, paper, padded paper, bubble-lined, in 3 to 4 sizes each
- **Boxes:** single wall and double wall, in the 6 to 8 standard sizes small sellers use most
- **Fillers:** air pillows, packing peanuts, crinkle paper, kraft paper sheets
- **Wraps:** bubble wrap, paper honeycomb wrap
- **Inserts:** molded pulp jar insert, cardboard divider

---

## 5. State fee rates (`data/fees/<state>.json`)

One file per state that has published rates. File names are lowercase state names plus the program year: `oregon-2026.json`, `oregon-2027.json`, `colorado-2026.json`, `colorado-2027.json`, and `california.json` (proposed 2027). Rates are keyed by **our** material IDs, so the code never needs each state's own category names. The state's official name is kept alongside for checking.

### Fields

| Field | Type | Meaning |
| --- | --- | --- |
| `state` | text | Two-letter code, like `OR` |
| `program_year` | number | The year these rates apply to, like `2026` |
| `status` | text | `final` or `proposed` |
| `unit` | text | Always `usd_per_lb` |
| `rates` | object | One entry per material ID |
| `rates.<material>.rate_usd_per_lb` | number | The fee |
| `rates.<material>.official_category` | text | The state's own name for it |
| `source_url`, `last_checked`, `notes` | | Required |

If a material isn't in a state's schedule, leave it out. The code treats a missing material as "no rate found" and shows a warning, never zero.

### Example

```json
{
  "state": "OR",
  "program_year": 2026,
  "status": "final",
  "unit": "usd_per_lb",
  "rates": {
    "corrugated": { "rate_usd_per_lb": 0.08, "official_category": "Corrugated cardboard" },
    "pe-film": { "rate_usd_per_lb": 0.43, "official_category": "HDPE/LDPE flexible and film items" }
  },
  "source_url": "https://example.com/schedule",
  "last_checked": "2026-11-20",
  "notes": "Rates from secondary source until the official schedule is confirmed"
}
```

---

## 6. State coverage rules (`data/rules/state-coverage.json`)

One record for every state plus DC (51 records). States without a packaging EPR law are listed with `law_status` set to `none`, so the app can say "no packaging law yet" with a source and date.

### Allowed `law_status` values

- `fees_active`: producers are being billed (Oregon, Colorado)
- `fees_upcoming`: law passed, fees not billed yet
- `registration_only`: must register, no fees yet
- `none`: no enacted packaging EPR law. Thresholds are `null`, `key_dates` is empty, and `fee_file` is `null`

### Fields

| Field | Type | Meaning |
| --- | --- | --- |
| `state` | text | Two-letter code |
| `name` | text | Full state name |
| `law_name` | text | Like "SB 582" |
| `law_status` | text | From the list above |
| `revenue_threshold_usd` | number | Exempt if revenue is below this |
| `revenue_scope` | text | `global` (all sales everywhere) or `in_state` (sales in that state only) |
| `weight_threshold_lb` | number or null | Exempt if packaging shipped into the state is below this. 1 metric ton = 2204.6, 1 short ton = 2000. `null` if no weight test |
| `exempt_if` | text | `any_test` (passing either test exempts) or `revenue_only` |
| `application_required` | true or false | Must apply to claim the exemption (California) |
| `key_dates` | list | Each one is `{ "date": "YYYY-MM-DD", "event": "text" }` |
| `fee_file` | text or null | Like `oregon.json`, or `null` if no rates yet |
| `source_url`, `last_checked`, `notes` | | Required |

### Example

```json
[
  {
    "state": "OR",
    "name": "Oregon",
    "law_name": "SB 582",
    "law_status": "fees_active",
    "revenue_threshold_usd": 5000000,
    "revenue_scope": "global",
    "weight_threshold_lb": 2204.6,
    "exempt_if": "any_test",
    "application_required": false,
    "key_dates": [
      { "date": "2025-07-01", "event": "Fees began" }
    ],
    "fee_file": "oregon.json",
    "source_url": "https://example.com/statute",
    "last_checked": "2026-11-20",
    "notes": "Revenues of associated companies are added together"
  }
]
```

---

## 7. Shipping rules (`data/rules/shipping.json`)

What right-sizing needs to turn a box size into a shipping cost. Carriers charge for whichever is bigger: the real weight, or the "dimensional weight" calculated from the box's size.

```
dimensional weight (lb) = length_in × width_in × height_in ÷ divisor
billable weight (lb) = the larger of actual weight and dimensional weight, rounded up to the next whole pound
```

To keep this simple, use one carrier service and one typical shipping distance (zone) for the whole app, and state that assumption in the app.

### Fields

| Field | Type | Meaning |
| --- | --- | --- |
| `carrier` | text | Like "USPS" |
| `service` | text | Like "Ground Advantage" |
| `zone_assumption` | text | Like "Zone 5, a typical cross-country distance" |
| `dim_divisor` | number | From the carrier's rules |
| `dim_applies_above_cubic_in` | number or null | Some carriers only apply dimensional weight above a box size; `null` if always |
| `rates` | list | `{ "max_lb": number, "price_usd": number }`, sorted smallest first |
| `source_url`, `last_checked` | | Required |

### Example

```json
{
  "carrier": "USPS",
  "service": "Ground Advantage",
  "zone_assumption": "Zone 5",
  "dim_divisor": 166,
  "dim_applies_above_cubic_in": 1728,
  "rates": [
    { "max_lb": 1, "price_usd": 7.00 },
    { "max_lb": 2, "price_usd": 8.50 },
    { "max_lb": 3, "price_usd": 9.75 }
  ],
  "source_url": "https://example.com/rates",
  "last_checked": "2026-11-20"
}
```

The divisor, size threshold, and prices above are placeholders. Look them up.

---

## 8. Sample order file (`data/samples/shopify-orders.csv`)

A fake order history for the demo seller. The column names copy a real Shopify order export, so the same reader would work on a real one. Real exports have many more columns; the code reads only these.

| Column | Meaning |
| --- | --- |
| `Name` | Order number, like `#1001` |
| `Created at` | Order date, like `2026-03-14` |
| `Shipping Province` | Two-letter state, like `OR` |
| `Lineitem name` | Product name |
| `Lineitem quantity` | How many of that product |
| `Subtotal` | Order total before shipping, in dollars |

```csv
Name,Created at,Shipping Province,Lineitem name,Lineitem quantity,Subtotal
#1001,2026-03-14,OR,Cedar & Smoke Candle 8oz,1,32.00
#1002,2026-03-14,CA,Cedar & Smoke Candle 8oz,2,64.00
#1003,2026-03-15,TX,Linen Candle 12oz,1,38.00
```

For the demo: about 1,000 to 2,000 rows spread across states roughly by population, with enough Oregon orders that Maya's packaging tops 1 metric ton (2,204.6 lb) a year there. Remember the file covers a sample period, so the code scales it up to a full year.

---

## 9. Shapes passed between code (`src/lib/types.ts`)

These aren't data files. They're what one piece of code hands to another. Agreeing on them lets each of you build alone: Whitman can write a fake version of any function with the right shape, then swap in the real one later.

### The product being shipped (from the planner)

| Field | Type | Meaning |
| --- | --- | --- |
| `name` | text | Like "8 oz candle in glass jar" |
| `length_in`, `width_in`, `height_in` | number | Product size |
| `weight_g` | number | Product weight |
| `fragility` | text | `low`, `medium`, or `high` |
| `items_per_order` | number | Usually 1 |

### A packaging setup (one option to score)

| Field | Type | Meaning |
| --- | --- | --- |
| `outer_id` | text | The box or mailer, a component `id` |
| `fill_id` | text or null | Filler, if any |
| `wrap_id` | text or null | Wrap, if any |
| `insert_id` | text or null | Insert, if any |

### Score result (what scoring gives back)

| Field | Meaning |
| --- | --- |
| `cost.usd_per_order` and `cost.score` | Packaging plus shipping per order; 0 to 10 |
| `protection.level` and `protection.score` | `low`, `medium`, or `high`; 0 to 10 |
| `waste.landfill_g_per_order` and `waste.score` | Grams likely landfilled; 0 to 10 |
| `fees.usd_per_year` and `fees.score` | State fees for the seller's volume; 0 to 10 |
| `carbon.kg_co2e_per_order` and `carbon.score` | Carbon per order; 0 to 10 |
| `plastic_g_per_order` | Grams of plastic, for "plastic avoided" |
| `overall` | Weighted total, 0 to 10 |

### Coverage result (one per state)

| Field | Meaning |
| --- | --- |
| `state` | Two-letter code |
| `result` | `covered`, `exempt`, `no_law`, or `apply_for_exemption` |
| `reason` | One plain sentence, like "Exempt: revenue under $5M" |
| `fee_usd_per_year` | Estimated fee, or null if exempt or no rates |
| `fee_status` | `final`, `proposed`, or `none` |

### Swap (what swaps give back)

| Field | Meaning |
| --- | --- |
| `from` and `to` | Two packaging setups |
| `usd_saved_per_year` | Negative if it costs more |
| `plastic_avoided_lb_per_year` | Pounds of plastic removed per year |
| `score_change` | New overall minus old overall |
| `tradeoffs` | A list of short sentences, like "Costs 5 cents more per order" |

---

## 10. Decisions to approve in the kickoff

- [ ] Units as listed in section 1
- [ ] The 12 material IDs (add or remove any?)
- [ ] The 5 component types and 3 protection levels
- [ ] Fillers priced per cubic foot and wraps per square foot
- [ ] One carrier, one service, and one zone for shipping cost
- [ ] Shopify column names for the order file
- [ ] The shapes in section 9
- [ ] Merging carbon and disposal data into `materials.json`

---

## 11. Changes made after the research (approve at kickoff)

The research found a few things the first draft did not plan for. These are already in the data files.

**Materials (section 3).** Each record also has: `recycle_rate_year`, `recycle_rate_is_estimate`, `recycle_rate_source_url`, `curbside_basis`, `carbon_boundary` (what the carbon number covers), `carbon_source_url`, `eol_split` (`recycled_rate`, `combusted_rate`, `landfilled_rate`, `data_year`, `status`, `basis`; null for paper-plastic-mix), `how2recycle_label`, `contamination_notes`, and `why_it_matters` (one sentence for the app). Recommended: add a 13th material ID `compostable-film`, since the compostable mailer is filed under `plastic-laminate` for now. Needs approval.

**Components (section 4).** Six new fields, null unless the supplier page states the value: `recycled_content_rate`, `post_consumer_rate`, `recyclability_claim` (`curbside`, `store_drop_off`, `compostable`, `not_recyclable`, `recyclable_unspecified`), `claim_wording` (exact quote), `certifications` (list), `reusable`. Mailer `height_in` is estimated as (width minus 0.5) divided by 2, so the fit check should also test item width plus item height against mailer width.

**Fees (section 5).** Each rate entry also has `base_rate_usd_per_lb`, `acceptance`, and `rate_usd_per_lb` can be **negative** (Oregon 2027 aluminum is a credit of 0.09). Each file has `source_type` (`primary` or `secondary`), a `modulation` block (bonus and discount rules), and `official_schedule_url`. California also has `plastic_component_fees`. Oregon 2027 final rates are base rates minus a one-time reserve return, so show both.

**State coverage (section 6).** 51 records. `law_status` is one of `fees_active`, `fees_upcoming`, `registration_only`, `none`. `fee_file` points at the latest year file. Oregon is confirmed by DEQ; Colorado's dollar figure is not (see Could_Not_Confirm).

**Shipping (section 7).** DIM divisor is 139 (since 2026-07-12), applied above 1,728 cubic inches. Prices are Zone 5 USPS Ground Advantage commercial, effective 2026-10-04, temporary holiday prices through 2027-01-17. Under 1 lb uses four ounce tiers priced the same.

**Sample orders (section 8).** 2,100 fake orders for the week 2026-10-05 to 2026-10-11, about $157,000 of sales, which is about $8.2M a year when multiplied by 52. Oregon (8%) and California (15%) are deliberately over-represented so Maya clearly passes Oregon's 1 metric ton test and California's $1M test; the other states follow population.

### Environmental research update (2026-11-16, later the same day)

**Materials.** `recycle_rate` now uses one method for all 12 materials: The Recycling Partnership's national residential recycling rate (State of Recycling 2024, Figure 14), the share of each material thrown out by US households that actually gets recycled. The old EPA 2018 all-sector value is kept as `recycle_rate_epa_2018`. New fields: `recycle_rate_metric`, `recycle_rate_reason`, `recycle_rate_options` (every candidate figure with its source), `recycled_content_typical`, `recyclability_guidance`.

**Carbon.** `carbon_kg_co2e_per_kg` is now cradle-to-gate for the finished form where a source exists (plastic film includes forming). The old value is kept as `carbon_previous_warm_v16_virgin`. New fields: `carbon_is_estimate`, `carbon_reason`, `carbon_options`, and `eol_kg_co2e_per_kg` with `landfill`, `recycling` and `combustion` (EPA Emission Factors Hub 2025, no credits, landfill methane included). Suggested lifecycle factor for the carbon score: `carbon + recycle_rate x recycling + (1 - recycle_rate) x landfill` (treat a null recycling factor as 0).

**Components.** The two paper fillers have `weight_range_g`: crinkle 660 to 1,296, crumpled kraft 60 to 297. Show the range until they are weighed.

**New file `data/rules/environment.json`.** Keys: `eu_empty_space` (50% limit, Article 24 of Regulation (EU) 2025/40; filler counts as empty space), `empty_space_benchmarks`, `reuse`, `void_fill_density`, `void_fill_recommended`, `impact_baseline` (33 sourced facts), `projection` (formula and caveats), `writeup_problem_statement`, `recycling_method_note`, `carbon_method_note`.

**For Whitman's right-sizing code.** Empty space ratio = (box volume minus product volume) / box volume, compared against 0.5. USPS Ground Advantage applies dimensional weight only above 1,728 cubic inches, so for small boxes the shipping saving comes from dropping a price tier, not from dimensional weight.

### Round 3 update (2026-11-16, night)

**Shipping (`shipping.json`).** New `weight_rates_by_zone` (zones 1 to 9) and `cubic` (USPS Ground Advantage Cubic: commercial postage only; 1 cu ft or less, 20 lb or less, longest side 22 in or less; round each OUTSIDE dimension down to 1/4 in, multiply, divide by 1,728, use the lowest 0.1 tier that fits; soft packs use length plus width). The price shown should be the lower of the weight price and the Cubic price when eligible. `zones_from_origin` (Portland, 972) is pending; use Zone 5 and label it until filled.

**Components.** New fields `has_fitted_insert` (true for jar shipper boxes with built-in inserts) and, where the supplier lists them, `outside_length_in`, `outside_width_in`, `outside_height_in`. If outside dimensions are missing, use inside + 0.25 in and label it an estimate. Six Flush Packaging candle shipper boxes were added.

**Box picker rules (`packing-rules.json`).** For glass: at least 2 in of clearance per side (UPS), so inside dimensions must be at least the item plus 4 in, unless the box has a fitted insert made for that jar. Wrap each glass item. Reuse 2 in between jars (no source gives a number). Box strength by package weight: 32 ECT up to 30 lb. Say "designed for the ISTA 3A drop profile", never "passes".

**Coverage check (`state-coverage.json`, `epr-logic.json`).** New fields: `revenue_year_basis`, `weight_year_basis`, `shipping_packaging_producer`, `state_allocation_basis`, `fee_data_year_lag` (OR and CO bill year Y on year Y-2 data), `candle_jar_status`, `revenue_threshold_confidence`. Compute each state's weight from the seller's own ship-to data; population share is only a labeled fallback. A seller who packs and ships its own orders is the producer of the jar packaging and the shipping box and fill. Count the candle jar as likely covered glass and offer a toggle.

## Zones update (2026-11-16)

`data/rules/shipping.json` now has real zones. `zone_assumption` no longer means "Zone 5 for everyone": it describes the zones listed below.

`zones_from_origin` (origin ZIP3 `972`, Portland OR, from the USPS Domestic Zone Chart):

| Field | Type | Meaning |
| --- | --- | --- |
| `status` | text | `filled` |
| `states` | object | Keyed by 2-letter state code (51 jurisdictions). Each has `city` (largest metro), `dest_zip3`, `zone` (1 to 9, the zone of that metro), `zones_in_state` (every zone in the state), `zone_marker` (`*`, `+` or null) |
| `zip3_ranges` | list | The full chart: `{ "from_zip3", "to_zip3", "zone", "marker" }` for each of the 3-digit ZIP ranges, if you want a per-ZIP lookup instead of per-state |

How to use it: for a destination state, `weight_rates_by_zone[...].prices_by_zone[str(zone)]` and `cubic.tiers[...].prices_by_zone[str(zone)]`. If the user gives a ZIP, look up its first three digits in `zip3_ranges` for a more exact zone.

Things to know:
- 56% of the sample orders land in Zone 8 (the East Coast and most of the South and Midwest). Zone 5 is only about 20%. Price with the real zone, not a flat Zone 5.
- Oregon is Zone 1 from Portland, but the rest of the state is Zones 1 to 3. The state value uses Portland.
- The chart marks some ranges with `*` (Oregon, Washington) and `+` (APO/FPO, Guam). We did not copy the legend, so the markers are stored but not interpreted.
- Hawaii ZIP3 967 is not listed except 96700, so Hawaii uses 968 (Zone 8).
- The chart is valid only for origin 972. A different ship-from ZIP needs a different chart.

Workbook change: new `State_Zones` tab; Swap_Demo now prices shipping across the sample's zone mix, uses all 109,200 sample orders per year, and applies the EPR fee only to orders delivered into the fee state.


---

## Update 2026-11-20: fitted-insert boxes

Components with `has_fitted_insert: true` (7 jar shipper boxes) also carry a structured `fitted_insert` object, read from each box's own notes (the Flush Packaging page lists the insert cell size):

| Field | Meaning |
| --- | --- |
| `fitted_insert.cells` | How many jars the insert holds (1, 2, 3 or 4) |
| `fitted_insert.cell_length_in`, `cell_width_in`, `cell_height_in` | Size of one cell, inches |
| `fitted_insert.source` | Where the numbers came from |

The clearance rule is skipped only when every item fits a cell (the two smaller item sizes fit the cell and are at most 0.75 in smaller; the tallest fits the box's inside height) and the order has no more items than cells. A fitted box is safe for the jars it is made for, not for any product that fits inside it.

## Update 2026-11-21: ship-from ZIP and estimated zones

The seller's ship-from ZIP drives the shipping zone. `PlannerInput.shipFromZip` holds five digits and only the first three are used. Not set means the demo's Portland (972); an empty string means "left blank".

`getZone` in `src/lib/shipping/getZone.ts` is the only place a zone is decided:

- **exact:** the ship-from ZIP3 is the origin in `shipping.json` (`zones_from_origin.origin_zip3`, 972). The zone comes from the real USPS chart: `zip3_ranges` when a destination ZIP is known, `states[XX].zone` when only the state is known.
- **estimated:** any other origin. The zone comes from the straight-line distance between two ZIP3 centers (`zip3-centroids.json`) and the USPS distance bands. A state stands in for its anchor ZIP3, `states[XX].dest_zip3`.
- **assumed:** no usable origin or destination. Zone 5, labelled "assumed". Zone 5 is a fallback, not a typical zone: from Portland, 56% of the sample orders are Zone 8 and about 20% are Zone 5.

Zone 9 is priced as Zone 8. The estimate never returns 9. `EvaluatedSetup.zoneLabel` is `"exact" | "estimated" | "assumed"`. Accuracy against real USPS charts and the known limits are in `docs/findings-zones.md`.

`zip3-centroids.json` is a new file: `{ "<zip3>": { "lat": number, "lng": number, "n": number } }`. Built from the Census ZCTA centers in the npm package `us-zips` (MIT, version 2022.9.1). Owner: Tyler.

## Update 2026-11-21: uploading a Shopify order export

The planner's shipping step accepts a seller's own Shopify order export (CSV, up to 25 MB). It is read in the browser with `parseShopifyCsv` and is never sent to a server. Only the six columns in section 8 are read.

`ordersFromParsedFile` (in `src/lib/planner/plannerInput.ts`) turns the parsed file into planner answers, the same fields the sample file fills in: `ordersPerYear`, `statePercent` (fee states), `orderStatePercent` (all states, for shipping zones), `revenueUsd` and `californiaSalesUsd`, plus `ordersNote`, a line saying where the numbers came from.

- **Scaling:** counts and dollars are scaled from the period the file covers to 364 days (52 weeks). A one-week file scales by 52, a two-week file by 26, matching the sample file and the answer key.
- **Revenue** is the sum of order subtotals (before shipping), scaled to a year. It feeds the state exemption tests.
- **Warnings shown to the seller:** rows skipped (no order number, date, quantity or two-letter state), a file under 7 days, orders to states outside the 50 states and DC (counted for volume, not for zones or state laws), and orders with more than one item (the planner sizes packaging for the products described in the planner, so items per order should match a typical order).
- **Product packaging:** the jar and lid (`productPackaging`) belong to Maya's candle. They count toward fees only while the planner still describes her unchanged 12 oz candle (`productPackagingOf`).
