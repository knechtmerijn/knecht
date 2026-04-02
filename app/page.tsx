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
      className="flex items-center justify-center h-[380px] rounded-xl text-sm"
      style={{ background: '#f9f7f4', color: '#7c7872' }}
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

// ─── Logo icon (bidon + gel) ──────────────────────────────────────────────────

function LogoIcon() {
  return (
    <svg
      viewBox="0 0 32 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6 shrink-0"
      aria-hidden="true"
      stroke="#4a6fa5"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Bidon */}
      <rect x="2" y="9" width="11" height="15" rx="2.5" />
      <rect x="4" y="5" width="7" height="5" rx="1" />
      <rect x="5.5" y="2.5" width="4" height="3" rx="0.75" />
      <line x1="2" y1="15" x2="13" y2="15" />
      {/* Gel packet */}
      <rect x="18" y="8" width="12" height="12" rx="2" />
      <line x1="24" y1="8" x2="24" y2="20" />
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
      className="w-14 h-14"
      aria-hidden="true"
      stroke="#4a6fa5"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={0.4}
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

  // Ride settings
  const [rideDate, setRideDate] = useState<string>(getTomorrowDate)
  const [rideTime, setRideTime] = useState('09:00')
  const [avgSpeedKmh, setAvgSpeedKmh] = useState(27)

  // Weather state
  const [allWeather, setAllWeather] = useState<HourlyWeather[] | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)

  // ── Fetch weather whenever route or date changes ──────────────────────────
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

  // ── Derived: ride hours window ────────────────────────────────────────────
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

  // ── File handling ─────────────────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 pt-8 pb-6" style={{ background: '#f5f0eb' }}>
        <div className="max-w-[720px] mx-auto">
          <div className="flex items-center gap-2.5 mb-1">
            <LogoIcon />
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ fontFamily: 'Sora, sans-serif', color: '#1a1a2e' }}
            >
              Knecht
            </h1>
          </div>
          <p className="text-sm" style={{ color: '#7c7872' }}>
            Je digitale knecht. Upload, check, rijd.
          </p>
        </div>
      </header>
      {/* Accent line */}
      <div style={{ height: '2px', background: '#4a6fa5' }} />

      <main className="flex-1 max-w-[720px] w-full mx-auto px-4 py-10 space-y-6">

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
            className="relative flex flex-col items-center justify-center gap-4 rounded-xl px-8 py-16 cursor-pointer transition-all duration-200 select-none"
            style={{
              background: '#fff',
              border: `2px dashed ${dragging ? '#4a6fa5' : '#c9c3bb'}`,
              backgroundColor: dragging ? '#f0f4fa' : '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <BikeIcon />
            <div className="text-center">
              <p
                className="text-lg font-semibold"
                style={{ fontFamily: 'Sora, sans-serif', color: '#1a1a2e' }}
              >
                Drop je GPX hier
              </p>
              <p className="text-sm mt-1" style={{ color: '#7c7872' }}>
                of klik om een bestand te kiezen
              </p>
            </div>
            <span
              className="text-xs font-medium px-3 py-1 rounded-full"
              style={{ background: '#eef3fb', color: '#4a6fa5' }}
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
            className="rounded-xl px-5 py-3.5 flex items-center justify-between gap-4 fade-up"
            style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                className="w-4 h-4 shrink-0"
                style={{ stroke: '#4a6fa5' }}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L9 2z" />
                <path d="M9 2v4h4" />
              </svg>
              <span className="text-sm font-medium truncate" style={{ color: '#1a1a2e' }}>
                {fileName}
              </span>
              <span className="text-sm shrink-0" style={{ color: '#7c7872' }}>
                · {route.distanceKm.toFixed(1)} km
              </span>
            </div>
            <button
              onClick={resetRoute}
              className="text-sm shrink-0 transition-colors"
              style={{ color: '#4a6fa5' }}
              onMouseOver={(e) => (e.currentTarget.style.color = '#3a5a8a')}
              onMouseOut={(e) => (e.currentTarget.style.color = '#4a6fa5')}
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
            className="rounded-xl px-5 py-4 text-sm"
            style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}
          >
            {error}
          </div>
        )}

        {route && (
          <>
            {/* ── Ride settings ─────────────────────────────────────────── */}
            <div
              className="rounded-xl px-5 py-5 fade-up"
              style={{
                background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                animationDelay: '0.05s',
              }}
            >
              <p
                className="text-xs font-medium uppercase mb-4"
                style={{ letterSpacing: '0.05em', color: '#7c7872' }}
              >
                Rit instellen
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* Date */}
                <div>
                  <label
                    htmlFor="ride-date"
                    className="block text-xs font-medium uppercase mb-1.5"
                    style={{ letterSpacing: '0.05em', color: '#7c7872' }}
                  >
                    Datum
                  </label>
                  <input
                    id="ride-date"
                    type="date"
                    value={rideDate}
                    onChange={(e) => setRideDate(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{
                      border: '1px solid #e0dbd5',
                      background: '#f9f7f4',
                      color: '#1a1a2e',
                    }}
                  />
                </div>

                {/* Time */}
                <div>
                  <label
                    htmlFor="ride-time"
                    className="block text-xs font-medium uppercase mb-1.5"
                    style={{ letterSpacing: '0.05em', color: '#7c7872' }}
                  >
                    Vertrektijd
                  </label>
                  <input
                    id="ride-time"
                    type="time"
                    value={rideTime}
                    onChange={(e) => setRideTime(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{
                      border: '1px solid #e0dbd5',
                      background: '#f9f7f4',
                      color: '#1a1a2e',
                    }}
                  />
                </div>

                {/* Speed slider */}
                <div>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <label
                      htmlFor="avg-speed"
                      className="text-xs font-medium uppercase"
                      style={{ letterSpacing: '0.05em', color: '#7c7872' }}
                    >
                      Gem. snelheid
                    </label>
                    <span
                      className="text-base font-bold"
                      style={{ fontFamily: 'Sora, sans-serif', color: '#4a6fa5' }}
                    >
                      {avgSpeedKmh} km/u
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
                    style={{ accentColor: '#4a6fa5' }}
                  />
                  <div className="flex justify-between text-xs mt-0.5" style={{ color: '#c9c3bb' }}>
                    <span>20</span>
                    <span>38</span>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs" style={{ color: '#7c7872' }}>
                Geschatte rijtijd:{' '}
                <span className="font-semibold" style={{ color: '#3d3a36' }}>
                  {Math.floor(durationHours)}u{' '}
                  {Math.round((durationHours % 1) * 60).toString().padStart(2, '0')}
                </span>
              </p>
            </div>

            {/* ── Route stats + map ──────────────────────────────────────── */}
            <div
              className="fade-up"
              style={{ animationDelay: '0.1s' }}
            >
              {/* Stats */}
              <div
                className="rounded-t-xl px-5 py-5"
                style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                <p
                  className="text-xs font-medium uppercase mb-4"
                  style={{ letterSpacing: '0.05em', color: '#7c7872' }}
                >
                  Route
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                  <div>
                    <p
                      className="text-xs font-medium uppercase mb-1"
                      style={{ letterSpacing: '0.05em', color: '#7c7872' }}
                    >
                      Afstand
                    </p>
                    <p
                      className="text-2xl font-bold"
                      style={{ fontFamily: 'Sora, sans-serif', color: '#1a1a2e' }}
                    >
                      {route.distanceKm.toFixed(1)}{' '}
                      <span className="text-base font-normal" style={{ color: '#7c7872' }}>km</span>
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-xs font-medium uppercase mb-1"
                      style={{ letterSpacing: '0.05em', color: '#7c7872' }}
                    >
                      Hoogtemeters
                    </p>
                    <p
                      className="text-2xl font-bold"
                      style={{ fontFamily: 'Sora, sans-serif', color: '#1a1a2e' }}
                    >
                      {route.elevationGain.toLocaleString('nl-NL')}{' '}
                      <span className="text-base font-normal" style={{ color: '#7c7872' }}>m</span>
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p
                      className="text-xs font-medium uppercase mb-1"
                      style={{ letterSpacing: '0.05em', color: '#7c7872' }}
                    >
                      Startlocatie
                    </p>
                    <p className="text-sm font-medium leading-snug" style={{ color: '#3d3a36' }}>
                      {route.startLat.toFixed(4)}°N{' '}
                      {route.startLon.toFixed(4)}°E
                    </p>
                  </div>
                </div>
              </div>

              {/* Map — flush below stats */}
              <div className="rounded-b-xl overflow-hidden" style={{ border: '1px solid #e0dbd5', borderTop: 'none' }}>
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
                className="rounded-xl px-5 py-8 text-center text-sm fade-up"
                style={{
                  background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  color: '#7c7872',
                  animationDelay: '0.2s',
                }}
              >
                Weersdata ophalen…
              </div>
            )}
            {weatherError && (
              <div
                className="rounded-xl px-5 py-4 text-sm"
                style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}
              >
                {weatherError}
              </div>
            )}
            {rideHours.length > 0 && (
              <div className="fade-up" style={{ animationDelay: '0.2s' }}>
                <WeatherPanel hours={rideHours} durationHours={durationHours} />
              </div>
            )}

            {/* ── Clothing ───────────────────────────────────────────────── */}
            {rideHours.length > 0 && (
              <div className="fade-up" style={{ animationDelay: '0.25s' }}>
                <ClothingAdvice hours={rideHours} />
              </div>
            )}

            {/* ── Nutrition ──────────────────────────────────────────────── */}
            {rideHours.length > 0 && (
              <div className="fade-up" style={{ animationDelay: '0.3s' }}>
                <NutritionAdvice
                  hours={rideHours}
                  distanceKm={route.distanceKm}
                  durationHours={durationHours}
                />
              </div>
            )}

            {/* ── Packing checklist ──────────────────────────────────────── */}
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
                className="rounded-xl px-5 py-6 text-sm text-center fade-up"
                style={{
                  background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  color: '#7c7872',
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
        className="text-center py-6 text-xs"
        style={{ color: '#7c7872', borderTop: '1px solid #e0dbd5' }}
      >
        Knecht. Jouw digitale meesterknecht.
      </footer>
    </div>
  )
}
