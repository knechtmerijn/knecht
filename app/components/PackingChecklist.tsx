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

const STANDARD_IDS = ['binnenband', 'bandenlichters', 'co2', 'multitool', 'telefoon', 'id', 'geld']

const STANDARD_ITEMS: CheckItem[] = [
  { id: 'binnenband',     label: 'Binnenband of tubeless plugkit' },
  { id: 'bandenlichters', label: 'Bandenlichters' },
  { id: 'co2',            label: 'CO₂-patroon of minipomp' },
  { id: 'multitool',      label: 'Multitool' },
  { id: 'telefoon',       label: 'Telefoon (geladen)' },
  { id: 'id',             label: 'ID of ICE-kaartje' },
  { id: 'geld',           label: 'Geld of pinpas' },
]

function buildSpecificItems(hours: HourlyWeather[], distanceKm: number, elevationGain: number): CheckItem[] {
  const maxPrecip = Math.max(...hours.map((h) => h.precipProb ?? 0))
  const maxTemp   = Math.max(...hours.map((h) => h.temp))
  const minTemp   = Math.min(...hours.map((h) => h.temp))
  const items: CheckItem[] = []

  if (maxPrecip > 30) {
    items.push({
      id: 'regenjack',
      label: 'Regenjack',
      reason: `${Math.round(maxPrecip)}% neerslagkans — neem hem mee`,
    })
  }
  if (distanceKm > 80) {
    items.push({
      id: 'extra-binnenband',
      label: 'Extra binnenband',
      reason: `${Math.round(distanceKm)} km — je wilt niet stranden`,
    })
  }
  if (maxTemp > 25) {
    items.push({
      id: 'zonnebrand',
      label: 'Zonnebrand',
      reason: `${Math.round(maxTemp)}° verwacht — vergeet je neus niet`,
    })
  }
  if (minTemp < 5) {
    items.push({
      id: 'extra-handschoenen',
      label: 'Extra handschoenen in achterzak',
      reason: `${Math.round(minTemp)}° bij de start — reserve is geen luxe`,
    })
  }
  if (elevationGain > 1000) {
    items.push({
      id: 'extra-laag',
      label: 'Extra laag voor de afdalingen',
      reason: `${elevationGain.toLocaleString('nl-NL')} hm — dat zijn koude afdalingen`,
    })
  }

  return items
}

function CheckBox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <span className="relative shrink-0 flex items-center justify-center" onClick={onChange}>
      <span
        className="w-5 h-5 rounded flex items-center justify-center transition-all duration-200 cursor-pointer"
        style={
          checked
            ? { background: '#F59E0B', border: '2px solid #F59E0B' }
            : { background: 'transparent', border: '2px solid #D1D5DB' }
        }
        aria-hidden="true"
      >
        {checked && (
          <svg viewBox="0 0 12 10" fill="none" className="w-3 h-3" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </span>
  )
}

export default function PackingChecklist({ hours, distanceKm, elevationGain }: Props) {
  const specificItems = buildSpecificItems(hours, distanceKm, elevationGain)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [showStandard, setShowStandard] = useState(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checklistQuote = useMemo(() => getChecklistQuote(), [])

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const specificDone  = specificItems.filter((i) => checked.has(i.id)).length
  const standardDone  = STANDARD_ITEMS.filter((i) => checked.has(i.id)).length
  const totalDone     = specificDone + standardDone
  const totalItems    = specificItems.length + STANDARD_ITEMS.length
  const allDone       = totalDone === totalItems
  const progressPct   = Math.round((totalDone / totalItems) * 100)

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
          Check voor vertrek
        </p>
        <p className="text-sm italic mb-4" style={{ color: '#374151', fontFamily: 'Satoshi, sans-serif' }}>
          {checklistQuote}
        </p>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm" style={{ color: '#374151', fontFamily: 'Satoshi, sans-serif' }}>
            {allDone ? (
              <span style={{ color: '#F59E0B', fontWeight: 600 }}>Alles ingepakt — veel plezier.</span>
            ) : (
              <>
                <span className="font-semibold" style={{ color: '#0B1220' }}>{totalDone}/{totalItems}</span>
                {' '}afgevinkt
              </>
            )}
          </p>
          <span className="text-xs" style={{ color: '#8896AB', fontFamily: 'Satoshi, sans-serif' }}>{progressPct}%</span>
        </div>
        <div className="h-1 rounded-full" style={{ background: '#E5E7EB' }}>
          <div
            className="h-1 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, background: '#F59E0B' }}
          />
        </div>
      </div>

      {/* Rit-specifieke items — prominent */}
      {specificItems.length > 0 && (
        <div style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          {specificItems.map((item, i) => {
            const isChecked = checked.has(item.id)
            return (
              <label
                key={item.id}
                className="flex items-start gap-4 px-6 py-4 cursor-pointer select-none"
                style={{
                  borderTop: i > 0 ? '1px solid rgba(0,0,0,0.04)' : undefined,
                  background: isChecked ? undefined : 'rgba(245,158,11,0.04)',
                }}
              >
                <span className="mt-0.5">
                  <input type="checkbox" checked={isChecked} onChange={() => toggle(item.id)} className="sr-only" />
                  <CheckBox checked={isChecked} onChange={() => toggle(item.id)} />
                </span>
                <span className="flex-1 min-w-0">
                  <span
                    className="text-sm font-semibold"
                    style={{
                      fontFamily: 'Satoshi, sans-serif',
                      color: isChecked ? '#9CA3AF' : '#0B1220',
                      textDecoration: isChecked ? 'line-through' : 'none',
                    }}
                  >
                    {item.label}
                  </span>
                  {item.reason && !isChecked && (
                    <span
                      className="block text-xs mt-0.5"
                      style={{ fontFamily: 'Satoshi, sans-serif', color: '#D97706' }}
                    >
                      {item.reason}
                    </span>
                  )}
                </span>
              </label>
            )
          })}
        </div>
      )}

      {/* Standaard spullen — ingeklapt */}
      <div>
        <button
          onClick={() => setShowStandard(!showStandard)}
          className="w-full flex items-center justify-between px-6 py-4 text-sm select-none"
          style={{
            fontFamily: 'Satoshi, sans-serif',
            color: '#8896AB',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span>
            Standaard spullen{' '}
            <span style={{ color: '#D1D5DB' }}>
              ({standardDone}/{STANDARD_ITEMS.length})
            </span>
          </span>
          <span style={{ fontSize: '10px', transform: showStandard ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }}>
            ▼
          </span>
        </button>

        {showStandard && STANDARD_ITEMS.map((item, i) => {
          const isChecked = checked.has(item.id)
          return (
            <label
              key={item.id}
              className="flex items-center gap-4 px-6 py-3 cursor-pointer select-none"
              style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}
            >
              <input type="checkbox" checked={isChecked} onChange={() => toggle(item.id)} className="sr-only" />
              <CheckBox checked={isChecked} onChange={() => toggle(item.id)} />
              <span
                className="text-sm"
                style={{
                  fontFamily: 'Satoshi, sans-serif',
                  color: isChecked ? '#9CA3AF' : '#6B7280',
                  textDecoration: isChecked ? 'line-through' : 'none',
                }}
              >
                {item.label}
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
