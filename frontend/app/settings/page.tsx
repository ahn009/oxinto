'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as api from '@/lib/api';
import type { User } from '@/lib/api';
import Header from '@/components/Header';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser]               = useState<User | null>(null);
  const [lang, setLangState]          = useState('en');
  const [authChecked, setAuthChecked] = useState(false);
  const [saved, setSaved]             = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('smart_token');
    const l     = localStorage.getItem('smart_lang') || 'en';
    setLangState(l);
    if (!token) { router.replace('/login'); return; }
    api.getMe()
      .then((me) => { setUser(me); setAuthChecked(true); })
      .catch(() => {
        localStorage.removeItem('smart_token');
        localStorage.removeItem('smart_user');
        router.replace('/login');
      });
  }, [router]);

  function setLang(l: string) {
    setLangState(l);
    localStorage.setItem('smart_lang', l);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleLogout() {
    try { await api.logout(); } catch {}
    localStorage.removeItem('smart_token');
    localStorage.removeItem('smart_user');
    localStorage.removeItem('smart_session_id');
    router.replace('/login');
  }

  function clearHistory() {
    localStorage.removeItem('smart_session_id');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!authChecked || !user) return null;

  const section = (title: string) => (
    <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' as const, color:'var(--text-muted)', marginBottom:'0.75rem', marginTop:'0.25rem' }}>{title}</div>
  );

  const card = { background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:20, padding:'1.5rem', marginBottom:'1.25rem' };

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:'var(--bg-surface)' }}>
      <Header user={user} lang={lang} onLogout={handleLogout} onLangChange={setLang} />

      <main style={{ flex:1, maxWidth:680, width:'100%', margin:'0 auto', padding:'2.5rem 1.25rem' }}>

        {/* Title */}
        <div style={{ marginBottom:'2rem' }}>
          <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--primary-l)', marginBottom:'0.4rem' }}>Account</div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:800, letterSpacing:'-0.025em', color:'var(--text-primary)', margin:0 }}>Settings</h1>
        </div>

        {/* Saved toast */}
        {saved && (
          <div style={{ background:'rgba(6,214,160,0.1)', border:'1px solid rgba(6,214,160,0.3)', borderRadius:10, padding:'0.65rem 1rem', fontSize:'0.8rem', color:'var(--accent)', marginBottom:'1.25rem', fontWeight:600 }}>
            Settings saved
          </div>
        )}

        {/* Account info */}
        <div style={card}>
          {section('Account')}
          <div style={{ display:'flex', flexDirection:'column', gap:'0.65rem' }}>
            {[
              { label:'Name',  value: user.name },
              { label:'Email', value: user.email },
            ].map((item) => (
              <div key={item.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize:'0.82rem', color:'var(--text-secondary)', fontWeight:500 }}>{item.label}</span>
                <span style={{ fontSize:'0.85rem', color:'var(--text-primary)', fontWeight:600 }}>{item.value}</span>
              </div>
            ))}
            <a href="/forgot-password" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem 0', textDecoration:'none' }}>
              <span style={{ fontSize:'0.82rem', color:'var(--text-secondary)', fontWeight:500 }}>Password</span>
              <span style={{ fontSize:'0.8rem', color:'var(--primary-l)', fontWeight:600 }}>Change →</span>
            </a>
          </div>
        </div>

        {/* Language */}
        <div style={card}>
          {section('Preferences')}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:'0.85rem', fontWeight:600, color:'var(--text-primary)' }}>Language</div>
              <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2 }}>Sets the language for AI recommendations</div>
            </div>
            <div style={{ display:'flex', gap:2, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:3 }}>
              {['EN', 'PT'].map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l.toLowerCase())}
                  style={{ border:'none', background: lang.toUpperCase() === l ? 'var(--primary)' : 'transparent', color: lang.toUpperCase() === l ? 'white' : 'var(--text-secondary)', fontSize:'0.75rem', fontWeight:700, padding:'6px 14px', borderRadius:7, cursor:'pointer', fontFamily:'inherit', boxShadow: lang.toUpperCase() === l ? '0 0 10px var(--primary-glow)' : 'none', transition:'all 0.2s' }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data */}
        <div style={card}>
          {section('Data & Privacy')}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:'0.85rem', fontWeight:600, color:'var(--text-primary)' }}>Clear Session History</div>
              <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2 }}>Removes your current chat session from this browser</div>
            </div>
            <button
              onClick={clearHistory}
              style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:9, padding:'0.5rem 0.9rem', fontSize:'0.8rem', fontWeight:600, color:'var(--text-secondary)', cursor:'pointer', fontFamily:'inherit' }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div style={{ ...card, borderColor:'rgba(244,63,94,0.2)', background:'rgba(244,63,94,0.04)' }}>
          {section('Danger Zone')}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:'0.85rem', fontWeight:600, color:'#fb7185' }}>Sign Out</div>
              <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2 }}>You will be redirected to the login page</div>
            </div>
            <button
              onClick={handleLogout}
              style={{ background:'rgba(244,63,94,0.1)', border:'1px solid rgba(244,63,94,0.3)', borderRadius:9, padding:'0.5rem 0.9rem', fontSize:'0.8rem', fontWeight:600, color:'#fb7185', cursor:'pointer', fontFamily:'inherit' }}
            >
              Sign Out
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
