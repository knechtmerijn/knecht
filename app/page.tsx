'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import ElevationProfile from './components/ElevationProfile'
import type { ElevPoint, HardestClimb } from './components/ElevationProfile'
import WeatherPanel from './components/WeatherPanel'
import type { HourlyWeather } from './components/WeatherPanel'
import ClothingAdvice from './components/ClothingAdvice'
import NutritionAdvice from './components/NutritionAdvice'
import PackingChecklist from './components/PackingChecklist'

const RouteMap = dynamic(() => import('./components/RouteMap'), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center h-[380px] text-sm"
      style={{ background: '#F5F7FA', color: '#6B7280', fontFamily: 'Satoshi, sans-serif' }}
    >
      Kaart laden…
    </div>
  ),
})

// ─── Types ───────────────────────────────────────────────────────────────────

type GpxPoint = { lat: number; lon: number; ele: number }

type RouteData = {
  points: GpxPoint[]
  distanceKm: number
  elevationGain: number
  startLat: number
  startLon: number
  elevationProfile: ElevPoint[]
  hardestClimb: HardestClimb
}

// ─── GPX parsing helpers ─────────────────────────────────────────────────────

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function buildElevationProfile(pts: GpxPoint[], cumDistM: number[]): ElevPoint[] {
  const TARGET = 200
  const step = Math.max(1, Math.floor(pts.length / TARGET))
  const profile: ElevPoint[] = []
  for (let i = 0; i < pts.length; i += step) {
    profile.push({
      distanceKm: parseFloat((cumDistM[i] / 1000).toFixed(2)),
      elevation: Math.round(pts[i].ele),
    })
  }
  const last = pts.length - 1
  const lastKm = parseFloat((cumDistM[last] / 1000).toFixed(2))
  if (profile[profile.length - 1].distanceKm !== lastKm) {
    profile.push({ distanceKm: lastKm, elevation: Math.round(pts[last].ele) })
  }
  return profile
}

function findHardestClimb(pts: GpxPoint[], cumDistM: number[]): HardestClimb {
  const MAX_PTS = 400
  const step = Math.max(1, Math.floor(pts.length / MAX_PTS))
  const sp = pts.filter((_, i) => i % step === 0)
  const sd = cumDistM.filter((_, i) => i % step === 0)

  let best: HardestClimb = null
  let bestScore = 0

  for (let i = 0; i < sp.length - 1; i++) {
    let j = i + 1
    while (j < sp.length && sd[j] - sd[i] < 500) j++
    if (j >= sp.length) continue

    const dM = sd[j] - sd[i]
    const dE = sp[j].ele - sp[i].ele
    if ((dE / dM) * 100 <= 5) continue

    while (j + 1 < sp.length) {
      const extDM = sd[j + 1] - sd[i]
      const extDE = sp[j + 1].ele - sp[i].ele
      if (extDE > 0 && (extDE / extDM) * 100 > 3) j++
      else break
    }

    const finalDM = sd[j] - sd[i]
    const finalDE = sp[j].ele - sp[i].ele
    const avgGrad = (finalDE / finalDM) * 100
    if (avgGrad <= 5) continue

    let maxGrad = 0
    for (let k = i + 1; k <= j; k++) {
      const segDM = sd[k] - sd[k - 1]
      if (segDM > 10) {
        const g = ((sp[k].ele - sp[k - 1].ele) / segDM) * 100
        if (g > maxGrad) maxGrad = g
      }
    }

    const lengthKm = finalDM / 1000
    const score = avgGrad * Math.sqrt(lengthKm)
    if (score > bestScore) {
      bestScore = score
      best = {
        startKm: sd[i] / 1000,
        endKm: sd[j] / 1000,
        lengthKm,
        avgGradient: avgGrad,
        maxGradient: maxGrad,
      }
    }
  }
  return best
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

  const rawCumul: number[] | undefined = track.distance?.cumul
  let cumulDistM: number[]
  if (rawCumul && rawCumul.length === points.length) {
    cumulDistM = rawCumul
  } else {
    cumulDistM = [0]
    for (let i = 1; i < points.length; i++) {
      cumulDistM.push(
        cumulDistM[i - 1] +
          haversineM(points[i - 1].lat, points[i - 1].lon, points[i].lat, points[i].lon),
      )
    }
  }

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
    elevationProfile: buildElevationProfile(points, cumulDistM),
    hardestClimb: findHardestClimb(points, cumulDistM),
  }
}

// ─── Decorative background line ──────────────────────────────────────────────

function DecorativeLine() {
  return (
    <svg
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      viewBox="0 0 100 1000"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      <path
        d="M 40 0
           C 58 80,  22 160, 38 240
           C 54 320, 20 400, 42 480
           C 62 560, 18 640, 36 720
           C 56 800, 24 880, 40 1000"
        fill="none"
        stroke="url(#lineGradient)"
        strokeWidth="3"
        opacity="0.2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

// ─── Upload zone bike icon ────────────────────────────────────────────────────

function BikeIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-12 h-12"
      aria-hidden="true"
      stroke="#F59E0B"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={0.6}
    >
      <circle cx="14" cy="44" r="10" />
      <circle cx="50" cy="44" r="10" />
      <path d="M14 44 L28 20 L36 20 L50 44" />
      <path d="M28 20 L32 32 L50 44" />
      <path d="M32 20 L38 16 L44 20" />
    </svg>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTomorrowDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Page() {
  const [route, setRoute] = useState<RouteData | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const [rideDate, setRideDate] = useState<string>(getTomorrowDate)
  const [rideTime, setRideTime] = useState('09:00')
  const [avgSpeedKmh, setAvgSpeedKmh] = useState(27)

  const [allWeather, setAllWeather] = useState<HourlyWeather[] | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)

  useEffect(() => {
    if (!route) return

    const ctrl = new AbortController()
    setWeatherLoading(true)
    setWeatherError(null)
    setAllWeather(null)

    ;(async () => {
      try {
        const url =
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${route.startLat.toFixed(4)}` +
          `&longitude=${route.startLon.toFixed(4)}` +
          `&hourly=temperature_2m,windspeed_10m,winddirection_10m,precipitation_probability,weathercode` +
          `&timezone=Europe%2FAmsterdam` +
          `&forecast_days=3`

        const res = await fetch(url, { signal: ctrl.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()

        const parsed: HourlyWeather[] = (json.hourly.time as string[]).map(
          (t, i) => ({
            time: t,
            temp: json.hourly.temperature_2m[i] as number,
            windspeed: json.hourly.windspeed_10m[i] as number,
            winddir: json.hourly.winddirection_10m[i] as number,
            precipProb: (json.hourly.precipitation_probability?.[i] as number) ?? 0,
            weathercode: json.hourly.weathercode[i] as number,
          }),
        )
        setAllWeather(parsed)
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setWeatherError('Kon het weer niet ophalen.')
        }
      } finally {
        setWeatherLoading(false)
      }
    })()

    return () => ctrl.abort()
  }, [route?.startLat, route?.startLon, rideDate])

  const durationHours = route ? route.distanceKm / avgSpeedKmh : 0

  let rideHours: HourlyWeather[] = []
  if (allWeather && route) {
    const startMs = new Date(`${rideDate}T${rideTime}`).getTime()
    const endMs = startMs + durationHours * 3_600_000
    rideHours = allWeather.filter((h) => {
      const ms = new Date(h.time).getTime()
      return ms >= startMs && ms <= endMs
    })
  }

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.gpx')) {
      setError('Alleen .gpx bestanden worden ondersteund.')
      return
    }
    setError(null)
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        setRoute(parseGpx(text))
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

  const mapPoints: [number, number][] = route
    ? route.points.map((p) => [p.lat, p.lon])
    : []

  const resetRoute = () => {
    setRoute(null)
    setFileName('')
    setError(null)
    setAllWeather(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F7FA' }}>

      <DecorativeLine />

      {/* Header */}
      <header className="px-6 pt-12 pb-8" style={{ position: 'relative', zIndex: 1 }}>
        <div className="max-w-[720px] mx-auto">
          <h1
            className="tracking-tight mb-2"
            style={{
              fontFamily: 'Satoshi, sans-serif',
              fontWeight: 900,
              color: '#0B1220',
              fontSize: 'clamp(40px, 6vw, 60px)',
              lineHeight: 1,
            }}
          >
            Knecht<span style={{ color: '#F59E0B' }}>.</span>
          </h1>
          <p
            className="text-sm"
            style={{ color: '#6B7280', fontFamily: 'Satoshi, sans-serif' }}
          >
            Je digitale knecht. Upload, check, rijd.
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-[720px] w-full mx-auto px-4 pb-16 space-y-12" style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Upload zone ─────────────────────────────────────────────────── */}
        {!route && (
          <div
            role="button"
            tabIndex={0}
            aria-label="GPX bestand uploaden"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className="relative flex flex-col items-center justify-center gap-5 rounded-2xl px-8 py-16 cursor-pointer transition-all duration-200 select-none"
            style={{
              background: dragging ? '#FFF8E6' : '#FFFFFF',
              border: `2px dashed ${dragging ? 'rgba(245,158,11,0.5)' : 'rgba(0,0,0,0.1)'}`,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}
          >
            <BikeIcon />
            <div className="text-center">
              <p
                className="text-lg mb-1"
                style={{
                  fontFamily: 'Satoshi, sans-serif',
                  fontWeight: 700,
                  color: '#0B1220',
                }}
              >
                Drop je GPX hier
              </p>
              <p
                className="text-sm"
                style={{ color: '#6B7280', fontFamily: 'Satoshi, sans-serif' }}
              >
                of klik om een bestand te kiezen
              </p>
            </div>
            <span
              className="text-xs font-medium px-3 py-1 rounded-full"
              style={{
                background: 'rgba(245,158,11,0.12)',
                color: '#F59E0B',
                fontFamily: 'Satoshi, sans-serif',
                letterSpacing: '0.05em',
              }}
            >
              .gpx
            </span>
            <input
              ref={inputRef}
              type="file"
              accept=".gpx"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
          </div>
        )}

        {/* ── Compact route bar (after upload) ────────────────────────────── */}
        {route && (
          <div
            className="rounded-2xl px-6 py-4 flex items-center justify-between gap-4 fade-up"
            style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                className="w-4 h-4 shrink-0"
                stroke="#F59E0B"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L9 2z" />
                <path d="M9 2v4h4" />
              </svg>
              <span
                className="text-sm font-medium truncate"
                style={{ color: '#0B1220', fontFamily: 'Satoshi, sans-serif' }}
              >
                {fileName}
              </span>
              <span
                className="text-sm shrink-0"
                style={{ color: '#6B7280', fontFamily: 'Satoshi, sans-serif' }}
              >
                · {route.distanceKm.toFixed(1)} km
              </span>
            </div>
            <button
              onClick={resetRoute}
              className="text-sm shrink-0 transition-colors"
              style={{ color: '#6B7280', fontFamily: 'Satoshi, sans-serif' }}
              onMouseOver={(e) => (e.currentTarget.style.color = '#0B1220')}
              onMouseOut={(e) => (e.currentTarget.style.color = '#6B7280')}
            >
              Andere route laden
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".gpx"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
          </div>
        )}

        {error && (
          <div
            className="rounded-2xl px-6 py-4 text-sm"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171',
              fontFamily: 'Satoshi, sans-serif',
            }}
          >
            {error}
          </div>
        )}

        {route && (
          <>
            {/* ── Ride settings ─────────────────────────────────────────── */}
            <div
              className="rounded-2xl px-6 py-6 fade-up"
              style={{
                background: '#FFFFFF',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                animationDelay: '0.05s',
              }}
            >
              <p
                className="text-xs font-medium uppercase mb-5"
                style={{
                  letterSpacing: '0.05em',
                  color: '#8896AB',
                  fontFamily: 'Satoshi, sans-serif',
                }}
              >
                Rit instellen
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label
                    htmlFor="ride-date"
                    className="block text-xs font-medium uppercase mb-2"
                    style={{
                      letterSpacing: '0.05em',
                      color: '#8896AB',
                      fontFamily: 'Satoshi, sans-serif',
                    }}
                  >
                    Datum
                  </label>
                  <input
                    id="ride-date"
                    type="date"
                    value={rideDate}
                    onChange={(e) => setRideDate(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                    style={{
                      background: '#F5F7FA',
                      border: '1px solid rgba(0,0,0,0.08)',
                      color: '#0B1220',
                      fontFamily: 'Satoshi, sans-serif',
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="ride-time"
                    className="block text-xs font-medium uppercase mb-2"
                    style={{
                      letterSpacing: '0.05em',
                      color: '#8896AB',
                      fontFamily: 'Satoshi, sans-serif',
                    }}
                  >
                    Vertrektijd
                  </label>
                  <input
                    id="ride-time"
                    type="time"
                    value={rideTime}
                    onChange={(e) => setRideTime(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                    style={{
                      background: '#F5F7FA',
                      border: '1px solid rgba(0,0,0,0.08)',
                      color: '#0B1220',
                      fontFamily: 'Satoshi, sans-serif',
                    }}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <label
                      htmlFor="avg-speed"
                      className="text-xs font-medium uppercase"
                      style={{
                        letterSpacing: '0.05em',
                        color: '#8896AB',
                        fontFamily: 'Satoshi, sans-serif',
                      }}
                    >
                      Gem. snelheid
                    </label>
                    <span
                      style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 900, fontSize: '1.1rem', color: '#F59E0B' }}
                    >
                      {avgSpeedKmh} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#8896AB' }}>km/u</span>
                    </span>
                  </div>
                  <input
                    id="avg-speed"
                    type="range"
                    min={20}
                    max={38}
                    step={1}
                    value={avgSpeedKmh}
                    onChange={(e) => setAvgSpeedKmh(Number(e.target.value))}
                    className="w-full"
                  />
                  <div
                    className="flex justify-between text-xs mt-1"
                    style={{ color: '#D1D5DB', fontFamily: 'Satoshi, sans-serif' }}
                  >
                    <span>20</span>
                    <span>38</span>
                  </div>
                </div>
              </div>

              <p
                className="mt-5 text-xs"
                style={{ color: '#8896AB', fontFamily: 'Satoshi, sans-serif' }}
              >
                Geschatte rijtijd:{' '}
                <span className="font-semibold" style={{ color: '#374151' }}>
                  {Math.floor(durationHours)}u{' '}
                  {Math.round((durationHours % 1) * 60).toString().padStart(2, '0')}
                </span>
              </p>
            </div>

            {/* ── Route stats + map ──────────────────────────────────────── */}
            <div className="fade-up" style={{ animationDelay: '0.1s' }}>
              <div
                className="rounded-t-2xl px-6 py-6"
                style={{ background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.06)' }}
              >
                <p
                  className="text-xs font-medium uppercase mb-5"
                  style={{
                    letterSpacing: '0.05em',
                    color: '#8896AB',
                    fontFamily: 'Satoshi, sans-serif',
                  }}
                >
                  Route
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  <div>
                    <p
                      className="text-xs font-medium uppercase mb-1.5"
                      style={{
                        letterSpacing: '0.05em',
                        color: '#8896AB',
                        fontFamily: 'Satoshi, sans-serif',
                      }}
                    >
                      Afstand
                    </p>
                    <p
                      className="leading-none"
                      style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 900, fontSize: '2rem', color: '#0B1220' }}
                    >
                      {route.distanceKm.toFixed(1)}{' '}
                      <span
                        style={{ fontSize: '1rem', fontWeight: 400, color: '#8896AB' }}
                      >
                        km
                      </span>
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-xs font-medium uppercase mb-1.5"
                      style={{
                        letterSpacing: '0.05em',
                        color: '#8896AB',
                        fontFamily: 'Satoshi, sans-serif',
                      }}
                    >
                      Hoogtemeters
                    </p>
                    <p
                      className="leading-none"
                      style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 900, fontSize: '2rem', color: '#0B1220' }}
                    >
                      {route.elevationGain.toLocaleString('nl-NL')}{' '}
                      <span
                        style={{ fontSize: '1rem', fontWeight: 400, color: '#8896AB' }}
                      >
                        m
                      </span>
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p
                      className="text-xs font-medium uppercase mb-1.5"
                      style={{
                        letterSpacing: '0.05em',
                        color: '#8896AB',
                        fontFamily: 'Satoshi, sans-serif',
                      }}
                    >
                      Startlocatie
                    </p>
                    <p
                      className="text-sm font-medium leading-snug"
                      style={{ color: '#374151', fontFamily: 'Satoshi, sans-serif' }}
                    >
                      {route.startLat.toFixed(4)}°N{' '}
                      {route.startLon.toFixed(4)}°E
                    </p>
                  </div>
                </div>
              </div>
              <div
                className="rounded-b-2xl overflow-hidden"
                style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
              >
                <RouteMap points={mapPoints} />
              </div>
            </div>

            {/* ── Elevation profile ──────────────────────────────────────── */}
            <div className="fade-up" style={{ animationDelay: '0.15s' }}>
              <ElevationProfile
                profile={route.elevationProfile}
                hardestClimb={route.hardestClimb}
              />
            </div>

            {/* ── Weather ────────────────────────────────────────────────── */}
            {weatherLoading && (
              <div
                className="rounded-2xl px-6 py-8 text-center text-sm fade-up"
                style={{
                  background: '#FFFFFF',
                  color: '#6B7280',
                  fontFamily: 'Satoshi, sans-serif',
                  animationDelay: '0.2s',
                }}
              >
                Weersdata ophalen…
              </div>
            )}
            {weatherError && (
              <div
                className="rounded-2xl px-6 py-4 text-sm"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#f87171',
                  fontFamily: 'Satoshi, sans-serif',
                }}
              >
                {weatherError}
              </div>
            )}
            {rideHours.length > 0 && (
              <div className="fade-up" style={{ animationDelay: '0.2s' }}>
                <WeatherPanel hours={rideHours} durationHours={durationHours} />
              </div>
            )}

            {rideHours.length > 0 && (
              <div className="fade-up" style={{ animationDelay: '0.25s' }}>
                <ClothingAdvice hours={rideHours} />
              </div>
            )}

            {rideHours.length > 0 && (
              <div className="fade-up" style={{ animationDelay: '0.3s' }}>
                <NutritionAdvice
                  hours={rideHours}
                  distanceKm={route.distanceKm}
                  durationHours={durationHours}
                />
              </div>
            )}

            {rideHours.length > 0 && (
              <div className="fade-up" style={{ animationDelay: '0.35s' }}>
                <PackingChecklist
                  hours={rideHours}
                  distanceKm={route.distanceKm}
                  elevationGain={route.elevationGain}
                />
              </div>
            )}

            {!weatherLoading && !weatherError && allWeather && rideHours.length === 0 && (
              <div
                className="rounded-2xl px-6 py-6 text-sm text-center fade-up"
                style={{
                  background: '#FFFFFF',
                  color: '#6B7280',
                  fontFamily: 'Satoshi, sans-serif',
                  animationDelay: '0.2s',
                }}
              >
                Geen weersdata beschikbaar voor de gekozen datum en tijd. Kies een datum
                binnen de komende 3 dagen.
              </div>
            )}
          </>
        )}
      </main>

      <footer
        className="text-center"
        style={{
          position: 'relative',
          zIndex: 1,
          borderTop: '1px solid rgba(0,0,0,0.06)',
          fontFamily: 'Satoshi, sans-serif',
          paddingTop: '48px',
          paddingBottom: '48px',
        }}
      >
        <p
          className="text-base font-bold mb-1"
          style={{ color: '#0B1220' }}
        >
          Knecht<span style={{ color: '#F59E0B' }}>.</span>
        </p>
        <p
          className="text-sm"
          style={{ color: '#6B7280' }}
        >
          Jouw digitale meesterknecht.
        </p>
      </footer>
    </div>
  )
}
