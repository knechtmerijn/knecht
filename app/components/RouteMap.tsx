'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

type LatLng = [number, number]

function FitBounds({ bounds }: { bounds: [LatLng, LatLng] }) {
  const map = useMap()
  useEffect(() => {
    map.fitBounds(bounds, { padding: [24, 24] })
  }, [map, bounds])
  return null
}

export default function RouteMap({ points }: { points: LatLng[] }) {
  if (points.length === 0) return null

  const lats = points.map((p) => p[0])
  const lngs = points.map((p) => p[1])
  const bounds: [LatLng, LatLng] = [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ]

  return (
    <MapContainer
      bounds={bounds}
      style={{ height: '380px', width: '100%' }}
      className="z-0"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={points} color="#f59e0b" weight={4} opacity={0.9} />
      <FitBounds bounds={bounds} />
    </MapContainer>
  )
}
