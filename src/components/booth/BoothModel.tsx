"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { M } from "./specs";

/**
 * Faithful focus-booth model built from the spec-sheet dimensions.
 * World units are meters; the booth is centered on X/Z and sits on the floor (y = 0).
 * The front (open / glass-door) face points toward +Z.
 */

// Palette tuned to the warm-realistic reference render.
const COLOR = {
  shell: "#8d847a", // taupe acoustic shell
  shellDark: "#7b736a",
  wood: "#6f4327", // warm wood interior
  woodLight: "#855233",
  glass: "#dfe7e6",
  beanBag: "#c7ad8a", // warm beige faux-leather
  beanBagButton: "#a98c66",
  desk: "#7a4d2c",
  metal: "#2b2b2b",
  lamp: "#202020", // matte black architect lamp
  curtain: "#161616", // black fabric curtain
  perforation: "#3a3632", // hole dots on the glass
  ventBody: "#eceff2", // white vent housing
  ventGuard: "#33383d", // dark fan guard / bore
  ventBlade: "#cfd6db", // fan blades
  airflow: "#7ec3ff", // animated air streaks

  foliage: "#4f7a3a",
  foliageDark: "#3d6130",
  planter: "#5a5048",
} as const;

const W = M.width; // 1.6
const D = M.depth; // 1.4
const H = M.height; // 2.2
const T = M.wall; // 0.08
const HW = W / 2;
const HD = D / 2;

function Shell() {
  return (
    <group>
      {/* Back wall */}
      <RoundedBox
        args={[W, H, T]}
        radius={M.cornerRadius * 0.6}
        smoothness={4}
        position={[0, H / 2, -HD + T / 2]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={COLOR.shell} roughness={0.9} metalness={0.05} />
      </RoundedBox>

      {/* Left wall */}
      <RoundedBox
        args={[T, H, D]}
        radius={M.cornerRadius * 0.6}
        smoothness={4}
        position={[-HW + T / 2, H / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={COLOR.shell} roughness={0.9} metalness={0.05} />
      </RoundedBox>

      {/* Right wall */}
      <RoundedBox
        args={[T, H, D]}
        radius={M.cornerRadius * 0.6}
        smoothness={4}
        position={[HW - T / 2, H / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={COLOR.shell} roughness={0.9} metalness={0.05} />
      </RoundedBox>

      {/* Roof */}
      <RoundedBox
        args={[W, T * 1.3, D]}
        radius={M.cornerRadius}
        smoothness={5}
        position={[0, H - (T * 1.3) / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={COLOR.shellDark} roughness={0.85} metalness={0.05} />
      </RoundedBox>

      {/* Floor base */}
      <RoundedBox
        args={[W, T, D]}
        radius={M.cornerRadius * 0.5}
        smoothness={4}
        position={[0, T / 2, 0]}
        receiveShadow
      >
        <meshStandardMaterial color={COLOR.shellDark} roughness={0.95} />
      </RoundedBox>
    </group>
  );
}

/** Taupe frame around the glass doors on the front face. */
function FrontFrame() {
  const z = HD - T / 2;
  const jambW = (W - M.clearOpening) / 2; // ~0.1 each side
  const headerH = H - M.doorHeight; // ~0.2 top header
  return (
    <group>
      {/* Left jamb */}
      <mesh position={[-HW + jambW / 2, H / 2, z]} castShadow receiveShadow>
        <boxGeometry args={[jambW, H, T]} />
        <meshStandardMaterial color={COLOR.shell} roughness={0.9} />
      </mesh>
      {/* Right jamb */}
      <mesh position={[HW - jambW / 2, H / 2, z]} castShadow receiveShadow>
        <boxGeometry args={[jambW, H, T]} />
        <meshStandardMaterial color={COLOR.shell} roughness={0.9} />
      </mesh>
      {/* Top header */}
      <mesh position={[0, H - headerH / 2, z]} castShadow receiveShadow>
        <boxGeometry args={[M.clearOpening, headerH, T]} />
        <meshStandardMaterial color={COLOR.shell} roughness={0.9} />
      </mesh>
    </group>
  );
}

/**
 * A single hinged glass door panel that swings open/closed with animation.
 * `side` = -1 (left, hinged on the left jamb) or +1 (right). Holes are drawn
 * in the door's local frame so they swing along with the glass. Clicking the
 * glass toggles the door.
 */
function DoorPanel({
  side,
  open,
  onToggle,
}: {
  side: number;
  open: boolean;
  onToggle: () => void;
}) {
  const doorW = M.doorWidth;
  const doorH = M.doorHeight;
  const hingeX = side * (M.clearOpening / 2); // ±0.7 outer hinge
  const z = HD - T * 0.35;
  const meshX = -side * (doorW / 2); // panel center, offset inward from hinge

  const ref = useRef<THREE.Group>(null);
  const target = open ? side * 1.7 : 0; // ~97° swing outward to the front
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y = THREE.MathUtils.damp(
        ref.current.rotation.y,
        target,
        6,
        delta,
      );
    }
  });

  // Perforation holes in local door space.
  const holes = useMemo<[number, number, number][]>(() => {
    const arr: [number, number, number][] = [];
    const cols = 4;
    const rows = 11;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const x = meshX - doorW * 0.28 + (c / (cols - 1)) * doorW * 0.56;
        const y = 0.35 + (r / (rows - 1)) * (doorH - 0.7);
        arr.push([x, y, 0.009]);
      }
    }
    return arr;
  }, [meshX, doorW, doorH]);

  const instRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    holes.forEach((p, i) => {
      d.position.set(p[0], p[1], p[2]);
      d.updateMatrix();
      instRef.current?.setMatrixAt(i, d.matrix);
    });
    if (instRef.current) instRef.current.instanceMatrix.needsUpdate = true;
  }, [holes]);

  return (
    <group ref={ref} position={[hingeX, 0, z]}>
      {/* Glass — click to toggle */}
      <mesh
        position={[meshX, doorH / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <boxGeometry args={[doorW - 0.01, doorH, 0.012]} />
        <meshPhysicalMaterial
          color={COLOR.glass}
          transmission={0.92}
          thickness={0.04}
          roughness={0.06}
          ior={1.45}
          metalness={0}
          transparent
          opacity={0.5}
        />
      </mesh>
      {/* Handle near the meeting stile (inner edge) */}
      <mesh position={[-side * (doorW - 0.06), doorH / 2, 0.03]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.45, 12]} />
        <meshStandardMaterial color={COLOR.metal} roughness={0.4} metalness={0.7} />
      </mesh>
      {/* Holes */}
      <instancedMesh ref={instRef} args={[undefined, undefined, holes.length]}>
        <circleGeometry args={[0.007, 14]} />
        <meshStandardMaterial color={COLOR.perforation} roughness={0.5} side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  );
}

/** Two hinged glass doors. */
function GlassDoors({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <group>
      <DoorPanel side={-1} open={open} onToggle={onToggle} />
      <DoorPanel side={1} open={open} onToggle={onToggle} />
    </group>
  );
}

/**
 * Build a pleated curtain panel anchored at its OUTER edge (local x = 0) and
 * extending inward to `width`. Animating the parent group's scale.x gathers it
 * toward the outer edge (open) or spreads it across the opening (closed).
 */
function buildCurtainGeometry(width: number, height: number, pleats: number) {
  const uSeg = pleats * 6;
  const vSeg = 10;
  const foldDepth = 0.05;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= vSeg; i++) {
    const v = i / vSeg;
    for (let j = 0; j <= uSeg; j++) {
      const u = j / uSeg;
      const x = u * width; // anchored at outer edge (u = 0)
      const z = foldDepth * Math.sin(u * pleats * Math.PI * 2);
      positions.push(x, v * height, z);
      uvs.push(u, v);
    }
  }
  const cols = uSeg + 1;
  for (let i = 0; i < vSeg; i++) {
    for (let j = 0; j < uSeg; j++) {
      const a = i * cols + j;
      const b = a + cols;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * One black curtain, hinged at the outer edge. Open → gathered to the side;
 * closed → spread across its half of the opening. Animated via scale.x.
 */
function CurtainPanel({ side, open }: { side: number; open: boolean }) {
  const height = M.doorHeight - 0.04;
  const fullWidth = M.clearOpening / 2; // 0.7 — covers half the opening when closed
  const geom = useMemo(
    () => buildCurtainGeometry(fullWidth, height, 12),
    [fullWidth, height],
  );
  const outerX = side * (M.clearOpening / 2); // ±0.7 outer anchor
  const z = HD - 0.075; // just inside the glass doors

  const ref = useRef<THREE.Group>(null);
  const targetSpread = open ? 0.2 : 1.0; // gathered vs. full
  useFrame((_, delta) => {
    if (ref.current) {
      const s = THREE.MathUtils.damp(ref.current.scale.x, targetSpread, 6, delta);
      ref.current.scale.x = s;
    }
  });

  return (
    <group ref={ref} position={[outerX, 0.03, z]}>
      {/* Mirror the right curtain so it extends inward (−x) from its anchor */}
      <mesh geometry={geom} scale={[side === 1 ? -1 : 1, 1, 1]} castShadow receiveShadow>
        <meshStandardMaterial
          color={COLOR.curtain}
          roughness={0.92}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/** Two black curtains flanking the opening. */
function Curtains({ open }: { open: boolean }) {
  return (
    <group>
      <CurtainPanel side={-1} open={open} />
      <CurtainPanel side={1} open={open} />
    </group>
  );
}

/**
 * A wall-mounted ventilation fan on the upper part of a side wall.
 * `mode` = "intake" (air flows inward) or "exhaust" (air flows outward).
 * Blades spin and animated streaks show the airflow direction through it.
 */
function VentUnit({
  side,
  mode,
  z = -0.12,
}: {
  side: 1 | -1;
  mode: "intake" | "exhaust";
  z?: number;
}) {
  const y0 = H - 0.42; // upper part of the wall
  const wallX = side * HW;
  const COUNT = 16;

  const fanRef = useRef<THREE.Group>(null);
  const flowRef = useRef<THREE.InstancedMesh>(null);

  const particles = useMemo(
    () =>
      Array.from({ length: COUNT }, () => ({
        phase: Math.random(),
        jy: (Math.random() - 0.5) * 0.16,
        jz: (Math.random() - 0.5) * 0.16,
      })),
    [],
  );

  useFrame((state, delta) => {
    // Spin the blades (opposite directions for intake vs. exhaust).
    if (fanRef.current) {
      fanRef.current.rotation.x += delta * (mode === "exhaust" ? 7 : -7);
    }
    // Animate the airflow streaks through the wall.
    const inst = flowRef.current;
    if (!inst) return;
    const d = new THREE.Object3D();
    const t = state.clock.elapsedTime;
    const inside = HW - 0.45;
    const outside = HW + 0.16;
    for (let i = 0; i < COUNT; i++) {
      const p = (particles[i].phase + t * 0.35) % 1;
      const prog = mode === "intake" ? 1 - p : p; // inside↔outside
      const xMag = inside + prog * (outside - inside);
      const fade = Math.sin(p * Math.PI); // fade in/out at the ends
      d.position.set(side * xMag, y0 + particles[i].jy, z + particles[i].jz);
      const s = 0.4 + fade * 0.6;
      d.scale.set(0.11 * s, 0.012, 0.012);
      d.updateMatrix();
      inst.setMatrixAt(i, d.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* White housing plate flush on the exterior face */}
      <RoundedBox
        args={[0.02, 0.34, 0.34]}
        radius={0.03}
        smoothness={3}
        position={[wallX + side * 0.012, y0, z]}
        castShadow
      >
        <meshStandardMaterial color={COLOR.ventBody} roughness={0.6} />
      </RoundedBox>

      {/* Dark fan bore */}
      <mesh position={[wallX + side * 0.006, y0, z]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.14, 0.14, 0.03, 32]} />
        <meshStandardMaterial color={COLOR.ventGuard} roughness={0.75} />
      </mesh>

      {/* Spinning blades */}
      <group ref={fanRef} position={[wallX + side * 0.004, y0, z]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.022, 0.022, 0.045, 16]} />
          <meshStandardMaterial color={COLOR.ventGuard} metalness={0.4} roughness={0.4} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <group key={i} rotation={[(i * Math.PI * 2) / 5, 0, 0]}>
            <mesh position={[0, 0.075, 0]} rotation={[0, 0.5, 0]} castShadow>
              <boxGeometry args={[0.06, 0.09, 0.005]} />
              <meshStandardMaterial
                color={COLOR.ventBlade}
                metalness={0.3}
                roughness={0.5}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Fan guard (ring + crossbars) on the exterior */}
      <group position={[wallX + side * 0.022, y0, z]}>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.14, 0.005, 8, 40]} />
          <meshStandardMaterial color={COLOR.ventGuard} roughness={0.6} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[(i * Math.PI) / 4, 0, 0]}>
            <boxGeometry args={[0.004, 0.006, 0.28]} />
            <meshStandardMaterial color={COLOR.ventGuard} roughness={0.6} />
          </mesh>
        ))}
      </group>

      {/* Animated airflow streaks */}
      <instancedMesh
        ref={flowRef}
        args={[undefined, undefined, COUNT]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={COLOR.airflow}
          emissive={COLOR.airflow}
          emissiveIntensity={1.4}
          transparent
          opacity={0.7}
        />
      </instancedMesh>
    </group>
  );
}

/** Intake on one side wall, exhaust on the other. */
function Ventilation() {
  return (
    <group>
      <VentUnit side={1} mode="intake" z={-0.12} />
      <VentUnit side={-1} mode="exhaust" z={-0.12} />
    </group>
  );
}

/** Vertical wood batten/slat accent on a wall. */
function SlatPanel({
  position,
  rotation,
  width,
  height,
  count,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  width: number;
  height: number;
  count: number;
}) {
  const slats = useMemo(() => {
    const gap = width / count;
    return Array.from({ length: count }, (_, i) => -width / 2 + gap / 2 + i * gap);
  }, [width, count]);
  const slatW = (width / count) * 0.65;
  return (
    <group position={position} rotation={rotation}>
      {slats.map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[slatW, height, 0.02]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? COLOR.wood : COLOR.woodLight}
            roughness={0.65}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Warm wood-lined interior surfaces + slat accents. */
function Interior() {
  return (
    <group>
      {/* Inner back wall liner */}
      <mesh position={[0, H / 2, -HD + T + 0.012]} receiveShadow>
        <boxGeometry args={[W - 2 * T, M.innerHeight, 0.02]} />
        <meshStandardMaterial color={COLOR.wood} roughness={0.7} />
      </mesh>
      {/* Vertical slats on the inner back wall */}
      <SlatPanel
        position={[0, H / 2, -HD + T + 0.026]}
        width={W - 2 * T - 0.1}
        height={M.innerHeight - 0.1}
        count={14}
      />
    </group>
  );
}

/** Cantilevered desk with two angled legs and a laptop. */
function Desk() {
  // Against the left interior wall, desktop top at deskHeight.
  const topY = M.deskHeight;
  const x = -HW + T + M.deskDepth / 2 + 0.04; // pushed off the left wall
  const z = -HD + T + 0.04 + M.deskWidth / 2 - 0.1; // desk "width" runs along Z (depth axis)
  return (
    <group position={[x, 0, z]}>
      {/* Desktop slab (width along Z, depth along X) */}
      <mesh position={[0, topY, 0]} castShadow receiveShadow>
        <boxGeometry args={[M.deskDepth, 0.04, M.deskWidth]} />
        <meshStandardMaterial color={COLOR.desk} roughness={0.55} />
      </mesh>
      {/* Two angled legs */}
      {[-M.deskWidth / 2 + 0.08, M.deskWidth / 2 - 0.08].map((lz, i) => (
        <mesh
          key={i}
          position={[M.deskDepth / 2 - 0.06, topY / 2, lz]}
          rotation={[0, 0, 0.12]}
          castShadow
        >
          <cylinderGeometry args={[0.018, 0.018, topY, 10]} />
          <meshStandardMaterial color={COLOR.metal} roughness={0.4} metalness={0.6} />
        </mesh>
      ))}
      {/* Desk lamp with warm glow */}
      <DeskLamp topY={topY} />
    </group>
  );
}

// --- Lamp helpers -----------------------------------------------------------

/** Position + rotation to draw a cylinder limb between two points. */
function limbTransform(a: THREE.Vector3, b: THREE.Vector3) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize(),
  );
  const e = new THREE.Euler().setFromQuaternion(q);
  return {
    position: [mid.x, mid.y, mid.z] as [number, number, number],
    rotation: [e.x, e.y, e.z] as [number, number, number],
    len,
  };
}

/** Coil-spring tube geometry wrapping the axis from a to b. */
function springGeometry(a: THREE.Vector3, b: THREE.Vector3, turns: number) {
  const axis = new THREE.Vector3().subVectors(b, a);
  const len = axis.length();
  axis.normalize();
  const ref =
    Math.abs(axis.y) < 0.95 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const u = new THREE.Vector3().crossVectors(axis, ref).normalize();
  const v = new THREE.Vector3().crossVectors(axis, u).normalize();
  const coilR = 0.016;
  const pts: THREE.Vector3[] = [];
  const N = turns * 14;
  const inset = 0.04; // leave the ends bare for the joints
  for (let i = 0; i <= N; i++) {
    const t = inset + (i / N) * (1 - 2 * inset);
    const ang = (i / N) * turns * Math.PI * 2;
    const center = a.clone().addScaledVector(axis, t * len);
    center
      .addScaledVector(u, Math.cos(ang) * coilR)
      .addScaledVector(v, Math.sin(ang) * coilR);
    pts.push(center);
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  return new THREE.TubeGeometry(curve, N, 0.0035, 6, false);
}

function BlackMat() {
  return <meshStandardMaterial color={COLOR.lamp} roughness={0.55} metalness={0.35} />;
}

function DeskLamp({ topY }: { topY: number }) {
  const bz = -M.deskWidth / 2 + 0.14;

  // Joint points in lamp-local space (base on desk at y = 0, +Z = forward).
  const lamp = useMemo(() => {
    const a = new THREE.Vector3(0, 0.055, 0); // base pivot
    const b = new THREE.Vector3(0, 0.34, 0.1); // elbow (top)
    const c = new THREE.Vector3(0, 0.23, 0.37); // head joint
    return {
      a,
      b,
      c,
      lower: limbTransform(a, b),
      upper: limbTransform(b, c),
      lowerSpring: springGeometry(a, b, 9),
      upperSpring: springGeometry(b, c, 9),
    };
  }, []);

  // Spotlight target (must live in the scene graph to update its world matrix).
  const lightTarget = useMemo(() => new THREE.Object3D(), []);

  // Bell-shade profile (revolved): narrow top → flared circular opening.
  const shadeProfile = useMemo(
    () =>
      [
        [0.006, 0.12],
        [0.022, 0.118],
        [0.038, 0.111],
        [0.052, 0.099],
        [0.066, 0.081],
        [0.079, 0.059],
        [0.092, 0.034],
        [0.103, 0.012],
        [0.11, 0.0],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
    [],
  );

  return (
    <group position={[0.06, topY, bz]}>
      {/* Weighted round base */}
      <mesh position={[0, 0.011, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.07, 0.088, 0.022, 32]} />
        <BlackMat />
      </mesh>
      <mesh position={[0, 0.03, 0]} castShadow>
        <sphereGeometry args={[0.07, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <BlackMat />
      </mesh>
      {/* Base pivot knuckle + post */}
      <mesh position={[lamp.a.x, lamp.a.y, lamp.a.z]} castShadow>
        <sphereGeometry args={[0.022, 16, 16]} />
        <BlackMat />
      </mesh>

      {/* Lower arm + spring */}
      <mesh position={lamp.lower.position} rotation={lamp.lower.rotation} castShadow>
        <cylinderGeometry args={[0.008, 0.008, lamp.lower.len, 12]} />
        <BlackMat />
      </mesh>
      <mesh geometry={lamp.lowerSpring} castShadow><BlackMat /></mesh>

      {/* Elbow knuckle */}
      <mesh position={[lamp.b.x, lamp.b.y, lamp.b.z]} castShadow>
        <sphereGeometry args={[0.022, 16, 16]} />
        <BlackMat />
      </mesh>

      {/* Upper arm + spring */}
      <mesh position={lamp.upper.position} rotation={lamp.upper.rotation} castShadow>
        <cylinderGeometry args={[0.008, 0.008, lamp.upper.len, 12]} />
        <BlackMat />
      </mesh>
      <mesh geometry={lamp.upperSpring} castShadow><BlackMat /></mesh>

      {/* Head joint knuckle */}
      <mesh position={[lamp.c.x, lamp.c.y, lamp.c.z]} castShadow>
        <sphereGeometry args={[0.02, 16, 16]} />
        <BlackMat />
      </mesh>

      {/* Tilted bell shade aimed down-forward */}
      <group position={[lamp.c.x, lamp.c.y - 0.01, lamp.c.z + 0.02]} rotation={[-0.7, 0, 0]}>
        {/* Outer shell */}
        <mesh castShadow>
          <latheGeometry args={[shadeProfile, 40]} />
          <meshStandardMaterial
            color={COLOR.lamp}
            roughness={0.5}
            metalness={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Top wire loop / finial */}
        <mesh position={[0, 0.135, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.013, 0.0035, 8, 20]} />
          <BlackMat />
        </mesh>
        {/* Glowing bulb inside the shade */}
        <mesh position={[0, 0.045, 0]}>
          <sphereGeometry args={[0.028, 16, 16]} />
          <meshStandardMaterial color="#fff3da" emissive="#ffcf87" emissiveIntensity={3} />
        </mesh>
        {/* Warm fill so the inside of the shade glows */}
        <pointLight position={[0, 0.04, 0]} color="#ffbf73" intensity={1.4} distance={1.2} decay={2} />
      </group>

      {/* Warm pool of light cast onto the desk */}
      <primitive object={lightTarget} position={[0, -0.04, 0.6]} />
      <spotLight
        position={[lamp.c.x, lamp.c.y - 0.02, lamp.c.z + 0.04]}
        target={lightTarget}
        color="#ffcd87"
        intensity={5}
        distance={1.8}
        angle={0.7}
        penumbra={0.6}
        decay={2}
        castShadow
      />
    </group>
  );
}

/**
 * Build a realistic bean-bag CHAIR geometry. The cross-section is a continuous
 * path (revolved as a lathe) that climbs the bulging body, curls over a rim,
 * then dips back inward and DOWN into a concave seat well — so the top is a
 * hollow scoop, not a closed bulb. The back is then lifted into a backrest.
 *
 * Each profile point is [radiusFactor (0..1), y (meters), seatWeight (0..1)].
 * seatWeight controls how much the asymmetric backrest lift affects that ring.
 */
function buildBeanBagGeometry(maxRadius: number) {
  const profile: [number, number, number][] = [
    // --- outer body, bottom → belly ---
    [0.0, 0.0, 0], // bottom center (floor)
    [0.32, 0.0, 0],
    [0.58, 0.05, 0],
    [0.8, 0.12, 0],
    [0.93, 0.2, 0],
    [1.0, 0.29, 0], // widest belly
    [0.99, 0.38, 0.15],
    [0.93, 0.46, 0.4],
    [0.84, 0.52, 0.7],
    [0.74, 0.57, 0.95],
    // --- rim (top edge of the seat) ---
    [0.66, 0.6, 1.0], // rim crest
    [0.6, 0.59, 1.0], // rim inner lip
    // --- inner wall diving into the seat well ---
    [0.5, 0.53, 0.92],
    [0.4, 0.48, 0.82],
    [0.29, 0.44, 0.72],
    [0.18, 0.41, 0.64],
    [0.08, 0.39, 0.58],
    [0.0, 0.38, 0.55], // seat well bottom center
  ];

  const radialSegments = 72;
  const panels = 8; // stitched panels around the bag
  const seamAmp = 0.04; // depth of the vertical seam valleys
  const backLift = 0.24; // how much the back rises into a backrest
  const cols = radialSegments + 1;
  const rings = profile.length;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < rings; i++) {
    const [rFac, y, w] = profile[i];
    for (let j = 0; j < cols; j++) {
      const theta = (j / radialSegments) * Math.PI * 2;
      const seam = 1 + seamAmp * Math.cos(panels * theta);
      const radius = maxRadius * rFac * seam;
      // Asymmetric backrest: raise the -Z side, lower the +Z (seat entry) side.
      // Scaled by rFac so the axis center never spikes.
      const lift = -backLift * w * rFac * Math.sin(theta);
      positions.push(Math.cos(theta) * radius, y + lift, Math.sin(theta) * radius);
      uvs.push(j / radialSegments, i / (rings - 1));
    }
  }

  for (let i = 0; i < rings - 1; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * cols + j;
      const b = a + cols;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/** Realistic glossy beige faux-leather bean-bag chair with a hollow seat. */
function BeanBag() {
  const maxRadius = M.beanBag / 2; // ~0.44 → ~0.88 m widest diameter
  const geometry = useMemo(() => buildBeanBagGeometry(maxRadius), [maxRadius]);

  return (
    <group position={[0.2, 0, 0.14]} rotation={[0, -0.5, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={COLOR.beanBag}
          roughness={0.38}
          metalness={0}
          clearcoat={0.6}
          clearcoatRoughness={0.28}
          sheen={0.35}
          sheenColor="#e8d6bb"
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export default function BoothModel({
  doorOpen,
  curtainOpen,
  onToggleDoor,
}: {
  doorOpen: boolean;
  curtainOpen: boolean;
  onToggleDoor: () => void;
}) {
  return (
    <group>
      <Shell />
      <FrontFrame />
      <Interior />
      <Desk />
      <BeanBag />
      <Ventilation />
      <Curtains open={curtainOpen} />
      <GlassDoors open={doorOpen} onToggle={onToggleDoor} />
    </group>
  );
}
