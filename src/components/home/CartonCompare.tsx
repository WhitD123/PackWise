import { useId } from "react";

import { dimsOf } from "@/lib/catalog";
import { dims as fmtDims } from "@/lib/format";
import type { ProductLook } from "@/lib/planner/examples";
import { WRAP_THICKNESS_IN } from "@/lib/rightsizing/packItems";
import type { EvaluatedSetup } from "@/lib/types";

const U = 10; // viewBox units per inch: both cartons share one scale, so the size difference is true
const GAP = 3; // inches between the two cartons
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Same picture every time (no Math.random), so the server and the browser draw identical peanuts. */
function rng(seedText: string) {
  let s = 0;
  for (const ch of seedText) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

interface Box {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

/** The product seen from above, in the carton's own coordinates. */
function Product({ look, b }: { look: ProductLook; b: Box }) {
  const { cx, cy, w, h } = b;
  const r = Math.min(w, h) / 2;
  switch (look) {
    case "jar": {
      const a0 = (200 * Math.PI) / 180;
      const a1 = (255 * Math.PI) / 180;
      const hr = r * 0.5;
      return (
        <g>
          <circle cx={cx + 1} cy={cy + 1.6} r={r} fill="var(--bark)" fillOpacity="0.22" />
          <circle cx={cx} cy={cy} r={r} fill="var(--ochre)" stroke="var(--bark)" strokeWidth="1.2" />
          <circle cx={cx} cy={cy} r={r * 0.88} fill="none" stroke="var(--bark)" strokeOpacity="0.55" strokeWidth="1.1" strokeDasharray="1.1 1.3" />
          <circle cx={cx} cy={cy} r={r * 0.62} fill="var(--ochre)" stroke="var(--bark)" strokeOpacity="0.55" strokeWidth="0.8" />
          <path
            d={`M ${r2(cx + hr * Math.cos(a0))} ${r2(cy + hr * Math.sin(a0))} A ${r2(hr)} ${r2(hr)} 0 0 1 ${r2(cx + hr * Math.cos(a1))} ${r2(cy + hr * Math.sin(a1))}`}
            fill="none"
            stroke="var(--surface)"
            strokeOpacity="0.85"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </g>
      );
    }
    case "mug": {
      const x0 = cx - w / 2;
      const rr = Math.min(w, h) / 2;
      const mx = x0 + rr;
      return (
        <g>
          <rect x={mx + rr * 0.75} y={cy - h * 0.16} width={w - rr * 1.75 + rr * 0.25} height={h * 0.32} rx="3" fill="var(--moss)" stroke="var(--bark)" strokeWidth="0.8" />
          <circle cx={mx + 1} cy={cy + 1.6} r={rr} fill="var(--bark)" fillOpacity="0.22" />
          <circle cx={mx} cy={cy} r={rr} fill="var(--moss)" stroke="var(--bark)" strokeWidth="1" />
          <circle cx={mx} cy={cy} r={rr * 0.86} fill="var(--surface)" stroke="var(--bark)" strokeOpacity="0.4" strokeWidth="0.8" />
          <circle cx={mx} cy={cy} r={rr * 0.6} fill="none" stroke="var(--bark)" strokeOpacity="0.25" strokeWidth="1" />
        </g>
      );
    }
    case "bar":
      return (
        <g>
          <rect x={cx - w / 2 + 1} y={cy - h / 2 + 1.6} width={w} height={h} rx="5" fill="var(--bark)" fillOpacity="0.22" />
          <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx="5" fill="var(--surface)" stroke="var(--bark)" strokeWidth="1.1" />
          <rect x={cx - w / 2 + 4} y={cy - h / 2 + 4} width={w - 8} height={h - 8} rx="3" fill="none" stroke="var(--bark)" strokeOpacity="0.4" strokeWidth="0.8" />
        </g>
      );
    case "folded":
      return (
        <g>
          <rect x={cx - w / 2 + 1} y={cy - h / 2 + 1.6} width={w} height={h} fill="var(--bark)" fillOpacity="0.22" />
          <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} fill="var(--moss)" stroke="var(--bark)" strokeWidth="1" />
          <path d={`M ${cx - w / 2} ${cy - h * 0.16} H ${cx + w / 2} M ${cx - w / 2} ${cy + h * 0.16} H ${cx + w / 2}`} stroke="var(--surface)" strokeOpacity="0.55" strokeWidth="0.9" />
          <path d={`M ${cx - w * 0.1} ${cy - h / 2} q ${w * 0.1} ${h * 0.12} ${w * 0.2} 0`} fill="none" stroke="var(--surface)" strokeOpacity="0.7" strokeWidth="1" />
        </g>
      );
    case "book":
      return (
        <g>
          <rect x={cx - w / 2 + 1} y={cy - h / 2 + 1.6} width={w} height={h} fill="var(--bark)" fillOpacity="0.22" />
          <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} fill="var(--forest)" stroke="var(--bark)" strokeWidth="1" />
          <rect x={cx - w / 2} y={cy - h / 2} width={w * 0.08} height={h} fill="var(--bark)" fillOpacity="0.7" />
          <path d={`M ${cx - w * 0.28} ${cy - h * 0.18} H ${cx + w * 0.3} M ${cx - w * 0.28} ${cy} H ${cx + w * 0.15}`} stroke="var(--surface)" strokeOpacity="0.8" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      );
    default:
      return (
        <g>
          <rect x={cx - w / 2 + 1} y={cy - h / 2 + 1.6} width={w} height={h} rx="3" fill="var(--bark)" fillOpacity="0.22" />
          <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx="3" fill="var(--forest)" stroke="var(--bark)" strokeWidth="1" />
        </g>
      );
  }
}

function Carton({ setup, x, y, id, seed, look }: { setup: EvaluatedSetup; x: number; y: number; id: string; seed: string; look: ProductLook }) {
  const outer = setup.parts.outer;
  const d = dimsOf(outer)!;
  const L = d.length * U;
  const W = d.width * U;
  const isMailer = outer.type === "mailer";
  const wall = 0.4 * U;
  const hasFill = setup.parts.fill !== null && setup.voidVolume_in3 > 0;
  const wrapped = setup.parts.wrap !== null;
  const bubbleWrap = setup.parts.wrap?.material === "pe-film";
  const fitted = outer.has_fitted_insert && outer.fitted_insert;
  const round = look === "jar" || look === "mug";

  // Centre the product block: loose fill and a fitted insert both hold it in the middle, not in a corner.
  const right = Math.max(...setup.placements.map((p) => p.x + p.dims.length));
  const bottom = Math.max(...setup.placements.map((p) => p.y + p.dims.width));
  const shiftX = Math.max(0, (d.length - right) / 2) * U;
  const shiftY = Math.max(0, (d.width - bottom) / 2) * U;
  // A placement is the product plus its wrap on every side.
  const pad = wrapped ? WRAP_THICKNESS_IN * U : 0;
  const boxes: Box[] = setup.placements.map((p) => ({
    cx: p.x * U + shiftX + (p.dims.length * U) / 2,
    cy: p.y * U + shiftY + (p.dims.width * U) / 2,
    w: p.dims.length * U - 2 * pad,
    h: p.dims.width * U - 2 * pad,
  }));

  // Loose filler, scattered on a jittered grid and kept out from under the product. What it looks like depends on
  // what it is: foam peanuts, plastic air pillows, or crumpled paper.
  const fillMaterial = setup.parts.fill?.material;
  const fillKind: "peanuts" | "pillows" | "paper" = fillMaterial === "pe-film" ? "pillows" : fillMaterial === "kraft-paper" ? "paper" : "peanuts";
  const peanuts: { x: number; y: number; a: number }[] = [];
  if (hasFill && !isMailer) {
    const rand = rng(`${seed}-${outer.id}`);
    const step = (fillKind === "pillows" ? 1.7 : fillKind === "paper" ? 0.55 : 0.8) * U;
    for (let gx = wall + step / 2; gx < L - wall; gx += step) {
      for (let gy = wall + step / 2; gy < W - wall; gy += step) {
        const px = gx + (rand() - 0.5) * step * 0.7;
        const py = gy + (rand() - 0.5) * step * 0.7;
        const a = rand() * 180;
        const under = boxes.some((b) => Math.abs(px - b.cx) < b.w / 2 + pad + 3 && Math.abs(py - b.cy) < b.h / 2 + pad + 3);
        if (!under) peanuts.push({ x: r2(px), y: r2(py), a: r2(a) });
      }
    }
  }

  const clip = `clip-${id}`;
  return (
    <g transform={`translate(${x * U} ${y * U})`}>
      <defs>
        <clipPath id={clip}>
          <rect x={wall} y={wall} width={L - 2 * wall} height={W - 2 * wall} />
        </clipPath>
      </defs>

      {isMailer ? (
        <>
          <rect x="1.5" y="2.5" width={L} height={W} rx="6" fill="var(--bark)" fillOpacity="0.16" />
          <rect width={L} height={W} rx="6" fill="var(--surface)" fillOpacity="0.9" stroke="var(--bark)" strokeWidth="1.6" strokeDasharray="5 3" />
          <path d={`M 4 ${wall} H ${L - 4}`} stroke="var(--bark)" strokeOpacity="0.45" strokeWidth="1" />
        </>
      ) : (
        <>
          {/* shadow, then the carton floor */}
          <rect x="2" y="3" width={L} height={W} fill="var(--bark)" fillOpacity="0.18" />
          <rect width={L} height={W} fill="var(--kraft)" />
          <rect x={wall} y={wall} width={L - 2 * wall} height={W - 2 * wall} fill="var(--kraft)" fillOpacity="0.55" />

          {/* the fitted insert: a corrugated pad with a cut-out that holds the product */}
          {fitted && (
            <g clipPath={`url(#${clip})`}>
              <rect x={wall} y={wall} width={L - 2 * wall} height={W - 2 * wall} fill="var(--kraft)" stroke="var(--bark)" strokeOpacity="0.5" strokeWidth="0.8" />
              {boxes.map((b, i) => {
                const rr = Math.max(b.w, b.h) / 2 + 1.5;
                return round ? (
                  <circle key={i} cx={b.cx} cy={b.cy} r={rr} fill="var(--bark)" fillOpacity="0.45" stroke="var(--bark)" strokeWidth="1.1" />
                ) : (
                  <rect key={i} x={b.cx - b.w / 2 - 1.5} y={b.cy - b.h / 2 - 1.5} width={b.w + 3} height={b.h + 3} rx="3" fill="var(--bark)" fillOpacity="0.45" stroke="var(--bark)" strokeWidth="1.1" />
                );
              })}
            </g>
          )}

          {/* loose filler */}
          <g clipPath={`url(#${clip})`}>
            {peanuts.map((p, i) =>
              fillKind === "peanuts" ? (
                <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.a})`}>
                  <rect x="-5" y="-2.4" width="10" height="4.8" rx="2.4" fill="var(--bark)" fillOpacity="0.18" transform="translate(0.8 1)" />
                  <rect x="-5" y="-2.4" width="10" height="4.8" rx="2.4" fill="var(--surface)" stroke="var(--bark)" strokeOpacity="0.5" strokeWidth="0.5" />
                  <path d="M -2.6 0.4 Q 0 -1.2 2.6 0.4" fill="none" stroke="var(--bark)" strokeOpacity="0.25" strokeWidth="0.5" />
                </g>
              ) : fillKind === "pillows" ? (
                <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.a})`}>
                  <rect x="-9" y="-4.6" width="18" height="9.2" rx="4.4" fill="var(--bark)" fillOpacity="0.16" transform="translate(1 1.2)" />
                  <rect x="-9" y="-4.6" width="18" height="9.2" rx="4.4" fill="var(--surface)" fillOpacity="0.85" stroke="var(--bark)" strokeOpacity="0.5" strokeWidth="0.6" />
                  <path d="M -5.5 0 H 5.5" stroke="var(--bark)" strokeOpacity="0.3" strokeWidth="0.6" strokeDasharray="1.4 1.2" />
                </g>
              ) : (
                <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.a})`}>
                  <path d="M -6 0 l 2 -2.6 l 2.2 5 l 2.2 -5 l 2.2 5 l 2 -2.4" fill="none" stroke="var(--bark)" strokeOpacity="0.7" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                  <path d="M -6 0 l 2 -2.6 l 2.2 5 l 2.2 -5 l 2.2 5 l 2 -2.4" fill="none" stroke="var(--surface)" strokeOpacity="0.45" strokeWidth="0.6" strokeLinejoin="round" strokeLinecap="round" />
                </g>
              ),
            )}
          </g>

          {/* walls: a thicker band with the corrugation line down the middle */}
          <path
            d={`M 0 0 H ${L} V ${W} H 0 Z M ${wall} ${wall} V ${W - wall} H ${L - wall} V ${wall} Z`}
            fillRule="evenodd"
            fill="var(--kraft)"
            stroke="var(--bark)"
            strokeWidth="1.6"
          />
          <rect x={wall / 2} y={wall / 2} width={L - wall} height={W - wall} fill="none" stroke="var(--bark)" strokeOpacity="0.55" strokeWidth="0.9" strokeDasharray="1.6 1.6" />
        </>
      )}

      {/* bubble wrap around each product, then the product */}
      {boxes.map((b, i) => (
        <g key={i}>
          {wrapped && !bubbleWrap && (
            <>
              {round ? (
                <circle cx={b.cx} cy={b.cy} r={Math.max(b.w, b.h) / 2 + pad} fill="var(--kraft)" fillOpacity="0.9" stroke="var(--bark)" strokeOpacity="0.7" strokeWidth="1" />
              ) : (
                <rect x={b.cx - b.w / 2 - pad} y={b.cy - b.h / 2 - pad} width={b.w + 2 * pad} height={b.h + 2 * pad} rx="3" fill="var(--kraft)" fillOpacity="0.9" stroke="var(--bark)" strokeOpacity="0.7" strokeWidth="1" />
              )}
              <path d={`M ${b.cx - b.w / 2 - pad + 3} ${b.cy - b.h * 0.18} L ${b.cx + b.w / 2 + pad - 3} ${b.cy + b.h * 0.12}`} stroke="var(--bark)" strokeOpacity="0.4" strokeWidth="0.8" strokeDasharray="3 2" />
            </>
          )}
          {wrapped &&
            bubbleWrap &&
            (round ? (
              <>
                <circle cx={b.cx} cy={b.cy} r={Math.max(b.w, b.h) / 2 + pad} fill="var(--surface)" fillOpacity="0.55" stroke="var(--bark)" strokeOpacity="0.55" strokeWidth="1" />
                <circle cx={b.cx} cy={b.cy} r={Math.max(b.w, b.h) / 2 + pad} fill={`url(#bubbles-${id})`} />
              </>
            ) : (
              <>
                <rect x={b.cx - b.w / 2 - pad} y={b.cy - b.h / 2 - pad} width={b.w + 2 * pad} height={b.h + 2 * pad} rx="4" fill="var(--surface)" fillOpacity="0.55" stroke="var(--bark)" strokeOpacity="0.55" strokeWidth="1" />
                <rect x={b.cx - b.w / 2 - pad} y={b.cy - b.h / 2 - pad} width={b.w + 2 * pad} height={b.h + 2 * pad} rx="4" fill={`url(#bubbles-${id})`} />
              </>
            ))}
          <Product look={look} b={b} />
        </g>
      ))}
    </g>
  );
}

/**
 * Two cartons from above, drawn to the same scale: today's setup and the right-sized one, packed the way they
 * really are (the product, bubble wrap, loose peanuts, a corrugated insert). Everything is read from the
 * evaluated setups; `look` only decides how the product itself is drawn.
 */
export function CartonCompare({ today, swap, look = "generic" }: { today: EvaluatedSetup; swap?: EvaluatedSetup; look?: ProductLook }) {
  // Two drawings on one page (the hero and the calculator) must not share ids, or one would use the other's clip.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const a = dimsOf(today.parts.outer)!;
  const b = swap ? dimsOf(swap.parts.outer)! : null;
  const H = Math.max(a.width, b?.width ?? 0);
  const width = (a.length + (b ? GAP + b.length : 0)) * U + 4;
  const height = H * U + 4;
  return (
    <figure>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={
          b
            ? `Top view of two cartons at the same scale. Today: ${fmtDims(a)} inches. Right-sized: ${fmtDims(b)} inches.`
            : `Top view of today's carton, ${fmtDims(a)} inches.`
        }
      >
        <defs>
          {["a", "b"].map((id) => (
            <pattern key={id} id={`bubbles-${uid}${id}`} width="5" height="5" patternUnits="userSpaceOnUse">
              <circle cx="2.5" cy="2.5" r="1.9" fill="var(--surface)" fillOpacity="0.8" stroke="var(--bark)" strokeOpacity="0.4" strokeWidth="0.5" />
            </pattern>
          ))}
        </defs>
        <Carton setup={today} x={0} y={H - a.width} id={`${uid}a`} seed="a" look={look} />
        {swap && b && <Carton setup={swap} x={a.length + GAP} y={H - b.width} id={`${uid}b`} seed="b" look={look} />}
      </svg>
    </figure>
  );
}
