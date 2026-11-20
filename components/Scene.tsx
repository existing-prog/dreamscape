'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Noise, SMAA, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { CHAPTER_COUNT, scrollState } from '@/lib/scrollState';
import Atmosphere from './three/Atmosphere';
import CameraRig from './three/CameraRig';
import { WORLD_CENTERS } from './three/helpers';
import Awakening from './worlds/Awakening';
import Void from './worlds/Void';
import Deep from './worlds/Deep';
import Ascension from './worlds/Ascension';

/** How quickly the camera catches up with the scroll position. Lower = floatier, slower glide. */
const SCROLL_EASE = 1.25;
/** Frame rate used while the window is in the background (unfocused and not under the mouse). */
const BACKGROUND_FPS = 20;

/** Eases scroll progress and pre-compiles every world's shaders to avoid hitches mid-journey. */
function ProgressDriver() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        gl.compile(scene, camera);
      } catch {
        /* non-fatal */
      }
      scrollState.ready = true;
    }, 60);
    return () => window.clearTimeout(id);
  }, [gl, scene, camera]);

  useFrame((_, delta) => {
    scrollState.current = THREE.MathUtils.damp(scrollState.current, scrollState.target, SCROLL_EASE, Math.min(delta, 0.1));
  }, -2);
  return null;
}

/**
 * Renders at full rate while you're using the page, and throttles to a gentle
 * background rate when focus is on another window or monitor.
 */
function FrameGovernor() {
  const setFrameloop = useThree((s) => s.setFrameloop);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    let pointerInside = true;
    let timer = 0;
    let idle = false;

    const update = () => {
      const shouldIdle = !document.hasFocus() && !pointerInside;
      if (shouldIdle === idle) return;
      idle = shouldIdle;
      window.clearInterval(timer);
      if (idle) {
        setFrameloop('demand');
        timer = window.setInterval(() => invalidate(), 1000 / BACKGROUND_FPS);
      } else {
        setFrameloop('always');
      }
    };
    const enter = () => {
      pointerInside = true;
      update();
    };
    const leave = () => {
      pointerInside = false;
      update();
    };

    window.addEventListener('focus', update);
    window.addEventListener('blur', update);
    document.documentElement.addEventListener('mouseenter', enter);
    document.documentElement.addEventListener('mouseleave', leave);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', update);
      window.removeEventListener('blur', update);
      document.documentElement.removeEventListener('mouseenter', enter);
      document.documentElement.removeEventListener('mouseleave', leave);
      setFrameloop('always');
    };
  }, [setFrameloop, invalidate]);

  return null;
}

/** Only renders a world while the camera is in or travelling toward it. */
function World({ index, children }: { index: number; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame(() => {
    if (!scrollState.ready) return;
    const x = scrollState.current * CHAPTER_COUNT;
    ref.current.visible = x > index - 0.35 && x < index + 1.08;
  });
  return (
    <group ref={ref} position={WORLD_CENTERS[index]}>
      {children}
    </group>
  );
}

export default function Scene() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 55, near: 0.1, far: 500, position: [0, 2, 16] }}
      onCreated={({ gl }) => {
        // Let the browser restore the GPU context instead of leaving a black canvas.
        gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault());
      }}
    >
      <Atmosphere />
      <CameraRig />

      <World index={0}>
        <Awakening />
      </World>
      <World index={1}>
        <Void />
      </World>
      <World index={2}>
        <Deep />
      </World>
      <World index={3}>
        <Ascension />
      </World>

      {/* SMAA instead of 4× MSAA: smooth edges at a fraction of the cost on HDR buffers. */}
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.3} intensity={1.15} radius={0.75} />
        <SMAA />
        <Noise opacity={0.045} />
        <Vignette offset={0.28} darkness={0.7} />
      </EffectComposer>

      <ProgressDriver />
      <FrameGovernor />
    </Canvas>
  );
}
