import { Loader } from '@googlemaps/js-api-loader'

const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const loader = key ? new Loader({ apiKey: key, version: 'weekly' }) : null

export function loadLibrary(name: 'maps'): Promise<google.maps.MapsLibrary>
export function loadLibrary(name: 'places'): Promise<google.maps.PlacesLibrary>
export function loadLibrary(name: 'marker'): Promise<google.maps.MarkerLibrary>
export function loadLibrary(name: 'maps' | 'places' | 'marker') {
  if (!loader) return Promise.reject(new Error('Google Maps browser key is not configured'))
  return loader.importLibrary(name)
}
