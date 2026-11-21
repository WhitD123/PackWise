# Packaging library findings (checked 2026-11-16)

49 items in components.json (16 mailers, 23 boxes, 4 fillers, 3 wraps, 3 inserts). 46 from Uline pages; others from Eco Packables, Flush Packaging, Packrift (crinkle coverage only). Builder script: scratchpad/scripts/build_components.py.

## Method
- Weight = Uline unit weight x 453.592 / units per case. Case, roll and bag weights probably include the carton, so per-unit weights may run a few percent high (up to ~15% for lightest items).
- Price = break nearest 500 units (price_basis_qty). Fillers per cu ft, wraps per sq ft.
- Mailer height_in is estimated as (inside width - 0.5)/2, rounded down to 0.5 in; the expansion mailer uses its listed 3 in gusset. Fit check should also test item width + item height <= mailer width.
- Protection calls by us: tissue low, corrugated pad low, bubble bag medium, compostable mailer low.

## Estimates (is_estimate)
- compostable-mailer-12x15-5: weight 22.4 g (396 sq in x 70 um x 1.25 g/cm3; density and 2 in flap assumed)
- crinkle-paper-fill: 907 g and $8.00/cu ft (Packrift: 10 lb fills 15-25 boxes of 12x9x4 = 3.75-6.25 cu ft; midpoint 5.0)
- kraft-paper-void-fill: 60 g and $0.24/cu ft (roll weight real, 6.05 g/sq ft; assumed 10 sq ft crumples to 1 cu ft)
The two paper fillers differ ~15x; at least one is wrong. Measured: air pillows 59 g/cu ft, peanuts 94 g/cu ft.

## Kitchen-scale list
1. Crinkle paper: pack a 12x12x12 box like a candle, weigh the paper.
2. Kraft void fill: crumple into same box until full; weigh and note sq ft used.
3. Compostable mailer (needs a sample).
Also check: kraft #5 expansion mailer (30 lb vs 25 lb per case on same page), tissue 2.34 g/sq ft (looks high), bubble wrap roll weight (may include dispenser box), 6x6 pad 0.03 lb (+/-17%), one poly mailer vs its case carton.

## Environmental fields (new, not yet in data-format spec)
recycled_content_rate, post_consumer_rate, recyclability_claim (curbside, store_drop_off, compostable, not_recyclable, recyclable_unspecified), claim_wording, certifications, reusable. Null unless the page states it.

## Swap pairs
Mailer: poly, poly bubble, kraft bubble vs unpadded kraft, padded paper, compostable. Fill: air pillows, peanuts vs crinkle, kraft. Wrap: bubble wrap vs honeycomb, tissue. Insert: bubble bag vs molded pulp tray, corrugated pad, jar shipper. Box: no plastic option; compare box vs poly mailer and 200 lb vs 32 ECT.

## Unconfirmed claims (keep out of the app)
- Uline boxes and pad: no recycled content or recyclability claim; ASTM D5118 is a strength standard.
- Poly mailers: only 6x9 checked ("<5% post-consumer", resin #4, no recyclability statement); other sizes null.
- Kraft #5/#6: "100% virgin paper", recyclability wording not captured. Padded paper #0/#2/#5: recycled content not captured.
- Molded pulp tray: "Made from recycled paper", no percentage.
- Flush jar box: "100% Recyclable & Biodegradable", no certification; biodegradable is not compostable.
- Compostable mailer: TUV and ABA named in listing; BPI only in FAQ; no certificate numbers; ASTM D6400 not mentioned; resin not disclosed.
- Reusable: no page stated it.

## Other gaps
- No public jar-sized molded pulp insert found; the Uline tray is wine-bottle sized. Flush box fits 8 oz jelly jars, not 12 oz.
- Air pillows need Uline's machine; machine cost excluded.
- Material mapping: compostable mailer -> plastic-laminate (suggest adding a compostable-film ID); bubble wrap and bag -> pe-film (plastic-laminate arguable); peanuts -> eps-foam.
- 18x12x6 priced high ($2.16, white version only). Pad height 0.16 in is estimated.
