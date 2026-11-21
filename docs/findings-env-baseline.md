# Impact baseline findings (checked 2026-11-16)

33 facts in baseline.json. Primary unless marked.

## Key facts
- US parcels: 23.1 billion in 2025, up 3.3% from 22.4 billion in 2024 (Pitney Bowes Parcel Shipping Index 2026). Amazon 6.9B, USPS 6.2B, UPS 4.3B, FedEx 3.9B. No e-commerce share given.
- US retail e-commerce Q2 2026: $340.2 billion, 17.1% of retail, up 12.2% year over year (Census, Aug 18, 2026). Census plans a revised Q3 release on Nov 19, 2026; re-check before submitting.
- Sellers: 44,322 US electronic shopping and mail-order employer firms (Census BDS 2022). Etsy 5.6 million active sellers worldwide (2025); 89% are businesses of one (2024 seller survey). 44% of Shopify merchants are US (2025), no absolute count. Amazon selling partners are over 60% of store sales; US independent sellers averaged over $375,000 in sales in 2025.
- EPA 2018: 82.2 million tons containers and packaging; corrugated 33.26M tons, 96.5% recycled; plastic containers and packaging 14.53M tons, 13.6% recycled; plastic bags, sacks and wraps 4.2M tons, 10.0% recycled (poly mailers placed in this category by inference).
- Amazon: Oceana estimated 208 million lb Amazon plastic packaging waste in US (2022). 37% of North America shipments had single-use plastic in 2024, down from 65% in 2023 (secondary, Oceana citing Amazon). Amazon says 288 million plastic bags avoided in North America in 2025 (company-reported).
- OECD Global Plastics Outlook (2019 data): 353 Mt plastic waste; 9% recycled; 22% mismanaged/leaked; 1.7 Mt reached oceans; US 221 kg plastic waste per person.
- Shipping label = 10.95% of average order value (Shippo 2023 platform data, mostly mid-sized US merchants).
- Secondary: APR reports 1,317.2 million lb US PE film recovered in 2024 (no rate). Red Stag (vendor, unsourced): poly mailers 0.2-0.8 oz; sanity check only.

## Conflicts
1. Corrugated: EPA 96.5% (2018) vs a later EPA 53.5% "cardboard" (2019), seen secondhand only. Keep 96.5% labeled 2018.
2. Ocean plastic: Pew 11 Mt/yr (2016 base) vs OECD 1.7 Mt (2019). Leave out of per-seller math; prefer OECD for global context.
3. Film recycling: EPA 10% (2018) is a rate; APR gives only tonnage. Use EPA labeled 2018.

## Projection
plastic avoided (lb) = 1000 x O x sum_k s_k x (plastic g before - plastic g after) / 453.592, where O = seller orders per year and s_k = share of orders in each packaging setup, grams from the Packwise library. Show beside it: paper or other material added, those orders as a share of 23.1B US parcels, and optionally avoided plastic x 0.90 as "likely not recycled" (EPA 2018 film rate). Does NOT claim: that 1,000 sellers will switch, that they are average, any ocean or net carbon benefit.

## Could not confirm
E-commerce share of parcels; USPS package volume from USPS itself; full-year 2025 Census e-commerce total; US counts for Shopify and Amazon sellers; nonemployer e-commerce counts; e-commerce share of US packaging waste; e-commerce corrugated volume; Oceana Amazon report newer than April 2024; credible packaging weight per parcel; share of parcels in poly mailers; small-seller packaging surveys.
