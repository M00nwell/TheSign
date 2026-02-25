'use client'

import { useRef, useState, useEffect } from 'react'
import OmenCard, { OmenCardHandle } from "@/components/omen-card";
import CardPackage from "@/components/card-package";
import Header from "@/components/header";
import { useUser } from '@/providers/user-provider'

// ─── Time-of-day ambient palette ─────────────────────────────────────────────
// Each stop: hour (0–24), bg [r,g,b], glow-top-left [r,g,b,a], glow-bottom-right [r,g,b,a]
// Dark but distinct — each period has a clearly different tonal mood.
const TIME_PALETTE = [
  { h: 0, bg: [10, 8, 45], g1: [90, 50, 220, 0.45], g2: [35, 18, 130, 0.38] }, // midnight — vivid indigo
  { h: 4, bg: [12, 10, 55], g1: [100, 55, 230, 0.48], g2: [45, 25, 155, 0.40] }, // deep night — violet
  { h: 5, bg: [22, 12, 75], g1: [140, 65, 240, 0.50], g2: [80, 35, 190, 0.42] }, // pre-dawn — purple surge
  { h: 6, bg: [40, 25, 90], g1: [200, 90, 55, 0.48], g2: [115, 55, 220, 0.44] }, // dawn — amber meets violet
  { h: 7, bg: [8, 28, 85], g1: [45, 100, 220, 0.50], g2: [28, 65, 170, 0.42] }, // sunrise — deep ocean blue
  { h: 9, bg: [6, 20, 65], g1: [28, 80, 195, 0.45], g2: [22, 55, 135, 0.36] }, // morning — cool blue
  { h: 12, bg: [16, 16, 28], g1: [45, 72, 155, 0.35], g2: [55, 58, 125, 0.28] }, // noon — muted blue-gray
  { h: 15, bg: [60, 28, 10], g1: [168, 78, 28, 0.48], g2: [105, 52, 18, 0.38] }, // afternoon — sienna
  { h: 17, bg: [90, 42, 8], g1: [240, 115, 22, 0.55], g2: [190, 65, 28, 0.48] }, // golden hour — vivid amber
  { h: 18, bg: [85, 12, 48], g1: [250, 52, 20, 0.58], g2: [180, 22, 125, 0.50] }, // sunset — crimson-magenta
  { h: 20, bg: [28, 12, 60], g1: [125, 35, 210, 0.50], g2: [82, 28, 175, 0.42] }, // dusk — twilight purple
  { h: 22, bg: [12, 10, 48], g1: [88, 48, 200, 0.42], g2: [35, 32, 140, 0.35] }, // night — dark indigo
  { h: 24, bg: [10, 8, 45], g1: [90, 50, 220, 0.45], g2: [35, 18, 130, 0.38] }, // midnight (wrap)
] as const

type Stop = typeof TIME_PALETTE[number]

// ─── DEV: set to any hour (0–23) to preview that time's palette. null = real time.
const DEV_HOUR_OVERRIDE: number | null = null;

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

function getAmbientColors() {
  const now = new Date()
  const h = DEV_HOUR_OVERRIDE !== null
    ? DEV_HOUR_OVERRIDE
    : now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600

  // Find surrounding stops
  let i = TIME_PALETTE.findIndex(p => p.h >= h) - 1
  i = Math.max(0, Math.min(i, TIME_PALETTE.length - 2))
  const a = TIME_PALETTE[i] as Stop
  const b = TIME_PALETTE[i + 1] as Stop
  const t = b.h === a.h ? 0 : (h - a.h) / (b.h - a.h)

  const ri = (x: number, y: number) => Math.round(lerp(x, y, t))
  const ra = (x: number, y: number) => lerp(x, y, t).toFixed(3)

  return {
    bg: `rgb(${ri(a.bg[0], b.bg[0])},${ri(a.bg[1], b.bg[1])},${ri(a.bg[2], b.bg[2])})`,
    g1: `rgba(${ri(a.g1[0], b.g1[0])},${ri(a.g1[1], b.g1[1])},${ri(a.g1[2], b.g1[2])},${ra(a.g1[3], b.g1[3])})`,
    g2: `rgba(${ri(a.g2[0], b.g2[0])},${ri(a.g2[1], b.g2[1])},${ri(a.g2[2], b.g2[2])},${ra(a.g2[3], b.g2[3])})`,
  }
}

export default function Home() {
  const [isPackageOpen, setIsPackageOpen] = useState(false)
  const omenCardRef = useRef<OmenCardHandle>(null)
  const { user } = useUser()
  const [ambient, setAmbient] = useState(() => getAmbientColors())

  // Reset to card-packaging stage when user logs out
  useEffect(() => {
    if (!user) setIsPackageOpen(false)
  }, [user])

  // Refresh ambient colors every minute
  useEffect(() => {
    const tick = () => setAmbient(getAmbientColors())
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen py-2 text-white overflow-hidden relative"
      style={{
        backgroundColor: ambient.bg,
        transition: 'background-color 3s ease-in-out',
      }}
    >
      {/* Ambient glow — top left */}
      <div
        className="absolute top-[-25%] left-[-15%] w-[50%] h-[50%] pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${ambient.g1} 0%, transparent 60%)`,
          transition: 'background 3s ease-in-out',
        }}
      />
      {/* Ambient glow — bottom right */}
      <div
        className="absolute bottom-[-25%] right-[-15%] w-[50%] h-[50%] pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${ambient.g2} 0%, transparent 60%)`,
          transition: 'background 3s ease-in-out',
        }}
      />
      {/* Subtle vignette to darken edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)' }}
      />

      <Header
        isPackageOpen={isPackageOpen}
        onShare={() => omenCardRef.current?.share()}
      />

      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 text-center z-10">
        <CardPackage onOpen={() => setIsPackageOpen(true)}>
          <OmenCard ref={omenCardRef} />
        </CardPackage>
      </main>
    </div>
  )
}
