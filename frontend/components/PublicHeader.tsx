'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: '/home',     label: 'Home' },
    { href: '/features', label: 'Features' },
    { href: '/usage',    label: 'Usage' },
  ];

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(10,11,15,0.88)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 2rem', height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>

      {/* Logo */}
      <Link href="/home" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
        <Image src="/optixo.png" alt="OPTIXO" width={36} height={36} style={{ borderRadius: 8, objectFit: 'contain' }} />
        <span style={{
          fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em',
          background: 'linear-gradient(90deg, var(--text-primary), var(--primary-l))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>OPTIXO</span>
      </Link>

      {/* Desktop Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {navLinks.map(l => (
          <Link key={l.href} href={l.href} style={{
            padding: '0.45rem 0.9rem', borderRadius: 8, fontSize: '0.88rem', fontWeight: 500,
            color: 'var(--text-secondary)', textDecoration: 'none', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(99,102,241,0.09)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
          >{l.label}</Link>
        ))}
      </nav>

      {/* Auth Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link href="/login" style={{
          padding: '0.48rem 1.1rem', borderRadius: 9, fontSize: '0.85rem', fontWeight: 600,
          color: 'var(--text-secondary)', border: '1px solid var(--border)',
          background: 'transparent', textDecoration: 'none', transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >Log In</Link>
        <Link href="/signup" style={{
          padding: '0.48rem 1.1rem', borderRadius: 9, fontSize: '0.85rem', fontWeight: 700,
          color: 'white', background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
          textDecoration: 'none', boxShadow: '0 4px 14px var(--primary-glow)', transition: 'opacity 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
        >Sign Up Free</Link>
      </div>
    </header>
  );
}
