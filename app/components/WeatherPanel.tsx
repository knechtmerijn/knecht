'use client'

export type HourlyWeather = {
  time: string
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

function windDegToCompass(deg: number): string {
  const dirs = [
    'N', 'NNO', 'NO', 'ONO', 'O', 'OZO', 'ZO', 'ZZO',
    'Z', 'ZZW', 'ZW', 'WZW', 'W', 'WNW', 'NW', 'NNW',
  ]
  return dirs[Math.round(deg / 22.5) % 16]
}

function WindArrow({ deg }: { deg: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        transform: `rotate(${deg}deg)`,
        fontSize: '11px',
        lineHeight: 1,
        color: '#6b7280',
      }}
    >
      ↑
    </span>
  )
}

function PrecipBar({ prob }: { prob: number }) {
  const color = prob >= 60 ? '#3366cc' : prob >= 30 ? '#6691dd' : '#adc0ef'
  return (
    <div className="flex flex-col items-center gap-0.5 w-full">
      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: '#e2e6ed' }}>
        <div
          style={{ width: `${prob}%`, background: color, transition: 'width 0.3s' }}
          className="h-full rounded-full"
        />
      </div>
      <span
        className="text-xs"
        style={{ color: prob >= 30 ? '#3366cc' : '#6b7280', fontFamily: 'Satoshi, sans-serif' }}
      >
        {prob}%
      </span>
    </div>
  )
}

function formatHourLabel(isoTime: string): string {
  return isoTime.slice(11, 16)
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
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: '#ffffff', border: '1px solid #e2e6ed', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
    >
      {/* Header */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #e2e6ed' }}>
        <p
          className="text-xs font-medium uppercase mb-1"
          style={{ letterSpacing: '0.05em', color: '#3366cc', fontFamily: 'Satoshi, sans-serif' }}
        >
          Weer · {formatDuration(durationHours)} rijden
        </p>
        <p className="text-sm" style={{ color: '#0f1a3e', fontFamily: 'Satoshi, sans-serif' }}>
          Vertrek{' '}
          <span className="font-semibold" style={{ color: '#3366cc' }}>
            {Math.round(first.temp)}°
          </span>
          {hours.length > 2 && (
            <>
              {', halverwege '}
              <span className="font-semibold" style={{ color: '#3366cc' }}>
                {Math.round(mid.temp)}°
              </span>
            </>
          )}
          {' · wind '}
          <span className="font-semibold" style={{ color: '#0f1a3e' }}>
            {midCompass} {Math.round(mid.windspeed)} km/u
          </span>
          {mid.precipProb >= 30 && (
            <span style={{ color: '#3366cc' }}>
              {' '}· {mid.precipProb}% neerslag
            </span>
          )}
        </p>
      </div>

      {/* Hourly cards – horizontal scroll */}
      <div className="px-4 py-4 overflow-x-auto">
        <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
          {hours.map((h) => {
            const { icon, label } = getWeatherInfo(h.weathercode)
            const compass = windDegToCompass(h.winddir)
            return (
              <div
                key={h.time}
                title={label}
                className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl"
                style={{ minWidth: '72px', background: '#f5f7fa', border: '1px solid #e2e6ed' }}
              >
                <span
                  className="text-xs font-medium"
                  style={{ color: '#6b7280', fontFamily: 'Satoshi, sans-serif' }}
                >
                  {formatHourLabel(h.time)}
                </span>
                <span className="text-2xl leading-none" role="img" aria-label={label}>
                  {icon}
                </span>
                <span
                  className="text-lg font-bold leading-none"
                  style={{ fontFamily: 'Satoshi, sans-serif', color: '#0f1a3e' }}
                >
                  {Math.round(h.temp)}°
                </span>
                <div
                  className="flex items-center gap-1 text-xs"
                  style={{ color: '#6b7280', fontFamily: 'Satoshi, sans-serif' }}
                >
                  <WindArrow deg={h.winddir} />
                  <span>{compass}</span>
                </div>
                <span
                  className="text-xs"
                  style={{ color: '#6b7280', fontFamily: 'Satoshi, sans-serif' }}
                >
                  {Math.round(h.windspeed)} km/u
                </span>
                <PrecipBar prob={h.precipProb ?? 0} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
