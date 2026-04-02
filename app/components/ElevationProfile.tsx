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
          Profiel
        </p>
        {hardestClimb ? (
          <p className="text-sm" style={{ color: '#1a1a2e' }}>
            Pittigste klim: km {hardestClimb.startKm.toFixed(0)}–{hardestClimb.endKm.toFixed(0)},{' '}
            <span className="font-semibold" style={{ color: '#4a6fa5' }}>
              {hardestClimb.avgGradient.toFixed(1)}% gem
            </span>
            , {hardestClimb.maxGradient.toFixed(0)}% max
          </p>
        ) : (
          <p className="text-sm" style={{ color: '#3d3a36' }}>
            Pannenkoek-vlak. Lekker in het wiel kruipen en doordraaien.
          </p>
        )}
      </div>

      {/* Chart */}
      <div className="px-5 pt-4 pb-4">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={profile} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4a6fa5" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#4a6fa5" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e0dbd5" vertical={false} />

            <XAxis
              dataKey="distanceKm"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickCount={6}
              tickFormatter={(v: number) => `${v.toFixed(0)} km`}
              tick={{ fontSize: 11, fill: '#7c7872' }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              domain={yDomain}
              tickCount={4}
              tickFormatter={(v: number) => `${v} m`}
              tick={{ fontSize: 11, fill: '#7c7872' }}
              axisLine={false}
              tickLine={false}
              width={52}
            />

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Tooltip content={(props: any) => <ElevTooltip {...props} />} />

            <Area
              type="monotone"
              dataKey="elevation"
              stroke="#4a6fa5"
              strokeWidth={2}
              fill="url(#elevGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#4a6fa5', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
