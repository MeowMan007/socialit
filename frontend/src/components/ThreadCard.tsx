import { ArrowBigDown, ArrowBigUp, Bookmark, MessageCircle, MoreHorizontal, Share2 } from 'lucide-react'
import type { Thread } from '../types'

const palette: Record<Thread['category'], string> = { 'Local life': 'mint', Food: 'peach', Question: 'lavender', Events: 'yellow' }
export default function ThreadCard({ thread, active, onClick }: { thread: Thread; active: boolean; onClick: () => void }) {
  return <article className={`thread-card ${active ? 'thread-active' : ''}`} onClick={onClick}>
    <div className="thread-votes"><button aria-label="Upvote"><ArrowBigUp size={20}/></button><b>{thread.score}</b><button aria-label="Downvote"><ArrowBigDown size={20}/></button></div>
    <div className="thread-main"><div className="thread-meta"><span className="community-mark">s/</span><b>s/{thread.community.toLowerCase().replace(/ /g, '')}</b><span className="meta-dot">·</span><span>{thread.time}</span><button className="more-button" aria-label="More actions"><MoreHorizontal size={19}/></button></div>
      <h3>{thread.title}</h3><p>{thread.body}</p>
      <div className="thread-tags"><span className={`tag ${palette[thread.category]}`}>{thread.category}</span><span className="place-tag">⌖ {thread.place}{thread.author === 'you' ? ` · ${thread.lat.toFixed(5)}, ${thread.lng.toFixed(5)}` : ''}</span></div>
      <div className="thread-actions"><button><MessageCircle size={15}/>{thread.comments} comments</button><button><Share2 size={15}/>Share</button><button><Bookmark size={15}/>Save</button></div>
    </div>
  </article>
}
