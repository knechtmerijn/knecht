'use client'

import { useState } from 'react'
import type { HourlyWeather } from './WeatherPanel'

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
      className="rounded-xl overflow-hidden"
      style={{ background: '#f5f7fa', border: '1px solid #e2e6ed' }}
    >
      {/* Header */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #e2e6ed' }}>
        <p
          className="text-xs font-medium uppercase mb-1"
          style={{ letterSpacing: '0.05em', color: '#6b7280', fontFamily: 'Satoshi, sans-serif' }}
        >
          Check voor vertrek
        </p>
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: '#0f1a3e', fontFamily: 'Satoshi, sans-serif' }}>
            {allDone ? (
              <span style={{ color: '#16a34a' }} className="font-semibold">
                Alles ingepakt — veel plezier!
              </span>
            ) : (
              <>
                <span className="font-semibold" style={{ color: '#3366cc' }}>
                  {doneCount}/{totalCount}
                </span>{' '}
                afgevinkt
              </>
            )}
          </p>
          <span
            className="text-xs"
            style={{ color: '#6b7280', fontFamily: 'Satoshi, sans-serif' }}
          >
            {progressPct}%
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1 rounded-full" style={{ background: '#e2e6ed' }}>
          <div
            className="h-1 rounded-full transition-all duration-300"
            style={{
              width: `${progressPct}%`,
              background: allDone ? '#16a34a' : '#3366cc',
            }}
          />
        </div>
      </div>

      {/* List */}
      <div className="divide-y" style={{ borderColor: '#e2e6ed' }}>
        {items.map((item) => {
          const isChecked = checked.has(item.id)
          const isConditional = !!item.reason
          return (
            <label
              key={item.id}
              className="flex items-center gap-4 px-5 py-3.5 cursor-pointer select-none transition-colors"
              style={
                isConditional && !isChecked
                  ? { background: '#fffbeb' }
                  : isChecked
                  ? { background: '#f0f4ff' }
                  : undefined
              }
            >
              <span className="relative shrink-0 flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(item.id)}
                  className="sr-only"
                />
                <span
                  className="w-5 h-5 rounded flex items-center justify-center transition-all duration-150"
                  style={
                    isChecked
                      ? { background: '#3366cc', border: '2px solid #3366cc' }
                      : { background: 'white', border: '2px solid #c5ccd6' }
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
                    color: isChecked ? '#6b7280' : '#0f1a3e',
                    textDecoration: isChecked ? 'line-through' : 'none',
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
                            background: '#e2e6ed',
                            color: '#6b7280',
                            fontFamily: 'Satoshi, sans-serif',
                          }
                        : {
                            background: '#fef3c7',
                            color: '#92400e',
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
