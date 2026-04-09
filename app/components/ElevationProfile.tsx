'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { getProfielQuote, getHardestClimbQuote } from '../data/quotes'

export type ElevPoint = { distanceKm: number; elevation: number }

export type HardestClimb = {
  startKm: number
  endKm: number
  lengthKm: number
  avgGradient: number
  maxGradient: number
} | null

function ElevTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: ElevPoint }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div
      className="text-xs px-3 py-2 rounded-lg"
      style={{
        background: '#0B1220',
        color: '#F5F7FA',
        fontFamily: 'Satoshi, sans-serif',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      }}
    >
      <span style={{ color: '#8896AB' }}>{d.distanceKm.toFixed(1)} km</span>
      <span className="ml-2 font-semibold">{d.elevation} m</span>
    </div>
  )
}

type Props = {
  profile: ElevPoint[]
  hardestClimb: HardestClimb
  elevationGain: number
}

export default function ElevationProfile({ profile, hardestClimb, elevationGain }: Props) {
  const hasElevation = profile.some((p) => p.elevation > 0)
  if (!hasElevation) return null

  const minEle = Math.min(...profile.map((p) => p.elevation))
  const maxEle = Math.max(...profile.map((p) => p.elevation))
  const padding = Math.max(20, (maxEle - minEle) * 0.1)
  const yDomain = [Math.max(0, minEle - padding), maxEle + padding]

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const profielQuote = useMemo(() => getProfielQuote(elevationGain), [elevationGain])
  const climbQuote   = useMemo(
    () => hardestClimb ? getHardestClimbQuote(hardestClimb.avgGradient) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hardestClimb?.avgGradient],
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
          Profiel
        </p>
        <p className="text-sm italic mb-1.5" style={{ color: '#374151', fontFamily: 'Satoshi, sans-serif' }}>
          {profielQuote}
        </p>
        {hardestClimb && (
          <p className="text-sm" style={{ color: '#8896AB', fontFamily: 'Satoshi, sans-serif' }}>
            {climbQuote}{' '}
            <span style={{ color: '#374151' }}>
              km {hardestClimb.startKm.toFixed(0)}–{hardestClimb.endKm.toFixed(0)},
            </span>{' '}
            <span className="font-semibold" style={{ color: '#F59E0B' }}>
              {hardestClimb.avgGradient.toFixed(1)}% gem
            </span>
            <span style={{ color: '#374151' }}>, {hardestClimb.maxGradient.toFixed(0)}% max</span>
          </p>
        )}
      </div>

      <div className="px-5 pt-4 pb-5">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={profile} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />

            <XAxis
              dataKey="distanceKm"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickCount={6}
              tickFormatter={(v: number) => `${v.toFixed(0)} km`}
              tick={{ fontSize: 11, fill: '#8896AB', fontFamily: 'Satoshi, sans-serif' }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              domain={yDomain}
              tickCount={4}
              tickFormatter={(v: number) => `${v} m`}
              tick={{ fontSize: 11, fill: '#8896AB', fontFamily: 'Satoshi, sans-serif' }}
              axisLine={false}
              tickLine={false}
              width={52}
            />

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Tooltip content={(props: any) => <ElevTooltip {...props} />} />

            <Area
              type="monotone"
              dataKey="elevation"
              stroke="#F59E0B"
              strokeWidth={2}
              fill="url(#elevGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#F59E0B', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
