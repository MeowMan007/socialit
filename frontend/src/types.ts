export type Thread = {
  id: string
  title: string
  body: string
  author: string
  community: string
  score: number
  comments: number
  time: string
  category: 'Food' | 'Local life' | 'Question' | 'Events'
  lat: number
  lng: number
  place: string
}
