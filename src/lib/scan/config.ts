// Settings for the photo scan. The model can be changed with GEMINI_MODEL in .env.local.
// gemini-3.1-flash-lite: cheap, stable, accepts images (Google AI Studio pricing page, checked 2026-11-20).

export const DEFAULT_SCAN_MODEL = "gemini-3.1-flash-lite";

/** Largest photo the route accepts, after the browser shrinks it. Vercel limits request bodies to 4.5 MB. */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Browser-side resize target (long edge, pixels). Smaller photos are cheaper and plenty for packaging. */
export const RESIZE_LONG_EDGE_PX = 1280;
