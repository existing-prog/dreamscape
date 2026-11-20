'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import Drift from '../three/Drift';
import { isShown, seeded, useRimMaterial } from '../three/helpers';

type Vec3 = [number, number, number];

function Island({ position, scale = 1, speed = 1 }: { position: Vec3; scale?: number; speed?: number }) {
  return (
    <Float speed={speed} floatIntensity={1.5} rotationIntensity={0.15}>
      <group position={position} scale={scale}>
        <mesh rotation-x={Math.PI} position-y={-2.5}>
          <coneGeometry args={[3, 5, 7, 1]} />
          <meshStandardMaterial color="#b49a7e" flatShading roughness={1} />
        </mesh>
        <mesh position-y={0.15}>
          <cylinderGeometry args={[3.05, 3, 0.5, 7]} />
          <meshStandardMaterial color="#f4e3c3" flatShading roughness={0.9} />
        </mesh>
        {[
          [0.8, 1.1, 0.4, 0.7],
          [-1.2, 0.9, -0.6, 0.5],
          [0.2, 0.8, -1.4, 0.4],
        ].map(([x, y, z, s], i) => (
          <mesh key={i} position={[x, y, z]} scale={[s, s * 1.8, s]}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#ffd27a" emissive="#ffb84d" emissiveIntensity={2.2} toneMapped={false} flatShading />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

// Islands spiral up around the pillar, leaving the camera's approach lane open.
const ISLANDS: { p: Vec3; s: number }[] = [
  { p: [-16, -6, -4], s: 1.2 },
  { p: [12, -2, -12], s: 1.0 },
  { p: [-10, 4, -18], s: 0.9 },
  { p: [18, 8, 2], s: 1.1 },
  { p: [-18, 12, 6], s: 0.8 },
  { p: [8, 18, -16], s: 0.9 },
  { p: [-6, 24, -14], s: 0.7 },
  { p: [14, 28, -6], s: 0.6 },
  { p: [-12, 34, -4], s: 0.55 },
];

/** A sea of clouds you break through on the way up. */
function CloudSea() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const PUFFS = 48;
  const PER = 6;

  useLayoutEffect(() => {
    const r = seeded(101);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    let idx = 0;
    for (let i = 0; i < PUFFS; i++) {
      const cx = (r() - 0.5) * 80;
      const cz = r() * 70 - 10;
      const cy = -22 + (r() - 0.5) * 5;
      const base = 2.5 + r() * 3;
      for (let j = 0; j < PER; j++) {
        p.set(cx + (r() - 0.5) * base * 2.5, cy + r() * base * 0.6, cz + (r() - 0.5) * base * 2);
        s.setScalar(base * (0.6 + r() * 0.6));
        s.y *= 0.65;
        m.compose(p, q, s);
        ref.current.setMatrixAt(idx++, m);
      }
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, PUFFS * PER]}>
      <sphereGeometry args={[1, 16, 12]} />
      <meshStandardMaterial color="#fff7ea" emissive="#ffe2c2" emissiveIntensity={0.35} roughness={1} />
    </instancedMesh>
  );
}

export default function Ascension() {
  const rings = useRef<THREE.Group>(null!);
  const halo = useRimMaterial('#ffd27a', 2.4, 1.6);

  const ringData = useMemo(() => {
    const r = seeded(13);
    return Array.from({ length: 8 }, (_, i) => ({
      y: -6 + i * 9,
      radius: 5 + i * 0.9,
      tilt: (r() - 0.5) * 0.25,
    }));
  }, []);

  useFrame((state) => {
    if (!isShown(rings.current)) return;
    const t = state.clock.elapsedTime;
    rings.current.children.forEach((ring, i) => {
      ring.rotation.z = t * (0.1 + i * 0.02) * (i % 2 ? -1 : 1);
      ring.position.y = ringData[i].y + Math.sin(t * 0.5 + i) * 0.6;
    });
  });

  return (
    <group>
      {/* Pillar of light */}
      <mesh position-y={60}>
        <cylinderGeometry args={[2.6, 2.6, 200, 32, 1, true]} />
        <meshBasicMaterial color={[2, 1.6, 0.9]} transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh position-y={60}>
        <cylinderGeometry args={[0.45, 0.45, 200, 16, 1, true]} />
        <meshBasicMaterial color={[6, 5, 3.4]} toneMapped={false} />
      </mesh>

      <group ref={rings}>
        {ringData.map((r, i) => (
          <mesh key={i} position-y={r.y} rotation={[Math.PI / 2 + r.tilt, 0, 0]}>
            <torusGeometry args={[r.radius, 0.05, 8, 160]} />
            <meshBasicMaterial color={[3, 2.2, 1.2]} toneMapped={false} />
          </mesh>
        ))}
      </group>

      {/* The light at the summit */}
      <group position={[0, 58, -16]}>
        <mesh>
          <sphereGeometry args={[5, 48, 48]} />
          <meshBasicMaterial color={[5, 4.2, 3]} toneMapped={false} />
        </mesh>
        <mesh material={halo} scale={1.8}>
          <sphereGeometry args={[5, 48, 48]} />
        </mesh>
      </group>

      {ISLANDS.map((isl, i) => (
        <Island key={i} position={isl.p} scale={isl.s} speed={0.6 + (i % 3) * 0.3} />
      ))}

      <CloudSea />

      <Sparkles count={180} scale={[50, 70, 50]} position={[0, 15, 0]} size={4} speed={0.4} color="#fff1c9" />
      <Drift count={320} area={[46, 90, 46]} position={[0, 20, 0]} color={[2.2, 1.7, 0.9]} size={0.22} speed={2.2} sway={0.5} seed={44} />
    </group>
  );
}
