'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  function scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <footer style={{
      background: 'var(--bg-surface)', borderTop: '1px solid var(--border)',
      padding: '3.5rem 2rem 0', position: 'relative', zIndex: 1,
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Top row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '3rem', paddingBottom: '3rem', borderBottom: '1px solid var(--border)' }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <Image src="/optixo.png" alt="OPTIXO" width={32} height={32} style={{ borderRadius: 7, objectFit: 'contain' }} />
              <span style={{
                fontSize: '1.05rem', fontWeight: 800,
                background: 'linear-gradient(90deg, var(--text-primary), var(--primary-l))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>OPTIXO</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 280, marginBottom: '1.5rem' }}>
              Transform your shopping experience with AI-powered personalized product recommendations.
            </p>
            {/* Social icons */}
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              {[
                { icon: 'X', href: '#' },
                { icon: 'GH', href: '#' },
                { icon: 'LI', href: '#' },
                { icon: '✉', href: '#' },
              ].map((s, i) => (
                <a key={i} href={s.href} style={{
                  width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)',
                  background: 'var(--bg-card)', textDecoration: 'none', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; e.currentTarget.style.color = 'var(--primary-l)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >{s.icon}</a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1.1rem' }}>Product</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {[
                { label: 'Home', href: '/home' },
                { label: 'Features', href: '/features' },
                { label: 'Usage', href: '/usage' },
              ].map(l => (
                <Link key={l.href} href={l.href} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary-l)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >{l.label}</Link>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1.1rem' }}>Company</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {[
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
              ].map(l => (
                <Link key={l.href} href={l.href} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary-l)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >{l.label}</Link>
              ))}
            </div>
          </div>
        </div>

        {/* Back to top + bottom bar */}
        <div style={{ padding: '1.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            © 2026 OPTIXO. All rights reserved. Made with ❤️ by Muhammad Ahsan
          </p>
          <button onClick={scrollTop} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '0.45rem 1rem', fontSize: '0.8rem',
            fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.color = 'var(--primary-l)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >↑ Back to top</button>
        </div>
      </div>
    </footer>
  );
}
