'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { User } from '@/lib/api';

interface Props {
  user: User;
  lang: string;
  onLogout: () => void;
  onLangChange: (l: string) => void;
}

export default function Header({ user, lang, onLogout, onLangChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const menuItems = [
    { href: '/',         icon: '⌂', label: 'Home' },
    { href: '/profile',  icon: '◎', label: 'Profile' },
    { href: '/settings', icon: '⚙', label: 'Settings' },
  ];

  return (
    <header style={{ position:'sticky', top:0, zIndex:100, background:'rgba(10,11,15,0.88)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderBottom:'1px solid var(--border)', padding:'0 1.5rem', height:64, display:'flex', alignItems:'center', justifyContent:'space-between' }}>

      {/* Logo */}
      <Link href="/" style={{ display:'flex', alignItems:'center', gap:'0.85rem', textDecoration:'none' }}>
        <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,var(--primary),#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 16px var(--primary-glow)', flexShrink:0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z" fill="white" opacity="0.95"/>
            <path d="M19 16L19.9 18.1L22 19L19.9 19.9L19 22L18.1 19.9L16 19L18.1 18.1L19 16Z" fill="white" opacity="0.7"/>
            <path d="M5 3L5.7 5.3L8 6L5.7 6.7L5 9L4.3 6.7L2 6L4.3 5.3L5 3Z" fill="white" opacity="0.6"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize:'1rem', fontWeight:700, background:'linear-gradient(90deg,var(--text-primary),var(--primary-l))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            Smart Product Advisor
          </div>
          <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)', marginTop:1 }}>AI-powered recommendations</div>
        </div>
      </Link>

      {/* Right side */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>

        {/* Language toggle */}
        <div style={{ display:'flex', gap:2, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:3 }}>
          {['EN', 'PT'].map((l) => (
            <button
              key={l}
              onClick={() => onLangChange(l.toLowerCase())}
              style={{ border:'none', background: lang.toUpperCase() === l ? 'var(--primary)' : 'transparent', color: lang.toUpperCase() === l ? 'white' : 'var(--text-secondary)', fontSize:'0.7rem', fontWeight:700, padding:'4px 10px', borderRadius:7, cursor:'pointer', fontFamily:'inherit', boxShadow: lang.toUpperCase() === l ? '0 0 10px var(--primary-glow)' : 'none', transition:'all 0.2s' }}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Profile dropdown */}
        <div ref={ref} style={{ position:'relative' }}>
          <button
            onClick={() => setOpen((o) => !o)}
            style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:24, padding:'0.28rem 0.7rem 0.28rem 0.3rem', cursor:'pointer', fontFamily:'inherit', transition:'border-color 0.2s', borderColor: open ? 'rgba(99,102,241,0.5)' : 'var(--border)' }}
          >
            <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,var(--primary),#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.68rem', fontWeight:800, color:'white', flexShrink:0, letterSpacing:'0.02em', boxShadow:'0 0 10px var(--primary-glow)' }}>
              {initials}
            </div>
            <span style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--text-primary)', maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user.name}
            </span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 0.2s', flexShrink:0 }}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          {open && (
            <div style={{ position:'absolute', top:'calc(100% + 10px)', right:0, background:'var(--bg-elevated)', border:'1px solid rgba(99,102,241,0.18)', borderRadius:14, padding:'0.4rem', minWidth:210, boxShadow:'0 20px 60px rgba(0,0,0,0.65)', zIndex:200, animation:'fadeIn 0.15s ease' }}>

              {/* User info */}
              <div style={{ padding:'0.65rem 0.8rem 0.7rem', borderBottom:'1px solid var(--border)', marginBottom:'0.3rem' }}>
                <div style={{ fontSize:'0.83rem', fontWeight:700, color:'var(--text-primary)' }}>{user.name}</div>
                <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:2 }}>{user.email}</div>
              </div>

              {/* Nav items */}
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  style={{ display:'flex', alignItems:'center', gap:'0.65rem', padding:'0.55rem 0.8rem', borderRadius:9, fontSize:'0.83rem', fontWeight:500, color:'var(--text-primary)', textDecoration:'none' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.09)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize:'0.95rem', width:18, textAlign:'center', opacity:0.65 }}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}

              <div style={{ borderTop:'1px solid var(--border)', margin:'0.3rem 0' }}/>

              {/* Logout */}
              <button
                onClick={() => { setOpen(false); onLogout(); }}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:'0.65rem', padding:'0.55rem 0.8rem', borderRadius:9, fontSize:'0.83rem', fontWeight:600, color:'#fb7185', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fb7185" strokeWidth="2" strokeLinecap="round" style={{ flexShrink:0 }}>
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </header>
  );
}
