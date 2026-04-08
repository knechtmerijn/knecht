'use client'

import { useMemo } from 'react'
import type { HourlyWeather } from './WeatherPanel'
import { getKitQuote } from '../data/quotes'

type Category = {
  label: string
  items: string[]
  accent?: boolean
}

function getAdvice(hours: HourlyWeather[]): { categories: Category[]; avgTemp: number } {
  const avgTemp = hours.reduce((s, h) => s + h.temp, 0) / hours.length
  const maxWind = Math.max(...hours.map((h) => h.windspeed))
  const maxPrecip = Math.max(...hours.map((h) => h.precipProb ?? 0))
  const tempDiff = Math.abs(hours[hours.length - 1].temp - hours[0].temp)

  let bovenlijf: string[]
  if (avgTemp < 5) bovenlijf = ['Thermisch onderhemd', 'Winterjack']
  else if (avgTemp < 10) bovenlijf = ['Basislaag lange mouwen', 'Jersey', 'Gilet']
  else if (avgTemp < 16) bovenlijf = ['Korte mouwen jersey', 'Armwarmers in achterzak']
  else if (avgTemp < 20) bovenlijf = ['Korte mouwen jersey', 'Gilet in achterzak']
  else bovenlijf = ['Korte mouwen jersey']

  let onderlijf: string[]
  if (avgTemp < 10) onderlijf = ['Lange thermobroek']
  else if (avgTemp < 16) onderlijf = ['Korte broek', 'Beenwarmers']
  else onderlijf = ['Korte broek']

  let extremiteiten: string[]
  if (avgTemp < 5) extremiteiten = ['Winterhandschoenen', 'Overschoenen', 'Buff']
  else if (avgTemp < 12) extremiteiten = ['Lichte handschoenen', 'Toe covers']
  else extremiteiten = ['Geen handschoenen nodig']

  const extras: string[] = []
  if (maxWind > 30) extras.push('Windvest mee — het gaat flink waaien')
  if (maxPrecip >= 70)
    extras.push('Regenjack aan. Of gewoon doorrijden, het is maar water.')
  else if (maxPrecip >= 40)
    extras.push('Regenjack in je achterzak. Kans is er.')
  if (avgTemp < 5)
    extras.push('Je tenen zullen je dankbaar zijn bij km 60. Overschoenen aan.')
  if (tempDiff >= 8) extras.push('Kleed je in lagen — het verschil is groot vandaag')

  const categories: Category[] = [
    { label: 'Bovenlijf', items: bovenlijf },
    { label: 'Onderlijf', items: onderlijf },
    { label: 'Handen & voeten', items: extremiteiten },
  ]
  if (extras.length > 0) {
    categories.push({ label: "Extra's", items: extras, accent: true })
  }

  return { categories, avgTemp }
}

export default function ClothingAdvice({ hours }: { hours: HourlyWeather[] }) {
  if (hours.length === 0) return null

  const { categories, avgTemp } = getAdvice(hours)
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
      <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <p
          className="text-xs font-medium uppercase mb-1.5"
          style={{ letterSpacing: '0.05em', color: '#8896AB', fontFamily: 'Satoshi, sans-serif' }}
        >
          Kit check
        </p>
        <p className="text-sm italic mb-1" style={{ color: '#374151', fontFamily: 'Satoshi, sans-serif' }}>
          {kitQuote}
        </p>
        <p className="text-xs" style={{ color: '#8896AB', fontFamily: 'Satoshi, sans-serif' }}>
          Gem. {Math.round(avgTemp)}° tijdens de rit
        </p>
      </div>

      <div>
        {categories.map((cat, i) => (
          <div
            key={cat.label}
            className="flex gap-4 px-6 py-5"
            style={{
              borderTop: i > 0 ? '1px solid rgba(0,0,0,0.04)' : undefined,
              background: cat.accent ? 'rgba(245,158,11,0.05)' : undefined,
            }}
          >
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-medium uppercase mb-3"
                style={{
                  letterSpacing: '0.05em',
                  color: cat.accent ? '#F59E0B' : '#8896AB',
                  fontFamily: 'Satoshi, sans-serif',
                }}
              >
                {cat.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {cat.items.map((item) => (
                  <span
                    key={item}
                    className="text-sm px-4 py-2 rounded-full"
                    style={{
                      background: '#F5F7FA',
                      color: '#374151',
                      fontFamily: 'Satoshi, sans-serif',
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
