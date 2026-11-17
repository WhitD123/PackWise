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
| `data/fees/oregon.json` (and one per state with fees) | Fee rate per material for that state | Tyler |
| `data/rules/state-coverage.json` | Exemption rules and status for all 7 EPR states | Tyler |
| `data/rules/shipping.json` | Carrier size-pricing rules and a simple rate table | Tyler |
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

One file per state that has published rates. File names are lowercase state names: `oregon.json`, `colorado.json`, `california.json`. Rates are keyed by **our** material IDs, so the code never needs each state's own category names. The state's official name is kept alongside for checking.

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

One record for each of the 7 EPR states. States without a law aren't listed; the code treats any missing state as "no packaging law yet."

### Allowed `law_status` values

- `fees_active`: producers are being billed (Oregon, Colorado)
- `fees_upcoming`: law passed, fees not billed yet
- `registration_only`: must register, no fees yet

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
