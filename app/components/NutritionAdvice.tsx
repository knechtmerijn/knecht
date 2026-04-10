'use client'

import { useMemo } from 'react'
import type { HourlyWeather } from './WeatherPanel'
import { getVoedingQuote } from '../data/quotes'

type RefillVenue = { name: string; type: string; distanceM: number }
type RefillInfo  = { km: number; venue: RefillVenue | null } | null

type Props = {
  hours: HourlyWeather[]
  distanceKm: number
  durationHours: number
  refillPoint?: RefillInfo
}

type SchemaItem = {
  km: number
  text: string
  note?: string
  type: 'eten' | 'drinken' | 'bijvullen'
}

const FOODS = ['Gel', 'Rijstwafel', 'Reep', 'Gel', 'Banaan', 'Reep', 'Gel', 'Rijstwafel', 'Reep', 'Gel', 'Banaan']

function buildSchema(distanceKm: number, durationHours: number, maxTemp: number): SchemaItem[] {
  const durationMin = durationHours * 60
  if (durationMin < 45) return []

  const avgSpeed = distanceKm / durationHours
  const mlPerHour = maxTemp > 25 ? 750 : 500
  const nBidons = Math.max(1, Math.ceil((mlPerHour * durationHours) / 500))

  // Eet-events: eerste na 30 min, daarna elke 20 min
  const eatItems: SchemaItem[] = []
  for (let minT = 30; minT < durationMin - 10; minT += 20) {
    const km = Math.round((minT / 60) * avgSpeed)
    if (km > distanceKm - 5) break
    eatItems.push({ km, text: FOODS[eatItems.length % FOODS.length], type: 'eten' })
  }

  if (eatItems.length > 0) {
    eatItems[0].note = 'Op tijd beginnen is halve winst.'
    if (eatItems.length > 1) {
      eatItems[eatItems.length - 1].note = 'Laatste loodjes. Even doorbijten.'
    }
  }

  // Drink-events: elke 60 min
  const drinkItems: SchemaItem[] = []
  for (let bidon = 1; ; bidon++) {
    const minT = bidon * 60
    if (minT >= durationMin) break
    const km = Math.round((minT / 60) * avgSpeed)
    if (km > distanceKm - 5) break
    const isBijvullen = nBidons > 2 && bidon === 2
    drinkItems.push({
      km,
      text: isBijvullen
        ? `Bidon ${bidon} leeg. Bijvullen.`
        : `Bidon ${bidon} zou leeg moeten zijn.`,
      note: isBijvullen ? 'Zoek een kraan of terras. Goede plek om even te stoppen.' : undefined,
      type: isBijvullen ? 'bijvullen' : 'drinken',
    })
  }

  return [...eatItems, ...drinkItems].sort((a, b) => a.km - b.km)
}

export default function NutritionAdvice({ hours, distanceKm, durationHours, refillPoint }: Props) {
  if (hours.length === 0) return null

  const durationMin = durationHours * 60
  const maxTemp = Math.max(...hours.map((h) => h.temp))
  const kcal = Math.round(distanceKm * 25)
  const mlPerHour = maxTemp > 25 ? 750 : 500
  const nBidons = Math.max(1, Math.ceil((mlPerHour * durationHours) / 500))

  // Koolhydraten totaal voor stats-balk
  const eatInterval = durationMin >= 180 ? 20 : 30
  const nInnames = Math.max(1, Math.floor(durationMin / eatInterval))
  const nGels = Math.ceil(nInnames * 0.6)
  const nRepen = nInnames - nGels
  const totalCarbs = nGels * 25 + nRepen * 30

  const voedingQuote = useMemo(
    () => getVoedingQuote(durationHours, maxTemp),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Math.round(durationHours * 2), Math.round(maxTemp)],
  )

  const schema = useMemo(
    () => buildSchema(distanceKm, durationHours, maxTemp),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Math.round(distanceKm), Math.round(durationHours * 2), Math.round(maxTemp)],
  )

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
          Achterzakken
        </p>
        <p className="text-sm italic" style={{ color: '#374151', fontFamily: 'Satoshi, sans-serif' }}>
          {voedingQuote}
        </p>
      </div>

      {/* Compacte stats */}
      <div
        className="px-6 py-3 flex items-center gap-4 text-sm"
        style={{ background: '#F5F7FA', borderBottom: '1px solid rgba(0,0,0,0.06)' }}
      >
        <span style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 700, color: '#0B1220' }}>
          {kcal.toLocaleString('nl-NL')}{' '}
          <span style={{ fontWeight: 400, color: '#8896AB' }}>kcal</span>
        </span>
        {durationMin >= 90 && (
          <>
            <span style={{ color: '#D1D5DB' }}>·</span>
            <span style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 700, color: '#0B1220' }}>
              {totalCarbs}{' '}
              <span style={{ fontWeight: 400, color: '#8896AB' }}>g koolh.</span>
            </span>
          </>
        )}
        <span style={{ color: '#D1D5DB' }}>·</span>
        <span style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 700, color: '#0B1220' }}>
          {nBidons}{' '}
          <span style={{ fontWeight: 400, color: '#8896AB' }}>bidon{nBidons > 1 ? 's' : ''}</span>
        </span>
      </div>

      {/* Timing-schema */}
      {schema.length === 0 ? (
        <div className="px-6 py-4">
          <p className="text-sm" style={{ color: '#374151', fontFamily: 'Satoshi, sans-serif' }}>
            Goed ontbijten voor de start. Onderweg heb je niks nodig.
          </p>
        </div>
      ) : (
        <div>
          {schema.map((item, i) => {
            const dotColor =
              item.type === 'eten' ? '#F59E0B'
              : item.type === 'bijvullen' ? '#F97316'
              : '#D1D5DB'
            const textColor = item.type === 'drinken' ? '#6B7280' : '#0B1220'
            const noteColor = item.type === 'bijvullen' ? '#F97316' : '#D97706'

            // Vervang generieke bijvul-noot met echte venuedata
            let displayNote = item.note
            if (item.type === 'bijvullen' && refillPoint) {
              if (refillPoint.venue) {
                displayNote = `${refillPoint.venue.name} — ${refillPoint.venue.type}, ${refillPoint.venue.distanceM}m van route.`
              } else {
                displayNote = 'Weinig langs de route. Neem een extra bidon mee of vul eerder bij.'
              }
            }

            return (
              <div
                key={i}
                className="flex items-start gap-4 px-6 py-3"
                style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}
              >
                {/* Dot + lijn */}
                <div className="flex flex-col items-center" style={{ paddingTop: 5, width: 8, flexShrink: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                  {i < schema.length - 1 && (
                    <div style={{ width: 1, flex: 1, background: '#E5E7EB', marginTop: 4, minHeight: 12 }} />
                  )}
                </div>

                {/* km label */}
                <span style={{
                  fontFamily: 'Satoshi, sans-serif',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#B0BACA',
                  minWidth: 40,
                  paddingTop: 1,
                  flexShrink: 0,
                }}>
                  km {item.km}
                </span>

                {/* tekst + noot */}
                <div style={{ paddingBottom: i < schema.length - 1 ? 8 : 0 }}>
                  <span style={{
                    fontFamily: 'Satoshi, sans-serif',
                    fontSize: '0.875rem',
                    fontWeight: item.type === 'eten' ? 600 : 400,
                    color: textColor,
                  }}>
                    {item.text}
                  </span>
                  {displayNote && (
                    <p style={{
                      fontFamily: 'Satoshi, sans-serif',
                      fontSize: '0.75rem',
                      color: noteColor,
                      marginTop: 2,
                    }}>
                      {displayNote}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
