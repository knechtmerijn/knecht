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

  // ── Koolhydraten ──────────────────────────────────────────────────────────
  let carbsBlock: Block
  if (durationMin < 60) {
    carbsBlock = { label: 'Eten', detail: 'Goed ontbijten voor de start. Onderweg heb je niks nodig.' }
  } else if (durationMin < 90) {
    carbsBlock = { label: 'Eten', detail: 'Één gel of reep mee voor de tweede helft. Niet vergeten.' }
  } else if (durationMin < 180) {
    carbsBlock = {
      label: 'Eten',
      detail: 'Elke 30 minuten iets naar binnen. Gel, rijstwafel, banaan — maakt niet uit. Niet wachten tot je honger hebt.',
    }
  } else {
    carbsBlock = {
      label: 'Eten',
      detail: 'Elke 20 minuten iets eten. Vroeg beginnen, blijven tanken. De man met de hamer wacht niet.',
    }
  }

  // ── Drinken ───────────────────────────────────────────────────────────────
  let drinkBlock: Block
  if (maxTemp > 30) {
    drinkBlock = {
      label: 'Drinken',
      detail: 'Plan een waterstop in. 2 bidons is vandaag niet genoeg. Dehydratie is geen bonificatie.',
      warning: true,
    }
  } else {
    const mlPerHour = maxTemp > 25 ? 750 : 500
    const nBidons = Math.max(1, Math.ceil((mlPerHour * durationHours) / 500))
    const stopKm = Math.round(distanceKm * 0.55)
    const drinkDetail = nBidons > 2
      ? `Elke uur een bidon leegdrinken. ${nBidons} bidons voor deze rit — plan een bijvulstop rond km ${stopKm}.`
      : `Elke uur een bidon leegdrinken. ${nBidons} bidon${nBidons > 1 ? 's' : ''} is genoeg voor deze afstand.`
    drinkBlock = { label: 'Drinken', detail: drinkDetail + (maxTemp > 25 ? ' Warm weer: meer drinken dan je denkt.' : '') }
  }

  // ── Elektrolyten ─────────────────────────────────────────────────────────
  const needsElectrolytes = durationHours > 2 || maxTemp > 25
  const electrolytesBlock: Block | null = needsElectrolytes
    ? { label: 'Elektrolyten', detail: 'Gooi een tablet in je eerste bidon. Na 2 uur fietsen gaat het verschil maken.' }
    : null

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats: Stat[] = [{ value: kcal.toLocaleString('nl-NL'), unit: 'kcal', label: 'Verbruik' }]
  if (durationMin >= 90) {
    const nItems = Math.max(1, Math.ceil((durationHours - 1) * 2))
    const nGels  = Math.ceil(nItems / 2)
    const nRepen = Math.floor(nItems / 2)
    stats.push({ value: `${nGels * 25 + nRepen * 30}`, unit: 'g koolh.', label: 'Onderweg' })
  }
  if (maxTemp <= 30) {
    const mlPerHour = maxTemp > 25 ? 750 : 500
    const nBidons = Math.max(1, Math.ceil((mlPerHour * durationHours) / 500))
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
      <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <p style={{
          fontFamily: 'Satoshi, sans-serif',
          fontWeight: 900,
          fontSize: 'clamp(22px, 4vw, 28px)',
          color: '#0B1220',
          lineHeight: 1.1,
          marginBottom: 10,
        }}>
          Achterzakken
        </p>
        <p className="text-sm italic" style={{ color: '#374151', fontFamily: 'Satoshi, sans-serif' }}>
          {voedingQuote}
        </p>
      </div>

      {/* Stats row — iets kleiner */}
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
            className="px-5 py-4"
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
              style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 900, fontSize: '1.3rem', color: '#0B1220' }}
            >
              {s.value}{' '}
              <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#8896AB' }}>{s.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Detail blocks */}
      <div>
        {blocks.map((b, i) => (
          <div
            key={b.label}
            className="px-6 py-4"
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
