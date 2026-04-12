'use client';

import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import Footer from '@/components/Footer';

const features = [
  {
    icon: '🤖', title: 'Conversational AI Engine',
    desc: 'OPTIXO uses a multi-turn conversational AI that adapts its questions based on your previous answers. No cookie-cutter surveys — every session is dynamically tailored to you.',
    bullets: ['7-question adaptive flow', 'Branching logic based on responses', 'Supports natural language input'],
  },
  {
    icon: '🎯', title: '3-Tier Recommendation System',
    desc: 'Every session ends with three clearly differentiated recommendation tiers, ensuring you always find the right product regardless of budget.',
    bullets: ['Basic: value-for-money essentials', 'Intermediate: best-balanced picks', 'Premium: top-tier with exclusive bundles'],
  },
  {
    icon: '📦', title: 'Bundle Deal Engine',
    desc: 'Premium recommendations come with curated bundle deals — complementary products grouped together at a discounted price, saving you up to 30%.',
    bullets: ['Automatic bundle detection', 'Up to 30% discount on bundles', 'Transparent savings breakdown'],
  },
  {
    icon: '🧬', title: 'Personalisation Memory',
    desc: 'OPTIXO remembers your history across sessions. The more you use it, the sharper your recommendations get — like a personal shopper who knows your taste.',
    bullets: ['Cross-session preference learning', 'Profile-based scoring', 'Improves with every interaction'],
  },
  {
    icon: '🌍', title: 'Multi-Language Support',
    desc: 'Available in English and Portuguese today, with more languages on the roadmap. OPTIXO speaks your language — literally.',
    bullets: ['Full EN/PT localisation', 'Seamless in-session switching', 'More languages coming soon'],
  },
  {
    icon: '🔐', title: 'Secure & Private',
    desc: 'Your data is yours. OPTIXO is built with a privacy-first architecture — no third-party tracking, no data selling, no spam.',
    bullets: ['JWT-based authentication', 'Google OAuth support', 'Email OTP verification'],
  },
];

export default function FeaturesPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      <PublicHeader />

      {/* Hero */}
      <section style={{ padding: '6rem 2rem 4rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--primary-l)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>FEATURES</div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '1.25rem', lineHeight: 1.15 }}>
            Built to get you the<br/>
            <span style={{ background: 'linear-gradient(135deg, var(--primary-l), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>right answer, fast</span>
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '2rem' }}>
            Every OPTIXO feature is designed with one goal: eliminate the gap between what you want and what you buy.
          </p>
          <Link href="/signup" style={{
            display: 'inline-flex', alignItems: 'center',
            background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
            color: 'white', textDecoration: 'none', borderRadius: 11,
            padding: '0.85rem 1.75rem', fontSize: '0.92rem', fontWeight: 700,
            boxShadow: '0 6px 24px rgba(99,102,241,0.4)',
          }}>Try It Free →</Link>
        </div>
      </section>

      {/* Features grid */}
      <section style={{ padding: '4rem 2rem 6rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1.5rem' }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 20, padding: '2rem',
              transition: 'border-color 0.2s, transform 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{f.icon}</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.6rem' }}>{f.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.25rem' }}>{f.desc}</p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {f.bullets.map((b, j) => (
                  <li key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem' }}>✓</span> {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '5rem 2rem', textAlign: 'center', borderTop: '1px solid var(--border)', background: 'rgba(99,102,241,0.04)' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '1rem' }}>Ready to find your perfect product?</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>It takes 60 seconds and it's completely free.</p>
        <Link href="/signup" style={{
          display: 'inline-flex', alignItems: 'center',
          background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
          color: 'white', textDecoration: 'none', borderRadius: 12,
          padding: '1rem 2.25rem', fontSize: '1rem', fontWeight: 800,
          boxShadow: '0 8px 30px rgba(99,102,241,0.45)',
        }}>Get Started Free →</Link>
      </section>

      <Footer />
    </div>
  );
}
