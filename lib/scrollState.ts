// Shared, mutable scroll state. GSAP ScrollTrigger writes `target`, the
// render loop eases `current` toward it. Kept outside React so the 3D scene
// can read it every frame without re-rendering.
export const scrollState = {
  target: 0,
  current: 0,
  ready: false,
};

export const CHAPTER_COUNT = 4;

/** Fraction of each chapter spent lingering inside its world; the rest is the journey to the next. */
export const TRAVEL_START = 0.7;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const smoothstep = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};

export function chapterLocal(p: number) {
  const x = Math.min(clamp01(p) * CHAPTER_COUNT, CHAPTER_COUNT - 1e-4);
  const k = Math.floor(x);
  return { k, l: x - k };
}

/** Which two worlds to blend between, and how far (0 → `a`, 1 → `b`). */
export function blendIndex(p: number) {
  const { k, l } = chapterLocal(p);
  if (k >= CHAPTER_COUNT - 1 || l < TRAVEL_START) return { a: k, b: k, t: 0 };
  return { a: k, b: k + 1, t: smoothstep((l - TRAVEL_START) / (1 - TRAVEL_START)) };
}

/** 0 when settled in a world, peaks at 1 mid-journey between two worlds. */
export function travelAmount(p: number) {
  const { k, l } = chapterLocal(p);
  if (k >= CHAPTER_COUNT - 1 || l < TRAVEL_START) return 0;
  return Math.sin(Math.PI * ((l - TRAVEL_START) / (1 - TRAVEL_START)));
}

/**
 * Maps scroll progress to the camera spline parameter. The spline has two
 * keyframes per world (arrive, linger), so 8 points and 7 segments.
 */
export function curveU(p: number) {
  const { k, l } = chapterLocal(p);
  let seg: number;
  if (k === CHAPTER_COUNT - 1) seg = 2 * k + l;
  else if (l < TRAVEL_START) seg = 2 * k + l / TRAVEL_START;
  else seg = 2 * k + 1 + smoothstep((l - TRAVEL_START) / (1 - TRAVEL_START));
  return seg / (CHAPTER_COUNT * 2 - 1);
}
