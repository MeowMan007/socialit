import { useCallback, useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Crosshair, Layers, MapPin, Minus, Plus } from 'lucide-react'
import type { Thread } from '../types'
import 'leaflet/dist/leaflet.css'

type FriendPin = { id: string; initials: string; color: string; name: string; lat: number; lng: number; place: string }
type Props = {
  threads: Thread[]
  selected: string
  onSelect: (id: string) => void
  onPickLocation: (lat: number, lng: number, place?: string) => void
  picking: boolean
  draftPin: { lat: number; lng: number; place: string } | null
  friendPins: FriendPin[]
}

const center: L.LatLngExpression = [28.574, 77.323]
const defaultTiles = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const satelliteTiles = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

function scoreIcon(score: number, active: boolean) {
  return L.divIcon({
    className: 'socialit-leaflet-icon',
    html: `<span class="leaflet-thread-pin${active ? ' active' : ''}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg><b>${score}</b></span>`,
    iconSize: [50, 40], iconAnchor: [19, 38],
  })
}

function friendIcon(friend: FriendPin) {
  return L.divIcon({ className: 'socialit-leaflet-icon', html: `<span class="leaflet-friend-pin ${friend.color}">${friend.initials}<i></i></span>`, iconSize: [38, 38], iconAnchor: [19, 19] })
}

function draftIcon() {
  return L.divIcon({ className: 'socialit-leaflet-icon', html: '<span class="leaflet-draft-pin"><svg viewBox="0 0 24 24"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></span>', iconSize: [34, 42], iconAnchor: [17, 40] })
}

function MapEvents({ picking, onPick }: { picking: boolean; onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(event) { if (picking) onPick(event.latlng.lat, event.latlng.lng) } })
  return null
}

function MapRef({ onMap }: { onMap: (map: L.Map) => void }) {
  const map = useMap()
  useEffect(() => onMap(map), [map, onMap])
  return null
}

export default function MapPanel({ threads, selected, onSelect, onPickLocation, picking, draftPin, friendPins }: Props) {
  const [map, setMap] = useState<L.Map | null>(null)
  const [alternateTiles, setAlternateTiles] = useState(false)
  const pick = useCallback((lat: number, lng: number) => onPickLocation(lat, lng, 'Pinned map location'), [onPickLocation])
  const saveMap = useCallback((value: L.Map) => setMap((current) => current === value ? current : value), [])
  const tiles = useMemo(() => import.meta.env.VITE_OSM_TILE_URL || (alternateTiles ? satelliteTiles : defaultTiles), [alternateTiles])
  const locate = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      map?.flyTo([coords.latitude, coords.longitude], 16)
      if (picking) onPickLocation(coords.latitude, coords.longitude, 'Your current location')
    })
  }

  return <section className={`map-stage ${picking ? 'map-picking' : ''}`} aria-label="Map of local discussions">
    <MapContainer className="map-canvas" center={center} zoom={14} zoomControl={false} attributionControl={false} scrollWheelZoom>
      <TileLayer url={tiles} attribution={alternateTiles ? '&copy; OpenStreetMap &copy; CARTO' : '&copy; OpenStreetMap contributors'} />
      <MapRef onMap={saveMap}/>
      <MapEvents picking={picking} onPick={pick}/>
      {threads.map((thread) => <Marker key={thread.id} position={[thread.lat, thread.lng]} icon={scoreIcon(thread.score, selected === thread.id)} eventHandlers={{ click: () => onSelect(thread.id) }}><Popup><b>{thread.title}</b><br/>{thread.place}</Popup></Marker>)}
      {friendPins.map((friend) => <Marker key={friend.id} position={[friend.lat, friend.lng]} icon={friendIcon(friend)} eventHandlers={{ click: () => map?.flyTo([friend.lat, friend.lng], Math.max(map.getZoom(), 15)) }}><Popup><b>{friend.name}</b><br/>{friend.place}</Popup></Marker>)}
      {draftPin && <Marker position={[draftPin.lat, draftPin.lng]} icon={draftIcon()}><Popup><b>New thread pin</b><br/>{draftPin.place}<br/>{draftPin.lat.toFixed(5)}, {draftPin.lng.toFixed(5)}</Popup></Marker>}
    </MapContainer>
    <div className="map-search-chip"><MapPin size={14}/><span>{draftPin?.place || locationLabel(threads, selected)}</span><span className="map-live"><i/> LIVE</span></div>
    <div className="map-controls"><button aria-label="Zoom in" onClick={() => map?.zoomIn()}><Plus size={17}/></button><button aria-label="Zoom out" onClick={() => map?.zoomOut()}><Minus size={17}/></button><span/><button aria-label="Change map style" onClick={() => setAlternateTiles((value) => !value)}><Layers size={17}/></button><button aria-label="My location" onClick={locate}><Crosshair size={17}/></button></div>
    {picking && <div className="live-map-hint">Tap the map to place your pin</div>}
    <div className="map-attribution"><MapPin size={12}/> Noida, India <span>·</span> {threads.length} local conversations</div>
  </section>
}

function locationLabel(threads: Thread[], selected: string) { return threads.find((thread) => thread.id === selected)?.place || 'Noida, Uttar Pradesh' }
