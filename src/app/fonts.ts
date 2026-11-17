import { Fraunces, Source_Sans_3 } from "next/font/google";

// Warm serif for headings, clean sans for body (brief section 12). Tyler may swap these.
export const headingFont = Fraunces({ subsets: ["latin"], variable: "--font-heading" });
export const bodyFont = Source_Sans_3({ subsets: ["latin"], variable: "--font-body" });
