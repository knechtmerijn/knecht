'use client'

export type HourlyWeather = {
  time: string // "YYYY-MM-DDTHH:00"
  temp: number
  windspeed: number
  winddir: number
  precipProb: number
  weathercode: number
}

function getWeatherInfo(code: number): { icon: string; label: string } {
  if (code === 0) return { icon: '☀️', label: 'Helder' }
  if (code <= 2) return { icon: '🌤️', label: 'Licht bewolkt' }
  if (code === 3) return { icon: '☁️', label: 'Bewolkt' }
  if (code <= 48) return { icon: '🌫️', label: 'Mist' }
  if (code <= 55) return { icon: '🌦️', label: 'Motregen' }
  if (code <= 65) return { icon: '🌧️', label: 'Regen' }
  if (code <= 77) return { icon: '❄️', label: 'Sneeuw' }
  if (code <= 82) return { icon: '🌦️', label: 'Buien' }
  if (code <= 86) return { icon: '❄️', label: 'Sneeuwbuien' }
  return { icon: '⛈️', label: 'Onweer' }
}

// 16-point Dutch compass
function windDegToCompass(deg: number): string {
  const dirs = [
    'N', 'NNO', 'NO', 'ONO', 'O', 'OZO', 'ZO', 'ZZO',
    'Z', 'ZZW', 'ZW', 'WZW', 'W', 'WNW', 'NW', 'NNW',
  ]
  return dirs[Math.round(deg / 22.5) % 16]
}

// ↑ rotated by winddir degrees = arrow pointing toward wind source (meteorological convention)
function WindArrow({ deg }: { deg: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        transform: `rotate(${deg}deg)`,
        fontSize: '11px',
        lineHeight: 1,
        color: '#78716c',
      }}
    >
      ↑
    </span>
  )
}

function PrecipBar({ prob }: { prob: number }) {
  const color = prob >= 60 ? '#3b82f6' : prob >= 30 ? '#93c5fd' : '#bfdbfe'
  return (
    <div className="flex flex-col items-center gap-0.5 w-full">
      <div className="w-full h-1 rounded-full bg-stone-200 overflow-hidden">
        <div
          style={{ width: `${prob}%`, background: color, transition: 'width 0.3s' }}
          className="h-full rounded-full"
        />
      </div>
      <span className="text-xs" style={{ color: prob >= 30 ? '#3b82f6' : '#a8a29e' }}>
        {prob}%
      </span>
    </div>
  )
}

function formatHourLabel(isoTime: string): string {
  return isoTime.slice(11, 16) // "HH:MM"
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}u`
  return `${h}u${m < 10 ? '0' : ''}${m}`
}

type Props = {
  hours: HourlyWeather[]
  durationHours: number
}

export default function WeatherPanel({ hours, durationHours }: Props) {
  if (hours.length === 0) return null

  const first = hours[0]
  const mid = hours[Math.floor((hours.length - 1) / 2)]
  const midCompass = windDegToCompass(mid.winddir)

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm">
      {/* Summary bar */}
      <div
        className="px-5 py-4"
        style={{ background: '#1a1a2e' }}
      >
        <p className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-2">
          Weer · {formatDuration(durationHours)} rijden
        </p>
        <p className="text-sm text-white leading-relaxed">
          Bij vertrek{' '}
          <span className="font-semibold" style={{ color: '#f97316' }}>
            {Math.round(first.temp)}°
          </span>
          {hours.length > 2 && (
            <>
              {', halverwege '}
              <span className="font-semibold" style={{ color: '#f97316' }}>
                {Math.round(mid.temp)}°
              </span>
            </>
          )}
          {', wind '}
          <span className="font-semibold">
            {midCompass} {Math.round(mid.windspeed)} km/u
          </span>
          {mid.precipProb >= 30 && (
            <span className="text-blue-300">
              {' '}· {mid.precipProb}% kans op neerslag
            </span>
          )}
        </p>
      </div>

      {/* Hourly cards – horizontal scroll */}
      <div className="bg-white px-4 py-4 overflow-x-auto">
        <div className="flex gap-2.5" style={{ minWidth: 'max-content' }}>
          {hours.map((h) => {
            const { icon, label } = getWeatherInfo(h.weathercode)
            const compass = windDegToCompass(h.winddir)
            return (
              <div
                key={h.time}
                title={label}
                className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border border-stone-100 bg-stone-50"
                style={{ minWidth: '76px' }}
              >
                {/* Time */}
                <span className="text-xs font-semibold text-stone-400">
                  {formatHourLabel(h.time)}
                </span>

                {/* Weather icon */}
                <span className="text-2xl leading-none" role="img" aria-label={label}>
                  {icon}
                </span>

                {/* Temperature */}
                <span
                  className="text-lg font-bold leading-none"
                  style={{ fontFamily: 'Sora, sans-serif', color: '#1a1a2e' }}
                >
                  {Math.round(h.temp)}°
                </span>

                {/* Wind direction */}
                <div className="flex items-center gap-1 text-xs text-stone-500">
                  <WindArrow deg={h.winddir} />
                  <span>{compass}</span>
                </div>

                {/* Wind speed */}
                <span className="text-xs text-stone-400">
                  {Math.round(h.windspeed)} km/u
                </span>

                {/* Precipitation bar */}
                <PrecipBar prob={h.precipProb ?? 0} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
