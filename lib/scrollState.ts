// Shared, mutable scroll state. GSAP ScrollTrigger writes `target`, the
// render loop eases `current` toward it. Kept outside React so the 3D scene
// can read it every frame without re-rendering.
export const scrollState = {
  target: 0,
  current: 0,
  ready: false,
  /**
   * One entry per story panel, tweened by its ScrollTrigger from 0 to its
   * side (-1 = text on the left, +1 = right) while the sentence is on screen.
   * The camera reframes so the scene's subject slides away from the words.
   */
  frames: [] as { v: number }[],
};

export const CHAPTER_COUNT = 4;

/**
 * Per chapter: the point (0–1 through the chapter's scroll) where the camera
 * leaves for the next world. Before it, the camera lingers in its world.
 */
export const TRAVEL_START = [0.7, 0.7, 0.74, 1];

/**
 * Per chapter: where the colours, fog and light begin blending into the next
 * world. For the Deep this is later than the travel start, so the ascent
 * begins in the dark while "You were learning to breathe" is still on screen,
 * and the gold only arrives once the sentence has faded.
 */
export const COLOR_START = [0.7, 0.7, 0.88, 1];

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

const isLast = (k: number) => k >= CHAPTER_COUNT - 1;

/** Which two worlds to blend between, and how far (0 → `a`, 1 → `b`). */
export function blendIndex(p: number) {
  const { k, l } = chapterLocal(p);
  const start = COLOR_START[k];
  if (isLast(k) || l < start) return { a: k, b: k, t: 0 };
  return { a: k, b: k + 1, t: smoothstep((l - start) / (1 - start)) };
}

/** 0 when settled in a world, peaks at 1 mid-journey between two worlds. */
export function travelAmount(p: number) {
  const { k, l } = chapterLocal(p);
  const start = TRAVEL_START[k];
  if (isLast(k) || l < start) return 0;
  return Math.sin(Math.PI * ((l - start) / (1 - start)));
}

/**
 * Maps scroll progress to the camera spline parameter. The spline has two
 * keyframes per world (arrive, linger), so 8 points and 7 segments.
 */
export function curveU(p: number) {
  const { k, l } = chapterLocal(p);
  const start = TRAVEL_START[k];
  let seg: number;
  if (isLast(k)) seg = 2 * k + l;
  else if (l < start) seg = 2 * k + l / start;
  else seg = 2 * k + 1 + smoothstep((l - start) / (1 - start));
  return seg / (CHAPTER_COUNT * 2 - 1);
}
