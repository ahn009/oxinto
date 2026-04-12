'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as api from '@/lib/api';
import type { User, Product, Bundle, Offers, BotResponse as BotData } from '@/lib/api';
import Header from '@/components/Header';

type Message =
  | { type: 'text'; role: 'bot' | 'user'; text: string }
  | { type: 'offers'; offers: Offers }
  | { type: 'quickReplies'; options: string[] };

function getCategoryEmoji(tags?: string[]) {
  if (!tags) return '🎧';
  const t = tags.join(' ').toLowerCase();
  if (t.includes('kid') || t.includes('child')) return '🧒';
  if (t.includes('sport')) return '🏃';
  if (t.includes('studio') || t.includes('professional')) return '🎙️';
  if (t.includes('wireless') || t.includes('bluetooth')) return '🎵';
  return '🎧';
}

// ── Tiny AI sparkle icon ──────────────────────────────────────────────────
const AIIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z" fill="#818cf8"/>
    <path d="M19 16L19.9 18.1L22 19L19.9 19.9L19 22L18.1 19.9L16 19L18.1 18.1L19 16Z" fill="#a5b4fc" opacity="0.7"/>
  </svg>
);

// ── Send icon ─────────────────────────────────────────────────────────────
const SendIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Main Component ────────────────────────────────────────────────────────
export default function ChatPage() {
  const router = useRouter();
  const [user, setUser]               = useState<User | null>(null);
  const [token, setToken]             = useState<string | null>(null);
  const [lang, setLangState]          = useState('en');
  const [authChecked, setAuthChecked] = useState(false);
  const [messages, setMessages]       = useState<Message[]>([]);
  const [inputVal, setInputVal]       = useState('');
  const [isTyping, setIsTyping]       = useState(false);
  const [sendDisabled, setSendDisabled] = useState(false);
  const [sessionId, setSessionId]     = useState<string | null>(null);
  const [isComplete, setIsComplete]   = useState(false);
  const [progress, setProgress]       = useState<{ step: number; total: number } | null>(null);
  const [toast, setToast]             = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const userIdRef = useRef<string>('');

  // ── Auth init ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const t   = localStorage.getItem('smart_token');
    const u   = localStorage.getItem('smart_user');
    const sid = localStorage.getItem('smart_session_id');
    const l   = localStorage.getItem('smart_lang') || 'en';
    setLangState(l);
    if (t && u) {
      api.getMe()
        .then(me => {
          setToken(t); setUser(me);
          userIdRef.current = 'user_' + me.id;
          localStorage.setItem('smart_user', JSON.stringify(me));
          setAuthChecked(true);
          startSession(t, 'user_' + me.id, sid, l);
        })
        .catch(() => {
          localStorage.removeItem('smart_token');
          localStorage.removeItem('smart_user');
          localStorage.removeItem('smart_session_id');
          router.replace('/home');
        });
    } else {
      router.replace('/home');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  function checkScrollFab() {
    const el = scrollAreaRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 180);
  }

  // ── Auto-scroll on new content ────────────────────────────────────────
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  function showToast(msg: string) {
    setToast(msg); setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2600);
  }

  function setLang(l: string) {
    setLangState(l);
    if (typeof window !== 'undefined') localStorage.setItem('smart_lang', l);
  }

  async function sendToApi(msg: string, _t: string | null, uid: string, sid: string | null, l: string): Promise<BotData> {
    return api.sendWebMessage(uid, msg, l, sid);
  }

  async function startSession(tkn: string | null, uid: string, sid: string | null, l: string) {
    setSendDisabled(true); setIsTyping(true);
    try {
      const data = await sendToApi('start', tkn, uid, sid, l);
      setIsTyping(false);
      applyBotData(data, l);
    } catch {
      setIsTyping(false);
      addMsg({ type: 'text', role: 'bot', text: 'Unable to connect. Please refresh the page.' });
    } finally { setSendDisabled(false); inputRef.current?.focus(); }
  }

  function applyBotData(data: BotData, l: string) {
    if (typeof window !== 'undefined') localStorage.setItem('smart_session_id', data.sessionId);
    setSessionId(data.sessionId); setIsComplete(data.isComplete);
    if (data.isComplete && data.offers) {
      setProgress({ step: data.totalQuestions + 1, total: data.totalQuestions });
      addMsg({ type: 'offers', offers: data.offers });
      addMsg({ type: 'text', role: 'bot', text: l === 'pt' ? 'Gostou das recomendações? Clique em ↺ para recomeçar.' : 'Tap ↺ below to start a new session anytime.' });
    } else {
      setProgress({ step: data.questionNumber, total: data.totalQuestions });
      const text = (data.response || '').trim();
      text.split('\n\n').filter(Boolean).forEach(p => addMsg({ type: 'text', role: 'bot', text: p.trim() }));
      if (data.question?.options) {
        const opts = data.question.options[l as 'en' | 'pt'] || data.question.options.en;
        if (opts) setTimeout(() => addMsg({ type: 'quickReplies', options: opts }), 100);
      }
    }
  }

  function addMsg(m: Message) {
    setMessages(prev => [...prev.filter(x => x.type !== 'quickReplies'), m]);
  }

  const sendRaw = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setSendDisabled(true);
    setMessages(prev => [...prev.filter(x => x.type !== 'quickReplies'), { type: 'text', role: 'user', text }]);
    setIsTyping(true);
    try {
      const data = await sendToApi(text, token, userIdRef.current, sessionId, lang);
      setIsTyping(false);
      applyBotData(data, lang);
    } catch (err: any) {
      setIsTyping(false);
      if (err.message?.includes('401') || err.message?.includes('Authentication')) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('smart_token');
          localStorage.removeItem('smart_user');
        }
        router.replace('/home');
      } else {
        addMsg({ type: 'text', role: 'bot', text: 'Connection error. Please try again.' });
      }
    } finally { setSendDisabled(false); inputRef.current?.focus(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, sessionId, lang]);

  async function sendMessage() {
    const text = inputVal.trim();
    if (!text) return;
    setInputVal('');
    if (inputRef.current) { inputRef.current.style.height = 'auto'; }
    await sendRaw(text);
  }

  async function resetSession() {
    if (typeof window !== 'undefined') localStorage.removeItem('smart_session_id');
    setSessionId(null); setIsComplete(false); setMessages([]); setProgress(null);
    showToast(lang === 'pt' ? 'Sessão reiniciada' : 'Session reset');
    await sendRaw('reset');
  }

  async function handleLogout() {
    try { await api.logout(); } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('smart_token');
      localStorage.removeItem('smart_user');
      localStorage.removeItem('smart_session_id');
    }
    router.replace('/home');
  }

  if (!authChecked || !user) return null;

  const progressPct = progress
    ? progress.total > 0 && progress.step <= progress.total
      ? Math.round(((progress.step - 1) / progress.total) * 100)
      : 100
    : 0;

  return (
    /* ── Full-viewport flex column ── */
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>

      {/* Atmosphere */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.07) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* ── Header (shrink: 0) ── */}
      <div style={{ flexShrink: 0, zIndex: 10, position: 'relative' }}>
        <Header user={user} lang={lang} onLogout={handleLogout} onLangChange={setLang} />
        {progress && (
          <div style={{ height: 2, background: 'rgba(255,255,255,0.05)' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: progressPct === 100 ? 'linear-gradient(90deg,var(--accent),#34d399)' : 'linear-gradient(90deg,var(--primary),#a78bfa)', transition: 'width 0.7s cubic-bezier(.4,0,.2,1)' }} />
          </div>
        )}
      </div>

      {/* ── Scrollable chat column (flex: 1) ── */}
      <div
        id="chat-scroll"
        ref={scrollAreaRef}
        onScroll={checkScrollFab}
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative', zIndex: 1 }}
      >
        <main style={{ maxWidth: 760, margin: '0 auto', padding: '2.5rem 1.5rem 2rem' }}>

        {/* Empty / loading state */}
        {messages.length === 0 && !isTyping && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '28vh', gap: '1rem', opacity: 0.28, userSelect: 'none', pointerEvents: 'none' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AIIcon />
            </div>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {lang === 'pt' ? 'Iniciando sessão…' : 'Starting your session…'}
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, idx) => {

          /* ── User message ─────────────────────────────────────── */
          if (msg.type === 'text' && msg.role === 'user') {
            return (
              <div key={idx} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.75rem', animation: 'fadeUp 0.3s ease' }}>
                <div style={{
                  maxWidth: '72%',
                  background: 'rgba(99,102,241,0.13)',
                  border: '1px solid rgba(99,102,241,0.18)',
                  borderRadius: '18px 18px 4px 18px',
                  padding: '0.75rem 1.1rem',
                  fontSize: '0.95rem',
                  lineHeight: 1.65,
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {msg.text}
                </div>
              </div>
            );
          }

          /* ── Bot message ──────────────────────────────────────── */
          if (msg.type === 'text' && msg.role === 'bot') {
            return (
              <div key={idx} style={{ display: 'flex', gap: '0.85rem', marginBottom: '1.75rem', alignItems: 'flex-start', animation: 'fadeUp 0.3s ease' }}>
                {/* AI avatar */}
                <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, marginTop: 2, background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AIIcon />
                </div>
                {/* Plain prose — no background box */}
                <div style={{ flex: 1, fontSize: '0.95rem', lineHeight: 1.75, color: 'var(--text-primary)', paddingTop: '0.3rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {msg.text}
                </div>
              </div>
            );
          }

          /* ── Quick replies ────────────────────────────────────── */
          if (msg.type === 'quickReplies') {
            return (
              <div key={idx} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.75rem', paddingLeft: '3.1rem', animation: 'fadeUp 0.3s ease' }}>
                {msg.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => { setMessages(prev => prev.filter(m => m.type !== 'quickReplies')); sendRaw(String(i + 1)); }}
                    style={{ padding: '0.5rem 1rem', borderRadius: 99, fontSize: '0.84rem', fontWeight: 500, border: '1px solid rgba(99,102,241,0.25)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', letterSpacing: '0.01em' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; e.currentTarget.style.color = 'var(--primary-l)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            );
          }

          /* ── Product recommendations ──────────────────────────── */
          if (msg.type === 'offers') {
            return (
              <div key={idx} style={{ display: 'flex', gap: '0.85rem', marginBottom: '1.75rem', alignItems: 'flex-start', animation: 'fadeUp 0.3s ease' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, marginTop: 2, background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AIIcon />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.95rem', lineHeight: 1.75, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
                    {lang === 'pt' ? 'Aqui estão suas recomendações personalizadas:' : 'Here are your personalised recommendations:'}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {msg.offers.basic && msg.offers.basic.length > 0 && (
                      <TierCard tier="basic" label={lang === 'pt' ? 'Básico' : 'Basic'} products={msg.offers.basic} bundle={null} />
                    )}
                    {msg.offers.intermediate && msg.offers.intermediate.length > 0 && (
                      <TierCard tier="mid" label={lang === 'pt' ? 'Intermediário' : 'Intermediate'} products={msg.offers.intermediate} bundle={null} />
                    )}
                    {msg.offers.premium && (
                      <TierCard tier="premium" label={lang === 'pt' ? 'Premium' : 'Premium'} products={[msg.offers.premium.product]} bundle={msg.offers.premium.bundle || null} lang={lang} />
                    )}
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}

        {/* ── Typing indicator ── */}
        {isTyping && (
          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', marginBottom: '1.75rem', animation: 'fadeUp 0.2s ease' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, marginTop: 2, background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AIIcon />
            </div>
            <div style={{ paddingTop: '0.55rem', display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--text-muted)', animation: `pulse-dot 1.2s ${i * 0.22}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} style={{ height: 1 }} />
        </main>
      </div>{/* end scroll area */}

      {/* ── Input bar (shrink: 0) — sits at the bottom of the flex column ── */}
      <div style={{ flexShrink: 0, zIndex: 10, background: 'var(--bg-base)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '0.85rem 1.5rem 1rem', position: 'relative' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: '0.5rem',
            background: 'var(--bg-elevated)',
            border: `1px solid ${inputFocused ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.09)'}`,
            borderRadius: 16, padding: '0.6rem 0.6rem 0.6rem 1.1rem',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxShadow: inputFocused ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
          }}>
            <textarea
              ref={inputRef}
              rows={1}
              placeholder={lang === 'pt' ? 'Envie uma mensagem…' : 'Send a message…'}
              value={inputVal}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onChange={e => {
                setInputVal(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.95rem', lineHeight: 1.6, minHeight: 28, maxHeight: 140, padding: 0 }}
            />
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', paddingBottom: 2, flexShrink: 0 }}>
              <button
                onClick={resetSession}
                title={lang === 'pt' ? 'Reiniciar' : 'Reset session'}
                style={{ width: 34, height: 34, borderRadius: 9, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >↺</button>
              <button
                onClick={sendMessage}
                disabled={sendDisabled || !inputVal.trim()}
                title="Send"
                style={{ width: 34, height: 34, borderRadius: 9, background: (sendDisabled || !inputVal.trim()) ? 'rgba(99,102,241,0.15)' : 'var(--primary)', border: 'none', cursor: (sendDisabled || !inputVal.trim()) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: (sendDisabled || !inputVal.trim()) ? 0.45 : 1, transition: 'all 0.15s', boxShadow: (!sendDisabled && inputVal.trim()) ? '0 2px 12px rgba(99,102,241,0.4)' : 'none' }}
                onMouseEnter={e => { if (!sendDisabled && inputVal.trim()) { e.currentTarget.style.background = '#5254cc'; e.currentTarget.style.transform = 'scale(1.05)'; } }}
                onMouseLeave={e => { e.currentTarget.style.background = (!sendDisabled && inputVal.trim()) ? 'var(--primary)' : 'rgba(99,102,241,0.15)'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <SendIcon />
              </button>
            </div>
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.67rem', color: 'var(--text-muted)', marginTop: '0.5rem', opacity: 0.5 }}>
            OPTIXO can make mistakes. Verify important product details before purchasing.
          </p>
        </div>
      </div>

      {/* ── Scroll-to-bottom FAB (inside the outer div, positioned absolute) ── */}
      {showScrollBtn && (
        <button
          onClick={() => {
            const el = scrollAreaRef.current;
            if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
          }}
          style={{ position: 'absolute', bottom: '6.5rem', right: '1.5rem', zIndex: 20, width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.88rem', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', transition: 'all 0.15s', animation: 'fadeUp 0.2s ease' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.color = 'var(--primary-l)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >↓</button>
      )}

      {/* ── Toast ── */}
      <div style={{ position: 'absolute', bottom: toastVisible ? '5rem' : '-5rem', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 99, padding: '0.5rem 1.25rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', transition: 'bottom 0.3s cubic-bezier(.4,0,.2,1)', zIndex: 30, whiteSpace: 'nowrap' }}>
        {toast}
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        textarea::placeholder { color: var(--text-muted); }
        #chat-scroll::-webkit-scrollbar { width: 6px; }
        #chat-scroll::-webkit-scrollbar-track { background: transparent; }
        #chat-scroll::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.35); border-radius: 6px; }
        #chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.6); }
      `}</style>
    </div>
  );
}

// ── TierCard — clean card, no header chrome ────────────────────────────────
function TierCard({ tier, label, products, bundle, lang = 'en' }: {
  tier: string; label: string;
  products: Product[]; bundle: Bundle | null; lang?: string;
}) {
  const accent: Record<string, string> = {
    basic:   'var(--accent)',
    mid:     '#60a5fa',
    premium: 'var(--gold)',
  };
  const color = accent[tier] || accent.basic;

  return (
    <div style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', background: 'var(--bg-surface)', overflow: 'hidden' }}>
      {/* Thin tier label bar */}
      <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: color }}>{label}</span>
      </div>

      {/* Products */}
      <div style={{ padding: '0.5rem' }}>
        {products.map((p, i) => (
          <div
            key={i}
            style={{ display: 'flex', gap: '0.9rem', padding: '0.85rem', borderRadius: 10, alignItems: 'flex-start', transition: 'background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            {/* Category icon */}
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
              {getCategoryEmoji(p.tags)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.75rem', marginBottom: 3 }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{p.name}</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color, flexShrink: 0 }}>${p.price}</span>
              </div>
              {p.description && (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>{p.description}</p>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: 7 }}>
                {p.score && (
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--primary-l)', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 99, padding: '1px 8px' }}>{p.score}% match</span>
                )}
                {p.reason && (
                  <span style={{ fontSize: '0.73rem', color: 'var(--accent)', fontStyle: 'italic' }}>✓ {p.reason}</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Bundle */}
        {bundle && (
          <div style={{ margin: '0.25rem 0.5rem 0.5rem', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 10, padding: '0.75rem 0.9rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gold)', marginBottom: 4 }}>
              {lang === 'pt' ? '🎁 Pacote inclui:' : '🎁 Bundle includes:'}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.5 }}>
              {bundle.items.join(' · ')}
            </p>
            <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent)', margin: 0 }}>
              {lang === 'pt'
                ? `${bundle.discountPercent}% off — $${bundle.totalPrice} (economize $${bundle.savings})`
                : `${bundle.discountPercent}% off — $${bundle.totalPrice} (save $${bundle.savings})`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
