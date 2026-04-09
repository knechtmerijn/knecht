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
    const eetKm = Math.round(distanceKm * 0.55)
    carbsBlock = { label: 'Eten', detail: `1 gel of reep voor de tweede helft. Eet hem bij km ${eetKm}.` }
  } else {
    const eatInterval = durationMin >= 180 ? 20 : 30
    const nInnames = Math.max(1, Math.floor(durationMin / eatInterval))
    const nGels = Math.ceil(nInnames * 0.6)
    const nRepen = nInnames - nGels
    const totalCarbs = nGels * 25 + nRepen * 30
    const detail = nRepen > 0
      ? `Elke ${eatInterval} min iets eten — ${nGels} gel${nGels > 1 ? 's' : ''} (${nGels * 25}g) + ${nRepen} reep${nRepen > 1 ? 'en' : ''} (${nRepen * 30}g). Vroeg beginnen, niet wachten tot je honger hebt.`
      : `Elke ${eatInterval} min een gel — ${nGels} stuks (${totalCarbs}g koolhydraten). Vroeg beginnen.`
    carbsBlock = { label: 'Eten', detail }
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
      ? `${nBidons} bidons nodig — elke uur één leegdrinken. Plan een bijvulstop rond km ${stopKm}.`
      : `${nBidons} bidon${nBidons > 1 ? 's' : ''} is genoeg. Elke uur één leegdrinken.`
    drinkBlock = { label: 'Drinken', detail: drinkDetail + (maxTemp > 25 ? ' Warm weer: meer drinken dan je denkt.' : '') }
  }

  // ── Elektrolyten ─────────────────────────────────────────────────────────
  const needsElectrolytes = durationHours > 2 || maxTemp > 25
  let electrolytesBlock: Block | null = null
  if (needsElectrolytes) {
    const mlPerHour = maxTemp > 25 ? 750 : 500
    const nBidons = Math.max(1, Math.ceil((mlPerHour * durationHours) / 500))
    const electDetail = nBidons >= 3
      ? 'Tablet in bidon 1 en bidon 3. Na het zweten blijft het verschil merkbaar.'
      : 'Gooi een tablet in je eerste bidon. Na 2 uur fietsen gaat het verschil maken.'
    electrolytesBlock = { label: 'Elektrolyten', detail: electDetail }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats: Stat[] = [{ value: kcal.toLocaleString('nl-NL'), unit: 'kcal', label: 'Verbruik' }]
  if (durationMin >= 90) {
    const eatInterval = durationMin >= 180 ? 20 : 30
    const nInnames = Math.max(1, Math.floor(durationMin / eatInterval))
    const nGels = Math.ceil(nInnames * 0.6)
    const nRepen = nInnames - nGels
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
