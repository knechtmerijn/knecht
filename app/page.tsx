'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import ElevationProfile from './components/ElevationProfile'
import type { ElevPoint, ClimbInfo } from './components/ElevationProfile'
import WeatherPanel from './components/WeatherPanel'
import type { HourlyWeather } from './components/WeatherPanel'
import ClothingAdvice from './components/ClothingAdvice'
import NutritionAdvice from './components/NutritionAdvice'
import PackingChecklist from './components/PackingChecklist'
import RecoveryAdvice from './components/RecoveryAdvice'
import { getOpenerQuote, getPacingQuote, getFooterQuote } from './data/quotes'

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
  climbs: ClimbInfo[]
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

function findAllClimbs(pts: GpxPoint[], cumDistM: number[]): ClimbInfo[] {
  const MAX_PTS = 400
  const step = Math.max(1, Math.floor(pts.length / MAX_PTS))
  const sp = pts.filter((_, i) => i % step === 0)
  const sd = cumDistM.filter((_, i) => i % step === 0)

  type Candidate = { i: number; j: number; score: number; climb: ClimbInfo }
  const candidates: Candidate[] = []

  for (let i = 0; i < sp.length - 1; i++) {
    let j = i + 1
    while (j < sp.length && sd[j] - sd[i] < 500) j++
    if (j >= sp.length) continue

    const dE = sp[j].ele - sp[i].ele
    const dM = sd[j] - sd[i]
    if ((dE / dM) * 100 <= 5) continue

    while (j + 1 < sp.length) {
      const extDE = sp[j + 1].ele - sp[i].ele
      const extDM = sd[j + 1] - sd[i]
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
    candidates.push({
      i, j, score,
      climb: {
        startKm: parseFloat((sd[i] / 1000).toFixed(1)),
        endKm: parseFloat((sd[j] / 1000).toFixed(1)),
        lengthKm: parseFloat(lengthKm.toFixed(1)),
        avgGradient: parseFloat(avgGrad.toFixed(1)),
        maxGradient: parseFloat(maxGrad.toFixed(0)),
      },
    })
  }

  // Greedy non-overlapping selection sorted by score
  candidates.sort((a, b) => b.score - a.score)
  const result: ClimbInfo[] = []
  const ranges: { start: number; end: number }[] = []

  for (const c of candidates) {
    const overlaps = ranges.some(r => c.i <= r.end && c.j >= r.start)
    if (!overlaps) {
      result.push(c.climb)
      ranges.push({ start: c.i, end: c.j })
    }
  }

  result.sort((a, b) => a.startKm - b.startKm)
  return result
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
    climbs: findAllClimbs(points, cumulDistM),
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

// ─── Wind analyse ─────────────────────────────────────────────────────────────

function calcBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

type WindType = 'tegen' | 'schuin tegen' | 'zijwind' | 'schuin mee' | 'mee'

function classifyWind(travelBearing: number, windFromDir: number): WindType {
  let diff = Math.abs(travelBearing - windFromDir)
  if (diff > 180) diff = 360 - diff
  if (diff < 30)  return 'tegen'
  if (diff < 70)  return 'schuin tegen'
  if (diff < 110) return 'zijwind'
  if (diff < 150) return 'schuin mee'
  return 'mee'
}

function windLabel(t: WindType): string {
  if (t === 'tegen')        return 'wind recht tegen'
  if (t === 'schuin tegen') return 'wind schuin tegen'
  if (t === 'zijwind')      return 'zijwind'
  if (t === 'schuin mee')   return 'wind schuin mee'
  return 'wind in de rug'
}

function windCompassNL(deg: number): string {
  const d = ['N','NNO','NO','ONO','O','OZO','ZO','ZZO','Z','ZZW','ZW','WZW','W','WNW','NW','NNW']
  return d[Math.round(deg / 22.5) % 16]
}

function buildWindAnalysis(
  points: GpxPoint[],
  distanceKm: number,
  windFromDir: number,
  windSpeedKmh: number,
): string {
  if (windSpeedKmh < 10) return 'Nauwelijks wind. Geen excuses vandaag.'

  const compass = windCompassNL(windFromDir)
  const N = 4
  const step = Math.max(1, Math.floor(points.length / N))

  const segs: { type: WindType; startKm: number; endKm: number }[] = []
  for (let i = 0; i < N; i++) {
    const p1 = points[i * step]
    const p2 = points[Math.min((i + 1) * step, points.length - 1)]
    segs.push({
      type: classifyWind(calcBearing(p1.lat, p1.lon, p2.lat, p2.lon), windFromDir),
      startKm: Math.round((i / N) * distanceKm),
      endKm: Math.round(((i + 1) / N) * distanceKm),
    })
  }

  const groups: typeof segs = []
  let cur = { ...segs[0] }
  for (let i = 1; i < segs.length; i++) {
    if (segs[i].type === cur.type) { cur.endKm = segs[i].endKm }
    else { groups.push({ ...cur }); cur = { ...segs[i] } }
  }
  groups.push(cur)

  let result: string
  if (groups.length === 1) {
    const t = groups[0].type
    if (t === 'mee')          result = `Wind de hele rit in de rug (${compass}). Profiteer ervan.`
    else if (t === 'tegen')   result = `Wind de hele rit recht tegen (${compass}). Tempo bijstellen.`
    else if (t === 'zijwind') result = `Zijwind de hele rit (${compass}). Scherp blijven.`
    else                      result = `Wind de hele rit ${windLabel(t)} (${compass}).`
  } else {
    const parts = groups.map((g, idx) => {
      const lbl = windLabel(g.type)
      if (idx === 0)                  return `Eerste ${g.endKm} km ${lbl}`
      if (idx === groups.length - 1)  return `laatste ${g.endKm - g.startKm} km ${lbl}`
      return `km ${g.startKm}–${g.endKm} ${lbl}`
    })
    result = parts.join(', ') + ` (${compass}).`
  }

  if (windSpeedKmh >= 35) result += ' Waaierwerk mogelijk. Zoek het wiel.'
  else if (windSpeedKmh >= 25) result += ' Lekker in het wiel als het kan.'
  return result
}

// ─── Overview samenvatting helpers ───────────────────────────────────────────

function weatherSummaryStr(hours: HourlyWeather[]): string {
  const temps = hours.map((h) => h.temp)
  const minT = Math.min(...temps)
  const maxT = Math.max(...temps)
  const avgWind = hours.reduce((s, h) => s + h.windspeed, 0) / hours.length
  const mid = hours[Math.floor(hours.length / 2)]
  const compass = windCompassNL(mid.winddir)
  const maxPrecip = Math.max(...hours.map((h) => h.precipProb ?? 0))
  const avgCode = hours.reduce((s, h) => s + h.weathercode, 0) / hours.length

  let desc: string
  if (maxPrecip >= 60) desc = 'Regenachtig'
  else if (maxPrecip >= 30) desc = 'Kans op regen'
  else if (avgCode <= 1) desc = 'Zonnig'
  else if (avgCode <= 2) desc = 'Licht bewolkt'
  else if (avgCode <= 3) desc = 'Bewolkt'
  else desc = 'Grijs'

  const tempStr = Math.abs(maxT - minT) > 2
    ? `${Math.round(minT)}–${Math.round(maxT)}°`
    : `${Math.round((minT + maxT) / 2)}°`

  return `${desc}, ${tempStr}, wind ${compass} ${Math.round(avgWind)} km/u`
}

function kitFoodSummaryStr(hours: HourlyWeather[], distanceKm: number, durationHours: number): string {
  const avgTemp = hours.reduce((s, h) => s + h.temp, 0) / hours.length
  const maxPrecip = Math.max(...hours.map((h) => h.precipProb ?? 0))

  const kit: string[] = []
  if (avgTemp < 5)       kit.push('winterjack', 'lange broek', 'overschoenen')
  else if (avgTemp < 10) kit.push('lange mouwen', 'gilet', 'lange broek')
  else if (avgTemp < 16) kit.push('armwarmers', 'gilet', 'korte broek')
  else if (avgTemp < 20) kit.push('gilet in achterzak')
  else                   kit.push('korte mouwen')
  if (maxPrecip >= 50) kit.push('regenjack')

  const mlPerHour = avgTemp > 25 ? 750 : 500
  const nBidons = Math.max(1, Math.ceil((mlPerHour * durationHours) / 500))
  const eatMin = durationHours >= 3 ? 20 : 30

  return `${kit.join(', ')}. ${nBidons} bidon${nBidons > 1 ? 's' : ''}, elke ${eatMin} min eten.`
}

// ─── Go/No-Go beoordeling ────────────────────────────────────────────────────

type GoNoGo = { level: 'danger' | 'warning'; message: string }

function buildGoNoGo(hours: HourlyWeather[]): GoNoGo | null {
  if (hours.length === 0) return null

  const minTemp   = Math.min(...hours.map((h) => h.temp))
  const maxTemp   = Math.max(...hours.map((h) => h.temp))
  const maxWind   = Math.max(...hours.map((h) => h.windspeed))
  const maxPrecip = Math.max(...hours.map((h) => h.precipProb ?? 0))
  const maxCode   = Math.max(...hours.map((h) => h.weathercode))

  // Echt gevaarlijk — rode balk
  if (minTemp < -5)
    return { level: 'danger', message: 'Knecht zegt: niet doen. IJskoude wegen, risico op gladheid.' }
  if (maxTemp > 38)
    return { level: 'danger', message: 'Extreem warm. Overweeg de rollen of een kortere route.' }
  if (maxWind > 50)
    return { level: 'danger', message: 'Stormachtig. Dit is geen weer om te fietsen.' }
  if (maxPrecip > 90 && maxCode >= 95)
    return { level: 'danger', message: 'Onweer voorspeld. Stel je rit uit.' }
  if (maxPrecip > 50 && minTemp < 3)
    return { level: 'danger', message: 'IJzel mogelijk. Niet het risico waard.' }

  // Pittig maar rijdbaar — amber balk
  if (maxWind >= 35)
    return { level: 'warning', message: 'Het gaat stevig waaien. Wees voorbereid of kies een beschutte route.' }
  if (maxPrecip > 30 && maxWind > 30)
    return { level: 'warning', message: 'Natte en winderige dag. Het kan, maar het wordt geen pretje.' }

  return null
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

  // ── Quotes (willekeurig per sessie, stabiel per conditie-bucket) ─────────────
  const hasWeather = rideHours.length > 0
  const _avgTemp   = hasWeather ? rideHours.reduce((s, h) => s + h.temp, 0) / rideHours.length : 15
  const _maxPrecip = hasWeather ? Math.max(...rideHours.map((h) => h.precipProb)) : 0
  const _maxWind   = hasWeather ? Math.max(...rideHours.map((h) => h.windspeed)) : 0

  const openerQuote = useMemo(() => {
    if (!route) return ''
    return getOpenerQuote(route.distanceKm, route.elevationGain, _avgTemp, _maxPrecip, _maxWind)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.distanceKm, route?.elevationGain, hasWeather])

  const pacingQuote = useMemo(() => {
    if (!route) return null
    return getPacingQuote(durationHours, route.elevationGain)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Math.round(durationHours * 2), route?.elevationGain])

  const footerQuote = useMemo(() => getFooterQuote(), [])

  // Wind analyse (stabiel per route + windcondities)
  const windAnalysis = useMemo(() => {
    if (!route || rideHours.length === 0) return null
    const sinSum = rideHours.reduce((s, h) => s + Math.sin((h.winddir * Math.PI) / 180), 0)
    const cosSum = rideHours.reduce((s, h) => s + Math.cos((h.winddir * Math.PI) / 180), 0)
    const dir = ((Math.atan2(sinSum, cosSum) * 180) / Math.PI + 360) % 360
    const spd = rideHours.reduce((s, h) => s + h.windspeed, 0) / rideHours.length
    return buildWindAnalysis(route.points, route.distanceKm, dir, spd)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.distanceKm, hasWeather])

  // Overview kaart samenvattingsregels
  const overviewWeather = rideHours.length > 0 ? weatherSummaryStr(rideHours) : null
  const overviewKitFood = route && rideHours.length > 0
    ? kitFoodSummaryStr(rideHours, route.distanceKm, durationHours)
    : null

  const durationStr = `~${Math.floor(durationHours)}u${Math.round((durationHours % 1) * 60).toString().padStart(2, '0')} rijden`
  const goNoGo = rideHours.length > 0 ? buildGoNoGo(rideHours) : null

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
            Knecht
            <svg
              viewBox="0 0 24 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              style={{
                display: 'inline-block',
                verticalAlign: 'middle',
                height: '0.85em',
                width: 'auto',
                marginLeft: '0.06em',
                marginBottom: '0.05em',
              }}
              stroke="#F59E0B"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* body */}
              <rect x="6" y="10" width="12" height="22" rx="4" />
              {/* shoulder taper */}
              <line x1="6" y1="14" x2="4" y2="10" />
              <line x1="18" y1="14" x2="20" y2="10" />
              {/* neck */}
              <rect x="9" y="4" width="6" height="6" rx="1" />
              {/* cap */}
              <line x1="8" y1="4" x2="16" y2="4" />
              {/* label stripe */}
              <line x1="6" y1="20" x2="18" y2="20" />
            </svg>
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
            {/* ── Go/No-Go banner ───────────────────────────────────────── */}
            {goNoGo && (
              <div
                className="rounded-2xl px-6 py-4 fade-up"
                style={{
                  background: goNoGo.level === 'danger' ? '#FEE2E2' : '#FEF3C7',
                  border: `1px solid ${goNoGo.level === 'danger' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`,
                  animationDelay: '0.01s',
                }}
              >
                <p style={{
                  fontFamily: 'Satoshi, sans-serif',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  color: goNoGo.level === 'danger' ? '#991B1B' : '#92400E',
                  lineHeight: 1.5,
                }}>
                  {goNoGo.message}
                </p>
              </div>
            )}

            {/* ── Overview card ─────────────────────────────────────────── */}
            <div
              className="fade-up"
              style={{
                background: 'linear-gradient(#FFFFFF, #FFFFFF) padding-box, linear-gradient(135deg, #F59E0B, #EC4899) border-box',
                border: '2px solid transparent',
                borderRadius: 16,
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                animationDelay: '0.02s',
              }}
            >
              <div className="px-6 py-6">
                <p
                  style={{
                    fontFamily: 'Satoshi, sans-serif',
                    fontStyle: 'italic',
                    fontWeight: 500,
                    fontSize: 'clamp(18px, 4vw, 22px)',
                    color: '#0B1220',
                    lineHeight: 1.4,
                    marginBottom: pacingQuote ? 6 : 20,
                  }}
                >
                  {openerQuote}
                </p>
                {pacingQuote && (
                  <p
                    style={{
                      fontFamily: 'Satoshi, sans-serif',
                      fontSize: '0.875rem',
                      color: '#8896AB',
                      marginBottom: 20,
                    }}
                  >
                    {pacingQuote}
                  </p>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
                  {([
                    { label: 'AFSTAND', value: `${route.distanceKm.toFixed(0)} km` },
                    { label: 'HOOGTEMETERS', value: `${route.elevationGain.toLocaleString('nl-NL')} hm` },
                    { label: 'RIJTIJD', value: durationStr },
                    overviewWeather ? { label: 'WEER', value: overviewWeather } : null,
                  ] as const).filter(Boolean).map((cell) => (
                    <div key={cell!.label}>
                      <p style={{
                        fontFamily: 'Satoshi, sans-serif',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: '#B0BACA',
                        textTransform: 'uppercase',
                        marginBottom: 2,
                      }}>
                        {cell!.label}
                      </p>
                      <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: '#374151', lineHeight: 1.4 }}>
                        {cell!.value}
                      </p>
                    </div>
                  ))}
                  {windAnalysis && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <p style={{
                        fontFamily: 'Satoshi, sans-serif',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: '#B0BACA',
                        textTransform: 'uppercase',
                        marginBottom: 2,
                      }}>
                        WIND
                      </p>
                      <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: '#374151', lineHeight: 1.4 }}>
                        {windAnalysis}
                      </p>
                    </div>
                  )}
                  {overviewKitFood && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <p style={{
                        fontFamily: 'Satoshi, sans-serif',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: '#B0BACA',
                        textTransform: 'uppercase',
                        marginBottom: 2,
                      }}>
                        KIT & VOEDING
                      </p>
                      <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: '#374151', lineHeight: 1.4 }}>
                        {overviewKitFood}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Rit instellen ─────────────────────────────────────────── */}
            <div
              className="rounded-2xl px-5 py-4 fade-up"
              style={{
                background: '#FFFFFF',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.06)',
                animationDelay: '0.05s',
              }}
            >
              <p
                className="text-xs font-medium uppercase mb-4"
                style={{
                  letterSpacing: '0.06em',
                  color: '#B0BACA',
                  fontFamily: 'Satoshi, sans-serif',
                }}
              >
                Rit instellen
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

            {/* ── Route kaart ────────────────────────────────────────────── */}
            <div className="fade-up" style={{ animationDelay: '0.1s' }}>
              <div
                className="rounded-t-2xl px-6 pt-6 pb-4"
                style={{ background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.06)' }}
              >
                <p style={{
                  fontFamily: 'Satoshi, sans-serif',
                  fontWeight: 900,
                  fontSize: 'clamp(22px, 4vw, 28px)',
                  color: '#0B1220',
                  lineHeight: 1.1,
                }}>
                  Route
                </p>
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
                climbs={route.climbs}
                elevationGain={route.elevationGain}
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
                <WeatherPanel hours={rideHours} durationHours={durationHours} windAnalysis={windAnalysis ?? undefined} />
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

            {rideHours.length > 0 && (
              <div className="fade-up" style={{ animationDelay: '0.4s' }}>
                <RecoveryAdvice
                  distanceKm={route.distanceKm}
                  durationHours={durationHours}
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
          Knecht
          <svg
            viewBox="0 0 24 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            style={{
              display: 'inline-block',
              verticalAlign: 'middle',
              height: '0.85em',
              width: 'auto',
              marginLeft: '0.06em',
              marginBottom: '0.05em',
            }}
            stroke="#F59E0B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="6" y="10" width="12" height="22" rx="4" />
            <line x1="6" y1="14" x2="4" y2="10" />
            <line x1="18" y1="14" x2="20" y2="10" />
            <rect x="9" y="4" width="6" height="6" rx="1" />
            <line x1="8" y1="4" x2="16" y2="4" />
            <line x1="6" y1="20" x2="18" y2="20" />
          </svg>
        </p>
        <p
          className="text-sm"
          style={{ color: '#6B7280' }}
        >
          {footerQuote}
        </p>
      </footer>
    </div>
  )
}
