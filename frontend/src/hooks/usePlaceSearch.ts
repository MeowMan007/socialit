import { useEffect, useRef, useState } from 'react'
import { loadLibrary } from '../lib/maps'

export type PlaceSelection = { id?: string; name?: string; address?: string; location?: google.maps.LatLng | null }

export function usePlaceSearch(onSelect: (place: PlaceSelection) => void) {
  const input = useRef<HTMLInputElement>(null)
  const session = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [suggestions, setSuggestions] = useState<google.maps.places.PlacePrediction[]>([])

  useEffect(() => {
    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) return
    let active = true
    let timer: ReturnType<typeof setTimeout>
    let requestId = 0
    const handler = async () => {
      const value = input.current?.value.trim() ?? ''
      if (value.length < 3) { setSuggestions([]); session.current = null; return }
      if (!session.current) {
        const { AutocompleteSessionToken } = await loadLibrary('places')
        if (!active) return
        session.current = new AutocompleteSessionToken()
      }
      const currentRequest = ++requestId
      try {
        const { AutocompleteSuggestion } = await loadLibrary('places')
        const result = await AutocompleteSuggestion.fetchAutocompleteSuggestions({ input: value, sessionToken: session.current })
        if (active && currentRequest === requestId) setSuggestions(result.suggestions.flatMap((item) => item.placePrediction ? [item.placePrediction] : []))
      } catch { if (active) setSuggestions([]) }
    }
    const schedule = () => { clearTimeout(timer); timer = setTimeout(() => void handler(), 280) }
    input.current?.addEventListener('input', schedule)
    setEnabled(true)
    return () => { active = false; clearTimeout(timer); input.current?.removeEventListener('input', schedule) }
  }, [])

  async function selectPrediction(prediction: google.maps.places.PlacePrediction) {
    const place = prediction.toPlace()
    try {
      await place.fetchFields({ fields: ['id', 'displayName', 'formattedAddress', 'location'] })
      onSelect({ id: place.id || undefined, name: place.displayName || undefined, address: place.formattedAddress || undefined, location: place.location })
      setSuggestions([])
      session.current = null
    } catch { setSuggestions([]) }
  }

  return { input, enabled, suggestions, selectPrediction }
}
