// Photo scan (CLAUDE.md section 9). Runs on the server so the API key stays private.
//
//   POST multipart/form-data with an "image" file
//   -> Gemini reads the photo and returns parts as structured JSON
//   -> the reply is checked against scanResultSchema (never trusted)
//   -> parseScan matches each part to the library
//   -> JSON back to the review screen, where the user corrects it.

import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";

import { loadData } from "@/lib/data";
import { ALLOWED_IMAGE_TYPES, DEFAULT_SCAN_MODEL, MAX_IMAGE_BYTES } from "@/lib/scan/config";
import { parseScan } from "@/lib/scan/parseScan";
import { buildScanPrompt } from "@/lib/scan/prompt";
import { scanResultSchema } from "@/lib/scan/schema";

const TIMEOUT_MS = 45_000;

// A simple per-visitor cap so one person cannot run up the bill. In-memory, so each server
// instance counts separately: a speed bump, not a guarantee. Set a spending limit at the provider too.
const MAX_SCANS_PER_HOUR = 20;
const recent = new Map<string, number[]>();

function overLimit(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > MAX_SCANS_PER_HOUR;
}

const fail = (error: string, status: number) => Response.json({ error }, { status });

export async function POST(request: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return fail("The photo scan isn't set up on this server yet. You can still pick your packaging by hand in the planner.", 503);
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (overLimit(ip)) return fail("Too many scans from this connection. Please try again in an hour.", 429);

  let file: File;
  try {
    const form = await request.formData();
    const value = form.get("image");
    if (!(value instanceof File)) return fail("Choose a photo to scan.", 400);
    file = value;
  } catch {
    return fail("That upload couldn't be read. Try a different photo.", 400);
  }

  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return fail("Use a JPEG, PNG or WebP photo.", 415);
  }
  if (file.size > MAX_IMAGE_BYTES) return fail("That photo is too large. Try one under 4 MB.", 413);
  if (file.size === 0) return fail("That photo is empty.", 400);

  const data = loadData();
  const model = process.env.GEMINI_MODEL || DEFAULT_SCAN_MODEL;

  try {
    const result = await generateText({
      model: google(model),
      output: Output.object({ schema: scanResultSchema }),
      abortSignal: AbortSignal.timeout(TIMEOUT_MS),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: buildScanPrompt(data.catalog.materials) },
            { type: "file", data: new Uint8Array(await file.arrayBuffer()), mediaType: file.type },
          ],
        },
      ],
    });

    // Token counts (no photo, no key) so the real cost per scan can be worked out from provider pricing.
    console.log(`scan ok: model=${model} input_tokens=${result.usage.inputTokens} output_tokens=${result.usage.outputTokens}`);
    const scan = scanResultSchema.parse(result.output); // belt and braces: validate again
    return Response.json({ scan, parsed: parseScan(scan.parts, data.catalog), model });
  } catch (error) {
    // Log the reason on the server only. Never send provider details or keys to the browser.
    console.error("scan failed:", error instanceof Error ? error.message : "unknown error");
    return fail("We couldn't read that photo. Try again, or pick your packaging by hand in the planner.", 502);
  }
}
