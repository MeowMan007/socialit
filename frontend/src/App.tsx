import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Bookmark, Check, ChevronDown, Compass, Flame, Heart, Home, MapPin, MessageCircle, MessageSquarePlus, MoreHorizontal, Navigation, Plus, Search, Send, Settings2, Users, X } from 'lucide-react'
import MapPanel from './components/MapPanel'
import ThreadCard from './components/ThreadCard'
import { usePlaceSearch } from './hooks/usePlaceSearch'
import { threads as sampleThreads } from './data/threads'
import { createRemoteThread } from './services/threads'
import type { Thread } from './types'

type View = 'map' | 'feed' | 'friends' | 'messages' | 'saved' | 'trending'
type Pin = { lat: number; lng: number; place: string; id?: string }
type ChatMessage = { id: string; text: string; time: string; mine: boolean }
const friends = [
  { id: 'maya', name: 'Maya Kapoor', initials: 'MK', color: 'coral', status: 'At Blue Tokai', place: 'Sector 18, Noida', lat: 28.5708, lng: 77.3261, seen: 'now' },
  { id: 'arjun', name: 'Arjun Mehta', initials: 'AM', color: 'blue', status: 'On the move', place: 'Botanical Garden', lat: 28.5652, lng: 77.3298, seen: '4 min ago' },
  { id: 'zoya', name: 'Zoya Khan', initials: 'ZK', color: 'lilac', status: 'At home', place: 'Sector 16, Noida', lat: 28.5785, lng: 77.3177, seen: '12 min ago' },
  { id: 'dev', name: 'Dev Sharma', initials: 'DS', color: 'gold', status: 'Exploring', place: 'Atta Market', lat: 28.5729, lng: 77.3218, seen: 'now' },
]
const initialChats: Record<string, ChatMessage[]> = {
  maya: [{ id: 'm1', text: 'Coffee at the new place?', time: '10:42', mine: false }, { id: 'm2', text: 'On my way ☕', time: '10:44', mine: true }],
  arjun: [{ id: 'a1', text: 'Found a great walking route by the garden', time: 'Yesterday', mine: false }],
  zoya: [{ id: 'z1', text: 'Did you see the thread about Sector 16?', time: 'Yesterday', mine: false }],
  dev: [{ id: 'd1', text: 'Let’s check out the market this weekend', time: 'Mon', mine: false }],
}
function readThreads(): Thread[] {
  try { const saved = localStorage.getItem('socialit.threads'); if (saved) return [...JSON.parse(saved), ...sampleThreads] } catch { /* use sample feed */ }
  return sampleThreads
}
function readChats(): Record<string, ChatMessage[]> {
  try { const saved = localStorage.getItem('socialit.chats'); if (saved) return { ...initialChats, ...JSON.parse(saved) } } catch { /* use sample chats */ }
  return initialChats
}
function shortTime() { return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date()) }

export default function App() {
  const [view, setView] = useState<View>('map')
  const [panel, setPanel] = useState<View | 'compose'>('map')
  const [threads, setThreads] = useState<Thread[]>(readThreads)
  const [selected, setSelected] = useState('t1')
  const [sort, setSort] = useState('Nearby')
  const [location, setLocation] = useState('Noida, Uttar Pradesh')
  const [query, setQuery] = useState('')
  const [picking, setPicking] = useState(false)
  const [pin, setPin] = useState<Pin | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState<Thread['category']>('Question')
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>(readChats)
  const [activeFriend, setActiveFriend] = useState('maya')
  const [message, setMessage] = useState('')
  const [toast, setToast] = useState('')
  const { input, enabled, suggestions, selectPrediction } = usePlaceSearch((place) => {
    const point = place.location
    if (!point) return
    const placeName = place.name || place.address || 'Pinned place'
    setLocation(placeName)
    setPin({ lat: point.lat(), lng: point.lng(), place: placeName, id: place.id })
    document.dispatchEvent(new CustomEvent('socialit:place', { detail: { lat: point.lat(), lng: point.lng(), placeId: place.id } }))
    setPicking(false)
    setView('feed'); setPanel('feed')
  })
  useEffect(() => { localStorage.setItem('socialit.threads', JSON.stringify(threads.filter((thread) => !sampleThreads.some((sample) => sample.id === thread.id)))) }, [threads])
  useEffect(() => { localStorage.setItem('socialit.chats', JSON.stringify(chats)) }, [chats])
  const visible = useMemo(() => {
    let items = threads.filter((thread) => `${thread.title} ${thread.body} ${thread.place} ${thread.community}`.toLowerCase().includes(query.toLowerCase()))
    if (sort === 'New') items = [...items].reverse()
    if (sort === 'Top') items = [...items].sort((a, b) => b.score - a.score)
    if (sort === 'Discussed') items = [...items].sort((a, b) => b.comments - a.comments)
    return items
  }, [threads, sort, query])
  const onPin = useCallback((lat: number, lng: number, place = 'Pinned map location') => { setPin({ lat, lng, place }); setPicking(false); setToast('Pin added to your discussion'); window.setTimeout(() => setToast(''), 2400) }, [])
  const selectThread = useCallback((id: string) => { setSelected(id); setPanel('feed') }, [])
  function startCompose() { setPin(null); setTitle(''); setBody(''); setPicking(true); setPanel('compose'); setView('map') }
  async function submitThread(event: FormEvent) {
    event.preventDefault()
    if (!pin) { setPicking(true); setToast('Tap the map to place your discussion pin'); window.setTimeout(() => setToast(''), 2500); return }
    let newThread: Thread = { id: `local-${Date.now()}`, title: title.trim(), body: body.trim(), author: 'you', community: pin.place, score: 1, comments: 0, time: 'just now', category, lat: pin.lat, lng: pin.lng, place: pin.place }
    try {
      const saved = await createRemoteThread({ title: newThread.title, body: newThread.body, latitude: pin.lat, longitude: pin.lng, place_id: pin.id, city: 'Noida' })
      newThread = { ...newThread, id: saved.id, score: saved.score, comments: saved.comment_count }
    } catch { /* keep the discussion in browser storage while the API or database is unavailable */ }
    setThreads((current) => [newThread, ...current]); setSelected(newThread.id); setPanel('feed'); setPicking(false); setToast('Discussion posted at your pin'); window.setTimeout(() => setToast(''), 2500)
  }
  function sendMessage(event: FormEvent) {
    event.preventDefault(); const text = message.trim(); if (!text) return
    setChats((current) => ({ ...current, [activeFriend]: [...(current[activeFriend] || []), { id: `msg-${Date.now()}`, text, time: shortTime(), mine: true }] }))
    setMessage('')
  }
  function nav(next: View) { if (panel === 'compose' || next !== 'map') { setPicking(false); if (panel === 'compose') setPin(null) } setView(next); setPanel(next) }
  function closePanel() { if (panel === 'compose') { setPicking(false); setPin(null) } setPanel('map'); setView('map') }
  const panelOpen = panel !== 'map'
  const activeFriendData = friends.find((friend) => friend.id === activeFriend) || friends[0]

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => { setView('map'); setPanel('map') }} aria-label="Socialit map home"><span className="brand-icon"><MapPin size={18} fill="currentColor"/></span><span>socialit<span className="brand-period">.</span></span></button>
      <div className="location-pill"><MapPin size={15}/><span>{location}</span><ChevronDown size={14}/></div>
      <div className="search-wrap"><label className="search-box"><Search size={16}/><input ref={input} placeholder={enabled ? 'Search a place or neighborhood' : 'Search discussions'} onChange={(event) => { setQuery(event.target.value); if (enabled) setQuery('') }}/></label>{suggestions.length > 0 && <div className="place-suggestions">{suggestions.map((prediction) => <button key={prediction.placeId} onClick={() => void selectPrediction(prediction)}><MapPin size={14}/><span><b>{prediction.mainText?.text || prediction.text.text}</b><small>{prediction.secondaryText?.text}</small></span></button>)}</div>}</div>
      <button className="top-create" onClick={startCompose}><Plus size={16}/> <span>Post on map</span></button>
      <button className="profile-button" aria-label="Your profile">J</button>
    </header>
    <main className="map-workspace">
      <MapPanel threads={threads} selected={selected} onSelect={selectThread} onPickLocation={onPin} picking={picking} draftPin={pin} friendPins={friends}/>
      <aside className="left-rail" aria-label="Main navigation">
        <button className={`rail-icon ${view === 'map' ? 'active' : ''}`} onClick={() => nav('map')} aria-label="Map"><Compass/><span>Map</span></button>
        <button className={`rail-icon ${view === 'friends' ? 'active' : ''}`} onClick={() => nav('friends')} aria-label="Friends"><Users/><span>Friends</span><i className="online-count">4</i></button>
        <button className={`rail-icon ${view === 'messages' ? 'active' : ''}`} onClick={() => nav('messages')} aria-label="Messages"><MessageCircle/><span>Chats</span></button>
        <div className="rail-rule"/>
        <button className={`rail-icon ${view === 'saved' ? 'active' : ''}`} onClick={() => nav('saved')} aria-label="Saved"><Bookmark/><span>Saved</span></button>
        <button className={`rail-icon ${view === 'trending' ? 'active' : ''}`} onClick={() => nav('trending')} aria-label="Trending"><Flame/><span>Trending</span></button>
      </aside>
      <section className={`side-panel ${panelOpen ? 'panel-open' : ''} ${panel === 'compose' ? 'compose-panel' : ''}`}>
        <div className="panel-top"><div><span className="panel-kicker">{panel === 'compose' ? 'NEW ON THE MAP' : panel === 'friends' ? 'YOUR PEOPLE' : panel === 'messages' ? 'PRIVATE CONVERSATIONS' : panel === 'saved' ? 'YOUR COLLECTION' : panel === 'trending' ? 'AROUND YOUR CITY' : 'NOIDA · 2 KM'}</span><h1>{panel === 'compose' ? 'Start a thread' : panel === 'friends' ? 'Friends' : panel === 'messages' ? 'Messages' : panel === 'saved' ? 'Saved places & posts' : panel === 'trending' ? 'Trending nearby' : 'Happening nearby'}<span>.</span></h1></div><button className="panel-close" aria-label="Close panel" onClick={closePanel}><X size={18}/></button></div>
        {panel === 'compose' ? <form className="compose-form" onSubmit={submitThread}>
          <div className="pin-instruction"><div className={`pin-status ${pin ? 'pinned' : ''}`}>{pin ? <Check size={17}/> : <MapPin size={17}/>}</div><div><b>{pin ? 'Location pinned' : 'Choose where this is happening'}</b><span>{pin ? `${pin.place} · ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}` : 'Tap anywhere on the map to drop your pin.'}</span></div></div>
          <button className={`choose-pin ${picking ? 'choosing' : ''}`} type="button" onClick={() => setPicking((value) => !value)}><MapPin size={15}/>{picking ? 'Tap a spot on the map…' : pin ? 'Move pin on map' : 'Choose pin on map'}</button>
          <label className="field-label">THREAD TITLE<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} placeholder="What’s happening here?" required/></label>
          <label className="field-label">ADD SOME CONTEXT<textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={4000} rows={5} placeholder="Give your neighbors the details…"/></label>
          <label className="field-label">TOPIC<select value={category} onChange={(event) => setCategory(event.target.value as Thread['category'])}><option>Question</option><option>Food</option><option>Local life</option><option>Events</option></select></label>
          <div className="coordinate-note"><Navigation size={14}/><span>Your pin coordinates are attached to this thread.</span></div>
          <button className="submit-thread" disabled={!title.trim()} type="submit"><MessageSquarePlus size={16}/> Post to this location</button>
          <p className="local-mode-note">Prototype posts are saved in this browser.</p>
        </form> : panel === 'friends' ? <div className="friends-content">
          <div className="friend-summary"><span className="online-pulse"/> <b>4 friends sharing with you</b><button aria-label="Friend settings"><Settings2 size={16}/></button></div>
          <h2>On the map <span>LIVE</span></h2>
          <div className="friend-list">{friends.map((friend) => <article className="friend-card" key={friend.id}><button className={`friend-avatar ${friend.color}`} onClick={() => { onPin(friend.lat, friend.lng, friend.place); setView('map'); setPanel('map') }} aria-label={`Show ${friend.name} on map`}>{friend.initials}<i/></button><div className="friend-info"><b>{friend.name}</b><span>{friend.status}</span><small><MapPin size={11}/>{friend.place} · {friend.seen}</small></div><button className="friend-message" onClick={() => { setActiveFriend(friend.id); setView('messages'); setPanel('messages') }} aria-label={`Message ${friend.name}`}><MessageCircle size={17}/></button></article>)}</div>
          <div className="share-location-card"><div className="share-icon"><Heart size={16}/></div><div><b>Your location is yours to share</b><span>Friend locations here are sample data for this prototype.</span></div></div>
          <button className="invite-button"><Plus size={15}/> Invite friends</button>
        </div> : panel === 'messages' ? <div className="messages-layout">
          <div className="conversation-list"><div className="inbox-label">RECENT</div>{friends.map((friend) => { const messages = chats[friend.id] || []; const recent = messages[messages.length - 1]; return <button key={friend.id} onClick={() => setActiveFriend(friend.id)} className={`conversation-row ${activeFriend === friend.id ? 'selected' : ''}`}><span className={`friend-avatar small ${friend.color}`}>{friend.initials}<i/></span><span className="conversation-copy"><b>{friend.name}</b><small>{recent?.text || 'Say hello'}</small></span><span className="conversation-time">{recent?.time || ''}</span></button> })}</div>
          <div className="chat-window"><div className="chat-head"><span className={`friend-avatar small ${activeFriendData.color}`}>{activeFriendData.initials}<i/></span><div><b>{activeFriendData.name}</b><small><span className="online-pulse"/> {activeFriendData.place}</small></div><button aria-label="Show friend on map" onClick={() => { onPin(activeFriendData.lat, activeFriendData.lng, activeFriendData.place); setView('map'); setPanel('map') }}><MapPin size={16}/></button></div>
            <div className="chat-context"><MapPin size={13}/><span>Both nearby in Noida</span><button onClick={() => { setLocation(activeFriendData.place); setView('map'); setPanel('map') }}>View map</button></div>
            <div className="message-list">{(chats[activeFriend] || []).map((item) => <div key={item.id} className={`message-bubble ${item.mine ? 'mine' : ''}`}><p>{item.text}</p><time>{item.time}</time></div>)}<div className="chat-encryption">Messages are saved on this device in this prototype.</div></div>
            <form className="message-compose" onSubmit={sendMessage}><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder={`Message ${activeFriendData.name.split(' ')[0]}`} aria-label="Message"/><button disabled={!message.trim()} aria-label="Send message"><Send size={17}/></button></form>
          </div>
        </div> : <>
          {panel === 'feed' || panel === 'trending' ? <><div className="feed-tabs">{['Nearby', 'New', 'Top', 'Discussed'].map((item) => <button key={item} className={sort === item ? 'selected' : ''} onClick={() => setSort(item)}>{item}</button>)}</div><div className="feed-context"><MapPin size={15}/><div><b>Near Sector 18, Noida</b><span>{visible.length} local conversations</span></div><button aria-label="Feed settings"><Settings2 size={16}/></button></div><div className="thread-list">{visible.map((thread) => <ThreadCard key={thread.id} thread={thread} active={selected === thread.id} onClick={() => { setSelected(thread.id); document.dispatchEvent(new CustomEvent('socialit:thread', { detail: { lat: thread.lat, lng: thread.lng } })) }}/>)}</div><button className="start-thread-inline" onClick={startCompose}><Plus size={15}/> Start a discussion at a pin</button></> : panel === 'saved' ? <div className="empty-collection"><Bookmark size={26}/><b>Keep good spots close</b><span>Save a conversation and it will show up here.</span><button onClick={() => setPanel('feed')}>Explore discussions</button></div> : null}
        </>}
      </section>
      {panel === 'map' && <button className="open-feed-chip" onClick={() => setPanel('feed')}><MessageCircle size={15}/> {threads.length} conversations nearby <ChevronDown size={14}/></button>}
      {toast && <div className="toast"><Check size={15}/>{toast}</div>}
      {picking && <div className="pick-banner"><MapPin size={16}/> Tap the map to place your thread <button onClick={() => setPicking(false)} aria-label="Stop choosing pin"><X size={14}/></button></div>}
    </main>
    <nav className="mobile-nav" aria-label="Mobile navigation"><button className={view === 'map' ? 'active' : ''} onClick={() => nav('map')}><MapPin size={19}/><span>Map</span></button><button className={view === 'friends' ? 'active' : ''} onClick={() => nav('friends')}><Users size={19}/><span>Friends</span></button><button className="mobile-create" onClick={startCompose} aria-label="Post on map"><Plus size={22}/></button><button className={view === 'messages' ? 'active' : ''} onClick={() => nav('messages')}><MessageCircle size={19}/><span>Chats</span></button><button className={view === 'trending' ? 'active' : ''} onClick={() => nav('trending')}><Flame size={19}/><span>Local</span></button></nav>
  </div>
}
