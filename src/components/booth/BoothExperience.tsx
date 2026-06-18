"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useRef, useState } from "react";
import * as THREE from "three";
import Scene, {
  applyView,
  VIEWS,
  type ControlsRef,
  type ViewKey,
} from "./Scene";
import { SPEC_GROUPS, SPEC_NOTE } from "./specs";

function CanvasLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#ece8e3]">
      <div className="flex flex-col items-center gap-3 text-[#6b5f52]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#cbbfae] border-t-[#6b5f52]" />
        <span className="text-sm tracking-wide">Бүхээг ачаалж байна…</span>
      </div>
    </div>
  );
}

export default function BoothExperience() {
  const controlsRef: ControlsRef = useRef(null);
  const [activeView, setActiveView] = useState<ViewKey>("hero");
  const [doorOpen, setDoorOpen] = useState(false);
  const [curtainOpen, setCurtainOpen] = useState(true);

  const handleView = (key: ViewKey) => {
    setActiveView(key);
    applyView(controlsRef.current, key);
  };

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-[#ece8e3] text-[#3a322b] lg:flex-row">
      {/* 3D viewer pane */}
      <div className="relative flex-1">
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
          camera={{ position: [2.4, 1.75, 2.7], fov: 42, near: 0.1, far: 100 }}
        >
          <Suspense fallback={null}>
            <Scene
              controlsRef={controlsRef}
              doorOpen={doorOpen}
              curtainOpen={curtainOpen}
              onToggleDoor={() => setDoorOpen((v) => !v)}
            />
          </Suspense>
        </Canvas>

        {/* Header overlay */}
        <div className="pointer-events-none absolute left-0 top-0 p-5 sm:p-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#8a7d6c]">
            Дуу тусгаарлагч бүхээг
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Хан алтай ресурс ХХК
          </h1>
        </div>

        {/* Door / curtain toggles */}
        <div className="absolute right-5 top-5 flex flex-col gap-2 sm:right-6 sm:top-6">
          <button
            onClick={() => setDoorOpen((v) => !v)}
            className="rounded-full border border-black/5 bg-white/70 px-4 py-2 text-sm font-medium text-[#3a322b] shadow-sm backdrop-blur-md transition-colors hover:bg-white"
          >
            {doorOpen ? "Хаалга хаах" : "Хаалга нээх"}
          </button>
          <button
            onClick={() => setCurtainOpen((v) => !v)}
            className="rounded-full border border-black/5 bg-white/70 px-4 py-2 text-sm font-medium text-[#3a322b] shadow-sm backdrop-blur-md transition-colors hover:bg-white"
          >
            {curtainOpen ? "Хөшиг хаах" : "Хөшиг нээх"}
          </button>
        </div>

        {/* Preset view buttons */}
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 flex-wrap justify-center gap-2 rounded-full border border-black/5 bg-white/70 px-2 py-2 shadow-sm backdrop-blur-md">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => handleView(v.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeView === v.key
                  ? "bg-[#3a322b] text-white"
                  : "text-[#5d5247] hover:bg-black/5"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Interaction hint */}
        <div className="pointer-events-none absolute bottom-5 right-5 hidden text-right text-xs text-[#8a7d6c] sm:block">
          Чирж эргүүлэх · Гүйлгэж томруулах · Баруун товчоор зөөх
        </div>
      </div>

      {/* Spec panel */}
      <aside className="w-full shrink-0 overflow-y-auto border-t border-black/10 bg-[#f6f3ee] lg:h-dvh lg:w-[340px] lg:border-l lg:border-t-0">
        <div className="p-6">
          <h2 className="text-lg font-semibold tracking-tight">Үзүүлэлтүүд</h2>
          <p className="mt-1 text-sm text-[#8a7d6c]">
            Бүхээгийн зураг төслийн хэмжээс.
          </p>

          <div className="mt-6 space-y-6">
            {SPEC_GROUPS.map((group) => (
              <section key={group.title}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a08f7a]">
                  {group.title}
                </h3>
                <dl className="mt-2 divide-y divide-black/5 rounded-lg border border-black/5 bg-white/60">
                  {group.rows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-4 px-3 py-2"
                    >
                      <dt className="text-sm text-[#5d5247]">{row.label}</dt>
                      <dd className="shrink-0 text-sm font-semibold tabular-nums">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>

          <p className="mt-6 text-xs leading-relaxed text-[#a08f7a]">
            {SPEC_NOTE}
          </p>
        </div>
      </aside>
    </div>
  );
}
