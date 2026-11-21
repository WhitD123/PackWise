# CLAUDE.md: Packwise (Arbiter Hacks V1)

Read this whole file before doing anything in this repo. It is the handoff from the research phase (done in a separate Claude session on 2026-11-16) to the build phase. It tells you what the project is, what is already decided, what data exists and how to use it, the exact math, what is still open, and how Tyler wants to work.

Last updated: 2026-11-16 (Monday night, Central time).

---

## 0. Quick facts

| Item | Value |
| --- | --- |
| Project | **Packwise**: a free website that helps small online sellers pick packaging that costs less, protects the product, and creates less plastic waste, and checks whether state packaging (EPR) laws apply to them |
| Event | Arbiter Hacks V1, online, Devpost: https://arbiter-hacks-v1.devpost.com/ |
| Track | **Theme Track: "Rethinking Waste"** ("Build something that helps people or systems reduce, sort, or recycle waste more effectively"). Judges check that the theme is central, not bolted on |
| Theme rubric | Impact on waste problem **35%**, Technical execution **25%**, Feasibility **20%**, Presentation and demo **20%** |
| Official deadline | **Dec 20, 2026, 9:00pm PST**. Late = not judged |
| Our target | **Dec 15, 2026**. Dec 16 to 20 is emergency buffer only |
| Integration milestone | **Dec 6**: whole demo works end to end on localhost, first Vercel deploy |
| Team | Tyler Greenwell (you are working with him) and Whitman ("Whit"), who created the GitHub repo. Team of 2 |
| Stack | Next.js (App Router) + TypeScript, Tailwind reading colors from our own tokens file, JSON data files, a vision-capable AI API for the photo scan, GitHub, Vercel |
| Submission needs | Public GitHub repo, 2 to 3 minute demo video (YouTube or Vimeo), written description (what it does, how we built it, what's next), and a Theme paragraph (the waste problem and how we'd measure success). Missing repo or video = ineligible. A live link is optional |

---

## 1. How to work with Tyler

- Tyler is a Business Analytics student at Auburn. He started coding in mid-2025 and builds with AI help. He is on a **Mac**.
- When something is new to him (a git command, a terminal step, a TypeScript concept), **explain every step** and say what each command does. Don't assume he knows the intermediate steps.
- He wants **direct, honest feedback**, not cheerleading. If a plan or number is wrong, say so plainly. Hold your position under pushback unless he gives new information.
- **No em dashes** in anything you write for him or for the submission (README, writeup, UI copy). Use commas, colons, parentheses, or separate sentences.
- Keep writing polished and plain. No hype ("revolutionize", "AI-powered"), no emoji as icons.
- He wants accuracy above speed. Never invent a number. If a value isn't in `data/`, say it's missing.
- **Before you change anything in `data/`**, tell him why. The data was researched carefully and every value traces to a source.

---

## 2. Decisions already made (don't reopen without asking)

1. **Theme Track**, not General. Lead every pitch with waste, not with state fees.
2. **The demo shows only what's on the website.** No live testing with real sellers, no drop-test video, no hand-held props. Everything the judges see is in the app, using built-in sample data. Tyler's interpretation, settled in research: built-in sample order file, a preloaded sample photo for the scan, right-sizing as the headline swap, and a "How we calculate this" panel that shows the math and sources.
3. **Public data only.** No private business data.
4. **7 core features, built to 100%**, before any stretch item (list in section 4). Unfinished screens cost points.
5. **No trained ML model for scoring.** It's a transparent formula. AI is used only where it belongs: the photo scan.
6. **Not a business pitch.** No revenue, pricing or market-size sections. "Feasibility" means "could this realistically work".
7. **Build on localhost first.** Deploy to Vercel at the Dec 6 milestone.
8. **Demo seller ("Maya")**: runs a candle brand on Shopify, ships from **Portland, Oregon (ZIP3 972)**, about **$8.2M a year** in revenue (above Oregon's $5M small-producer line, so she's covered). A second seller at about $2M appears briefly as exempt, to show the checker isn't alarmist.
9. **Every number on screen must be calculated by the app** from `data/`, never typed into the UI or the video script.
10. **Estimates are labeled as estimates** in the UI (`is_estimate`, proposed fee schedules, mailer heights, filler weights).
11. **Design**: calm, earthy, designed by hand (section 12). No neon, no purple gradients, no default component-library look.

---

## 3. Who owns what

Latest split (Tyler: "give me 4, give him 3, and any non-coding or research stuff goes to me"):

| # | Feature | Owner |
| --- | --- | --- |
| 1 | Packaging library (data + a browsable library page) | **Tyler** |
| 2 | Packaging planner (questions to setups) | Whitman |
| 3 | Scoring engine and five-factor label | **Tyler** |
| 4 | Box right-sizing and shipping cost | Whitman |
| 5 | Swap suggestions | Whitman |
| 6 | Photo scan | **Tyler** |
| 7 | "Am I covered?" check and fee estimate | **Tyler** |
| - | Connecting everything (by Dec 6), README, Vercel deploy | Whitman |
| - | All research, data, SOURCES.md, video script, writeup, theme paragraph | Tyler |
| - | Look and feel (`tokens.css`, landing page) | Tyler per the original plan; confirm with Whitman |

Rules: each feature gets its own branch (`tyler/coverage`, `tyler/photo-scan`, `whit/rightsizing`). Nobody pushes straight to `main`. Stay inside your own folders to avoid merge conflicts. `git pull` before starting, small commits, push at the end of each session.

**Unknown as of handoff (check first):**
- Whether the starter code and folder skeleton are pushed to the repo.
- Whether Whitman has approved `docs/data-format.md` (the data contract).
- Whether a `.env.example` exists, and which AI API the scan will use.

---

## 4. The seven features and the stretch list

| # | Feature | What it does | Rubric |
| --- | --- | --- | --- |
| 1 | Packaging library | 55 real components with material, size, weight, price and a source link | Feasibility |
| 2 | Planner | A few questions (product, fragility, size, weight, ship-to mix) return cheapest, best-balance, and lowest-waste setups | Impact, Presentation |
| 3 | Scoring + five-factor label | One documented formula scores every setup on Cost, Protection, Waste, Fees, Carbon; shown as a nutrition-label style card | Technical, Impact |
| 4 | Right-sizing + shipping | Smallest safe box, filler volume, and USPS price (weight, dimensional, Cubic) before and after | Technical, Impact |
| 5 | Swaps | Ranked swaps with dollars saved, plastic avoided, and trade-offs | Impact, Presentation |
| 6 | Photo scan | Vision AI lists the parts and materials in a photo of a packed order; the user corrects them | Technical, Presentation |
| 7 | Coverage + fees | Per state: covered, exempt, no law, or must apply; with the reason and a yearly fee estimate before and after a swap | Feasibility |

Stretch, in order, only after all seven work end to end: (1) disposal insert generator (printable card telling customers how to dispose of each part), (2) PDF export of the results page, (3) robustness check (Monte Carlo on uncertain inputs: "ranked first in 91% of runs"), (4) spec-sheet PDF reader, (5) status list for the other EPR states, (6) short guides.

Cut, don't build: match score, dashboard, impact scorecard, separate report, 50-state table, user accounts, business model.

---

## 5. What's in this handoff package

```
Packwise_handoff/
├── CLAUDE.md                     # this file. Put a copy at the repo root
├── README_FIRST.md               # how to copy this package into the repo, step by step
├── data/                         # DROP-IN: copy into the repo's data/ folder as is
│   ├── materials.json            # 12 materials: recycle rate, carbon, end of life, disposal text
│   ├── library/components.json   # 55 components (boxes, mailers, fillers, wraps, inserts)
│   ├── fees/                     # oregon-2026, oregon-2027, colorado-2026, colorado-2027, california (2027 proposed)
│   ├── rules/
│   │   ├── state-coverage.json   # 51 records: EPR status and small-producer tests per state
│   │   ├── state-population.json # Census 2025 population, for the population-share fallback
│   │   ├── shipping.json         # USPS Ground Advantage: weight prices zones 1-9, Cubic, DIM, zones from 972
│   │   ├── packing-rules.json    # cushioning, wrap, box strength, drop-test wording (R1 to R10)
│   │   ├── epr-logic.json        # sourced answers + app logic recommendations for the coverage check
│   │   └── environment.json      # EU empty-space rule, benchmarks, impact baseline, projection, problem statement
│   └── samples/
│       ├── shopify-orders.csv    # 4,483 fake single-candle orders, one week, Maya's store
│       └── demo-products.json    # Maya's 8 oz and 12 oz candles, sourced jar and wax weights
├── docs/
│   ├── data-format.md            # THE CONTRACT: every field of every file, plus 4 update sections at the end
│   ├── project-brief.md          # full team brief (rules, judging, demo story, process, skeleton tree, design)
│   ├── hackathon-plan-2026-11-03.md  # older plan; superseded by the brief and this file
│   ├── findings-*.md             # research notes per topic, with sources and caveats (9 files)
│   └── usps-zone-chart-972.tsv   # the raw USPS zone chart Tyler copied (origin 972)
├── tests/fixtures/
│   └── demo-answer-key.json      # known-answer values for the demo calculations (use in tests)
├── SOURCES.md                    # every data source with links (goes at the repo root)
└── research/
    ├── Packwise_Research_Data.xlsx   # 17-tab workbook; every calculation done in formulas (for checking code)
    ├── workbook-scripts/             # Python that built the workbook (paths point at the old sandbox; reference only)
    └── raw/                          # raw research agent outputs (archive; not needed to build)
```

The repo layout planned in `docs/project-brief.md` section 11 still holds, with these changes (already reflected in `data/`):
- `carbon-factors.json` and `disposal-guidance.json` were merged into `data/materials.json`.
- `box-sizes.json` doesn't exist: boxes are in `components.json` (`type: "box"`).
- `carrier-dim-weight.json` became `data/rules/shipping.json`.
- Fees are one file per state and year: `data/fees/oregon-2027.json`, etc. California has one file (2027, proposed).

---

## 6. Data reference (read `docs/data-format.md` for every field)

### Ground rules
- **The unit is always in the field name**: `_in` inches, `_g` grams, `_lb` pounds, `_usd` dollars, `_rate` 0 to 1, `_kg_co2e_per_kg`. Pounds = grams / 453.592.
- IDs are lowercase-with-dashes and **never change** (other files point to them).
- Research records carry `source_url`, `last_checked`, `is_estimate`.
- **A blank/null rate means "no rate found", never zero.** Oregon 2027 glass `0.00` is a real published rate. Oregon 2027 aluminum is **-0.09** (a credit). Code must allow negative rates.

### `data/materials.json` (12 materials)

| id | plastic? | recycle_rate | carbon (kg CO2e/kg, cradle-to-gate) |
| --- | --- | --- | --- |
| corrugated | no | 0.32 | 0.937 |
| kraft-paper | no | 0.23 | 1.091 |
| paperboard | no | 0.23 | 1.091 |
| molded-pulp | no | 0.23 | 1.091 |
| paper-plastic-mix | yes | 0.00 | 1.679 |
| pe-film | yes | 0.01 | 2.560 |
| pp-film | yes | 0.00 | 2.252 |
| plastic-laminate | yes | 0.00 | 2.593 |
| eps-foam | yes | 0.01 | 2.917 (resin only, a lower bound) |
| glass | no | 0.27 | 0.584 |
| aluminum | no | 0.30 | 5.291 |
| steel | no | 0.19 | 3.340 |

- `recycle_rate` = The Recycling Partnership 2024 national **residential** recycling rate (one method for all). The old EPA 2018 values are kept in `recycle_rate_epa_2018` (corrugated was 96.5% there; don't mix the two).
- `eol_kg_co2e_per_kg` has `landfill`, `recycling`, `combustion` (EPA Emission Factors Hub 2025, landfill methane included, no recycling credits). Null recycling factor = treat as 0.
- Also useful for UI: `disposal_text`, `why_it_matters` (one sentence), `curbside_recyclable`, `how2recycle_label`.
- Open decision: add a 13th material `compostable-film` (the compostable mailer is filed under `plastic-laminate` for now).

### `data/library/components.json` (55 components)
- Types: 29 `box`, 16 `mailer`, 4 `filler`, 3 `wrap`, 3 `insert`.
- Key fields: `id`, `name`, `type`, `material` (a materials id), `length_in`, `width_in`, `height_in` (inside dims; absent for fillers and wraps), optional `outside_length_in/width_in/height_in`, `unit`, `weight_g`, `price_usd`, `price_basis_qty`, `protection` (`low`/`medium`/`high`), `supplier`, `source_url`, `is_estimate`, `has_fitted_insert`, recycled content and claim fields, `notes`.
- **`unit` matters:** `each` for boxes, mailers, inserts. Fillers are `cubic_ft` (so `weight_g` and `price_usd` are **per cubic foot**). Wraps are `square_ft` (per square foot).
- `price_usd` is the per-unit price at the quantity in `price_basis_qty` (usually 500).
- **Mailer `height_in` is an estimate** (width minus 0.5, divided by 2). Fit check for mailers: also test item width + item height <= mailer width.
- If a box has no `outside_*` dims, use inside + 0.25 in and label it an estimate.
- `has_fitted_insert: true` = candle shipper boxes (Flush Packaging) with built-in jar inserts. They're safe for the jar they're made for **without** the 2 in clearance rule. `box-12oz-straight-jar-shipper` lists Maya's exact 12 oz Uline jar as compatible.
- Paper filler weights are uncertain: `crinkle-paper-fill` 907 g/cu ft (range 660 to 1,296); `kraft-paper-void-fill` 60 g/cu ft (range 60 to 297, likely low). Both have `weight_range_g`. Show the range until Tyler weighs them.

### `data/fees/*.json`
- `rates` is an object keyed by material id: `{ "rate_usd_per_lb", "base_rate_usd_per_lb", "official_category", "acceptance" }`.
- `status`: `final` (OR 2027), `proposed` (CA 2027). OR and CO 2026 come from secondary sources (`source_type`).
- Oregon 2027 final rates are base rates after a one-time reserve return: corrugated 0.02 (base 0.07), kraft 0.02, paperboard 0.05, pe-film 0.12 (base 0.29), pp-film 0.56, eps-foam 0.59, glass 0.00, aluminum -0.09. Show both final and base where it matters.
- California plastics also owe `plastic_component_fees` (about $0.03 + $0.26 per lb + $0.001 per component). Example: pe-film 0.24 + 0.03 + 0.26 = $0.53/lb.
- Oregon has an optional flat fee for producers at 10 metric tons or less ($700 to $3,100 by tier, in the file notes).

### `data/rules/state-coverage.json` (51 records)
- `law_status`: `fees_active` (OR, CO), `fees_upcoming` (CA, ME), `registration_only` (MD, MN, WA), `none` (44 others).
- Fields: `revenue_threshold_usd`, `revenue_scope` (global or in-state), `weight_threshold_lb`, `exempt_if` (`any_test` etc.), `application_required`, `key_dates`, `fee_file`, `law_name`, `notes`, `source_url`, plus round-3 fields `revenue_year_basis`, `weight_year_basis`, `shipping_packaging_producer`, `state_allocation_basis`, `fee_data_year_lag`, `candle_jar_status`, `revenue_threshold_confidence`.
- **Oregon (confirmed by DEQ):** exempt if worldwide gross revenue < $5M **or** < 1 metric ton (2,204.6 lb) of covered packaging into Oregon. Either one exempts. Associated companies' revenues are added together. No application needed.
- **Colorado:** exempt if revenue under about $5.8M ($5,779,297, secondary source, CPI-adjusted every July 1) or < 1 ton (recorded as a 2,000 lb short ton; Oregon is the only state confirmed as a metric ton). Display as "about $5.8M (secondary source)".
- **California:** exempt if **California** gross sales < $1M; must apply. Fees are 2027 proposed.

### `data/rules/shipping.json` (USPS Ground Advantage, commercial)
- Effective 2026-10-04, includes temporary holiday prices through **2027-01-17** (show this note).
- `weight_rates_by_zone`: rows `{ max_lb, prices_by_zone: { "1": .., ..., "9": .. } }`. Under 1 lb has four ounce tiers (all the same price within a zone); the 15.999 oz row is stored as `max_lb: 0.9999`. Pick the first row whose `max_lb` >= billable weight.
- `cubic`: Cubic pricing tiers 0.1 to 1.0 cu ft by zone, plus eligibility text.
- `dim_divisor` 139, applied only above 1,728 cu in.
- `surcharges_usd`: length over 22 in ($4.50), over 30 in ($10), volume over 2 cu ft ($21), etc.
- `zones_from_origin` (origin 972, **filled 2026-11-16** from the chart Tyler copied): `states[XX] = { city, dest_zip3, zone, zones_in_state, zone_marker }` and `zip3_ranges` (the full chart for per-ZIP lookups). State zone = zone of its largest metro. Oregon = Zone 1 (rest of OR is 1 to 3). 56% of sample orders are Zone 8; about 20% Zone 5. The chart's `*` and `+` markers are stored but not interpreted (legend not copied). **Other origins are estimated** (added 2026-11-21): see `docs/findings-zones.md` for the method, the accuracy against real charts for origins 972, 100 and 770, and the limits.

### `data/rules/packing-rules.json` (box picker rules)
- R1: fragile (glass) needs >= **2 in cushioning on every side**: box inside dims >= item dims + 4 in per axis (unless `has_fitted_insert` and the box is made for that jar).
- R1b: optional "carrier-strict" 3 in per side (FedEx).
- R3: wrap each glass item individually. R4: >= 2 in between glass items (no source gives a number; reused from R1).
- R5: allowed void fill for glass: air pillows, foam peanuts, bubble wrap. Crumpled paper = non-fragile only (UPS).
- R7: box strength 32 ECT up to 30 lb. R10: pick the smallest box that meets R1.
- **R9: never say a setup "passes ISTA 3A".** Say "follows carrier packaging guidance and is designed for the ISTA 3A drop profile".

### `data/rules/epr-logic.json`
- `answers`: sourced Q&A (fee basis, who is the producer, candle jars, year basis, categories) with confidence and quotes.
- `app_logic_recommendations`: **follow these for the coverage check** (summarized in section 8).

### `data/rules/environment.json`
- `eu_empty_space`: EU PPWR Article 24, max 50% empty space for e-commerce packaging (filler counts as empty), applies from 2030. Benchmark only; not a US law.
- `impact_baseline`: 33 sourced facts (US parcels 2025: 23.1 billion; Q2 2026 e-commerce $340.2B, 17.1% of retail, etc.).
- `projection`: the "N similar sellers" formula and caveats. `writeup_problem_statement`: a ready, sourced problem paragraph.

### `data/samples/`
- `shopify-orders.csv`: columns `Name, Created at, Shipping Province, Lineitem name, Lineitem quantity, Subtotal`. 4,483 orders (one candle each), week 2026-10-05 to 2026-10-11, about $157,000 (x 52 = about $8.2M/yr, 233,116 orders/yr). **Annualize by x 52.** **Changed 2026-11-20:** the original file had 2,100 orders with 2 or 3 candles each (79% multi-candle); each was split into one-candle orders (same state, date and total revenue) so the "one product per package" scope is true. Oregon is 8.2% of orders (369/wk, 19,188/yr) and California about 14%. California sales are about $1.15M/yr, inside the 20% "close to the line" band around $1M, so the app hedges on California by design. Four products: Amber & Fig 8oz, Cedar & Smoke 8oz, Linen 12oz, Sea Salt 12oz.
- `demo-products.json`: 8 oz candle 3.5625 in tall, 2.875 in diameter, 0.877 lb packed; 12 oz candle 3.25 x 3.25 in, 1.021 lb (up to 1.135 lb if filled near the brim). "8 oz" and "12 oz" are **jar capacities**, not wax weight. Jars are Uline with gold metal caps.

---

## 7. The math (one source of truth; the workbook implements all of it)

### Per component weight and cost
- `each`: weight = `weight_g`, cost = `price_usd`.
- Filler (`cubic_ft`): fill volume cu ft = (box inside volume - product bounding-box volume) / 1728. If the box has a fitted insert, fill = 0. Weight = volume x `weight_g`; cost = volume x `price_usd`.
- Wrap (`square_ft`): weight = sq ft x `weight_g`; cost = sq ft x `price_usd`. Demo assumes 1.0 sq ft per jar (about two layers; an estimate).

### Five factors (per order unless noted)
| Factor | Calculation |
| --- | --- |
| Cost | packaging material cost + shipping price |
| Protection | rules: fragility + cushioning + box strength (Low/Medium/High). Uses packing-rules.json |
| Waste | sum over parts of weight_g x (1 - recycle_rate) = grams likely landfilled |
| Fees | sum over parts of (weight_lb x state rate) x orders delivered to that state per year |
| Carbon | sum over parts of weight_kg x lifecycle factor |

Lifecycle factor (kg CO2e per kg) = `carbon_kg_co2e_per_kg + recycle_rate x eol.recycling + (1 - recycle_rate) x eol.landfill`.

Plastic weight = sum of weight of parts whose material `is_plastic`.

### Scores (from the brief, section 13; Tyler owns writing `docs/scoring-spec.md`)
1. Compute the real number for each factor for every option for the same product.
2. Normalize 0 to 10 across the options: `score = 10 x (worst - this) / (worst - best)`. If all options tie, give 10.
3. Protection maps directly: Low = 2, Medium = 6, High = 9.
4. Drop any option that loses on every factor (Pareto filter).
5. Overall = sum(weight x score). Presets: default, "cost matters most", "waste matters most". The brief's worked example only fixed three factors (default cost 40 / protection 30 / waste 30; waste-first 20 / 30 / 50). **Five-factor default weights are not decided yet**; propose them in scoring-spec.md and get Tyler's OK.
6. Stretch: robustness check (Monte Carlo with uncertain inputs nudged in their ranges).

### Shipping price (USPS Ground Advantage, commercial)
1. Shipped weight lb = product lb + packaging g / 453.592.
2. Outside volume: if L x W x H (each rounded **up** to the whole inch) > 1,728 cu in, billable = max(actual, ceil(volume / 139)). Otherwise billable = actual.
3. Weight price = first row in `weight_rates_by_zone` with `max_lb` >= billable, at the destination zone.
4. Cubic eligibility: outside volume <= 1 cu ft, weight <= 20 lb, longest side <= 22 in. Cubic volume uses each **outside** dimension rounded **down** to 1/4 in; tier = ceil(volume/1728 to 0.1). Soft packs (mailers) use length + width (max 36 in).
5. Price paid = lower of weight price and Cubic price when eligible (our interpretation; Cubic needs commercial postage through shipping software, which most Shopify sellers have).
6. Zone = `getZone(shipFromZip, destination)` in `src/lib/shipping/getZone.ts`, the only place a zone is decided. Origin ZIP3 972: the exact chart in `zones_from_origin` (labelled "Exact USPS zone"). Any other ship-from ZIP: an estimate from the distance between ZIP3 centers, `data/rules/zip3-centroids.json` (labelled "Estimated zone, typically within one zone of USPS's chart"). No usable ZIP: Zone 5, labelled "assumed". Zone 5 is a fallback, **not** a typical zone. Zone 9 is priced as Zone 8. Maya's example is preset to Portland (972) and never asks for a ZIP. For a whole order file, average the price over orders (weight each zone by its share of orders). Shipping estimates cover the 50 states and DC, USPS Ground Advantage only.
7. Add surcharges when they apply (length over 22 in, etc.).

### Right-sizing (Whitman's, but scoring depends on it)
- Candidate boxes: `type: "box"` that fit by packing rules (R1, R4, R10) or have a fitted insert for that jar.
- Report: box utilization, empty-space ratio = (box volume - product volume) / box volume vs the EU 0.5 benchmark, filler volume, before/after price.
- Note: for small boxes the saving comes mostly from Cubic tiers, not dimensional weight (DIM only applies above 1,728 cu in).

### Impact projection ("N similar sellers")
plastic_avoided_lb = N x orders_per_year x (plastic g before - plastic g after) / 453.592, shown next to paper added and share of 23.1B US parcels. It **doesn't claim** that N sellers will switch, that they're typical, or any ocean-plastic benefit. Show the formula on screen.

---

## 8. Coverage check spec (Tyler's feature 7)

Inputs: worldwide gross revenue (and the year it covers), California gross sales (or derive from orders), orders by ship-to state (from the CSV, annualized x 52), packaging per order by material (shipping box, fill, wrap **plus product packaging: glass jar, metal lid**), whether the seller packs and ships its own orders.

Steps, per state with a law:
1. **Covered weight per state, by material** = orders delivered to that state per year x packaging weight per order. Use the seller's own ship-to data. Only if there's no state breakdown, fall back to national weight x state population share (`state-population.json`) and label it "estimate (population proration, allowed by Oregon DEQ as a fallback)".
2. **Producer check:** if the seller packs and ships, they're the producer of both the product packaging (jar, lid, label) and the shipping box and fill (OR, CO by statute; CA by our reading). If a 3PL or marketplace packs, say the shipping-packaging obligation may fall on them.
3. **Small-producer tests** (from `state-coverage.json`): OR revenue < $5M worldwide **or** < 2,204.6 lb into OR; CO revenue < about $5.8M **or** < 1 ton; CA California sales < $1M (and must apply). Result: `covered`, `exempt`, `no_law`, or `apply_for_exemption`, with one plain-English reason sentence.
4. **California close-to-the-line:** if the CA sales estimate is within about 20% of $1M, say "close to the line, use your actual California sales" instead of a firm verdict.
5. **Fee estimate** = sum over materials of (state lb for that material x rate per lb). Allow negatives. CA plastics add `plastic_component_fees`. Show `fee_status` (final/proposed).
6. **Year lag:** OR and CO bill year Y using year Y-2 data (a 2027 fee reflects 2025 shipments). Say so in the UI.
7. **Candle jar:** count the glass jar as covered glass and the lid by its material, labeled **"likely covered, no official ruling on candle jars"**. Offer a toggle "treat jar as product (not packaging)" so the user sees both numbers.
8. Registration-only states (MD, MN, WA) and upcoming (ME): show status and key dates, no fee.
9. Show `source_url` and `last_checked` for every rule used.

Output shape (data-format.md section 9): `{ state, result, reason, fee_usd_per_year, fee_status }`, one per state.

---

## 9. Photo scan spec (Tyler's feature 6)

- Flow: `src/app/scan/page.tsx` (upload or pick the preloaded demo photo) -> `src/app/api/scan/route.ts` (server route, holds the key) -> AI returns JSON -> `src/lib/scan/parseScan.ts` maps each part to a material id and, where possible, a component id -> `PartsReview` lets the user fix mistakes -> results.
- Constrain the AI's output: ask for strict JSON with an array of parts `{ part_name, type (box|mailer|filler|wrap|insert|product_packaging), material (one of the 12 ids), approx_dims_in (optional), confidence }`. Validate it in code; never trust it blindly.
- The API key lives in `.env.local` (never committed). The repo has `.env.example` with the key name and no value. Tyler shares the real key privately with Whitman.
- **Which AI API is undecided.** Compare 2 or 3 vision APIs (for example Anthropic Claude, OpenAI, Google Gemini) on: JSON reliability, price per image, free tier, ease in Next.js. Don't state prices from memory; check the providers' pricing pages.
- Website-only demo: the demo uses a **preloaded sample photo** in `public/demo/`. Expected parts for Maya's order: glass jar, metal lid, label, plastic void fill (foam peanuts), bubble wrap, oversized corrugated box (or poly mailer, depending on the photo).
- Accuracy number (30 to 50 labeled photos, `evaluation/`) raised the Technical score in the original plan. It's optional now that the demo is website-only; ask Tyler before spending time on it.

---

## 10. Demo story and known answers

Walkthrough (website only):
1. Landing page: the problem (packaging is chosen once, by price, with no guidance) and the upstream framing.
2. Maya's candle: planner questions (or photo scan of her current packed order).
3. Load the built-in sample order file: orders per state.
4. Results: five-factor labels; right-sizing shows the oversized box vs the fitted jar box.
5. Swap: plastic removed, dollars saved, trade-offs (the fitted box costs 18 cents more per order; show it).
6. Coverage: Oregon covered, with the reason and the fee before and after. A $2M seller shows as exempt.
7. Impact: the projection with its formula visible, and "How we calculate this" with sources.

### Known answers (from `tests/fixtures/demo-answer-key.json`; 12 oz candle, origin 972, fee state OR 2027)

| Per order | Oversized box (12x10x8 + foam peanuts + bubble wrap) | Fitted jar box (Flush, `box-12oz-straight-jar-shipper`) |
| --- | --- | --- |
| Packaging weight | 362.8 g | 215.5 g |
| Plastic | 58.9 g | 0 g |
| Shipped weight | 1.82 lb | 1.50 lb |
| Shipping, averaged over sample zones | $12.17 | $9.96 |
| Shipping at Zone 5 / Zone 8 | $10.50 / $13.42 (weight price wins) | $9.04 / $10.68 (Cubic 0.1 tier wins) |
| Packaging material cost | $2.13 | $2.30 |
| CO2e (production + end of life) | 0.69 kg | 0.37 kg |
| Unrecycled packaging | 264.9 g | 146.5 g |
| Empty-space ratio (EU method) | 96% | 72% (still above the 50% benchmark) |

**Stale yearly totals:** the figures below used 109,200 orders/yr (the old file). Per-order values above are still valid. Recompute the yearly numbers at 233,116 orders/yr from the workbook (Swap_Demo orders_per_year and the Oregon share 0.0823) before using them. Old figures, per year at 109,200 orders: plastic avoided about 14,170 lb, shipping saved about $241,000, packaging cost up about $19,000, CO2e down about 35,200 kg. EPR fee applied only to the 8.4% of orders delivered to Oregon.

Honest findings to keep in the pitch:
- **The paper-mailer swap is a plastic and fee win only.** The padded paper mailer is about 1.3x heavier than the poly bubble mailer, so unrecycled weight and CO2e rise slightly. Claim plastic avoided and lower fees for that swap, nothing more.
- **Right-sizing with a fitted box is the strong win:** waste, plastic, carbon and shipping all fall.
- The fitted box **doesn't meet** the EU 50% empty-space benchmark (72%), because it's a square box around a round jar. Say "much less empty space", not "meets the EU rule".

### Three decisions Tyler hasn't answered yet
1. Orders per year: **resolved 2026-11-20:** 233,116 (whole sample, all states, one candle per order). Oregon-bound is 19,188.
2. The "1,000 similar sellers" projection now means 1,000 sellers at about $8M each (0.5% of US parcels, $241M shipping). That's aggressive for a small-seller pitch. Recommendation: about 100 sellers, or relabel. (Swap_Demo cell B83 in the workbook.)
3. How to present the EU empty-space result (above).

---

## 11. Open items (not confirmed; keep labeled in the UI)

Data that only Tyler can supply:
- **Weigh a 12 x 12 x 12 box of crumpled kraft paper** (the biggest uncertainty: 60 vs about 297 g/cu ft). Also crinkle fill, one poly mailer, tissue, bubble wrap per sq ft (see the Weigh_List tab).

Research not confirmed:
- Colorado's exact revenue threshold and flat-fee tiers (only secondary sources).
- Oregon and Colorado fee category definitions (CAA documents are login-only; mapping reasoned from names). California mapping confirmed by CalRecycle except bubble wrap (25_P15P) and loose peanuts (25_P47P), whose rates weren't captured (pe-film and eps-foam rates used as stand-ins).
- Candle jar coverage: no official ruling.
- ISTA 6-Amazon drop heights; space between jars (2 in reused, no source).
- USPS zone chart `*` and `+` markers (legend not copied).
- 2026 Oregon/Colorado rates are secondary; molded pulp and EPS have no 2026 rate.
- Census Q3 2026 e-commerce release (Nov 19, 2026) may revise baseline figures; recheck before submitting.
- Hackathon rules, **confirmed 2026-11-21** from the Devpost page (Tyler pasted it): prizes total $7,800 (Theme 1st $2,100, 2nd $1,550, participation $500); Theme weights are Impact on waste 35%, Technical execution 25%, Feasibility 20%, Presentation and demo 20%; Tyler reports that AI coding tools are allowed. Teams of 1 to 4. Still not seen on the page text: the exact deadline (our notes say Dec 20, 9:00pm PST).
- UPS and FedEx dimensional rules (not researched; we use USPS only).

---

## 12. Design direction

Calm, earthy, professional; looks designed, not generated.

| Role | Name | Hex |
| --- | --- | --- |
| Main | Forest | `#1F3A2B` |
| Second green | Moss | `#4A6B3F` |
| Brown | Bark | `#5C4033` |
| Accent | Kraft | `#C8A97E` |
| Background | Paper | `#F4EFE6` |
| Text | Ink | `#1C1A17` |
| Warning | Ochre | `#B8862B` |
| Bad score | Brick | `#9C4A3A` |

- Warm serif for headings, clean sans-serif for body.
- Every color, font and spacing value comes from `src/styles/tokens.css`; Tailwind reads from it.
- Own small set of UI pieces in `src/components/ui/` (Button, Card, Field, ScoreBar, Stepper). Flat surfaces, thin borders, plenty of space.
- The five-factor label is the signature visual: designed like a real nutrition label.
- Avoid: neon, purple-blue gradients, glowing buttons, emoji icons, default component-library styling, heavy rounded shadowed cards everywhere, generic AI hero lines.
- Footer: sources and "data last updated".

---

## 13. Timeline (from Nov 16)

| Dates | Tyler | Whitman |
| --- | --- | --- |
| Nov 16 to 19 | Get data into the repo, confirm the data contract, write scoring-spec.md, 3 hand-worked example products | Repo skeleton, types.ts from data-format section 9 |
| Nov 20 to 25 | Library page, scoring engine + five-factor label, tokens.css | Right-sizing math, tests from the examples |
| Nov 26 to 30 (Thanksgiving, lighter) | Photo scan | Swap engine |
| Dec 1 to 6 | Coverage check + fees, landing page, scan page | Planner and results pages, merging everything |
| **Dec 6** | **Milestone: full demo works on localhost; first Vercel deploy** | |
| Dec 7 to 11 | Polish, known-answer tests pass, stretch only if core is solid | Bug fixes, tests |
| Dec 12 to 14 | Video script and recording, writeup, theme paragraph | README, technical writeup, final checks |
| **Dec 15** | **Submit on Devpost** | |

If Dec 6 slips: cut stretch and the robustness check, never the core. Check against Auburn finals week.

---

## 14. Theme paragraph (draft, required for submission)

> Most e-commerce packaging waste is locked in the day a small brand picks its mailers and boxes, usually the cheapest plastic option in a box too big for the product. Packwise targets that decision. It scans a seller's current packaging, scores every option on cost, protection, waste, state fees, and carbon, and recommends right-sized, recyclable swaps that also cut shipping costs. A printable insert tells customers how to dispose of each part, which reduces contamination at the bin. We measure success by pounds of hard-to-recycle packaging each seller switches to recyclable or reusable alternatives per year, calculated from their order volume and shown alongside the dollars they save.

Drop the insert sentence if the disposal insert doesn't ship. Positioning line for the video: the organizers' own examples (recyclability checker, food-waste routing, sorting vision) all act **after** waste exists; Packwise works **upstream**, when the packaging is chosen.

---

## 15. Rules for code in this repo

1. Read data only through `src/lib/data.ts`; never hardcode a rate, weight, price or threshold in a component.
2. Write known-answer tests before AI-written math: `tests/fixtures/demo-answer-key.json` plus 3 hand-worked products. If code disagrees with the answer key, find out which is wrong before changing either.
3. Keep units in variable names (`weightG`, `priceUsd`) and convert in one place.
4. Every number shown in the UI must be computed; label estimates and proposed rates; link sources.
5. Whoever builds a part must be able to explain it to judges.
6. Never commit `.env.local`. Keep `.env.example` current.
7. Workbook check: `research/Packwise_Research_Data.xlsx` (Swap_Demo tab) does every calculation in formulas. Use it to check the code, and change inputs there to generate new test cases.

---

## 16. Other places this project lives

- claude.ai Project "Arbiter Hacks Hackathon" (research chat history).
- A Claude Docs doc "Packwise: Hackathon Plan" exists but is **out of date** (doesn't reflect the website-only demo or the research). `docs/project-brief.md` plus this file are current.
