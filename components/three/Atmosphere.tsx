'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { blendIndex, scrollState } from '@/lib/scrollState';

type Mood = {
  bg: string;
  fog: string;
  density: number;
  ambient: string;
  ambientI: number;
  sun: string;
  sunI: number;
  sky: string;
  ground: string;
  hemiI: number;
};

// One mood per world; colours and light blend as you travel between them.
const MOODS: Mood[] = [
  { bg: '#f3c4b8', fog: '#f1bfb5', density: 0.017, ambient: '#ffe0d0', ambientI: 0.7, sun: '#ffb38a', sunI: 1.6, sky: '#ffd9c7', ground: '#8a6fb0', hemiI: 0.8 },
  { bg: '#04020a', fog: '#06030e', density: 0.011, ambient: '#6b4fbf', ambientI: 0.25, sun: '#8b5cf6', sunI: 0.7, sky: '#1a1033', ground: '#000000', hemiI: 0.4 },
  { bg: '#02182a', fog: '#032438', density: 0.034, ambient: '#2a7f9e', ambientI: 0.45, sun: '#5fd3ff', sunI: 0.9, sky: '#0e4d6b', ground: '#000814', hemiI: 0.6 },
  { bg: '#ffe6bd', fog: '#ffe9c8', density: 0.0095, ambient: '#fff3dd', ambientI: 0.9, sun: '#ffd27a', sunI: 2.2, sky: '#fff6e0', ground: '#c9a46b', hemiI: 0.9 },
];

/** Background, fog and global lighting, all driven by scroll. */
export default function Atmosphere() {
  const scene = useThree((s) => s.scene);
  const ambient = useRef<THREE.AmbientLight>(null!);
  const sun = useRef<THREE.DirectionalLight>(null!);
  const hemi = useRef<THREE.HemisphereLight>(null!);

  const moods = useMemo(
    () =>
      MOODS.map((m) => ({
        ...m,
        bg: new THREE.Color(m.bg),
        fog: new THREE.Color(m.fog),
        ambient: new THREE.Color(m.ambient),
        sun: new THREE.Color(m.sun),
        sky: new THREE.Color(m.sky),
        ground: new THREE.Color(m.ground),
      })),
    [],
  );

  const { background, fog } = useMemo(() => {
    const background = moods[0].bg.clone();
    const fog = new THREE.FogExp2(moods[0].fog.clone(), moods[0].density);
    return { background, fog };
  }, [moods]);

  useEffect(() => {
    scene.background = background;
    scene.fog = fog;
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene, background, fog]);

  useFrame(() => {
    const { a, b, t } = blendIndex(scrollState.current);
    const A = moods[a];
    const B = moods[b];
    background.copy(A.bg).lerp(B.bg, t);
    fog.color.copy(A.fog).lerp(B.fog, t);
    fog.density = THREE.MathUtils.lerp(A.density, B.density, t);
    ambient.current.color.copy(A.ambient).lerp(B.ambient, t);
    ambient.current.intensity = THREE.MathUtils.lerp(A.ambientI, B.ambientI, t);
    sun.current.color.copy(A.sun).lerp(B.sun, t);
    sun.current.intensity = THREE.MathUtils.lerp(A.sunI, B.sunI, t);
    hemi.current.color.copy(A.sky).lerp(B.sky, t);
    hemi.current.groundColor.copy(A.ground).lerp(B.ground, t);
    hemi.current.intensity = THREE.MathUtils.lerp(A.hemiI, B.hemiI, t);
  });

  return (
    <>
      <ambientLight ref={ambient} />
      <directionalLight ref={sun} position={[10, 20, 10]} />
      <hemisphereLight ref={hemi} />
    </>
  );
}
