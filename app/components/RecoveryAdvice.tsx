'use client'

import { useMemo } from 'react'
import { getHerstelQuote } from '../data/quotes'

type Props = {
  distanceKm: number
  durationHours: number
  elevationGain: number
}

type RecoveryBlock = {
  label: string
  detail: string
  timing: string
}

function buildBlocks(durationHours: number, elevationGain: number): RecoveryBlock[] {
  const isShort = durationHours < 2
  const isZwaar = durationHours >= 4 || elevationGain >= 1500

  if (isShort) {
    return [
      {
        label: 'Herstel',
        detail: 'Kwark of shake met 20-25g eiwit binnen 30 minuten. Banaan erbij voor de koolhydraten.',
        timing: 'Binnen 30 min',
      },
      {
        label: 'Vocht',
        detail: '500ml water. Meer hoeft waarschijnlijk niet.',
        timing: 'Eerste uur',
      },
    ]
  }

  const blocks: RecoveryBlock[] = [
    {
      label: 'Eiwit',
      detail: 'Shake of kwark met 25-30g eiwit. Herstel begint hier — niet uitstellen.',
      timing: 'Binnen 30 min',
    },
    {
      label: 'Koolhydraten',
      detail: 'Banaan + brood met pindakaas. Glycogeen bijvullen terwijl de spieren openstaan.',
      timing: 'Binnen 30 min',
    },
    {
      label: 'Vocht',
      detail: 'Minstens 500ml water of isotonisch in het eerste uur.',
      timing: 'Eerste uur',
    },
    {
      label: 'Maaltijd',
      detail: 'Stevige maaltijd binnen 2 uur. Rijst, pasta of aardappelen met eiwitbron.',
      timing: 'Binnen 2 uur',
    },
  ]

  if (isZwaar) {
    blocks.push({
      label: 'Morgen',
      detail: 'Neem het rustig. Herstelrit of rustdag. De benen hebben het verdiend.',
      timing: 'Dag erna',
    })
  }

  return blocks
}

export default function RecoveryAdvice({ distanceKm: _distanceKm, durationHours, elevationGain }: Props) {
  const blocks = useMemo(
    () => buildBlocks(durationHours, elevationGain),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Math.round(durationHours * 2), elevationGain],
  )

  const herstelQuote = useMemo(
    () => getHerstelQuote(durationHours, elevationGain),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Math.round(durationHours * 2), elevationGain],
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
          Na de finish
        </p>
        <p className="text-sm italic" style={{ color: '#374151', fontFamily: 'Satoshi, sans-serif' }}>
          {herstelQuote}
        </p>
      </div>

      <div>
        {blocks.map((block, i) => (
          <div
            key={block.label}
            className="flex items-start gap-4 px-6 py-4"
            style={{ borderTop: i > 0 ? '1px solid rgba(0,0,0,0.04)' : undefined }}
          >
            <div style={{ flex: 1 }}>
              <p
                className="text-xs font-medium uppercase mb-1"
                style={{ letterSpacing: '0.05em', color: '#8896AB', fontFamily: 'Satoshi, sans-serif' }}
              >
                {block.label}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: '#374151', fontFamily: 'Satoshi, sans-serif' }}>
                {block.detail}
              </p>
            </div>
            <span
              className="text-xs shrink-0"
              style={{
                fontFamily: 'Satoshi, sans-serif',
                color: '#B0BACA',
                paddingTop: 2,
                whiteSpace: 'nowrap',
              }}
            >
              {block.timing}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
