'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import ElevationProfile from './components/ElevationProfile'
import type { ElevPoint, HardestClimb } from './components/ElevationProfile'
import WeatherPanel from './components/WeatherPanel'
import type { HourlyWeather } from './components/WeatherPanel'
import ClothingAdvice from './components/ClothingAdvice'
import NutritionAdvice from './components/NutritionAdvice'

const RouteMap = dynamic(() => import('./components/RouteMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[420px] rounded-xl bg-stone-100 text-stone-400 text-sm">
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

// ─── Upload zone bike icon ────────────────────────────────────────────────────

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
        stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M28 20 L32 32 L50 44"
        stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M32 20 L38 16 L44 20"
        stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

function getTomorrowDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

export default function Page() {
  const [route, setRoute] = useState<RouteData | null>(null)
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

  // ── Render ────────────────────────────────────────────────────────────────
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

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-10 space-y-8">
        {/* Upload zone */}
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
            className={`
              relative flex flex-col items-center justify-center gap-4
              rounded-2xl border-2 border-dashed px-8 py-16 cursor-pointer
              transition-all duration-200 select-none
              ${dragging
                ? 'border-orange-400 bg-orange-50'
                : 'border-stone-300 bg-white hover:border-orange-300 hover:bg-orange-50/40'}
            `}
          >
            <BikeIcon />
            <div className="text-center">
              <p className="text-base font-semibold text-stone-700">
                Sleep je GPX-bestand hierheen
              </p>
              <p className="text-sm text-stone-400 mt-1">of klik om te uploaden</p>
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
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
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
                  {route.startLat.toFixed(4)}°N<br />
                  {route.startLon.toFixed(4)}°E
                </p>
              </div>
            </div>

            {/* ── Ride settings ─────────────────────────────────────────── */}
            <div className="rounded-2xl bg-white border border-stone-200 shadow-sm px-5 py-5">
              <h2
                className="text-sm font-semibold uppercase tracking-widest mb-4"
                style={{ fontFamily: 'Sora, sans-serif', color: '#1a1a2e' }}
              >
                Rit instellen
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* Date */}
                <div>
                  <label
                    htmlFor="ride-date"
                    className="block text-xs font-medium uppercase tracking-widest text-stone-400 mb-1.5"
                  >
                    Datum
                  </label>
                  <input
                    id="ride-date"
                    type="date"
                    value={rideDate}
                    onChange={(e) => setRideDate(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                {/* Time */}
                <div>
                  <label
                    htmlFor="ride-time"
                    className="block text-xs font-medium uppercase tracking-widest text-stone-400 mb-1.5"
                  >
                    Vertrektijd
                  </label>
                  <input
                    id="ride-time"
                    type="time"
                    value={rideTime}
                    onChange={(e) => setRideTime(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                {/* Speed slider */}
                <div>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <label
                      htmlFor="avg-speed"
                      className="text-xs font-medium uppercase tracking-widest text-stone-400"
                    >
                      Gem. snelheid
                    </label>
                    <span
                      className="text-base font-bold"
                      style={{ fontFamily: 'Sora, sans-serif', color: '#f97316' }}
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
                    className="w-full accent-orange-500"
                  />
                  <div className="flex justify-between text-xs text-stone-300 mt-0.5">
                    <span>20</span>
                    <span>38</span>
                  </div>
                </div>
              </div>

              {/* Estimated duration hint */}
              <p className="mt-4 text-xs text-stone-400">
                Geschatte rijtijd:{' '}
                <span className="font-semibold text-stone-600">
                  {Math.floor(durationHours)}u{' '}
                  {Math.round((durationHours % 1) * 60).toString().padStart(2, '0')}
                </span>
              </p>
            </div>

            {/* ── Map ───────────────────────────────────────────────────── */}
            <div className="rounded-2xl overflow-hidden shadow-sm border border-stone-200">
              <RouteMap points={mapPoints} />
            </div>

            {/* ── Elevation profile ─────────────────────────────────────── */}
            <ElevationProfile
              profile={route.elevationProfile}
              hardestClimb={route.hardestClimb}
            />

            {/* ── Weather ───────────────────────────────────────────────── */}
            {weatherLoading && (
              <div className="rounded-2xl bg-white border border-stone-200 px-5 py-8 text-center text-sm text-stone-400">
                Weersdata ophalen…
              </div>
            )}
            {weatherError && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
                {weatherError}
              </div>
            )}
            {rideHours.length > 0 && (
              <WeatherPanel hours={rideHours} durationHours={durationHours} />
            )}
            {rideHours.length > 0 && (
              <ClothingAdvice hours={rideHours} />
            )}
            {rideHours.length > 0 && route && (
              <NutritionAdvice
                hours={rideHours}
                distanceKm={route.distanceKm}
                durationHours={durationHours}
              />
            )}
            {!weatherLoading && !weatherError && allWeather && rideHours.length === 0 && (
              <div className="rounded-2xl bg-white border border-stone-200 px-5 py-6 text-sm text-stone-400 text-center">
                Geen weersdata beschikbaar voor de gekozen datum en tijd. Kies een datum
                binnen de komende 3 dagen.
              </div>
            )}

            {/* Reset */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setRoute(null)
                  setError(null)
                  setAllWeather(null)
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

      <footer
        className="text-center py-5 text-xs text-stone-400 border-t border-stone-200"
        style={{ background: '#fafaf9' }}
      >
        Knecht — Jouw digitale wielrenknecht
      </footer>
    </div>
  )
}
