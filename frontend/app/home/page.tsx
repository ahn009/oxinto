'use client';

import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import Footer from '@/components/Footer';

const stats = [
  { num: '10,000+', label: 'Happy Users' },
  { num: '26+',     label: 'Products Indexed' },
  { num: '6',       label: 'Categories' },
  { num: '100%',    label: 'Personalised' },
];

const steps = [
  { num: '01', title: 'Tell us a little', desc: 'Answer 7 quick questions about your lifestyle, budget, and needs. No sign-up required to start.' },
  { num: '02', title: 'AI does the thinking', desc: 'Our engine evaluates 26+ products across 6 categories and ranks every match to your profile.' },
  { num: '03', title: 'Pick your perfect fit', desc: 'Get 3-tier recommendations — Basic, Intermediate, and a curated Premium pick — with bundle deals.' },
];

const features = [
  { icon: '⚡', title: 'Instant Recommendations', desc: 'Results in under 60 seconds. No browsing rabbit holes, no analysis paralysis.', color: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.2)' },
  { icon: '🎯', title: '3-Tier Results', desc: 'Always get a Basic, Intermediate, and Premium option — matched by budget and need.', color: 'rgba(6,214,160,0.08)', border: 'rgba(6,214,160,0.18)' },
  { icon: '🧠', title: 'Smarter Every Time', desc: 'Your history trains the AI. Each session delivers sharper, more personalised picks.', color: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)' },
  { icon: '🔒', title: 'Private by Design', desc: 'Your data stays yours. No tracking, no selling, no spam. Ever.', color: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.18)' },
  { icon: '🌍', title: 'Multi-Language', desc: 'Available in English and Portuguese. More languages coming soon.', color: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
  { icon: '🎁', title: 'Bundle Deals', desc: 'Premium picks come with exclusive bundle pricing — save up to 30% on curated combos.', color: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.18)' },
];

const testimonials = [
  { name: 'Sarah M.', role: 'Fitness Enthusiast', text: '"I wasted $200 on headphones I hated. OPTIXO matched me to the exact pair in 2 minutes. Mind blown."', avatar: 'SM' },
  { name: 'James T.', role: 'Student', text: '"Tight budget, big needs. OPTIXO found me the best laptop in my range — no upsells, just facts."', avatar: 'JT' },
  { name: 'Priya K.', role: 'Home Chef', text: '"The bundle deal it found me saved $47. Literally paid for itself. This app is free?!"', avatar: 'PK' },
];

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      <PublicHeader />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section style={{ flex: 1, position: 'relative', overflow: 'hidden', padding: '7rem 2rem 6rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        {/* Ambient glows */}
        <div style={{ position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.18) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: '20%', width: 500, height: 400, background: 'radial-gradient(ellipse, rgba(6,214,160,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 780 }}>
          {/* Eyebrow badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: 20, padding: '0.35rem 1rem', marginBottom: '2rem',
            fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-l)', letterSpacing: '0.06em',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse-dot 2s infinite' }} />
            AI-POWERED PRODUCT DISCOVERY
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(2.8rem, 6vw, 5rem)', fontWeight: 900, lineHeight: 1.1,
            letterSpacing: '-0.04em', marginBottom: '1.5rem',
          }}>
            <span style={{ color: 'var(--text-primary)' }}>Stop guessing.</span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg, var(--primary-l) 0%, #a78bfa 40%, var(--accent) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Start owning the right products.</span>
          </h1>

          {/* Sub */}
          <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '2.5rem', maxWidth: 560, margin: '0 auto 2.5rem' }}>
            Most people waste <strong style={{ color: 'var(--text-primary)' }}>$300+ a year</strong> on products that don't fit.
            OPTIXO's AI asks the right questions and delivers recommendations tailored <em>exactly</em> to your life.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <Link href="/signup" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
              color: 'white', textDecoration: 'none', borderRadius: 12,
              padding: '1rem 2rem', fontSize: '1rem', fontWeight: 800,
              boxShadow: '0 8px 30px rgba(99,102,241,0.4)', transition: 'all 0.25s',
              letterSpacing: '-0.01em',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(99,102,241,0.55)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,102,241,0.4)'; }}
            >
              Get My Free Recommendations →
            </Link>
            <Link href="/features" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'transparent', color: 'var(--text-secondary)',
              textDecoration: 'none', borderRadius: 12, border: '1px solid var(--border)',
              padding: '1rem 1.5rem', fontSize: '0.92rem', fontWeight: 600, transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >See how it works</Link>
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Free forever · No credit card · 60-second setup
          </p>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <section style={{ padding: '2.5rem 2rem', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.5rem', textAlign: 'center' }}>
          {stats.map((s, i) => (
            <div key={i}>
              <div style={{
                fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.03em',
                background: 'linear-gradient(90deg, var(--primary-l), var(--accent))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>{s.num}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────── */}
      <section style={{ padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--primary-l)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>THE PROCESS</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              From confused shopper<br/>to confident buyer in 60 seconds
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '2rem' }}>
            {steps.map((s, i) => (
              <div key={i} style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: 20, padding: '2rem', position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 16, right: 20,
                  fontSize: '4rem', fontWeight: 900, letterSpacing: '-0.06em',
                  color: 'rgba(99,102,241,0.06)', lineHeight: 1,
                }}>{s.num}</div>
                <div style={{
                  width: 40, height: 40, borderRadius: 11, marginBottom: '1.25rem',
                  background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.15))',
                  border: '1px solid rgba(99,102,241,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', fontWeight: 900, color: 'var(--primary-l)',
                }}>{s.num}</div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--text-primary)' }}>{s.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section style={{ padding: '6rem 2rem', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--accent)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>FEATURES</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              Everything you need,<br/>nothing you don't
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem' }}>
            {features.map((f, i) => (
              <div key={i} style={{
                background: f.color, border: `1px solid ${f.border}`,
                borderRadius: 18, padding: '1.75rem',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>{f.icon}</div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{f.title}</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────── */}
      <section style={{ padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--primary-l)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>WHAT PEOPLE SAY</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              Real people. Real savings.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.5rem' }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: 18, padding: '1.75rem',
              }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem', fontStyle: 'italic' }}>{t.text}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 800, color: 'white',
                  }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────── */}
      <section style={{
        padding: '6rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(6,214,160,0.04) 100%)',
        borderTop: '1px solid rgba(99,102,241,0.12)',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '1rem', lineHeight: 1.15 }}>
            Your perfect product<br/>is 60 seconds away.
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: 1.6 }}>
            Join thousands who stopped guessing and started buying with confidence.
            It's free — and it always will be.
          </p>
          <Link href="/signup" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
            color: 'white', textDecoration: 'none', borderRadius: 14,
            padding: '1.1rem 2.5rem', fontSize: '1.05rem', fontWeight: 800,
            boxShadow: '0 10px 40px rgba(99,102,241,0.5)', transition: 'all 0.25s',
            letterSpacing: '-0.01em',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 18px 50px rgba(99,102,241,0.6)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 40px rgba(99,102,241,0.5)'; }}
          >
            Start For Free — No Card Needed →
          </Link>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
            Already have an account? <Link href="/login" style={{ color: 'var(--primary-l)', fontWeight: 600 }}>Sign in →</Link>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
