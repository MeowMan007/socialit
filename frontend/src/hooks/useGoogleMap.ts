import { useEffect, useRef, useState } from 'react'
import { loadLibrary } from '../lib/maps'

export function useGoogleMap(onPick: (lat: number, lng: number) => void) {
  const element = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  useEffect(() => {
    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) return
    let active = true
    loadLibrary('maps').then(({ Map }) => {
      if (!active || !element.current) return
      const instance = new Map(element.current, { center: { lat: 28.574, lng: 77.323 }, zoom: 14, mapTypeControl: false, streetViewControl: false, fullscreenControl: false, clickableIcons: false, gestureHandling: 'greedy', mapId: 'socialit-map' })
      instance.addListener('click', (event: google.maps.MapMouseEvent) => { if (event.latLng) onPick(event.latLng.lat(), event.latLng.lng()) })
      setMap(instance); setReady(true)
    }).catch(() => setReady(false))
    return () => { active = false }
  }, [])
  return { element, ready, map }
}
