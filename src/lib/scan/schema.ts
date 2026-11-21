// What the vision model must return, and how we check it. The reply is never trusted:
// it is validated against this schema, then matched to the library (parseScan.ts),
// and the user corrects it on the review screen.

import { z } from "zod";

import { MATERIAL_IDS } from "../types.ts";

export const PART_TYPES = ["box", "mailer", "filler", "wrap", "insert", "product_packaging"] as const;
export type PartType = (typeof PART_TYPES)[number];

export const scanPartSchema = z.object({
  part_name: z.string().min(1).max(80),
  type: z.enum(PART_TYPES),
  material: z.enum(MATERIAL_IDS),
  /** Rough outside size in inches if it can be judged from the photo, else null. */
  approx_dims_in: z
    .object({ length_in: z.number().positive().max(60), width_in: z.number().positive().max(60), height_in: z.number().positive().max(60) })
    .nullable(),
  confidence: z.enum(["low", "medium", "high"]),
});

export const scanResultSchema = z.object({
  parts: z.array(scanPartSchema).max(12),
  /** One short sentence about anything unclear (blurry, hidden parts). */
  notes: z.string().max(300),
});

export type ScanPart = z.infer<typeof scanPartSchema>;
export type ScanResult = z.infer<typeof scanResultSchema>;
