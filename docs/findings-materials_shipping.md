# Materials and USPS shipping findings (checked 2026-11-16)

All values came from pages opened with WebFetch (model-written page summaries, not raw text). Carbon factors and many rates are estimates; see is_estimate flags in materials.json.

## Recycle rates (EPA 2018 data) and carbon (EPA WARM v16, production only, virgin inputs)
corrugated 0.965 / 0.915 | kraft-paper 0.208 (proxy) / 1.069 | paperboard 0.208 (proxy) / 1.069 | molded-pulp 0.208 (proxy; curbside unconfirmed) / 1.069 | paper-plastic-mix 0.0 (estimate) / 1.435 (assumes 60/40 paper/LDPE) | pe-film 0.10 (store drop-off) / 1.984 | pp-film 0.0 (estimate) / 1.698 | plastic-laminate 0.0 (estimate) / 2.039 | eps-foam 0.06 (estimate, upper bound) / 2.756 | glass 0.313 / 0.661 | aluminum 0.349 (all aluminum packaging; cans alone 50.4%) / 12.114 | steel 0.738 / 4.012

## USPS Ground Advantage (commercial)
- Notice 123, effective 2026-10-04, temporary holiday prices ending 12am CT Jan 17, 2027.
- DIM divisor 139 (since 2026-07-12); applies above 1,728 cu in. Dimensions round up to whole inches; DIM weight rounds up to next pound.
- Under 1 lb: 4, 8, 12, 15.999 oz tiers, same price within a zone. Zone 5: ounce tiers $8.24; 1 lb $9.29; 2 lb $10.50; 5 lb $14.53; 10 lb $17.81; 20 lb $26.68.

## Could not confirm / estimated
- Corrugated rate conflict: EPA 96.5% (2018) vs AF&PA 70-75% (2025). Kept EPA for consistency.
- Estimated rates: kraft, paperboard, molded pulp (shared EPA category proxy); paper-plastic mix, PP film, laminate, EPS.
- End-of-life splits confirmed only for corrugated, PE film, glass, aluminum, steel; others proxies; paper-plastic mix null.
- Molded pulp curbside unconfirmed. Glass access figures include drop-off sites.
- How2Recycle labels not looked up in the Label Explorer; "Widely Recyclable" inferred from access above 60%.
- Plastic carbon factors exclude film making, foam expansion, lamination (true values higher). Molded pulp drying energy omitted. Paper-plastic and laminate factors use our own assumptions. No second LCA database checked.
- Current prices include a separate 8% transportation increase from April 2026; only a secondary source says it ends Jan 17, 2027.
- Shopify and Pirate Ship rates not checked.
- Soften why_it_matters lines for EPS and aluminum (no source behind the general claims).

## Sources
- EPA containers and packaging: https://www.epa.gov/facts-and-figures-about-materials-waste-and-recycling/containers-and-packaging-product-specific
- EPA 2018 Tables and Figures: https://19january2021snapshot.epa.gov/sites/static/files/2020-11/documents/2018_tables_and_figures_fnl_508.pdf
- EPA paper: https://epa.gov/facts-and-figures-about-materials-waste-and-recycling/paper-and-paperboard-material-specific-data
- EPA plastics: https://www.epa.gov/facts-and-figures-about-materials-waste-and-recycling/plastics-material-specific-data
- AF&PA 2025 rates: https://www.afandpa.org/news/2026/paper-industry-announces-2025-us-paper-recycling-rates
- SPC recycling access study: https://sustainablepackaging.org/wp-content/uploads/2022/03/UPDATED-2020-21-Centralized-Study-on-Availability-of-Recycling-SPC-3-2022.pdf
- How2Recycle: https://how2recycle.info/labels and https://how2recycle.info/about-the-how2recycle-label/store-drop-off-us-only/
- EPA recyclables: https://www.epa.gov/recycle/how-do-i-recycle-common-recyclables
- AF&PA padded mailers: https://www.afandpa.org/news/2022/how-do-i-recycle-paper-padded-mailers
- ISRI film jams: https://isri.org/scrap-articles/untangling-plastic-bag-snags
- EPA WARM v16: https://www.epa.gov/system/files/documents/2023-12/warm_containers_packaging_and_non-durable_goods_materials_v16_dec.pdf
- USPS Notice 123: https://pe.usps.com/text/dmm300/Notice123.pdf
- USPS DMM 283: https://pe.usps.com/cpim/ftp/manuals/DMM300/283.pdf
- USPS holiday release: https://about.usps.com/newsroom/national-releases/2026/0825-usps-announces-temporary-price-change-for-2026-holiday-shipping-season.htm
- Value Added Resource (secondary): https://www.valueaddedresource.net/usps-holiday-2026-rates/
