# Packwise scoring spec

**Status: DRAFT for Tyler to approve, then Whitman to code.** Items marked **PROPOSED** are my suggestions, not sourced facts. Items marked **OPEN** need a decision. Every number comes from `data/` or the answer key; nothing here is typed into the UI.

Scoring compares packaging setups **for the same product, the same orders and the same ship-from ZIP**. It is a transparent formula, not a trained model.

---

## 1. What goes in

Per setup (box or mailer, plus optional fill, wrap and insert), from right-sizing (`docs/data-format.md`, right-sizing output):

| Input | Used by |
| --- | --- |
| `packaging_g_by_material`: grams per order for each material id | Waste, Carbon, Fees |
| `plastic_g_per_order` | "Plastic avoided" (not a score, see section 7) |
| `packaging_cost_usd_per_order`, `shipping_usd_per_order` | Cost |
| `fits` and the packing rules that passed or failed | Protection |

From the seller: orders per year, orders by ship-to state (`ordersPerYearByState`), revenue and California sales (for the coverage result).

---

## 2. The five raw factors (per order unless noted)

Lower is better for every factor except Protection.

| Factor | Formula | Unit |
| --- | --- | --- |
| **Waste** | sum over parts of `weight_g x (1 - recycle_rate)` | grams likely landfilled |
| **Cost** | packaging material cost + shipping price | $ per order |
| **Protection** | whole-setup rating, section 3 | low, medium, high |
| **Fees** | `estimateFees()` for each state (`src/lib/coverage/`), summed over states | $ per year |
| **Carbon** | sum over parts of `weight_kg x lifecycle_factor` | kg CO2e |

Details:

- **`recycle_rate`** is the component's own value if it has one, otherwise its material's. Rates are household (residential) rates, which are lower than commonly quoted industry rates. The UI says so.
- **Lifecycle factor (kg CO2e per kg)** = `carbon_kg_co2e_per_kg + recycle_rate x eol.recycling + (1 - recycle_rate) x eol.landfill`. A null recycling factor counts as 0. Check: pe-film = 2.5603 + 0.01 x 0.2315 + 0.99 x 0.022 = **2.5844**, matching the answer key.
- **Fees** must come from the same `estimateFees()` the coverage card uses, so the two never disagree. If the seller is exempt in a state (coverage result `exempt`), that state's fee is 0 for scoring. Negative rates are allowed (Oregon aluminum). A material with no rate is a warning, never a silent zero.
- **Cost** uses the shipping price from right-sizing (zone-weighted over the seller's orders, lower of the weight price and Cubic where eligible).

---

## 3. Protection: rated on the whole setup, and a minimum requirement

The library's own `protection` field is a poor basis: 27 of 29 boxes are `medium`, only 2 boxes are `high`, and fillers and wraps are mostly `medium`. So the rating comes from the packing rules in `data/rules/packing-rules.json`, applied to the **whole setup** (box + wrap + fill + insert + clearance).

**PROPOSED rating:**

| Check | Source | Failing it means |
| --- | --- | --- |
| Clearance: box inside size >= item size + 4 in per axis (2 in per side), unless the box `has_fitted_insert` and is made for that jar | R1, R2 | Setup is **excluded** for fragile (high) products |
| Glass is individually wrapped, or sits in a fitted insert | R3 | Excluded for fragile products |
| Void fill is an allowed type for glass: air pillows, foam peanuts, bubble wrap (crumpled paper is "non-fragile only") | R5 | **Downgrade** one level (R5 is guidance, not a hard block) |
| Box strength matches shipped weight (32 ECT up to 30 lb) | R7 | Excluded over 30 lb with a 32 ECT box |

- **High** = passes every check for the product's fragility.
- **Medium** = passes the hard checks but is downgraded by a guidance rule, or the product is not fragile and the setup only just fits.
- **Low** = soft mailer or no padding for a product that needs it.
- Score mapping for the label: **Low = 2, Medium = 6, High = 9.**

**Protection is a minimum, not a weight.** Fragility `high` (glass, ceramic) requires a High-rated setup. Fragility `medium` requires at least Medium. Fragility `low` has no minimum. Setups below the minimum are removed before anything is scored, and the results page says how many were hidden ("2 options hidden: not enough protection for glass").

Never claim a setup "passes ISTA 3A". Say it "follows carrier packaging guidance and is designed for the ISTA 3A drop profile" (R9).

**OPEN:** the Medium/Low boundary for non-fragile products is my guess. The wording for it needs your sign-off.

---

## 4. From raw numbers to 0-10 scores

Run these steps in this order, on the candidate setups:

1. **Drop setups below the protection minimum** (section 3).
2. **Pareto filter on the raw values.** Drop any setup that another setup beats or ties on every factor and beats on at least one. Doing this first means the remaining options span the full range.
3. **Normalize each of Waste, Cost, Fees, Carbon across the survivors:** `score = 10 x (worst - this) / (worst - best)`. If all survivors tie, every one gets 10.
4. **Protection score** is the fixed mapping (2, 6, 9), not normalized.

**The current setup** (what the seller ships today) is always included in the comparison and gets a label, so it sits on the same scale. It is never eligible to be recommended, and it is not removed by the Pareto filter. If it fails the protection minimum it is shown with a warning.

**Scores are relative.** They compare these options for this product, so adding or removing an option can change the others' scores. Every label shows the real number (grams, dollars, kg) next to each score, with the caption "Scores compare these options for this product."

---

## 5. Weights and the overall score

Protection is not weighted. The other four share 100:

| Preset | Waste | Cost | Carbon | Fees |
| --- | --- | --- | --- | --- |
| **Default** | 35 | 35 | 15 | 15 |
| **Waste matters most** | 50 | 20 | 20 | 10 |
| **Cost matters most** | 20 | 55 | 10 | 15 |

`overall = sum(weight x score) / 100`, on a 0-10 scale.

**Three picks on the planner page:** *Cheapest* = lowest Cost among eligible setups. *Lowest waste* = lowest Waste grams. *Best balance* = highest overall under the Default preset. Ties go to the setup with less Waste, then lower Cost.

---

## 6. Swaps

For each eligible candidate versus the seller's current setup, per year (`x orders per year`):

| Output | Formula |
| --- | --- |
| `usd_saved_per_year` | (current Cost - new Cost) x orders per year. Negative if it costs more |
| `plastic_avoided_lb_per_year` | (current plastic g - new plastic g) / 453.592 x orders per year |
| `landfill_avoided_lb_per_year` | (current Waste g - new Waste g) / 453.592 x orders per year |
| `fees_saved_usd_per_year` | current Fees - new Fees |
| `carbon_avoided_kg_per_year` | (current kg - new kg) x orders per year |
| `score_change` | new overall - current overall |
| `tradeoffs` | one short sentence for each factor where the new setup is worse ("Costs 5 cents more per order") |

Recommended swaps use library items only (never custom items). The impact projection for "N similar brands" is `N x orders per year x (plastic g before - plastic g after) / 453.592`, with the formula shown on screen and no claim that N brands will switch.

---

## 7. Worked example (method only)

Demo A from `tests/fixtures/demo-answer-key.json`: poly bubble mailer (pe-film, 23.0 g) versus padded paper mailer (kraft-paper, 30.35 g). **Cost here is material cost only**, because the answer key has no shipping prices for this swap, so this illustrates the method and is not a final result.

| | Poly mailer | Paper mailer |
| --- | --- | --- |
| Waste, g landfilled: `weight x (1 - recycle)` | 23.0 x 0.99 = 22.77 | 30.35 x 0.77 = 23.37 |
| Cost, $ (material only) | 0.29 | 0.37 |
| Carbon, kg: `weight_kg x lifecycle` | 0.0594 | 0.0696 |
| Fees, $/yr (answer key basis) | 55.69 | 12.25 |
| Scores, Waste / Cost / Carbon / Fees | 10 / 10 / 10 / 0 | 0 / 0 / 0 / 10 |
| Overall, Default weights | 0.35x10 + 0.35x10 + 0.15x10 + 0 = **8.5** | **1.5** |

This matches the answer key's honest reading: the paper mailer removes all plastic and lowers fees, but it is about 1.3x heavier, so waste and carbon rise slightly.

**OPEN, and this one matters:** plastic is not one of the five factors, so the overall score *prefers the poly mailer* and `score_change` for the paper swap is negative. Yet the swap card leads with plastic avoided, and the whole pitch is about plastic. Options: (a) rank swaps by plastic and landfill avoided first and show `score_change` as a secondary number, which fits the Theme Track best (my recommendation); (b) add plastic as a fifth weighted factor; (c) leave it and explain the trade-off on the card. This must be decided before the swap engine is finalized.

---

## 8. Not decided yet

- The Medium/Low boundary for non-fragile products (section 3).
- How swaps are ranked (section 7).
- Whether the robustness check (Monte Carlo on uncertain inputs) is built at all. It is a stretch goal, built only after all seven features work.
