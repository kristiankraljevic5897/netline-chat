import { useState, useRef, useEffect } from 'react'

const ASCII_ART =
` ____    _    ____  _  ____  __  ___  ____  _____ 
|  _ \\  / \\  |  _ \\| |/ /  \\/  |/ _ \\|  _ \\| ____|
| | | |/ _ \\ | |_) | ' /| |\\/| | | | | | | |  _|  
| |_| / ___ \\|  _ <| . \\| |  | | |_| | |_| | |___ 
|____/_/   \\_\\_| \\_\\_|\\_\\_|  |_|\\___/|____/|_____|`

const BOOT_LINES = [
  { cls: 'dim', text: '$ netline --connect ghost_09' },
  { cls: 'ok', text: '[ok] handshake accepted' },
  { cls: 'ok', text: '[ok] AES-256 keys exchanged' },
  { cls: 'dim', text: '[....] mounting relay ch.7' },
  { cls: 'ok', text: '[ok] relay online' },
  { cls: '', text: '> Welcome DarkMode Team' },
]

const REPLIES = [
  "signal's clean on my end. go ahead.",
  'that checks out. rerouting through node 7 now.',
  "careful — this line isn't as private as it looks.",
  'copy that. give me a second to pull the logs.',
  'interesting. the corp servers went quiet right after you said that.',
  'noted. anything else before I go dark?',
]

function TerminalBubble({ count }) {
  return (
    <div className="bubble">
      <pre className="ascii">{ASCII_ART}</pre>
      {BOOT_LINES.slice(0, count).map((l, i) => (
        <div key={i} className={l.cls || undefined}>
          {l.text}
          {i === count - 1 && count < BOOT_LINES.length && <span className="cursor" />}
        </div>
      ))}
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

  function send() {
    const text = draft.trim()
    if (!text) return
    const id = Date.now()
    setMessages((m) => [...m, { id, from: 'me', who: 'YOU', text }])
    setDraft('')
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      const reply = REPLIES[Math.floor(Math.random() * REPLIES.length)]
      setMessages((m) => [...m, { id: id + 1, from: 'them', who: 'GHOST_09', text: reply }])
    }, 700 + Math.random() * 900)
  }

  return (
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
  )
}
