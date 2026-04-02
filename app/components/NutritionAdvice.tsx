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
      label: 'Koolhydraten',
      detail: 'Alleen een bidon water is genoeg.',
    }
  } else if (durationMin < 90) {
    carbsBlock = {
      label: 'Koolhydraten',
      detail: 'Neem 1 gel of reep mee voor het laatste half uur.',
    }
  } else {
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
      label: 'Koolhydraten',
      detail: `${totalCarbs}g onderweg: ${itemStr}. Eerste gel na 45 min, daarna elke 30 min.`,
    }
  }

  // ── Drinken ─────────────────────────────────────────────────────────────────
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

  // ── Elektrolyten ────────────────────────────────────────────────────────────
  const needsElectrolytes = durationHours > 2 || maxTemp > 25
  const electrolytesBlock: Block | null = needsElectrolytes
    ? {
        label: 'Elektrolyten',
        detail: 'Elektrolytentablet in minstens 1 bidon.',
      }
    : null

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats: Stat[] = [{ value: kcal.toLocaleString('nl-NL'), unit: 'kcal', label: 'Verbruik' }]

  if (durationMin >= 90) {
    const nItems = Math.max(1, Math.ceil((durationHours - 1) * 2))
    const nGels = Math.ceil(nItems / 2)
    const nRepen = Math.floor(nItems / 2)
    const totalCarbs = nGels * 25 + nRepen * 30
    stats.push({ value: `${totalCarbs}`, unit: 'g koolh.', label: 'Onderweg' })
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
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      {/* Header */}
      <div className="px-5 py-4" style={{ background: '#f5f0eb' }}>
        <p
          className="text-xs font-medium uppercase mb-1"
          style={{ letterSpacing: '0.05em', color: '#7c7872' }}
        >
          Achterzakken
        </p>
        <p className="text-sm" style={{ color: '#1a1a2e' }}>
          Voor{' '}
          <span className="font-semibold" style={{ color: '#4a6fa5' }}>
            {distanceKm.toFixed(0)} km
          </span>{' '}
          en{' '}
          <span className="font-semibold" style={{ color: '#4a6fa5' }}>
            {Math.floor(durationHours)}u
            {Math.round((durationHours % 1) * 60)
              .toString()
              .padStart(2, '0')}{' '}
          </span>
          rijden
        </p>
      </div>

      {/* Stats row */}
      <div
        className="grid border-b"
        style={{
          gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
          background: '#f9f7f4',
          borderColor: '#e0dbd5',
        }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            className="px-5 py-4 border-r last:border-r-0"
            style={{ borderColor: '#e0dbd5' }}
          >
            <p
              className="text-xs font-medium uppercase mb-0.5"
              style={{ letterSpacing: '0.05em', color: '#7c7872' }}
            >
              {s.label}
            </p>
            <p
              className="text-2xl font-bold leading-none"
              style={{ fontFamily: 'Sora, sans-serif', color: '#1a1a2e' }}
            >
              {s.value}{' '}
              <span className="text-sm font-normal" style={{ color: '#7c7872' }}>
                {s.unit}
              </span>
            </p>
          </div>
        ))}
      </div>

      {/* Detail blocks */}
      <div className="divide-y" style={{ borderColor: '#f0ebe4' }}>
        {blocks.map((b) => (
          <div
            key={b.label}
            className="px-5 py-4"
            style={b.warning ? { background: '#fdf6ee' } : undefined}
          >
            <p
              className="text-xs font-medium uppercase mb-1"
              style={{
                letterSpacing: '0.05em',
                color: b.warning ? '#b45309' : '#7c7872',
              }}
            >
              {b.label}
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{ color: b.warning ? '#92400e' : '#3d3a36' }}
            >
              {b.detail}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
