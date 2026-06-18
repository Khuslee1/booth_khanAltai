"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useRef, useState } from "react";
import * as THREE from "three";
import Scene, { VIEWS, type ControlsRef, type ViewKey } from "./Scene";
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
  const [specOpen, setSpecOpen] = useState(false);

  const handleView = (key: ViewKey) => {
    setActiveView(key);
  };

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-[#ece8e3] text-[#3a322b] lg:flex-row">
      {/* 3D viewer pane */}
      <div className="relative flex-1">
        <Canvas
          shadows="percentage"
          dpr={[1, 2]}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
          camera={{ position: [2.4, 1.75, 2.7], fov: 42, near: 0.1, far: 100 }}
        >
          <Suspense fallback={null}>
            <Scene
              controlsRef={controlsRef}
              activeView={activeView}
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

        {/* Mobile: open the spec drawer (hidden on desktop, where it's always shown) */}
        <button
          onClick={() => setSpecOpen(true)}
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#3a322b] px-5 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-[#4a4138] lg:hidden"
        >
          Үзүүлэлт ▲
        </button>

        {/* Preset view buttons — single scrollable row (lifted above the spec button on phones) */}
        <div className="absolute bottom-20 left-1/2 flex max-w-[94%] -translate-x-1/2 flex-nowrap items-center gap-1 overflow-x-auto rounded-full border border-black/5 bg-white/70 px-1.5 py-1.5 shadow-sm backdrop-blur-md lg:bottom-5 lg:max-w-none lg:gap-2 lg:px-2">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => handleView(v.key)}
              className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors lg:px-4 lg:text-sm ${
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

      {/* Mobile backdrop when the drawer is open */}
      {specOpen && (
        <div
          onClick={() => setSpecOpen(false)}
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
        />
      )}

      {/* Spec panel — slide-up drawer on phones, static sidebar on desktop */}
      <aside
        className={`fixed inset-x-0 bottom-0 z-30 max-h-[80dvh] overflow-y-auto rounded-t-2xl border-t border-black/10 bg-[#f6f3ee] shadow-[0_-8px_30px_rgba(0,0,0,0.18)] transition-transform duration-300 ease-out ${
          specOpen ? "translate-y-0" : "translate-y-full"
        } lg:static lg:z-auto lg:h-dvh lg:max-h-none lg:w-[340px] lg:shrink-0 lg:translate-y-0 lg:rounded-none lg:border-l lg:border-t-0 lg:shadow-none`}
      >
        {/* Mobile drag handle + close button */}
        <div className="sticky top-0 z-10 flex items-center justify-center bg-[#f6f3ee] pt-3 lg:hidden">
          <div className="h-1.5 w-12 rounded-full bg-black/15" />
          <button
            onClick={() => setSpecOpen(false)}
            aria-label="Хаах"
            className="absolute right-3 top-1.5 rounded-full p-2 text-[#5d5247] transition-colors hover:bg-black/5"
          >
            ✕
          </button>
        </div>

        <div className="p-6 pt-4 lg:pt-6">
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
