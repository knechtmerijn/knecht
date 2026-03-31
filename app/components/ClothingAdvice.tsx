'use client'

import type { HourlyWeather } from './WeatherPanel'

type Category = {
  emoji: string
  label: string
  items: string[]
  accent?: boolean // extra's krijgen oranje stijl
}

function getAdvice(hours: HourlyWeather[]): { categories: Category[]; avgTemp: number } {
  const avgTemp = hours.reduce((s, h) => s + h.temp, 0) / hours.length
  const maxWind = Math.max(...hours.map((h) => h.windspeed))
  const maxPrecip = Math.max(...hours.map((h) => h.precipProb ?? 0))
  const tempDiff = Math.abs(hours[hours.length - 1].temp - hours[0].temp)

  // Bovenlijf
  let bovenlijf: string[]
  if (avgTemp < 5) bovenlijf = ['Thermisch onderhemd', 'Winterjack']
  else if (avgTemp < 10) bovenlijf = ['Basislaag lange mouwen', 'Jersey', 'Gilet']
  else if (avgTemp < 16) bovenlijf = ['Korte mouwen jersey', 'Armwarmers in achterzak']
  else if (avgTemp < 20) bovenlijf = ['Korte mouwen jersey', 'Gilet in achterzak']
  else bovenlijf = ['Korte mouwen jersey']

  // Onderlijf
  let onderlijf: string[]
  if (avgTemp < 10) onderlijf = ['Lange thermobroek']
  else if (avgTemp < 16) onderlijf = ['Korte broek', 'Beenwarmers']
  else onderlijf = ['Korte broek']

  // Handen & voeten
  let extremiteiten: string[]
  if (avgTemp < 5) extremiteiten = ['Winterhandschoenen', 'Overschoenen', 'Buff']
  else if (avgTemp < 12) extremiteiten = ['Lichte handschoenen', 'Toe covers']
  else extremiteiten = ['Geen handschoenen nodig']

  // Extra's
  const extras: string[] = []
  if (maxWind > 30) extras.push('Windvest mee, het gaat flink waaien')
  if (maxPrecip >= 70)
    extras.push('Regenjack aan — of plan B: de rollen (geen schande)')
  else if (maxPrecip >= 40) extras.push('Regenjas in je achterzak')
  if (tempDiff >= 8) extras.push('Kleed je in lagen, het verschil is groot vandaag')

  const categories: Category[] = [
    { emoji: '🧥', label: 'Bovenlijf', items: bovenlijf },
    { emoji: '🩳', label: 'Onderlijf', items: onderlijf },
    { emoji: '🧤', label: 'Handen & voeten', items: extremiteiten },
  ]
  if (extras.length > 0) {
    categories.push({ emoji: '⚡', label: "Extra's", items: extras, accent: true })
  }

  return { categories, avgTemp }
}

export default function ClothingAdvice({ hours }: { hours: HourlyWeather[] }) {
  if (hours.length === 0) return null

  const { categories, avgTemp } = getAdvice(hours)

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm">
      {/* Header */}
      <div className="px-5 py-4" style={{ background: '#1a1a2e' }}>
        <p className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-1">
          Wat trek je aan?
        </p>
        <p className="text-sm text-white">
          Op basis van gem.{' '}
          <span className="font-semibold" style={{ color: '#f97316' }}>
            {Math.round(avgTemp)}°
          </span>{' '}
          tijdens de rit
        </p>
      </div>

      {/* Category rows */}
      <div className="bg-white divide-y divide-stone-100">
        {categories.map((cat) => (
          <div
            key={cat.label}
            className="flex gap-4 px-5 py-4"
            style={cat.accent ? { background: '#fff7ed' } : undefined}
          >
            <span className="text-2xl leading-none shrink-0 mt-0.5" aria-hidden="true">
              {cat.emoji}
            </span>
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: cat.accent ? '#f97316' : '#a8a29e' }}
              >
                {cat.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {cat.items.map((item) => (
                  <span
                    key={item}
                    className="text-sm px-3 py-1 rounded-full"
                    style={
                      cat.accent
                        ? {
                            background: '#ffedd5',
                            color: '#c2410c',
                            fontWeight: 500,
                          }
                        : {
                            background: '#f5f5f4',
                            color: '#44403c',
                          }
                    }
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
