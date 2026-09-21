import { useState, useRef, useEffect } from 'react'
import MatrixRain from './MatrixRain.jsx'

const ASCII_ART =
` ____    _    ____  _  ____  __  ___  ____  _____ 
|  _ \\  / \\  |  _ \\| |/ /  \\/  |/ _ \\|  _ \\| ____|
| | | |/ _ \\ | |_) | ' /| |\\/| | | | | | | |  _|  
| |_| / ___ \\|  _ <| . \\| |  | | |_| | |_| | |___ 
|____/_/   \\_\\_| \\_\\_|\\_\\_|  |_|\\___/|____/|_____|`

const BOOT_LINES = [
  { cls: '', text: '> Welcome DarkMode Team' },
]

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/chat'

function TerminalBubble({ count }) {
  return (
    <div className="bubble">
      <pre className="ascii">{ASCII_ART}</pre>
        <div >
          "Welcome DarkMode Team"
          <span className="cursor" />
        </div>
    </div>
  )
}

function useAutoScroll(dep) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [dep])
  return ref
}

export default function App() {
  const [bootCount, setBootCount] = useState(0)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const logRef = useAutoScroll(messages.length + bootCount + (typing ? 1 : 0))

  useEffect(() => {
    if (bootCount >= BOOT_LINES.length) {
      if (bootCount === BOOT_LINES.length) {
        const t = setTimeout(() => {
          setMessages([{ id: 2, from: 'them', who: 'GHOST_09', text: "you made it. line's live. talk." }])
        }, 500)
        return () => clearTimeout(t)
      }
      return
    }
    const t = setTimeout(() => setBootCount((c) => c + 1), 380)
    return () => clearTimeout(t)
  }, [bootCount])

  async function send() {
    const text = draft.trim()
    if (!text) return
    const id = Date.now()
    const nextMessages = [...messages, { id, from: 'me', who: 'YOU', text }]
    setMessages(nextMessages)
    setDraft('')
    setTyping(true)

    const history = nextMessages
      .filter((m) => m.from === 'me' || m.from === 'them')
      .map((m) => ({ role: m.from === 'me' ? 'user' : 'assistant', content: m.text }))

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })
      if (!res.ok) throw new Error(`backend returned ${res.status}`)
      const data = await res.json()
      setTyping(false)
      setMessages((m) => [...m, { id: id + 1, from: 'them', who: 'GHOST_09', text: data.reply }])
    } catch (err) {
      setTyping(false)
      setMessages((m) => [
        ...m,
        { id: id + 1, from: 'them', who: 'GHOST_09', text: '[connection lost — check the backend and try again]' },
      ])
    }
  }

  return (
    <>
      <MatrixRain />
      <div className="app">
      <div className="head">
        <div className="brand">
          <span className="dot" />
          <div>
            <h1>NETLINE</h1>
            <small>ch. 7 · relay: uncertain</small>
          </div>
        </div>
        <div className="status">LINK ACTIVE</div>
      </div>

      <div className="log" ref={logRef}>
        {bootCount > 0 && (
          <div className="row sys">
            <TerminalBubble count={bootCount} />
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={'row ' + (m.from === 'me' ? 'me' : 'them')}>
            {m.who && <div className="who">{m.who}</div>}
            <div className="bubble">{m.text}</div>
          </div>
        ))}
        {typing && (
          <div className="row them">
            <div className="who">GHOST_09</div>
            <div className="bubble typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      <div className="inputbar">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send()
          }}
          placeholder="transmit message..."
          aria-label="Message"
        />
        <button onClick={send} disabled={!draft.trim()}>
          SEND
        </button>
      </div>
      </div>
    </>
  )
}
