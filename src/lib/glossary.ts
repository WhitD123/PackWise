// Plain-word definitions for the jargon Packwise has to use. One place, so every screen explains a term the same way.
// Written for someone who has never shipped a package commercially. No numbers here: numbers come from the data files.

export const GLOSSARY = {
  "empty-space": {
    term: "Empty space",
    def: "The share of the box with no product in it. Filler such as foam peanuts or paper still counts as empty, so only a smaller box lowers it.",
  },
  "right-sizing": {
    term: "Right-sizing",
    def: "Using the smallest box that still protects the product. You pay less to ship it and need less filler.",
  },
  "fitted-box": {
    term: "Box made for the product",
    def: "A box with a cardboard insert shaped to hold one product snugly, so it needs no loose filler or bubble wrap.",
  },
  zone: {
    term: "Shipping zone",
    def: "USPS prices partly by distance, in zones from 1 (close by) up to 8 (across the country). The farther the zone, the higher the price.",
  },
  "cubic-pricing": {
    term: "Cubic pricing",
    def: "A USPS price for small boxes that is based on the box's size instead of its weight. It is often cheaper for small, heavy packages. You get it by buying postage through shipping software.",
  },
  "dimensional-weight": {
    term: "Dimensional weight",
    def: "For large, light boxes, USPS charges as if the box weighed more, based on its size. A smaller box can avoid it.",
  },
  "landfill-waste": {
    term: "Landfill waste",
    def: "Packaging that is likely to be thrown away instead of recycled, worked out from how much of each material actually gets recycled from homes.",
  },
  "state-laws": {
    term: "State packaging laws",
    def: "Some states make the brand that ships packaging pay a yearly fee per pound of it, with higher fees for plastic that is hard to recycle. Small sellers are often exempt. These are sometimes called EPR laws (extended producer responsibility).",
  },
  co2e: {
    term: "CO2e",
    def: "Carbon dioxide equivalent: all the greenhouse gases from making the packaging and from throwing it away or recycling it, added up as one number.",
  },
  protection: {
    term: "Protection",
    def: "How well the setup keeps the product safe in transit, from how fragile it is, the cushioning around it and the box strength. Glass needs the highest rating.",
  },
} as const;

export type GlossaryKey = keyof typeof GLOSSARY;
