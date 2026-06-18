"use client";

import {
  CameraControls,
  ContactShadows,
  Environment,
  Lightformer,
} from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type ElementRef, type RefObject } from "react";
import BoothModel from "./BoothModel";
import { M } from "./specs";

export type ViewKey = "hero" | "front" | "side" | "top" | "interior";

export const VIEWS: { key: ViewKey; label: string }[] = [
  { key: "hero", label: "3/4 өнцөг" },
  { key: "front", label: "Урдаас" },
  { key: "side", label: "Хажуугаас" },
  { key: "top", label: "Дээрээс" },
  { key: "interior", label: "Дотор тал" },
];

const H = M.height;

// Each preset: [camX, camY, camZ, targetX, targetY, targetZ]
// Distances are pulled back so the whole booth stays framed with margin.
const PRESETS: Record<ViewKey, [number, number, number, number, number, number]> = {
  hero: [3.6, 2.2, 4.0, 0, H * 0.45, 0],
  front: [0, 1.2, 4.6, 0, 1.05, 0],
  side: [4.6, 1.35, 0.2, 0, 1.05, 0],
  top: [0.01, 6.0, 0.7, 0, 0.4, 0],
  interior: [0.0, 1.55, 1.05, -0.15, 0.75, -0.6],
};

export type ControlsRef = RefObject<ElementRef<typeof CameraControls> | null>;

/**
 * Animate the camera to a named preset view.
 * `fit` pulls the camera back (>1) so narrow/portrait screens still frame the
 * whole booth — the camera→target distance is scaled around the target point.
 */
export function applyView(
  controls: ControlsRef["current"],
  key: ViewKey,
  transition = true,
  fit = 1,
) {
  if (!controls) return;
  const [px, py, pz, tx, ty, tz] = PRESETS[key];
  const cx = tx + (px - tx) * fit;
  const cy = ty + (py - ty) * fit;
  const cz = tz + (pz - tz) * fit;
  controls.setLookAt(cx, cy, cz, tx, ty, tz, transition);
}

export default function Scene({
  controlsRef,
  activeView,
  doorOpen,
  curtainOpen,
  onToggleDoor,
}: {
  controlsRef: ControlsRef;
  activeView: ViewKey;
  doorOpen: boolean;
  curtainOpen: boolean;
  onToggleDoor: () => void;
}) {
  // Pull-back factor based on the canvas aspect ratio (more for portrait/phone).
  const size = useThree((s) => s.size);
  const fit = useMemo(() => {
    const aspect = size.width / size.height;
    return aspect >= 1 ? 1 : Math.min(2.4, Math.max(1, 1 / aspect));
  }, [size.width, size.height]);

  // Re-frame whenever the chosen view or the screen aspect changes.
  const firstRef = useRef(true);
  useEffect(() => {
    applyView(controlsRef.current, activeView, !firstRef.current, fit);
    firstRef.current = false;
  }, [activeView, fit, controlsRef]);

  return (
    <>
      <color attach="background" args={["#ece8e3"]} />
      <fog attach="fog" args={["#ece8e3", 9, 18]} />

      {/* Key + fill lighting */}
      <ambientLight intensity={0.55} />
      <hemisphereLight args={["#fff6ea", "#d8ccbf", 0.6]} />
      <directionalLight
        position={[4, 6, 4]}
        intensity={1.6}
        color="#fff1de"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-5, 3, -2]} intensity={0.4} color="#cfe0ff" />

      <BoothModel
        doorOpen={doorOpen}
        curtainOpen={curtainOpen}
        onToggleDoor={onToggleDoor}
      />

      {/* Soft grounding shadow */}
      <ContactShadows
        position={[0, 0.001, 0]}
        scale={6}
        far={4}
        blur={2.6}
        opacity={0.45}
        color="#3a322b"
      />

      {/* Reflections for glass / shell without any network HDR download */}
      <Environment resolution={256}>
        <Lightformer
          intensity={1.2}
          color="#fff3df"
          position={[0, 4, 2]}
          scale={[8, 4, 1]}
        />
        <Lightformer
          intensity={0.7}
          color="#ffe3c0"
          position={[4, 2, 3]}
          scale={[4, 4, 1]}
        />
        <Lightformer
          intensity={0.5}
          color="#cfe0ff"
          position={[-4, 2, -2]}
          scale={[4, 4, 1]}
        />
      </Environment>

      <CameraControls
        ref={controlsRef}
        minDistance={0.6}
        maxDistance={8}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2 + 0.05}
        smoothTime={0.4}
      />
    </>
  );
}
