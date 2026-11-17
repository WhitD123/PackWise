# Placeholder data

Everything in this folder is **placeholder data** in the agreed format (`docs/data-format.md`), so the planner and results pages run before the real research lands. Tyler replaces the contents and keeps the file names and shapes.

- `materials.json`: recycling rates and carbon factors are rough guesses.
- `library/components.json`: made-up weights and prices, `supplier: "PLACEHOLDER"`, all `is_estimate: true`. Mailer `height_in` (thickest item that fits) is guessed; the 10 x 13 poly mailer is set to 5 in so the demo candle fits.
- `fees/oregon.json`, `fees/colorado.json`: 2026 rates from the brief (secondary source). Paper materials are left out until their categories are confirmed, so the app warns about them.
- `rules/shipping.json`: the divisor and threshold need verifying; the rate table is invented.

Delete this file once the real data is in.
