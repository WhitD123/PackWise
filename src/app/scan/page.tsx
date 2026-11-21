import { existsSync } from "node:fs";
import { join } from "node:path";

import type { Metadata } from "next";

import { ScanFlow } from "@/components/scan/ScanFlow";
import { loadData } from "@/lib/data";

export const metadata: Metadata = { title: "Scan your packaging | Packwise" };

/**
 * The built-in example photo for the demo: a ceramic mug in a corrugated box with crinkle paper.
 * It is a sample of how the scan reads packaging, not a photo of Maya's candle order.
 * Shown only if the file exists.
 */
const SAMPLE_PHOTO = "/demo/scan-sample-mug.jpg";

export default function ScanPage() {
  const data = loadData();
  const hasSample = existsSync(join(process.cwd(), "public", SAMPLE_PHOTO));
  return (
    <div>
      <h1 className="mb-2 text-4xl font-semibold text-forest">Scan your packaging</h1>
      <p className="mb-8 max-w-2xl text-lg text-muted">
        Photograph a packed order. We list the box, filling and wrap we can see, you correct anything we got wrong, and
        we use it as &ldquo;what you ship in today&rdquo; to find better options.
      </p>
      <ScanFlow data={data} samplePhotoUrl={hasSample ? SAMPLE_PHOTO : null} />
    </div>
  );
}
