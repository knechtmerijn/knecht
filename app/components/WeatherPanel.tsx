'use client'

import { useMemo } from 'react'
import { getWeerQuote } from '../data/quotes'

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
        color: '#8896AB',
      }}
    >
      ↑
    </span>
  )
}

function PrecipBar({ prob }: { prob: number }) {
  const fillColor = prob >= 60 ? '#F59E0B' : prob >= 30 ? '#8896AB' : '#D1D5DB'
  return (
    <div className="flex flex-col items-center gap-0.5 w-full">
      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: '#E5E7EB' }}>
        <div
          style={{ width: `${prob}%`, background: fillColor, transition: 'width 0.3s' }}
          className="h-full rounded-full"
        />
      </div>
      <span
        className="text-xs"
        style={{ color: '#8896AB', fontFamily: 'Satoshi, sans-serif' }}
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
  windAnalysis?: string
}

export default function WeatherPanel({ hours, durationHours, windAnalysis }: Props) {
  if (hours.length === 0) return null

  const first = hours[0]
  const mid = hours[Math.floor((hours.length - 1) / 2)]
  const midCompass = windDegToCompass(mid.winddir)

  const avgTemp   = hours.reduce((s, h) => s + h.temp, 0) / hours.length
  const maxWind   = Math.max(...hours.map((h) => h.windspeed))
  const maxPrecip = Math.max(...hours.map((h) => h.precipProb ?? 0))

  const weerQuote = useMemo(
    () => getWeerQuote(avgTemp, maxWind, maxPrecip),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Math.round(avgTemp), Math.round(maxWind / 5) * 5, Math.round(maxPrecip / 10) * 10],
  )

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
    >
      <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <p style={{
          fontFamily: 'Satoshi, sans-serif',
          fontWeight: 900,
          fontSize: 'clamp(22px, 4vw, 28px)',
          color: '#0B1220',
          lineHeight: 1.1,
          marginBottom: 10,
        }}>
          Weer · {formatDuration(durationHours)}
        </p>
        <p className="text-sm italic mb-2" style={{ color: '#374151', fontFamily: 'Satoshi, sans-serif' }}>
          {weerQuote}
        </p>
        <p className="text-xs" style={{ color: '#8896AB', fontFamily: 'Satoshi, sans-serif' }}>
          Vertrek{' '}
          <span className="font-medium" style={{ color: '#374151' }}>
            {Math.round(first.temp)}°
          </span>
          {hours.length > 2 && (
            <>
              {', halverwege '}
              <span className="font-medium" style={{ color: '#374151' }}>
                {Math.round(mid.temp)}°
              </span>
            </>
          )}
          {' · wind '}
          <span className="font-medium" style={{ color: '#374151' }}>
            {midCompass} {Math.round(mid.windspeed)} km/u
          </span>
          {mid.precipProb >= 30 && (
            <span style={{ color: '#D97706' }}>
              {' '}· {mid.precipProb}% neerslag
            </span>
          )}
        </p>
      </div>

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
                style={{ minWidth: '72px', background: '#F5F7FA' }}
              >
                <span
                  className="text-xs font-medium"
                  style={{ color: '#8896AB', fontFamily: 'Satoshi, sans-serif' }}
                >
                  {formatHourLabel(h.time)}
                </span>
                <span className="text-2xl leading-none" role="img" aria-label={label}>
                  {icon}
                </span>
                <span
                  className="text-lg font-bold leading-none"
                  style={{ fontFamily: 'Satoshi, sans-serif', color: '#0B1220' }}
                >
                  {Math.round(h.temp)}°
                </span>
                <div
                  className="flex items-center gap-1 text-xs"
                  style={{ color: '#8896AB', fontFamily: 'Satoshi, sans-serif' }}
                >
                  <WindArrow deg={h.winddir} />
                  <span>{compass}</span>
                </div>
                <span
                  className="text-xs"
                  style={{ color: '#8896AB', fontFamily: 'Satoshi, sans-serif' }}
                >
                  {Math.round(h.windspeed)} km/u
                </span>
                <PrecipBar prob={h.precipProb ?? 0} />
              </div>
            )
          })}
        </div>
      </div>

      {windAnalysis && (
        <div
          className="px-6 py-4"
          style={{
            borderTop: '1px solid rgba(0,0,0,0.06)',
            background: 'rgba(245,158,11,0.04)',
          }}
        >
          <p
            className="text-sm italic"
            style={{ color: '#374151', fontFamily: 'Satoshi, sans-serif', lineHeight: 1.55 }}
          >
            {windAnalysis}
          </p>
        </div>
      )}
    </div>
  )
}
