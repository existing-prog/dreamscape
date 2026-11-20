'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import * as THREE from 'three';
import Drift from '../three/Drift';
import { getDotTexture, isShown, seeded, useRimMaterial } from '../three/helpers';

function AccretionDisk() {
  const ref = useRef<THREE.Points>(null!);
  const map = useMemo(() => getDotTexture(), []);
  const { positions, colors } = useMemo(() => {
    const r = seeded(7);
    const N = 3500;
    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);
    const hot = new THREE.Color(3.2, 1.6, 0.8);
    const cold = new THREE.Color(0.7, 0.35, 1.8);
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const radius = 5 + Math.pow(r(), 1.8) * 13;
      const a = r() * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * radius;
      positions[i * 3 + 1] = (r() - 0.5) * 0.5 * (radius / 8);
      positions[i * 3 + 2] = Math.sin(a) * radius;
      c.copy(hot).lerp(cold, (radius - 5) / 13);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    return { positions, colors };
  }, []);

  useFrame((_, dt) => {
    if (!isShown(ref.current)) return;
    ref.current.rotation.y += dt * 0.22;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={map}
        size={0.16}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

export default function Void() {
  const halo = useRimMaterial('#8b5cf6', 3, 2.6);
  const monoliths = useRef<THREE.Group>(null!);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1.2, 12, 0.5)), []);

  const slabs = useMemo(() => {
    const r = seeded(19);
    return Array.from({ length: 11 }, (_, i) => {
      const a = (i / 11) * Math.PI * 2;
      const radius = 22 + r() * 6;
      return {
        position: [Math.cos(a) * radius, Math.sin(i * 1.7) * 4, Math.sin(a) * radius] as [number, number, number],
        rotY: -a + Math.PI / 2,
        tilt: (r() - 0.5) * 0.4,
        scaleY: 0.8 + r() * 0.7,
      };
    });
  }, []);

  const shards = useMemo(() => {
    const r = seeded(31);
    return Array.from({ length: 9 }, () => {
      const a = r() * Math.PI * 2;
      const radius = 10 + r() * 22;
      return {
        position: [Math.cos(a) * radius, (r() - 0.5) * 18, Math.sin(a) * radius] as [number, number, number],
        size: 0.6 + r() * 1.6,
        octa: r() > 0.5,
      };
    });
  }, []);

  useFrame((state, dt) => {
    if (!isShown(monoliths.current)) return;
    monoliths.current.rotation.y += dt * 0.02;
    halo.uniforms.uIntensity.value = 2.6 + Math.sin(state.clock.elapsedTime * 0.8) * 0.6;
  });

  return (
    <group>
      <Stars radius={45} depth={60} count={4500} factor={3.5} saturation={0.5} fade speed={0.4} />

      {/* The singularity at the centre of the void. */}
      <mesh>
        <sphereGeometry args={[4, 64, 64]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh material={halo} scale={1.22}>
        <sphereGeometry args={[4, 64, 64]} />
      </mesh>
      <group rotation={[0.38, 0, 0.18]}>
        <AccretionDisk />
        <mesh rotation-x={Math.PI / 2}>
          <torusGeometry args={[5.2, 0.04, 8, 200]} />
          <meshBasicMaterial color={[4, 2.2, 1.4]} toneMapped={false} />
        </mesh>
      </group>

      <group ref={monoliths}>
        {slabs.map((s, i) => (
          <group key={i} position={s.position} rotation={[s.tilt, s.rotY, 0]} scale={[1, s.scaleY, 1]}>
            <mesh>
              <boxGeometry args={[1.2, 12, 0.5]} />
              <meshStandardMaterial color="#07040c" roughness={0.4} metalness={0.6} />
            </mesh>
            <lineSegments geometry={edges}>
              <lineBasicMaterial color={[1.4, 0.8, 2.6]} toneMapped={false} />
            </lineSegments>
          </group>
        ))}
      </group>

      {shards.map((s, i) => (
        <Float key={i} speed={0.6} rotationIntensity={1.4} floatIntensity={2}>
          <mesh position={s.position} scale={s.size}>
            {s.octa ? <octahedronGeometry args={[1, 0]} /> : <icosahedronGeometry args={[1, 0]} />}
            <meshBasicMaterial color="#7c6be0" wireframe transparent opacity={0.45} />
          </mesh>
        </Float>
      ))}

      <Drift count={300} area={[70, 40, 70]} color={[0.9, 0.7, 1.6]} size={0.12} speed={0.15} sway={0.3} seed={9} />
    </group>
  );
}
