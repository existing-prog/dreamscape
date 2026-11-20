'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import Drift from '../three/Drift';
import { isShown, makeDunes, useRimMaterial } from '../three/helpers';

// Drifting "memory fragments" — soft, morphing pastel forms.
const FRAGMENTS: { p: [number, number, number]; s: number; c: string; speed: number }[] = [
  { p: [-8, 3, -4], s: 1.4, c: '#ffd6e0', speed: 1.2 },
  // Kept high and to the left, away from the right-hand paragraph.
  { p: [-4, 10, -26], s: 1.6, c: '#c8b6ff', speed: 0.9 },
  { p: [-12, 6, -16], s: 2.2, c: '#b8e0ff', speed: 0.7 },
  { p: [13, 1.5, -18], s: 1.2, c: '#ffe5b4', speed: 1.4 },
  { p: [-6, -0.5, -22], s: 1.6, c: '#ffc6e8', speed: 1.0 },
  { p: [-11, 13, -38], s: 2.4, c: '#d9c8ff', speed: 0.6 },
  { p: [-15, 2, 2], s: 0.9, c: '#ffe5b4', speed: 1.6 },
  { p: [12, 2.5, 4], s: 0.8, c: '#b8e0ff', speed: 1.5 },
];

export default function Awakening() {
  const ring = useRef<THREE.Group>(null!);
  const sun = useRef<THREE.Group>(null!);
  const dunes = useMemo(() => makeDunes(260, 110, 2.2, 1.3), []);
  const halo = useRimMaterial('#ffb38a', 2.4, 1.8);

  useFrame((state) => {
    if (!isShown(ring.current)) return;
    const t = state.clock.elapsedTime;
    const { pointer } = state;
    // The "eye" slowly opens and turns to watch the visitor's cursor.
    ring.current.rotation.x = THREE.MathUtils.lerp(ring.current.rotation.x, -pointer.y * 0.35, 0.04);
    ring.current.rotation.y = THREE.MathUtils.lerp(ring.current.rotation.y, pointer.x * 0.45, 0.04);
    ring.current.rotation.z = t * 0.08;
    ring.current.scale.setScalar(0.92 + Math.sin(t * 0.5) * 0.08);
    // The sun leans gently toward the cursor.
    sun.current.position.x = THREE.MathUtils.lerp(sun.current.position.x, pointer.x * 4, 0.02);
    sun.current.position.y = THREE.MathUtils.lerp(sun.current.position.y, 11 + pointer.y * 2, 0.02);
  });

  return (
    <group>
      <group ref={sun} position={[0, 11, -48]}>
        <mesh>
          <sphereGeometry args={[6, 48, 48]} />
          <meshBasicMaterial color={[3.2, 2.0, 1.5]} toneMapped={false} />
        </mesh>
        <mesh material={halo} scale={1.6}>
          <sphereGeometry args={[6, 48, 48]} />
        </mesh>
      </group>

      <group ref={ring} position={[0, 3, -12]}>
        <mesh>
          <torusGeometry args={[5, 0.05, 16, 200]} />
          <meshBasicMaterial color={[2.6, 1.7, 1.9]} toneMapped={false} />
        </mesh>
        <mesh>
          <torusGeometry args={[5.7, 0.02, 8, 200]} />
          <meshBasicMaterial color={[1.6, 1.3, 2.2]} toneMapped={false} transparent opacity={0.6} />
        </mesh>
        <mesh rotation-x={Math.PI / 2}>
          <torusGeometry args={[4.4, 0.015, 8, 200]} />
          <meshBasicMaterial color={[2, 1.6, 1.4]} toneMapped={false} transparent opacity={0.4} />
        </mesh>
      </group>

      {FRAGMENTS.map((f, i) => (
        <Float key={i} speed={f.speed} rotationIntensity={0.8} floatIntensity={1.6}>
          <mesh position={f.p} scale={f.s}>
            <icosahedronGeometry args={[1, 12]} />
            <MeshDistortMaterial color={f.c} distort={0.42} speed={1.4} roughness={0.25} metalness={0.05} />
          </mesh>
        </Float>
      ))}

      <mesh geometry={dunes} rotation-x={-Math.PI / 2} position={[0, -4.5, -30]}>
        <meshStandardMaterial color="#c9a7d8" flatShading roughness={0.95} />
      </mesh>

      <Sparkles count={140} scale={[40, 14, 40]} position={[0, 3, -10]} size={3} speed={0.3} color="#fff1e6" />
      <Drift count={240} area={[50, 26, 60]} position={[0, 6, -15]} color="#ffc4d6" size={0.32} speed={-0.6} sway={0.7} seed={3} />
    </group>
  );
}
