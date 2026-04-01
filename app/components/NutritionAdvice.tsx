'use client'

import type { HourlyWeather } from './WeatherPanel'

type Props = {
  hours: HourlyWeather[]
  distanceKm: number
  durationHours: number
}

type Stat = {
  value: string
  unit: string
  label: string
}

type Block = {
  emoji: string
  label: string
  detail: string
  warning?: boolean
}

function calcNutrition(hours: HourlyWeather[], distanceKm: number, durationHours: number) {
  const durationMin = durationHours * 60
  const maxTemp = Math.max(...hours.map((h) => h.temp))

  // ── Calorieën ───────────────────────────────────────────────────────────────
  const kcal = Math.round(distanceKm * 25)

  // ── Koolhydraten ────────────────────────────────────────────────────────────
  let carbsBlock: Block
  if (durationMin < 60) {
    carbsBlock = {
      emoji: '💧',
      label: 'Koolhydraten',
      detail: 'Alleen een bidon water is genoeg.',
    }
  } else if (durationMin < 90) {
    carbsBlock = {
      emoji: '🍬',
      label: 'Koolhydraten',
      detail: 'Neem 1 gel of reep mee voor het laatste half uur.',
    }
  } else {
    // One item (gel or bar) every 30 min after the first hour
    const nItems = Math.max(1, Math.ceil((durationHours - 1) * 2))
    const nGels = Math.ceil(nItems / 2)
    const nRepen = Math.floor(nItems / 2)
    const totalCarbs = nGels * 25 + nRepen * 30

    const itemStr = [
      nGels > 0 ? `${nGels} gel${nGels > 1 ? 's' : ''}` : '',
      nRepen > 0 ? `${nRepen} rijstwafel${nRepen > 1 ? 's' : ''}` : '',
    ]
      .filter(Boolean)
      .join(' + ')

    carbsBlock = {
      emoji: '🍬',
      label: 'Koolhydraten',
      detail: `Neem ${totalCarbs}g koolhydraten mee: ${itemStr}. Eerste gel na 45 min, daarna elke 30 min.`,
    }
  }

  // ── Drinken ─────────────────────────────────────────────────────────────────
  let drinkBlock: Block
  if (maxTemp > 30) {
    drinkBlock = {
      emoji: '🚰',
      label: 'Drinken',
      detail: 'Plan een waterstop in — 2 bidons is niet genoeg bij deze hitte.',
      warning: true,
    }
  } else {
    const mlPerHour = maxTemp > 25 ? 750 : 500
    const totalMl = Math.round(mlPerHour * durationHours)
    const nBidons = Math.ceil(totalMl / 500)
    drinkBlock = {
      emoji: '🚰',
      label: 'Drinken',
      detail: `${totalMl} ml — ${nBidons} bidon${nBidons > 1 ? 's' : ''}${maxTemp > 25 ? ' (het is warm, drink meer)' : ''}.`,
    }
  }

  // ── Elektrolyten ────────────────────────────────────────────────────────────
  const needsElectrolytes = durationHours > 2 || maxTemp > 25
  const electrolytesBlock: Block | null = needsElectrolytes
    ? {
        emoji: '⚡',
        label: 'Elektrolyten',
        detail: 'Voeg een elektrolytentablet toe aan minstens 1 bidon.',
      }
    : null

  // ── Stats row ────────────────────────────────────────────────────────────────
  const stats: Stat[] = [{ value: kcal.toLocaleString('nl-NL'), unit: 'kcal', label: 'Verbruik' }]

  if (durationMin >= 90) {
    const nItems = Math.max(1, Math.ceil((durationHours - 1) * 2))
    const nGels = Math.ceil(nItems / 2)
    const nRepen = Math.floor(nItems / 2)
    const totalCarbs = nGels * 25 + nRepen * 30
    stats.push({ value: `${totalCarbs}`, unit: 'g', label: 'Koolhydraten' })
  }

  if (maxTemp <= 30) {
    const mlPerHour = maxTemp > 25 ? 750 : 500
    const totalMl = Math.round(mlPerHour * durationHours)
    const nBidons = Math.ceil(totalMl / 500)
    stats.push({ value: `${nBidons}`, unit: `bidon${nBidons > 1 ? 's' : ''}`, label: 'Vocht' })
  }

  const blocks = [carbsBlock, drinkBlock, ...(electrolytesBlock ? [electrolytesBlock] : [])]

  return { stats, blocks }
}

export default function NutritionAdvice({ hours, distanceKm, durationHours }: Props) {
  if (hours.length === 0) return null

  const { stats, blocks } = calcNutrition(hours, distanceKm, durationHours)

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm">
      {/* Header */}
      <div className="px-5 py-4" style={{ background: '#1a1a2e' }}>
        <p className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-1">
          Wat neem je mee?
        </p>
        <p className="text-sm text-white">
          Op basis van{' '}
          <span className="font-semibold" style={{ color: '#f97316' }}>
            {distanceKm.toFixed(0)} km
          </span>{' '}
          en{' '}
          <span className="font-semibold" style={{ color: '#f97316' }}>
            {Math.floor(durationHours)}u{' '}
            {Math.round((durationHours % 1) * 60)
              .toString()
              .padStart(2, '0')}
          </span>{' '}
          rijden
        </p>
      </div>

      {/* Stats row */}
      <div
        className="grid border-b border-stone-200"
        style={{
          gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
          background: '#f5f5f4',
        }}
      >
        {stats.map((s) => (
          <div key={s.label} className="px-5 py-4 border-r border-stone-200 last:border-r-0">
            <p className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-0.5">
              {s.label}
            </p>
            <p
              className="text-2xl font-bold leading-none"
              style={{ fontFamily: 'Sora, sans-serif', color: '#1a1a2e' }}
            >
              {s.value}{' '}
              <span className="text-sm font-normal text-stone-400">{s.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Detail blocks */}
      <div className="bg-white divide-y divide-stone-100">
        {blocks.map((b) => (
          <div
            key={b.label}
            className="flex gap-4 px-5 py-4"
            style={b.warning ? { background: '#fff7ed' } : undefined}
          >
            <span className="text-2xl leading-none shrink-0 mt-0.5" aria-hidden="true">
              {b.emoji}
            </span>
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-1"
                style={{ color: b.warning ? '#f97316' : '#a8a29e' }}
              >
                {b.label}
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: b.warning ? '#c2410c' : '#44403c' }}
              >
                {b.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
