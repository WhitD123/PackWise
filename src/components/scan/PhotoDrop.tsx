"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function PhotoDrop({
  busy,
  samplePhotoUrl,
  onPhoto,
  onSample,
}: {
  busy: boolean;
  /** Path to the built-in example photo, or null if it hasn't been added. */
  samplePhotoUrl: string | null;
  onPhoto: (file: File) => void;
  onSample: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <Card>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f && !busy) onPhoto(f);
        }}
        className={`flex flex-col items-center gap-4 rounded-sm border-2 border-dashed p-10 text-center ${
          over ? "border-forest bg-forest/5" : "border-line"
        }`}
      >
        <p className="max-w-md text-lg">Take or upload a photo of a packed order, with the box open so the filling shows.</p>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label="Upload a photo of a packed order"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPhoto(f);
            e.target.value = "";
          }}
        />
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => input.current?.click()} disabled={busy}>
            {busy ? "Reading your photo…" : "Choose a photo"}
          </Button>
          {samplePhotoUrl && (
            <Button variant="secondary" onClick={onSample} disabled={busy}>
              Try the example photo
            </Button>
          )}
        </div>
        {samplePhotoUrl && (
          <p className="max-w-md text-xs text-muted">
            The example is a ceramic mug in a corrugated box with crinkle paper. It shows how the scan reads packaging and
            isn&rsquo;t anyone&rsquo;s real order.
          </p>
        )}
        <p className="text-xs text-muted">
          JPEG, PNG or WebP. The photo is sent to Google&rsquo;s Gemini to read the parts, and isn&rsquo;t saved by Packwise.
        </p>
      </div>
    </Card>
  );
}
