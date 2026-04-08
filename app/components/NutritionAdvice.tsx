'use client'

import { useMemo } from 'react'
import type { HourlyWeather } from './WeatherPanel'
import { getVoedingQuote } from '../data/quotes'

type Props = {
  hours: HourlyWeather[]
  distanceKm: number
  durationHours: number
}

type Stat = { value: string; unit: string; label: string }
type Block = { label: string; detail: string; warning?: boolean }

function calcNutrition(hours: HourlyWeather[], distanceKm: number, durationHours: number) {
  const durationMin = durationHours * 60
  const maxTemp = Math.max(...hours.map((h) => h.temp))
  const kcal = Math.round(distanceKm * 25)

  let carbsBlock: Block
  if (durationMin < 60) {
    carbsBlock = { label: 'Koolhydraten', detail: 'Alleen een bidon water is genoeg.' }
  } else if (durationMin < 90) {
    carbsBlock = { label: 'Koolhydraten', detail: 'Neem 1 gel of reep mee voor het laatste half uur.' }
  } else {
    const nItems = Math.max(1, Math.ceil((durationHours - 1) * 2))
    const nGels = Math.ceil(nItems / 2)
    const nRepen = Math.floor(nItems / 2)
    const totalCarbs = nGels * 25 + nRepen * 30
    const itemStr = [
      nGels > 0 ? `${nGels} gel${nGels > 1 ? 's' : ''}` : '',
      nRepen > 0 ? `${nRepen} rijstwafel${nRepen > 1 ? 's' : ''}` : '',
    ].filter(Boolean).join(' + ')
    carbsBlock = {
      label: 'Koolhydraten',
      detail: `${totalCarbs}g onderweg: ${itemStr}. Eerste gel na 45 min, daarna elke 30 min.`,
    }
  }

  let drinkBlock: Block
  if (maxTemp > 30) {
    drinkBlock = {
      label: 'Drinken',
      detail: 'Plan een waterstop in. 2 bidons is niet genoeg. Dehydratie is geen bonificatie.',
      warning: true,
    }
  } else {
    const mlPerHour = maxTemp > 25 ? 750 : 500
    const totalMl = Math.round(mlPerHour * durationHours)
    const nBidons = Math.ceil(totalMl / 500)
    drinkBlock = {
      label: 'Drinken',
      detail: `${totalMl} ml — ${nBidons} bidon${nBidons > 1 ? 's' : ''}${maxTemp > 25 ? '. Extra bidon. Dehydratie is geen bonificatie.' : '.'}`,
    }
  }

  const needsElectrolytes = durationHours > 2 || maxTemp > 25
  const electrolytesBlock: Block | null = needsElectrolytes
    ? { label: 'Elektrolyten', detail: 'Elektrolytentablet in minstens 1 bidon.' }
    : null

  const stats: Stat[] = [{ value: kcal.toLocaleString('nl-NL'), unit: 'kcal', label: 'Verbruik' }]
  if (durationMin >= 90) {
    const nItems = Math.max(1, Math.ceil((durationHours - 1) * 2))
    const nGels = Math.ceil(nItems / 2)
    const nRepen = Math.floor(nItems / 2)
    stats.push({ value: `${nGels * 25 + nRepen * 30}`, unit: 'g koolh.', label: 'Onderweg' })
  }
  if (maxTemp <= 30) {
    const mlPerHour = maxTemp > 25 ? 750 : 500
    const nBidons = Math.ceil(Math.round(mlPerHour * durationHours) / 500)
    stats.push({ value: `${nBidons}`, unit: `bidon${nBidons > 1 ? 's' : ''}`, label: 'Vocht' })
  }

  return { stats, blocks: [carbsBlock, drinkBlock, ...(electrolytesBlock ? [electrolytesBlock] : [])] }
}

export default function NutritionAdvice({ hours, distanceKm, durationHours }: Props) {
  if (hours.length === 0) return null
  const { stats, blocks } = calcNutrition(hours, distanceKm, durationHours)

  const maxTemp = Math.max(...hours.map((h) => h.temp))
  const voedingQuote = useMemo(
    () => getVoedingQuote(durationHours, maxTemp),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Math.round(durationHours * 2), Math.round(maxTemp)],
  )

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
    >
      <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <p
          className="text-xs font-medium uppercase mb-1.5"
          style={{ letterSpacing: '0.05em', color: '#8896AB', fontFamily: 'Satoshi, sans-serif' }}
        >
          Achterzakken
        </p>
        <p className="text-sm italic mb-1" style={{ color: '#374151', fontFamily: 'Satoshi, sans-serif' }}>
          {voedingQuote}
        </p>
        <p className="text-xs" style={{ color: '#8896AB', fontFamily: 'Satoshi, sans-serif' }}>
          {distanceKm.toFixed(0)} km ·{' '}
          {Math.floor(durationHours)}u{Math.round((durationHours % 1) * 60).toString().padStart(2, '0')} rijden
        </p>
      </div>

      {/* Stats row */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
          background: '#F5F7FA',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="px-6 py-5"
            style={{ borderRight: i < stats.length - 1 ? '1px solid rgba(0,0,0,0.06)' : undefined }}
          >
            <p
              className="text-xs font-medium uppercase mb-1"
              style={{ letterSpacing: '0.05em', color: '#8896AB', fontFamily: 'Satoshi, sans-serif' }}
            >
              {s.label}
            </p>
            <p
              className="leading-none"
              style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 900, fontSize: '1.75rem', color: '#0B1220' }}
            >
              {s.value}{' '}
              <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#8896AB' }}>{s.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Detail blocks */}
      <div>
        {blocks.map((b, i) => (
          <div
            key={b.label}
            className="px-6 py-5"
            style={{
              borderTop: i > 0 ? '1px solid rgba(0,0,0,0.04)' : undefined,
              background: b.warning ? 'rgba(245,158,11,0.06)' : undefined,
            }}
          >
            <p
              className="text-xs font-medium uppercase mb-1.5"
              style={{
                letterSpacing: '0.05em',
                color: b.warning ? '#F59E0B' : '#8896AB',
                fontFamily: 'Satoshi, sans-serif',
              }}
            >
              {b.label}
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{ color: '#374151', fontFamily: 'Satoshi, sans-serif' }}
            >
              {b.detail}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
