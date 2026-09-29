const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'

export async function createRemoteThread(input: {
  title: string
  body: string
  latitude: number
  longitude: number
  place_id?: string
  city?: string
}) {
  const response = await fetch(`${baseUrl}/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) throw new Error(`Thread API returned ${response.status}`)
  return response.json() as Promise<{ id: string; title: string; body: string; latitude: number; longitude: number; place_id?: string | null; city?: string | null; score: number; comment_count: number }>
}
