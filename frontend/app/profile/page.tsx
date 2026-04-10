'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as api from '@/lib/api';
import type { User } from '@/lib/api';
import Header from '@/components/Header';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser]           = useState<User | null>(null);
  const [lang, setLangState]      = useState('en');
  const [authChecked, setAuthChecked] = useState(false);

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
  }

  async function handleLogout() {
    try { await api.logout(); } catch {}
    localStorage.removeItem('smart_token');
    localStorage.removeItem('smart_user');
    localStorage.removeItem('smart_session_id');
    router.replace('/login');
  }

  if (!authChecked || !user) return null;

  const initials  = user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  const joinDate  = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric' })
    : '—';
  const lastSeen  = user.lastSeen
    ? new Date(user.lastSeen).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:'var(--bg-surface)' }}>
      <Header user={user} lang={lang} onLogout={handleLogout} onLangChange={setLang} />

      <main style={{ flex:1, maxWidth:680, width:'100%', margin:'0 auto', padding:'2.5rem 1.25rem' }}>

        {/* Page title */}
        <div style={{ marginBottom:'2rem' }}>
          <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--primary-l)', marginBottom:'0.4rem' }}>Account</div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:800, letterSpacing:'-0.025em', color:'var(--text-primary)', margin:0 }}>Your Profile</h1>
        </div>

        {/* Avatar card */}
        <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:20, padding:'2rem', marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'1.5rem' }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,var(--primary),#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.6rem', fontWeight:800, color:'white', flexShrink:0, boxShadow:'0 0 28px var(--primary-glow)' }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize:'1.25rem', fontWeight:800, color:'var(--text-primary)' }}>{user.name}</div>
            <div style={{ fontSize:'0.83rem', color:'var(--text-secondary)', marginTop:'0.25rem' }}>{user.email}</div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', marginTop:'0.6rem', background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:20, padding:'0.2rem 0.65rem', fontSize:'0.72rem', fontWeight:600, color:'var(--primary-l)' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--primary-l)' }}/>
              Active
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
          {[
            { label:'Full Name',   value: user.name },
            { label:'Email',       value: user.email },
            { label:'Member Since', value: joinDate },
            { label:'Last Active', value: lastSeen },
          ].map((item) => (
            <div key={item.label} style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:14, padding:'1.1rem 1.25rem' }}>
              <div style={{ fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:'0.4rem' }}>{item.label}</div>
              <div style={{ fontSize:'0.9rem', fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:20, padding:'1.5rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:'0.25rem' }}>Account Actions</div>
          <a href="/forgot-password" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.8rem 1rem', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, textDecoration:'none', color:'var(--text-primary)', fontSize:'0.85rem', fontWeight:600 }}>
            <span>Change Password</span>
            <span style={{ color:'var(--text-muted)', fontSize:'0.9rem' }}>→</span>
          </a>
          <button
            onClick={handleLogout}
            style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.8rem 1rem', background:'rgba(244,63,94,0.07)', border:'1px solid rgba(244,63,94,0.2)', borderRadius:12, cursor:'pointer', fontFamily:'inherit', color:'#fb7185', fontSize:'0.85rem', fontWeight:600, textAlign:'left' }}
          >
            <span>Sign Out</span>
            <span style={{ fontSize:'0.9rem' }}>→</span>
          </button>
        </div>
      </main>
    </div>
  );
}
