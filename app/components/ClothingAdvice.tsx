'use client'

import { useMemo } from 'react'
import type { HourlyWeather } from './WeatherPanel'
import { getKitQuote } from '../data/quotes'

type ClothingItem = { item: string; reason: string }

function getClothingItems(hours: HourlyWeather[]): { items: ClothingItem[]; avgTemp: number } {
  const avgTemp   = hours.reduce((s, h) => s + h.temp, 0) / hours.length
  const maxWind   = Math.max(...hours.map((h) => h.windspeed))
  const maxPrecip = Math.max(...hours.map((h) => h.precipProb ?? 0))
  const minTemp   = Math.min(...hours.map((h) => h.temp))
  const tempDiff  = Math.abs(hours[hours.length - 1].temp - hours[0].temp)

  const items: ClothingItem[] = []

  // ── Bovenlijf ────────────────────────────────────────────────────────────
  if (avgTemp < 5) {
    items.push({ item: 'Thermisch onderhemd', reason: `${Math.round(avgTemp)}° vraagt om een volledige basislaag` })
    items.push({ item: 'Winterjack', reason: 'Onder de 5 graden, geen discussie' })
  } else if (avgTemp < 10) {
    items.push({ item: 'Basislaag lange mouwen', reason: `${Math.round(avgTemp)}° gemiddeld — fris bij vertrek` })
    items.push({
      item: 'Gilet',
      reason: maxWind > 20
        ? `${Math.round(maxWind)} km/u wind — dat voel je op de afdalingen`
        : 'Snijdt de wind weg zonder te zwaar aan te kleden',
    })
  } else if (avgTemp < 16) {
    items.push({ item: 'Korte mouwen jersey', reason: 'Fijn als het warmer wordt onderweg' })
    items.push({ item: 'Armwarmers', reason: `${Math.round(avgTemp)}° is te fris voor blote armen — in de achterzak als je opwarmt` })
  } else if (avgTemp < 20) {
    items.push({ item: 'Korte mouwen jersey', reason: 'Prima temperatuur' })
    items.push({ item: 'Gilet in achterzak', reason: `${Math.round(minTemp)}° bij de start, later aangenaam` })
  } else {
    items.push({ item: 'Korte mouwen jersey', reason: 'Warm genoeg, geen lagen nodig' })
  }

  // ── Onderlijf ────────────────────────────────────────────────────────────
  if (avgTemp < 10) {
    items.push({ item: 'Lange thermobroek', reason: 'Onder de 10 graden, geen twijfel' })
  } else if (avgTemp < 16) {
    items.push({ item: 'Korte broek + beenwarmers', reason: `${Math.round(avgTemp)}° voelt fris bij lagere snelheid — beenwarmers eraf als je warm rijdt` })
  } else {
    items.push({ item: 'Korte broek', reason: 'Geen gedoe vandaag' })
  }

  // ── Handen & voeten ──────────────────────────────────────────────────────
  if (avgTemp < 5) {
    items.push({ item: 'Winterhandschoenen', reason: 'Koude handen rem je niet meer — altijd doen' })
    items.push({ item: 'Overschoenen', reason: 'Je tenen zullen je dankbaar zijn bij km 60' })
    items.push({ item: 'Buff', reason: 'Nek en oren warm houden' })
  } else if (avgTemp < 12) {
    items.push({ item: 'Lichte handschoenen', reason: 'Vingers worden het eerst koud op de fiets' })
    items.push({ item: 'Toe covers', reason: `${Math.round(avgTemp)}° is fris genoeg om je tenen te beschermen` })
  }

  // ── Extras ───────────────────────────────────────────────────────────────
  if (maxPrecip >= 70) {
    items.push({ item: 'Regenjack aan', reason: `${Math.round(maxPrecip)}% neerslagkans — dit neem je mee` })
  } else if (maxPrecip >= 40) {
    items.push({ item: 'Regenjack in achterzak', reason: `${Math.round(maxPrecip)}% kans op regen. Kans is er.` })
  }
  if (maxWind > 30 && avgTemp >= 10) {
    items.push({ item: 'Windvest', reason: `${Math.round(maxWind)} km/u wind — dat vreet warmte op de lange rechten` })
  }
  if (tempDiff >= 8) {
    items.push({ item: 'Extra laag in achterzak', reason: `Temperatuurverschil van ${Math.round(tempDiff)}° onderweg — kleden in lagen is verstandig` })
  }

  return { items, avgTemp }
}

export default function ClothingAdvice({ hours }: { hours: HourlyWeather[] }) {
  if (hours.length === 0) return null

  const { items, avgTemp } = getClothingItems(hours)
  const maxPrecip = Math.max(...hours.map((h) => h.precipProb ?? 0))

  const kitQuote = useMemo(
    () => getKitQuote(avgTemp, maxPrecip),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Math.round(avgTemp), Math.round(maxPrecip / 10) * 10],
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
          Kit check
        </p>
        <p className="text-sm italic" style={{ color: '#374151', fontFamily: 'Satoshi, sans-serif' }}>
          {kitQuote}
        </p>
      </div>

      <div>
        {items.map((item, i) => (
          <div
            key={item.item}
            className="px-6 py-4"
            style={{ borderTop: i > 0 ? '1px solid rgba(0,0,0,0.04)' : undefined }}
          >
            <span
              style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: '#0B1220' }}
            >
              {item.item}
            </span>
            <span
              style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.9375rem', color: '#6B7280' }}
            >
              {' — '}{item.reason}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
