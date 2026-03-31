'use client'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

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
      className="text-xs px-3 py-2 rounded-lg shadow"
      style={{ background: '#1a1a2e', color: '#fff' }}
    >
      <span style={{ color: '#94a3b8' }}>{d.distanceKm.toFixed(1)} km</span>
      <span className="ml-2 font-semibold">{d.elevation} m</span>
    </div>
  )
}

type Props = {
  profile: ElevPoint[]
  hardestClimb: HardestClimb
}

export default function ElevationProfile({ profile, hardestClimb }: Props) {
  const hasElevation = profile.some((p) => p.elevation > 0)
  if (!hasElevation) return null

  const minEle = Math.min(...profile.map((p) => p.elevation))
  const maxEle = Math.max(...profile.map((p) => p.elevation))
  const padding = Math.max(20, (maxEle - minEle) * 0.1)
  const yDomain = [Math.max(0, minEle - padding), maxEle + padding]

  return (
    <div className="rounded-2xl bg-white border border-stone-200 shadow-sm px-5 pt-5 pb-4">
      <h2
        className="text-sm font-semibold uppercase tracking-widest mb-4"
        style={{ fontFamily: 'Sora, sans-serif', color: '#1a1a2e' }}
      >
        Hoogteprofiel
      </h2>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={profile} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />

          <XAxis
            dataKey="distanceKm"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickCount={6}
            tickFormatter={(v: number) => `${v.toFixed(0)} km`}
            tick={{ fontSize: 11, fill: '#a8a29e' }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            domain={yDomain}
            tickCount={4}
            tickFormatter={(v: number) => `${v} m`}
            tick={{ fontSize: 11, fill: '#a8a29e' }}
            axisLine={false}
            tickLine={false}
            width={52}
          />

          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Tooltip content={(props: any) => <ElevTooltip {...props} />} />

          <Area
            type="monotone"
            dataKey="elevation"
            stroke="#f97316"
            strokeWidth={2}
            fill="url(#elevGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Klimsamenvatting */}
      <div
        className="mt-4 rounded-xl px-4 py-3 text-sm"
        style={{ background: '#fafaf9', borderLeft: '3px solid #f97316' }}
      >
        {hardestClimb ? (
          <span style={{ color: '#1a1a2e' }}>
            <span className="font-semibold">Pittigste klim:</span> km{' '}
            {hardestClimb.startKm.toFixed(0)} – {hardestClimb.endKm.toFixed(0)} (
            {hardestClimb.lengthKm.toFixed(1)} km, gem{' '}
            <span style={{ color: '#f97316' }} className="font-semibold">
              {hardestClimb.avgGradient.toFixed(1)}%
            </span>
            , max {hardestClimb.maxGradient.toFixed(0)}%)
          </span>
        ) : (
          <span style={{ color: '#57534e' }}>
            Lekker vlak vandaag.{' '}
            <span className="font-semibold" style={{ color: '#1a1a2e' }}>
              Knecht zegt: gas geven.
            </span>
          </span>
        )}
      </div>
    </div>
  )
}
