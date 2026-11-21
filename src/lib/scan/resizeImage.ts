// Browser-only: shrinks a photo before upload. Phone photos are several MB; the scan only
// needs the packaging to be recognizable, and smaller uploads are cheaper and fit
// Vercel's 4.5 MB request limit.

import { RESIZE_LONG_EDGE_PX } from "./config.ts";

export async function resizeForScan(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, RESIZE_LONG_EDGE_PX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser can't resize photos.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) throw new Error("That photo couldn't be prepared.");
  return blob;
}
