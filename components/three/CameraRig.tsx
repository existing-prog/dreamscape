'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { curveU, scrollState, travelAmount } from '@/lib/scrollState';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** How far the camera turns away from the text, relative to its distance to the subject. */
const FRAMING = 0.24;

// Two keyframes per world: where the camera arrives, and where it lingers
// before the journey to the next world begins.
const POSITIONS = [
  v(0, 2, 16), // Awakening — arrive
  v(4, 1.5, -6), //            linger (you pass through the "eye" ring next)
  v(0, 0, -60), // Void — arrive
  v(-7, 2.5, -72), //      linger, near the event horizon but leaving room for the text
  v(0, -70, -150), // Deep — arrive
  v(4, -82, -174), //       linger among the jellyfish
  v(0, 70, -235), // Ascension — arrive, just above the clouds
  v(6, 95, -250), //            final, gazing up the pillar of light
];

const TARGETS = [
  v(0, 2.5, 0),
  v(0, 3, -20),
  v(0, 0, -90),
  v(0, 0, -100),
  v(0, -80, -180),
  v(0, -85, -200),
  v(0, 85, -260),
  v(0, 135, -275),
];

/** Flies the camera along a scroll-driven spline; the mouse adds a gentle, floating parallax. */
export default function CameraRig() {
  const posCurve = useMemo(() => new THREE.CatmullRomCurve3(POSITIONS, false, 'centripetal'), []);
  const tgtCurve = useMemo(() => new THREE.CatmullRomCurve3(TARGETS, false, 'centripetal'), []);

  const tmp = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      tgt: new THREE.Vector3(),
      fwd: new THREE.Vector3(),
      right: new THREE.Vector3(),
      up: new THREE.Vector3(),
      worldUp: new THREE.Vector3(0, 1, 0),
    }),
    [],
  );
  const mouse = useRef({ x: 0, y: 0 });
  const framing = useRef(0);

  useFrame((state, delta) => {
    const { camera, pointer, clock } = state;
    const p = scrollState.current;
    const u = curveU(p);
    const t = clock.elapsedTime;
    const d = Math.min(delta, 0.1);

    posCurve.getPoint(u, tmp.pos);
    tgtCurve.getPoint(u, tmp.tgt);

    mouse.current.x = THREE.MathUtils.damp(mouse.current.x, pointer.x, 2.2, d);
    mouse.current.y = THREE.MathUtils.damp(mouse.current.y, pointer.y, 2.2, d);

    tmp.fwd.subVectors(tmp.tgt, tmp.pos);
    const distance = tmp.fwd.length();
    tmp.fwd.normalize();
    tmp.right.crossVectors(tmp.fwd, tmp.worldUp).normalize();
    tmp.up.crossVectors(tmp.right, tmp.fwd).normalize();

    // Reframe around the text: words on the left → turn left so the subject
    // slides to the right half of the screen (and vice versa).
    let side = 0;
    for (const f of scrollState.frames) side += f.v;
    framing.current = THREE.MathUtils.damp(framing.current, side, 1.6, d);
    const shift = framing.current * distance * FRAMING;
    tmp.tgt.addScaledVector(tmp.right, shift);
    tmp.pos.addScaledVector(tmp.right, shift * 0.35);

    // Idle "breathing" drift so the dream never feels perfectly still.
    const bx = Math.sin(t * 0.31) * 0.25;
    const by = Math.sin(t * 0.47) * 0.18;

    tmp.pos
      .addScaledVector(tmp.right, mouse.current.x * 1.6 + bx)
      .addScaledVector(tmp.up, mouse.current.y * 0.9 + by);
    tmp.tgt.addScaledVector(tmp.right, mouse.current.x * 3.5).addScaledVector(tmp.up, mouse.current.y * 2.2);

    camera.position.copy(tmp.pos);
    camera.lookAt(tmp.tgt);
    camera.rotateZ(-mouse.current.x * 0.06 + Math.sin(t * 0.23) * 0.012);

    // Widen the lens mid-journey for a warp-like sense of speed.
    const cam = camera as THREE.PerspectiveCamera;
    const fov = 55 + travelAmount(p) * 18;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = THREE.MathUtils.damp(cam.fov, fov, 4, d);
      cam.updateProjectionMatrix();
    }
  }, -1);

  return null;
}
