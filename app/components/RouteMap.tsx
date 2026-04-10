'use client'

import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type LatLng = [number, number]

type RefillMarker = { lat: number; lon: number; km: number; name: string | null }

function FitBounds({ bounds }: { bounds: [LatLng, LatLng] }) {
  const map = useMap()
  useEffect(() => {
    map.fitBounds(bounds, { padding: [24, 24] })
  }, [map, bounds])
  return null
}

export default function RouteMap({ points, refillMarker }: { points: LatLng[]; refillMarker?: RefillMarker }) {
  if (points.length === 0) return null

  const lats = points.map((p) => p[0])
  const lngs = points.map((p) => p[1])
  const bounds: [LatLng, LatLng] = [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ]

  const icon = useMemo(() => L.divIcon({
    html: '<div style="width:14px;height:14px;background:#F97316;border-radius:50%;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>',
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  }), [])

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
      <Polyline positions={points} color="#F59E0B" weight={3} opacity={0.9} />
      {refillMarker && (
        <Marker position={[refillMarker.lat, refillMarker.lon]} icon={icon}>
          <Popup>
            <span style={{ fontFamily: 'sans-serif', fontSize: '13px' }}>
              <strong>Vulstop km {refillMarker.km}</strong>
              {refillMarker.name && <><br />{refillMarker.name}</>}
            </span>
          </Popup>
        </Marker>
      )}
      <FitBounds bounds={bounds} />
    </MapContainer>
  )
}
