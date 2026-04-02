'use client'

import type { HourlyWeather } from './WeatherPanel'

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
          Kit check
        </p>
        <p className="text-sm" style={{ color: '#1a1a2e' }}>
          Gem.{' '}
          <span className="font-semibold" style={{ color: '#4a6fa5' }}>
            {Math.round(avgTemp)}°
          </span>{' '}
          tijdens de rit
        </p>
      </div>

      {/* Category rows */}
      <div className="divide-y" style={{ borderColor: '#f0ebe4' }}>
        {categories.map((cat) => (
          <div
            key={cat.label}
            className="flex gap-4 px-5 py-4"
            style={cat.accent ? { background: '#f0f4fa' } : undefined}
          >
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-medium uppercase mb-2"
                style={{
                  letterSpacing: '0.05em',
                  color: cat.accent ? '#4a6fa5' : '#7c7872',
                }}
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
                        ? { background: '#dce9f5', color: '#2d5187', fontWeight: 500 }
                        : { background: '#f5f0eb', color: '#3d3a36' }
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
