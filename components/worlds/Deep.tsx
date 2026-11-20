'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import Drift from '../three/Drift';
import { isShown, makeDunes, seeded, useRimMaterial } from '../three/helpers';

type Vec3 = [number, number, number];

function Jellyfish({ position, color, scale = 1, phase = 0 }: { position: Vec3; color: string; scale?: number; phase?: number }) {
  const group = useRef<THREE.Group>(null!);
  const bell = useRef<THREE.Group>(null!);
  const tentacleMesh = useRef<THREE.Mesh>(null!);
  const rim = useRimMaterial(color, 2.6, 1.5);
  const glow = useMemo(() => new THREE.Color(color).multiplyScalar(2.2), [color]);

  // All eight tentacles merged into one geometry = one draw call per jellyfish.
  const tentacles = useMemo(() => {
    const tubes = Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      const pts: THREE.Vector3[] = [];
      for (let j = 0; j < 8; j++) {
        const shrink = 1 - j * 0.08;
        pts.push(
          new THREE.Vector3(
            Math.cos(a) * 0.9 * shrink + Math.sin(j * 0.9 + i) * 0.25,
            -j * 0.8,
            Math.sin(a) * 0.9 * shrink + Math.cos(j * 0.7 + i) * 0.25,
          ),
        );
      }
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.03, 5, false);
    });
    const merged = mergeGeometries(tubes)!;
    tubes.forEach((t) => t.dispose());
    return merged;
  }, []);

  useFrame(({ clock }) => {
    if (!isShown(group.current)) return;
    const t = clock.elapsedTime;
    const pulse = Math.sin(t * 1.7 + phase);
    group.current.position.y = position[1] + Math.sin(t * 0.55 + phase) * 1.3 + Math.max(0, pulse) * 0.3;
    group.current.rotation.y = t * 0.12 + phase;
    bell.current.scale.set(1 + pulse * 0.09, 1 - pulse * 0.1, 1 + pulse * 0.09);
    tentacleMesh.current.rotation.x = Math.sin(t * 1.7 + phase - 0.9) * 0.09;
    tentacleMesh.current.rotation.z = Math.cos(t * 1.1 + phase) * 0.07;
  });

  return (
    <group ref={group} position={position} scale={scale}>
      <group ref={bell}>
        <mesh material={rim}>
          <sphereGeometry args={[1.4, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh scale={0.7}>
          <sphereGeometry args={[1.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color={glow} toneMapped={false} transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>
      <mesh ref={tentacleMesh} geometry={tentacles}>
        <meshBasicMaterial color={glow} toneMapped={false} transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

type KelpItem = { position: Vec3; height: number; phase: number };

/**
 * The whole kelp forest is one merged mesh. Each strand sways in the vertex
 * shader, so it costs one draw call and no per-frame JavaScript.
 */
function KelpForest({ items }: { items: KelpItem[] }) {
  const geometry = useMemo(() => {
    const strands = items.map(({ position, height, phase }) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 8; i++) {
        pts.push(new THREE.Vector3(Math.sin(i * 0.8 + phase) * 0.7, (i / 8) * height, Math.cos(i * 0.6 + phase) * 0.5));
      }
      const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.2, 6, false);
      const pos = g.attributes.position;
      const sway = new Float32Array(pos.count * 2);
      for (let v = 0; v < pos.count; v++) {
        sway[v * 2] = phase;
        sway[v * 2 + 1] = pos.getY(v); // height above the strand's root
      }
      g.setAttribute('aSway', new THREE.BufferAttribute(sway, 2));
      g.translate(position[0], position[1], position[2]);
      return g;
    });
    const merged = mergeGeometries(strands)!;
    strands.forEach((s) => s.dispose());
    return merged;
  }, [items]);

  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#0f5c4a', emissive: '#0b4a3e', emissiveIntensity: 0.5, roughness: 0.8 });
    const uniforms = { uTime: { value: 0 } };
    m.userData.uniforms = uniforms;
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.uTime;
      shader.vertexShader =
        'uniform float uTime;\nattribute vec2 aSway;\n' +
        shader.vertexShader.replace(
          '#include <begin_vertex>',
          /* glsl */ `
          vec3 transformed = vec3(position);
          float h = aSway.y;
          transformed.x -= h * sin(sin(uTime * 0.6 + aSway.x) * 0.09);
          transformed.z += h * sin(cos(uTime * 0.45 + aSway.x) * 0.06);
          `,
        );
    };
    return m;
  }, []);

  useFrame((state) => {
    material.userData.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}

const JELLIES: { p: Vec3; c: string; s: number }[] = [
  { p: [-6, 0, -8], c: '#5ff2ff', s: 1.2 },
  { p: [8, 3, -14], c: '#b18cff', s: 1.6 },
  { p: [-3, 5, -24], c: '#ff7ad9', s: 1.0 },
  { p: [12, -3, -28], c: '#7affc8', s: 1.3 },
  { p: [-12, 2, -20], c: '#5ff2ff', s: 1.8 },
  { p: [3, -4, -34], c: '#b18cff', s: 2.2 },
  { p: [-9, 7, 4], c: '#7affc8', s: 0.9 },
  { p: [10, 6, 10], c: '#ff7ad9', s: 0.8 },
];

export default function Deep() {
  const floor = useMemo(() => makeDunes(200, 90, 2.8, 4.2), []);

  const kelp = useMemo<KelpItem[]>(() => {
    const r = seeded(77);
    return Array.from({ length: 46 }, () => {
      let x = (r() - 0.5) * 70;
      if (Math.abs(x) < 6) x += Math.sign(x || 1) * 6; // keep the camera's lane clear
      return {
        position: [x, -15, (r() - 0.5) * 80 - 10] as Vec3,
        height: 10 + r() * 20,
        phase: r() * Math.PI * 2,
      };
    });
  }, []);

  const shafts = useMemo(() => {
    const r = seeded(5);
    return Array.from({ length: 7 }, () => ({
      position: [(r() - 0.5) * 50, 22, (r() - 0.5) * 50 - 10] as Vec3,
      tilt: (r() - 0.5) * 0.35,
    }));
  }, []);

  return (
    <group>
      <mesh geometry={floor} rotation-x={-Math.PI / 2} position={[0, -15, -10]}>
        <meshStandardMaterial color="#0a2f3d" flatShading roughness={1} />
      </mesh>

      <KelpForest items={kelp} />

      {JELLIES.map((j, i) => (
        <Jellyfish key={i} position={j.p} color={j.c} scale={j.s} phase={i * 1.3} />
      ))}

      {shafts.map((s, i) => (
        <mesh key={i} position={s.position} rotation-z={s.tilt}>
          <cylinderGeometry args={[0.6, 7, 50, 24, 1, true]} />
          <meshBasicMaterial color="#6fe3ff" transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}

      <Sparkles count={260} scale={[60, 30, 60]} position={[0, 0, -10]} size={4} speed={0.2} color="#7ff6ff" />
      <Drift count={260} area={[40, 34, 50]} position={[0, 0, -10]} color={[0.8, 2, 2.4]} size={0.14} speed={1.8} sway={0.4} seed={21} />
    </group>
  );
}
