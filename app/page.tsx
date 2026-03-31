'use client'

import { useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'

const RouteMap = dynamic(() => import('./components/RouteMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[420px] rounded-xl bg-stone-100 text-stone-400 text-sm">
      Kaart laden…
    </div>
  ),
})

type GpxPoint = { lat: number; lon: number; ele: number }

type RouteData = {
  points: GpxPoint[]
  distanceKm: number
  elevationGain: number
  startLat: number
  startLon: number
}

function parseGpx(text: string): RouteData {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const GpxParser = require('gpxparser')
  const parser = new GpxParser()
  parser.parse(text)

  const track = parser.tracks?.[0]
  if (!track) throw new Error('Geen track gevonden in GPX-bestand.')

  const points: GpxPoint[] = track.points.map(
    (p: { lat: number; lon: number; ele: number }) => ({
      lat: p.lat,
      lon: p.lon,
      ele: p.ele ?? 0,
    }),
  )

  const distanceKm = (track.distance?.total ?? 0) / 1000

  let elevationGain = 0
  for (let i = 1; i < points.length; i++) {
    const diff = points[i].ele - points[i - 1].ele
    if (diff > 0) elevationGain += diff
  }

  return {
    points,
    distanceKm,
    elevationGain: Math.round(elevationGain),
    startLat: points[0].lat,
    startLon: points[0].lon,
  }
}

function BikeIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-16 h-16 opacity-30"
      aria-hidden="true"
    >
      <circle cx="14" cy="44" r="10" stroke="#f97316" strokeWidth="3" />
      <circle cx="50" cy="44" r="10" stroke="#f97316" strokeWidth="3" />
      <path
        d="M14 44 L28 20 L36 20 L50 44"
        stroke="#f97316"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28 20 L32 32 L50 44"
        stroke="#f97316"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 20 L38 16 L44 20"
        stroke="#f97316"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Page() {
  const [route, setRoute] = useState<RouteData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.gpx')) {
      setError('Alleen .gpx bestanden worden ondersteund.')
      return
    }
    setError(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const data = parseGpx(text)
        setRoute(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Kon GPX niet verwerken.')
      }
    }
    reader.readAsText(file)
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const mapPoints: [number, number][] = route
    ? route.points.map((p) => [p.lat, p.lon])
    : []

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#fafaf9' }}>
      {/* Header */}
      <header style={{ background: '#1a1a2e' }} className="px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <h1
            className="text-4xl font-bold tracking-tight text-white"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            Knecht
          </h1>
          <p className="mt-1 text-sm font-medium" style={{ color: '#f97316' }}>
            Upload je route. Weet wat je mee moet.
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-10 space-y-8">
        {/* Upload zone */}
        {!route && (
          <div
            role="button"
            tabIndex={0}
            aria-label="GPX bestand uploaden"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`
              relative flex flex-col items-center justify-center gap-4
              rounded-2xl border-2 border-dashed px-8 py-16 cursor-pointer
              transition-all duration-200 select-none
              ${
                dragging
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-stone-300 bg-white hover:border-orange-300 hover:bg-orange-50/40'
              }
            `}
          >
            <BikeIcon />
            <div className="text-center">
              <p className="text-base font-semibold text-stone-700">
                Sleep je GPX-bestand hierheen
              </p>
              <p className="text-sm text-stone-400 mt-1">
                of klik om te uploaden
              </p>
            </div>
            <span
              className="text-xs font-medium px-3 py-1 rounded-full"
              style={{ background: '#1a1a2e', color: '#f97316' }}
            >
              .gpx
            </span>
            <input
              ref={inputRef}
              type="file"
              accept=".gpx"
              className="hidden"
              onChange={onInputChange}
            />
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {route && (
          <>
            {/* Stats bar */}
            <div
              className="rounded-2xl px-6 py-5 grid grid-cols-3 gap-4"
              style={{ background: '#1a1a2e' }}
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-stone-400">
                  Afstand
                </p>
                <p
                  className="text-2xl font-bold mt-1 text-white"
                  style={{ fontFamily: 'Sora, sans-serif' }}
                >
                  {route.distanceKm.toFixed(1)}{' '}
                  <span className="text-base font-normal text-stone-400">km</span>
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-stone-400">
                  Hoogtemeters
                </p>
                <p
                  className="text-2xl font-bold mt-1 text-white"
                  style={{ fontFamily: 'Sora, sans-serif' }}
                >
                  {route.elevationGain.toLocaleString('nl-NL')}{' '}
                  <span className="text-base font-normal text-stone-400">m</span>
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-stone-400">
                  Startlocatie
                </p>
                <p className="text-sm font-semibold mt-1 text-white leading-snug">
                  {route.startLat.toFixed(4)}°N
                  <br />
                  {route.startLon.toFixed(4)}°E
                </p>
              </div>
            </div>

            {/* Map */}
            <div className="rounded-2xl overflow-hidden shadow-sm border border-stone-200">
              <RouteMap points={mapPoints} />
            </div>

            {/* Reset knop */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setRoute(null)
                  setError(null)
                  if (inputRef.current) inputRef.current.value = ''
                }}
                className="text-sm text-stone-400 hover:text-stone-700 transition-colors underline underline-offset-2"
              >
                Andere route laden
              </button>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer
        className="text-center py-5 text-xs text-stone-400 border-t border-stone-200"
        style={{ background: '#fafaf9' }}
      >
        Knecht — Jouw digitale wielrenknecht
      </footer>
    </div>
  )
}
