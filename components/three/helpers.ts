import { useMemo } from 'react';
import * as THREE from 'three';

/** World origins. The camera journeys forward, falls into the deep, then rises. */
export const WORLD_CENTERS: [number, number, number][] = [
  [0, 0, 0], // I   The Awakening
  [0, 0, -90], // II  The Void
  [0, -80, -180], // III The Deep
  [0, 80, -260], // IV  The Ascension
];

let dot: THREE.Texture | null = null;
/** Soft round sprite for particles, generated once on a canvas. */
export function getDotTexture() {
  if (dot) return dot;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.25, 'rgba(255,255,255,0.75)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  dot = new THREE.CanvasTexture(c);
  dot.colorSpace = THREE.SRGBColorSpace;
  return dot;
}

const rimVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const rimFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uPower;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    // Clamp before pow(): float error can push the dot product past 1, and
    // pow(negative, x) is NaN. Bloom smears NaN pixels into black flashes.
    float facing = clamp(abs(dot(normalize(vNormal), normalize(vView))), 0.0, 1.0);
    float rim = pow(max(1.0 - facing, 0.0), uPower);
    gl_FragColor = vec4(uColor * uIntensity * rim, rim);
  }
`;

/** Additive fresnel glow — halos, jellyfish bells, event horizons. */
export function useRimMaterial(color: THREE.ColorRepresentation, intensity = 1.5, power = 2.5) {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uIntensity: { value: intensity },
          uPower: { value: power },
        },
        vertexShader: rimVertex,
        fragmentShader: rimFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [color, intensity, power],
  );
}

/** Low-poly rolling terrain. Swap for a Blender-sculpted .glb when you have one. */
export function makeDunes(size: number, segments: number, amp: number, seed: number) {
  const g = new THREE.PlaneGeometry(size, size, segments, segments);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z =
      amp *
      (Math.sin(x * 0.07 + seed) * Math.cos(y * 0.09 + seed * 0.5) +
        0.5 * Math.sin(x * 0.19 + y * 0.15 + seed * 2) +
        0.25 * Math.sin(x * 0.43 - y * 0.37));
    pos.setZ(i, z);
  }
  g.computeVertexNormals();
  return g;
}

/** True when the object and all its ancestors are visible — lets hidden worlds skip per-frame work. */
export function isShown(obj: THREE.Object3D | null) {
  for (let o = obj; o; o = o.parent) if (!o.visible) return false;
  return obj !== null;
}

/** Deterministic pseudo-random so worlds look identical on every visit. */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
