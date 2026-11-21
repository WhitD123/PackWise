import { Bitter, IBM_Plex_Sans } from "next/font/google";

// Headings: Bitter, a sturdy slab serif with the warmth of carton print (brief section 12: warm serif).
// Body and data: IBM Plex Sans, a clean sans with a spec-sheet feel and good tabular figures.
export const headingFont = Bitter({ subsets: ["latin"], variable: "--font-heading" });
export const bodyFont = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });
