'use client';

import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getDotTexture } from './helpers';

type Vec3 = [number, number, number];

type DriftProps = {
  count?: number;
  area?: Vec3;
  position?: Vec3;
  color?: THREE.ColorRepresentation | Vec3;
  size?: number;
  /** Vertical units per second. Negative values fall. */
  speed?: number;
  sway?: number;
  opacity?: number;
  seed?: number;
  /** Optional live multiplier (0–1) on opacity, e.g. to fade particles with the story. */
  intensity?: { current: number };
};

/**
 * Glowing particles that rise or fall through a box and wrap around.
 * All motion runs in the vertex shader: the CPU only updates one time uniform
 * per frame, and no buffer is re-uploaded to the GPU.
 */
export default function Drift({
  count = 200,
  area = [20, 20, 20],
  position,
  color = '#ffffff',
  size = 0.2,
  speed = 0.5,
  sway = 0.3,
  opacity = 0.9,
  seed = 1,
  intensity,
}: DriftProps) {
  const [ax, ay, az] = area;

  const geometry = useMemo(() => {
    let s = seed;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const positions = new Float32Array(count * 3);
    const offsets = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (r() - 0.5) * ax;
      positions[i * 3 + 1] = (r() - 0.5) * ay;
      positions[i * 3 + 2] = (r() - 0.5) * az;
      offsets[i] = r() * Math.PI * 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 1));
    return g;
  }, [count, ax, ay, az, seed]);

  const colorKey = Array.isArray(color) ? color.join(',') : String(color);

  const material = useMemo(() => {
    const m = new THREE.PointsMaterial({
      map: getDotTexture(),
      size,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      toneMapped: false,
    });
    if (Array.isArray(color)) m.color.setRGB(color[0], color[1], color[2]);
    else m.color.set(color);

    const uniforms = {
      uTime: { value: 0 },
      uSpeed: { value: speed },
      uHalf: { value: ay / 2 },
      uSway: { value: sway },
    };
    m.userData.uniforms = uniforms;
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader =
        'uniform float uTime;\nuniform float uSpeed;\nuniform float uHalf;\nuniform float uSway;\nattribute float aOffset;\n' +
        shader.vertexShader.replace(
          '#include <begin_vertex>',
          /* glsl */ `
          vec3 transformed = vec3(position);
          float rate = uSpeed * (0.6 + 0.4 * sin(aOffset));
          transformed.y = mod(position.y + uHalf + rate * uTime, 2.0 * uHalf) - uHalf;
          transformed.x -= cos(uTime * 0.5 + aOffset) * uSway * 2.0;
          transformed.z += sin(uTime * 0.4 + aOffset) * uSway * 1.25;
          `,
        );
    };
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorKey, size, opacity, speed, sway, ay]);

  useFrame((state) => {
    material.userData.uniforms.uTime.value = state.clock.elapsedTime;
    if (intensity) material.opacity = opacity * intensity.current;
  });

  return <points geometry={geometry} material={material} position={position} frustumCulled={false} />;
}
