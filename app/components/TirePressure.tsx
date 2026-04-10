'use client'

import { useMemo } from 'react'
import type { HourlyWeather } from './WeatherPanel'
import { getBandenQuote } from '../data/quotes'

type Props = {
  hours: HourlyWeather[]
  elevationGain: number
}

type PressureResult = {
  front: number
  rear: number
  corrections: string[]
  totalDelta: number
}

const RIDER_KG  = 75
const BIKE_KG   = 8
const TOTAL_KG  = RIDER_KG + BIKE_KG
const FRONT_PCT = 0.45
const REAR_PCT  = 0.55
const BASE_BAR  = 2.0

function calcPressure(maxPrecip: number, elevationGain: number, minTemp: number): PressureResult {
  const baseFront = TOTAL_KG * FRONT_PCT * 0.01 + BASE_BAR
  const baseRear  = TOTAL_KG * REAR_PCT  * 0.01 + BASE_BAR

  let delta = 0
  const corrections: string[] = []

  if (maxPrecip >= 50) {
    delta -= 0.3
    corrections.push(`Nat weer verwacht. 0.3 bar minder dan normaal voor meer grip in de bochten.`)
  }
  if (elevationGain >= 1000) {
    delta -= 0.1
    corrections.push(`Veel afdalingen vandaag. 0.1 bar minder voor meer controle op de descente.`)
  }
  if (minTemp < 5) {
    delta -= 0.1
    corrections.push(`Koude dag. 0.1 bar minder — rubber wordt harder in de kou.`)
  }

  const round1 = (v: number) => Math.round(v * 10) / 10

  return {
    front: round1(baseFront + delta),
    rear:  round1(baseRear  + delta),
    corrections,
    totalDelta: delta,
  }
}

export default function TirePressure({ hours, elevationGain }: Props) {
  if (hours.length === 0) return null

  const maxPrecip = Math.max(...hours.map((h) => h.precipProb ?? 0))
  const minTemp   = Math.min(...hours.map((h) => h.temp))

  const { front, rear, corrections, totalDelta } = useMemo(
    () => calcPressure(maxPrecip, elevationGain, minTemp),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Math.round(maxPrecip / 10) * 10, elevationGain, Math.round(minTemp)],
  )

  const bandenQuote = useMemo(
    () => getBandenQuote(maxPrecip, elevationGain, minTemp),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Math.round(maxPrecip / 10) * 10, elevationGain, Math.round(minTemp)],
  )

  const hasCorrections = corrections.length > 0

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <p style={{
          fontFamily: 'Satoshi, sans-serif',
          fontWeight: 900,
          fontSize: 'clamp(22px, 4vw, 28px)',
          color: '#0B1220',
          lineHeight: 1.1,
          marginBottom: 10,
        }}>
          Bandenspanning
        </p>
        <p className="text-sm italic" style={{ color: '#374151', fontFamily: 'Satoshi, sans-serif' }}>
          {bandenQuote}
        </p>
      </div>

      {/* Drukwaarden */}
      <div
        className="grid grid-cols-2"
        style={{ borderBottom: hasCorrections ? '1px solid rgba(0,0,0,0.06)' : undefined }}
      >
        {([
          { label: 'VOOR', value: front },
          { label: 'ACHTER', value: rear },
        ] as const).map((side, i) => (
          <div
            key={side.label}
            className="px-6 py-5"
            style={{ borderRight: i === 0 ? '1px solid rgba(0,0,0,0.06)' : undefined }}
          >
            <p
              className="text-xs font-medium uppercase mb-2"
              style={{ letterSpacing: '0.06em', color: '#8896AB', fontFamily: 'Satoshi, sans-serif' }}
            >
              {side.label}
            </p>
            <p style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 900, fontSize: '2rem', lineHeight: 1, color: '#0B1220' }}>
              {side.value.toFixed(1)}
              <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#8896AB', marginLeft: 4 }}>bar</span>
            </p>
            {totalDelta !== 0 && (
              <p className="text-xs mt-1" style={{ color: '#8896AB', fontFamily: 'Satoshi, sans-serif' }}>
                basis {(side.value - totalDelta).toFixed(1)} bar
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Correctie-uitleg */}
      {hasCorrections ? (
        <div className="px-6 py-4">
          {corrections.map((c, i) => (
            <p
              key={i}
              className="text-sm"
              style={{
                fontFamily: 'Satoshi, sans-serif',
                color: '#374151',
                marginTop: i > 0 ? 6 : 0,
              }}
            >
              {c}
            </p>
          ))}
        </div>
      ) : (
        <div className="px-6 py-4">
          <p className="text-sm" style={{ color: '#6B7280', fontFamily: 'Satoshi, sans-serif' }}>
            Standaard spanning. Droog en glad asfalt vandaag.
          </p>
        </div>
      )}
    </div>
  )
}
