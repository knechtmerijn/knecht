'use client'

import { useState, useMemo } from 'react'
import type { HourlyWeather } from './WeatherPanel'
import { getChecklistQuote } from '../data/quotes'

type Props = {
  hours: HourlyWeather[]
  distanceKm: number
  elevationGain: number
}

type CheckItem = {
  id: string
  label: string
  reason?: string
}

function buildItems(hours: HourlyWeather[], distanceKm: number, elevationGain: number): CheckItem[] {
  const fixed: CheckItem[] = [
    { id: 'binnenband', label: 'Binnenband (of tubeless plugkit)' },
    { id: 'bandenlichters', label: 'Bandenlichters' },
    { id: 'co2', label: 'CO₂-patroon of minipomp' },
    { id: 'multitool', label: 'Multitool' },
    { id: 'telefoon', label: 'Telefoon (geladen!)' },
    { id: 'id', label: 'ID of ICE-kaartje' },
    { id: 'geld', label: 'Geld of pinpas' },
  ]

  const maxPrecip = Math.max(...hours.map((h) => h.precipProb ?? 0))
  const maxTemp = Math.max(...hours.map((h) => h.temp))
  const minTemp = Math.min(...hours.map((h) => h.temp))

  const conditional: CheckItem[] = []

  if (maxPrecip > 30) {
    conditional.push({
      id: 'regenjack',
      label: 'Regenjack',
      reason: `${Math.round(maxPrecip)}% neerslagkans`,
    })
  }
  if (distanceKm > 80) {
    conditional.push({
      id: 'extra-binnenband',
      label: 'Extra binnenband',
      reason: `${Math.round(distanceKm)} km`,
    })
  }
  if (maxTemp > 25) {
    conditional.push({
      id: 'zonnebrand',
      label: 'Zonnebrand',
      reason: `${Math.round(maxTemp)}° verwacht`,
    })
  }
  if (minTemp < 5) {
    conditional.push({
      id: 'extra-handschoenen',
      label: 'Extra handschoenen in achterzak',
      reason: `${Math.round(minTemp)}° aan de start`,
    })
  }
  if (elevationGain > 1000) {
    conditional.push({
      id: 'extra-laag',
      label: 'Extra laag voor de afdalingen',
      reason: `${elevationGain.toLocaleString('nl-NL')} hm`,
    })
  }

  return [...fixed, ...conditional]
}

export default function PackingChecklist({ hours, distanceKm, elevationGain }: Props) {
  const items = buildItems(hours, distanceKm, elevationGain)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checklistQuote = useMemo(() => getChecklistQuote(), [])

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const doneCount = checked.size
  const totalCount = items.length
  const allDone = doneCount === totalCount
  const progressPct = Math.round((doneCount / totalCount) * 100)

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
    >
      {/* Header */}
      <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <p
          className="text-xs font-medium uppercase mb-1.5"
          style={{ letterSpacing: '0.05em', color: '#8896AB', fontFamily: 'Satoshi, sans-serif' }}
        >
          Check voor vertrek
        </p>
        <p className="text-sm italic mb-3" style={{ color: '#374151', fontFamily: 'Satoshi, sans-serif' }}>
          {checklistQuote}
        </p>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm" style={{ color: '#374151', fontFamily: 'Satoshi, sans-serif' }}>
            {allDone ? (
              <span style={{ color: '#F59E0B', fontWeight: 600 }}>
                Alles ingepakt — veel plezier!
              </span>
            ) : (
              <>
                <span className="font-semibold" style={{ color: '#0B1220' }}>
                  {doneCount}/{totalCount}
                </span>{' '}
                afgevinkt
              </>
            )}
          </p>
          <span
            className="text-xs"
            style={{ color: '#8896AB', fontFamily: 'Satoshi, sans-serif' }}
          >
            {progressPct}%
          </span>
        </div>
        <div className="h-1 rounded-full" style={{ background: '#E5E7EB' }}>
          <div
            className="h-1 rounded-full transition-all duration-500"
            style={{
              width: `${progressPct}%`,
              background: '#F59E0B',
            }}
          />
        </div>
      </div>

      {/* List */}
      <div>
        {items.map((item, i) => {
          const isChecked = checked.has(item.id)
          const isConditional = !!item.reason
          return (
            <label
              key={item.id}
              className="flex items-center gap-4 px-6 py-4 cursor-pointer select-none transition-colors"
              style={{
                borderTop: i > 0 ? '1px solid rgba(0,0,0,0.04)' : undefined,
                background: isConditional && !isChecked
                  ? 'rgba(245,158,11,0.05)'
                  : undefined,
              }}
            >
              <span className="relative shrink-0 flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(item.id)}
                  className="sr-only"
                />
                <span
                  className="w-5 h-5 rounded flex items-center justify-center transition-all duration-200"
                  style={
                    isChecked
                      ? { background: '#F59E0B', border: '2px solid #F59E0B' }
                      : { background: 'transparent', border: '2px solid #D1D5DB' }
                  }
                  aria-hidden="true"
                >
                  {isChecked && (
                    <svg
                      viewBox="0 0 12 10"
                      fill="none"
                      className="w-3 h-3"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 5l3.5 3.5L11 1"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
              </span>

              <span className="flex-1 min-w-0 flex items-center flex-wrap gap-x-2 gap-y-0.5">
                <span
                  className="text-sm font-medium"
                  style={{
                    fontFamily: 'Satoshi, sans-serif',
                    color: isChecked ? '#9CA3AF' : '#374151',
                    textDecoration: isChecked ? 'line-through' : 'none',
                    transition: 'color 0.15s',
                  }}
                >
                  {item.label}
                </span>
                {item.reason && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={
                      isChecked
                        ? {
                            background: '#F3F4F6',
                            color: '#9CA3AF',
                            fontFamily: 'Satoshi, sans-serif',
                          }
                        : {
                            background: 'rgba(245,158,11,0.12)',
                            color: '#D97706',
                            fontFamily: 'Satoshi, sans-serif',
                          }
                    }
                  >
                    {item.reason}
                  </span>
                )}
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
