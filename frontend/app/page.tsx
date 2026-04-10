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

// ── Helpers ────────────────────────────────────────────────────────────────
function getCategoryEmoji(tags?: string[]) {
  if (!tags) return '🎧';
  const t = tags.join(' ').toLowerCase();
  if (t.includes('kid') || t.includes('child')) return '🧒';
  if (t.includes('sport'))  return '🏃';
  if (t.includes('studio') || t.includes('professional')) return '🎙️';
  if (t.includes('wireless') || t.includes('bluetooth'))  return '🎵';
  return '🎧';
}

const SVG_AI = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z" fill="#818cf8"/>
    <path d="M19 16L19.9 18.1L22 19L19.9 19.9L19 22L18.1 19.9L16 19L18.1 18.1L19 16Z" fill="#a5b4fc" opacity="0.8"/>
    <path d="M5 3L5.7 5.3L8 6L5.7 6.7L5 9L4.3 6.7L2 6L4.3 5.3L5 3Z" fill="#c7d2fe" opacity="0.7"/>
  </svg>
);

const SVG_USER = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" fill="#06d6a0" opacity="0.9"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#06d6a0" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
  </svg>
);

// ── Component ──────────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const [user, setUser]    = useState<User | null>(null);
  const [token, setToken]  = useState<string | null>(null);
  const [lang, setLangState] = useState('en');
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
  const chatRef   = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const userIdRef = useRef<string>('');

  // ── Init from localStorage + verify token with backend ───────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const t = localStorage.getItem('smart_token');
    const u = localStorage.getItem('smart_user');
    const sid = localStorage.getItem('smart_session_id');
    const l = localStorage.getItem('smart_lang') || 'en';
    setLangState(l);
    if (t && u) {
      api.getMe()
        .then((me) => {
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
          router.replace('/login');
        });
    } else {
      router.replace('/login');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Toast ─────────────────────────────────────────────────────────────
  function showToast(msg: string) {
    setToast(msg); setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2800);
  }

  // ── Lang toggle ───────────────────────────────────────────────────────
  function setLang(l: string) {
    setLangState(l);
    if (typeof window !== 'undefined') localStorage.setItem('smart_lang', l);
  }

  // ── API ───────────────────────────────────────────────────────────────
  async function sendToApi(message: string, _tkn: string | null, uid: string, sid: string | null, l: string): Promise<BotData> {
    return api.sendWebMessage(uid, message, l, sid);
  }

  // ── Session start ────────────────────────────────────────────────────
  async function startSession(tkn: string | null, uid: string, sid: string | null, l: string) {
    setSendDisabled(true); setIsTyping(true);
    try {
      const data = await sendToApi('start', tkn, uid, sid, l);
      setIsTyping(false);
      applyBotData(data, l);
    } catch {
      setIsTyping(false);
      addMsg({ type:'text', role:'bot', text:'Unable to connect. Please refresh the page.' });
    } finally { setSendDisabled(false); inputRef.current?.focus(); }
  }

  // ── Apply bot data ────────────────────────────────────────────────────
  function applyBotData(data: BotData, l: string) {
    if (typeof window !== 'undefined') localStorage.setItem('smart_session_id', data.sessionId);
    setSessionId(data.sessionId); setIsComplete(data.isComplete);
    if (data.isComplete && data.offers) {
      setProgress({ step: data.totalQuestions + 1, total: data.totalQuestions });
      addMsg({ type: 'offers', offers: data.offers });
      addMsg({ type:'text', role:'bot', text: l==='pt' ? 'Gostou das recomendações? Clique em ↺ Reset para recomeçar.' : 'Like your recommendations? Click ↺ Reset to start over.' });
    } else {
      setProgress({ step: data.questionNumber, total: data.totalQuestions });
      const text = (data.response || '').trim();
      text.split('\n\n').filter(Boolean).forEach(p => addMsg({ type:'text', role:'bot', text: p.trim() }));
      if (data.question?.options) {
        const opts = data.question.options[l as 'en'|'pt'] || data.question.options.en;
        if (opts) setTimeout(() => addMsg({ type:'quickReplies', options: opts }), 120);
      }
    }
  }

  function addMsg(m: Message) { setMessages(prev => [...prev.filter(x => x.type !== 'quickReplies'), m]); }

  // ── Send message ──────────────────────────────────────────────────────
  const sendRaw = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setSendDisabled(true);
    setMessages(prev => [...prev.filter(x => x.type !== 'quickReplies'), { type:'text', role:'user', text }]);
    setIsTyping(true);
    try {
      const data = await sendToApi(text, token, userIdRef.current, sessionId, lang);
      setIsTyping(false);
      applyBotData(data, lang);
    } catch (err: any) {
      setIsTyping(false);
      if (err.message?.includes('401') || err.message?.includes('Authentication')) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('smart_token'); localStorage.removeItem('smart_user');
        }
        router.replace('/login');
      } else {
        addMsg({ type:'text', role:'bot', text:'Connection error. Please try again.' });
      }
    } finally { setSendDisabled(false); inputRef.current?.focus(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, sessionId, lang]);

  async function sendMessage() {
    const text = inputVal.trim(); if (!text) return;
    setInputVal(''); await sendRaw(text);
  }

  async function resetSession() {
    if (typeof window !== 'undefined') localStorage.removeItem('smart_session_id');
    setSessionId(null); setIsComplete(false); setMessages([]); setProgress(null);
    showToast(lang === 'pt' ? '↺ Sessão reiniciada' : '↺ Session reset');
    await sendRaw('reset');
  }

  async function handleLogout() {
    try { await api.logout(); } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('smart_token'); localStorage.removeItem('smart_user'); localStorage.removeItem('smart_session_id');
    }
    router.replace('/login');
  }

  // ── Guard ─────────────────────────────────────────────────────────────
  if (!authChecked || !user) return null;

  // ── Render ────────────────────────────────────────────────────────────
  const progressPct = progress
    ? progress.total > 0 && progress.step <= progress.total
      ? Math.round(((progress.step - 1) / progress.total) * 100)
      : 100
    : 0;

  return (
    <>
      {/* Ambient blob */}
      <div style={{ position:'fixed', top:-200, right:-200, width:600, height:600, background:'radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%)', pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'fixed', bottom:-150, left:-150, width:500, height:500, background:'radial-gradient(circle,rgba(6,214,160,0.05) 0%,transparent 70%)', pointerEvents:'none', zIndex:0 }}/>

      <Header user={user} lang={lang} onLogout={handleLogout} onLangChange={setLang} />

      {/* Main */}
      <div style={{ maxWidth:860, margin:'0 auto', width:'100%', flex:1, minHeight:0, display:'flex', flexDirection:'column', padding:'1.25rem 1rem', gap:'1rem', position:'relative', zIndex:1, overflow:'hidden', height:'calc(100vh - 64px)' }}>

        {/* Progress */}
        {progress && (
          <div style={{ display:'flex', background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:14, padding:'0.75rem 1rem', alignItems:'center', gap:'1rem' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:2, minWidth:0 }}>
              <div style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--primary-l)' }}>
                {progressPct === 100 ? (lang==='pt' ? 'Completo!' : 'Complete!') : (lang==='pt' ? `Passo ${progress.step}` : `Step ${progress.step}`)}
              </div>
              <div style={{ fontSize:'0.72rem', color:'var(--text-secondary)', fontWeight:500, whiteSpace:'nowrap' }}>
                {progressPct === 100 ? (lang==='pt' ? 'Recomendações prontas' : 'Recommendations ready') : (lang==='pt' ? `Pergunta ${progress.step} de ${progress.total}` : `Question ${progress.step} of ${progress.total}`)}
              </div>
            </div>
            <div style={{ flex:1, height:5, background:'var(--bg-card)', borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${progressPct}%`, background:'linear-gradient(90deg,var(--primary),var(--accent))', borderRadius:3, transition:'width 0.5s cubic-bezier(.4,0,.2,1)' }}/>
            </div>
            <div style={{ fontSize:'0.72rem', color:'var(--primary-l)', fontWeight:700, minWidth:30, textAlign:'right' }}>{progressPct}%</div>
          </div>
        )}

        {/* Chat window */}
        <div ref={chatRef} style={{ flex:1, minHeight:0, overflowY:'auto', background:'var(--bg-surface)', borderRadius:20, border:'1px solid var(--border)', padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem', scrollBehavior:'smooth' }}>
          {messages.length === 0 && !isTyping && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'0.75rem', opacity:0.4 }}>
              <div style={{ fontSize:'2.5rem' }}>✨</div>
              <div style={{ fontSize:'0.85rem', color:'var(--text-secondary)', fontWeight:500 }}>Starting your personalized session…</div>
            </div>
          )}

          {messages.map((msg, idx) => {
            if (msg.type === 'text') {
              return (
                <div key={idx} style={{ display:'flex', gap:'0.75rem', maxWidth:'88%', animation:'slideIn 0.3s cubic-bezier(.4,0,.2,1)', alignSelf: msg.role==='user' ? 'flex-end' : 'flex-start', flexDirection: msg.role==='user' ? 'row-reverse' : 'row' }}>
                  <div style={{ width:34, height:34, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background: msg.role==='bot' ? 'linear-gradient(135deg,#1e2130,#13151d)' : 'linear-gradient(135deg,#0d2e26,#0a1f1a)', border: msg.role==='bot' ? '1.5px solid rgba(99,102,241,0.4)' : '1.5px solid rgba(6,214,160,0.4)', boxShadow: msg.role==='bot' ? '0 0 14px var(--primary-glow)' : '0 0 14px var(--accent-glow)' }}>
                    {msg.role === 'bot' ? SVG_AI : SVG_USER}
                  </div>
                  <div style={{ padding:'0.7rem 1rem', borderRadius:14, fontSize:'0.88rem', lineHeight:1.6, whiteSpace:'pre-wrap', wordBreak:'break-word', maxWidth:'100%', background: msg.role==='bot' ? 'var(--bg-elevated)' : 'linear-gradient(135deg,var(--primary),#7c3aed)', border: msg.role==='bot' ? '1px solid var(--border)' : 'none', borderBottomLeftRadius: msg.role==='bot' ? 4 : 14, borderBottomRightRadius: msg.role==='user' ? 4 : 14, color: msg.role==='user' ? 'white' : 'var(--text-primary)', boxShadow: msg.role==='user' ? '0 4px 15px var(--primary-glow)' : 'none' }}>
                    {msg.text}
                  </div>
                </div>
              );
            }

            if (msg.type === 'quickReplies') {
              return (
                <div key={idx} style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem', padding:'0 0.25rem', animation:'slideIn 0.3s cubic-bezier(.4,0,.2,1)' }}>
                  {msg.options.map((opt, i) => (
                    <button key={i} onClick={() => { setMessages(prev => prev.filter(m => m.type !== 'quickReplies')); sendRaw(String(i+1)); }} style={{ background:'var(--bg-elevated)', border:'1px solid rgba(99,102,241,0.35)', color:'var(--primary-l)', borderRadius:20, padding:'0.45rem 1rem', fontSize:'0.8rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>
                      {i+1}. {opt}
                    </button>
                  ))}
                </div>
              );
            }

            if (msg.type === 'offers') {
              return (
                <div key={idx} style={{ display:'flex', gap:'0.75rem', maxWidth:'100%', width:'100%', alignSelf:'flex-start', animation:'slideIn 0.3s cubic-bezier(.4,0,.2,1)' }}>
                  <div style={{ width:34, height:34, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:'linear-gradient(135deg,#1e2130,#13151d)', border:'1.5px solid rgba(99,102,241,0.4)', boxShadow:'0 0 14px var(--primary-glow)' }}>
                    {SVG_AI}
                  </div>
                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                    <div style={{ background:'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))', border:'1px solid rgba(99,102,241,0.2)', borderRadius:14, padding:'0.85rem 1.1rem', fontWeight:700, fontSize:'0.95rem', color:'var(--primary-l)' }}>
                      {lang==='pt' ? '🎯 Suas Recomendações Personalizadas' : '🎯 Your Personalized Recommendations'}
                    </div>
                    {msg.offers.basic && msg.offers.basic.length > 0 && (
                      <TierCard tier="basic" icon="🟢" label={lang==='pt' ? 'Opções Básicas' : 'Basic Options'} products={msg.offers.basic} bundle={null}/>
                    )}
                    {msg.offers.intermediate && msg.offers.intermediate.length > 0 && (
                      <TierCard tier="mid" icon="🔵" label={lang==='pt' ? 'Opções Intermediárias' : 'Intermediate Options'} products={msg.offers.intermediate} bundle={null}/>
                    )}
                    {msg.offers.premium && (
                      <TierCard tier="premium" icon="⭐" label={lang==='pt' ? 'Recomendação Premium' : 'Premium Pick'} products={[msg.offers.premium.product]} bundle={msg.offers.premium.bundle||null} lang={lang}/>
                    )}
                  </div>
                </div>
              );
            }
            return null;
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div style={{ display:'flex', gap:'0.75rem', alignSelf:'flex-start', animation:'slideIn 0.25s ease' }}>
              <div style={{ width:34, height:34, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:'linear-gradient(135deg,#1e2130,#13151d)', border:'1.5px solid rgba(99,102,241,0.4)', boxShadow:'0 0 14px var(--primary-glow)' }}>{SVG_AI}</div>
              <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:14, borderBottomLeftRadius:4, padding:'0.7rem 1rem', display:'flex', alignItems:'center', gap:5, height:38 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:'var(--primary-l)', opacity:0.5, animation:`typing-dot 1.2s ${i*0.2}s infinite` }}/>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div style={{ display:'flex', gap:'0.75rem', background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:14, padding:'0.75rem', alignItems:'flex-end' }}>
          <textarea
            ref={inputRef}
            rows={1}
            placeholder="Type your answer or choose an option above…"
            value={inputVal}
            onChange={e => { setInputVal(e.target.value); e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,100)+'px'; }}
            onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            style={{ flex:1, background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:10, padding:'0.65rem 0.9rem', color:'var(--text-primary)', fontFamily:'inherit', fontSize:'0.9rem', outline:'none', resize:'none', minHeight:40, maxHeight:100, lineHeight:1.5 }}
          />
          <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
            <button onClick={sendMessage} disabled={sendDisabled} style={{ background:'linear-gradient(135deg,var(--primary),#7c3aed)', color:'white', border:'none', borderRadius:10, padding:'0.6rem 1.1rem', fontSize:'0.85rem', fontWeight:700, cursor: sendDisabled ? 'not-allowed' : 'pointer', fontFamily:'inherit', opacity: sendDisabled ? 0.5 : 1, boxShadow:'0 4px 14px var(--primary-glow)', whiteSpace:'nowrap' }}>
              Send ↑
            </button>
            <button onClick={resetSession} style={{ background:'var(--bg-card)', color:'var(--text-secondary)', border:'1px solid var(--border)', borderRadius:10, padding:'0.6rem 0.9rem', fontSize:'0.82rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
              ↺ Reset
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div style={{ position:'fixed', bottom: toastVisible ? '2rem' : '-4rem', left:'50%', transform:'translateX(-50%)', background:'var(--bg-elevated)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:20, padding:'0.6rem 1.2rem', fontSize:'0.82rem', fontWeight:600, color:'var(--text-primary)', boxShadow:'0 4px 20px rgba(0,0,0,0.5)', transition:'bottom 0.3s cubic-bezier(.4,0,.2,1)', zIndex:300, whiteSpace:'nowrap' }}>
        {toast}
      </div>

      <style>{`
        @keyframes typing-dot { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:1;transform:scale(1.2)} }
        textarea::placeholder { color: var(--text-muted); }
        #chat-scroll::-webkit-scrollbar { width:5px; }
        #chat-scroll::-webkit-scrollbar-thumb { background:rgba(99,102,241,0.3); border-radius:3px; }
      `}</style>
    </>
  );
}

// ── TierCard component ─────────────────────────────────────────────────────
function TierCard({ tier, icon, label, products, bundle, lang = 'en' }: { tier: string; icon: string; label: string; products: Product[]; bundle: Bundle | null; lang?: string }) {
  const headerBg: Record<string, string> = {
    basic:   'rgba(6,214,160,0.1)',
    mid:     'rgba(59,130,246,0.1)',
    premium: 'rgba(245,158,11,0.1)',
  };
  const headerColor: Record<string, string> = {
    basic:   'var(--accent)',
    mid:     '#60a5fa',
    premium: 'var(--gold)',
  };
  const headerBorder: Record<string, string> = {
    basic:   'rgba(6,214,160,0.15)',
    mid:     'rgba(59,130,246,0.15)',
    premium: 'rgba(245,158,11,0.15)',
  };

  return (
    <div style={{ borderRadius:14, overflow:'hidden', border:'1px solid var(--border)', background:'var(--bg-card)' }}>
      <div style={{ padding:'0.65rem 1rem', fontSize:'0.72rem', fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', display:'flex', alignItems:'center', gap:'0.5rem', background: headerBg[tier], borderBottom:`1px solid ${headerBorder[tier]}`, color: headerColor[tier] }}>
        <span>{icon}</span><span>{label}</span>
      </div>
      <div style={{ padding:'0.75rem', display:'flex', flexDirection:'column', gap:'0.6rem' }}>
        {products.map((p, i) => (
          <div key={i} style={{ display:'flex', gap:'0.85rem', padding:'0.85rem', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-elevated)', alignItems:'flex-start' }}>
            <div style={{ width:42, height:42, borderRadius:10, background:'linear-gradient(135deg,var(--bg-card),var(--bg-base))', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', flexShrink:0 }}>
              {getCategoryEmoji(p.tags)}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'0.5rem' }}>
                <div style={{ fontWeight:700, fontSize:'0.88rem', color:'var(--text-primary)', lineHeight:1.3 }}>{p.name}</div>
                <div style={{ fontWeight:800, fontSize:'0.95rem', color:'var(--primary-l)', whiteSpace:'nowrap' }}>${p.price}</div>
              </div>
              {p.description && <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', marginTop:3, lineHeight:1.4 }}>{p.description}</div>}
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginTop:6, flexWrap:'wrap' }}>
                {p.score && <span style={{ fontSize:'0.68rem', fontWeight:700, padding:'2px 8px', borderRadius:20, background:'rgba(99,102,241,0.15)', color:'var(--primary-l)', border:'1px solid rgba(99,102,241,0.25)' }}>{p.score}% match</span>}
                {p.reason && <span style={{ fontSize:'0.72rem', color:'var(--accent)', fontStyle:'italic' }}>✓ {p.reason}</span>}
              </div>
            </div>
          </div>
        ))}
        {bundle && (
          <div style={{ background:'linear-gradient(135deg,rgba(245,158,11,0.07),rgba(245,158,11,0.03))', border:'1px dashed rgba(245,158,11,0.3)', borderRadius:8, padding:'0.75rem 0.9rem', marginTop:'0.25rem' }}>
            <div style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--gold)', marginBottom:4 }}>
              {lang==='pt' ? '🎁 Pacote inclui:' : '🎁 Bundle includes:'}
            </div>
            <div style={{ fontSize:'0.72rem', color:'var(--text-secondary)' }}>{bundle.items.join(' · ')}</div>
            <div style={{ fontSize:'0.8rem', fontWeight:700, color:'var(--accent)', marginTop:6 }}>
              {lang==='pt'
                ? `💰 Com ${bundle.discountPercent}% off: $${bundle.totalPrice} — economize $${bundle.savings}`
                : `💰 Bundle with ${bundle.discountPercent}% off: $${bundle.totalPrice} — save $${bundle.savings}`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
