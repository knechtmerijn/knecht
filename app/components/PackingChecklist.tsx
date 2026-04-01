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
      reason: `lange rit van ${Math.round(distanceKm)} km`,
    })
  }
  if (maxTemp > 25) {
    conditional.push({
      id: 'zonnebrand',
      label: 'Zonnebrand',
      reason: `het wordt ${Math.round(maxTemp)}°`,
    })
  }
  if (minTemp < 5) {
    conditional.push({
      id: 'extra-handschoenen',
      label: 'Extra handschoenen in achterzak',
      reason: `het is ${Math.round(minTemp)}° aan de start`,
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
    <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm">
      {/* Header */}
      <div className="px-5 py-4" style={{ background: '#1a1a2e' }}>
        <p className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-1">
          Check voor vertrek
        </p>
        <div className="flex items-center justify-between">
          <p className="text-sm text-white">
            {allDone ? (
              <span style={{ color: '#22c55e' }} className="font-semibold">
                Alles ingepakt — veel plezier!
              </span>
            ) : (
              <>
                <span className="font-semibold" style={{ color: '#f97316' }}>
                  {doneCount}/{totalCount}
                </span>{' '}
                items afgevinkt
              </>
            )}
          </p>
          <span className="text-xs text-stone-400">{progressPct}%</span>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1 rounded-full bg-stone-700">
          <div
            className="h-1 rounded-full transition-all duration-300"
            style={{
              width: `${progressPct}%`,
              background: allDone ? '#22c55e' : '#f97316',
            }}
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-white divide-y divide-stone-100">
        {items.map((item) => {
          const isChecked = checked.has(item.id)
          return (
            <label
              key={item.id}
              className="flex items-center gap-4 px-5 py-3.5 cursor-pointer select-none transition-colors hover:bg-stone-50"
            >
              {/* Custom checkbox */}
              <span className="relative shrink-0 flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(item.id)}
                  className="sr-only"
                />
                <span
                  className="w-5 h-5 rounded flex items-center justify-center border-2 transition-all duration-150"
                  style={
                    isChecked
                      ? { background: '#22c55e', borderColor: '#22c55e' }
                      : { background: 'white', borderColor: '#d6d3d1' }
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

              {/* Label */}
              <span className="flex-1 min-w-0">
                <span
                  className="text-sm font-medium transition-colors"
                  style={{ color: isChecked ? '#a8a29e' : '#1c1917' }}
                >
                  <span style={isChecked ? { textDecoration: 'line-through' } : undefined}>
                    {item.label}
                  </span>
                </span>
                {item.reason && (
                  <span
                    className="ml-2 text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: isChecked ? '#f5f5f4' : '#fff7ed',
                      color: isChecked ? '#a8a29e' : '#c2410c',
                    }}
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
