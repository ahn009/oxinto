'use client';

import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import Footer from '@/components/Footer';

const steps = [
  {
    num: '01', icon: '🔐', title: 'Create your free account',
    desc: 'Sign up with email or Google in under 30 seconds. No credit card. No commitment. Verify your email and you\'re in.',
    tip: 'Already have an account? Just sign in.',
  },
  {
    num: '02', icon: '💬', title: 'Start the AI conversation',
    desc: 'OPTIXO will greet you and ask a series of smart, adaptive questions. Choose from quick-reply options or type your own answers — the AI understands both.',
    tip: 'The whole process takes about 60 seconds.',
  },
  {
    num: '03', icon: '🎯', title: 'Answer 7 targeted questions',
    desc: 'Questions cover your use case, budget, lifestyle, and priorities. Each answer shapes the next question, so there\'s no wasted time on irrelevant choices.',
    tip: 'You can reset and start over any time.',
  },
  {
    num: '04', icon: '⚡', title: 'Get your 3-tier results',
    desc: 'Instantly receive three recommendation tiers: Basic (great value), Intermediate (best balance), and Premium (top pick with bundle deal). Each includes a match score and reason.',
    tip: 'Premium picks include bundle pricing — check the savings!',
  },
  {
    num: '05', icon: '🔄', title: 'Refine or restart',
    desc: 'Not quite right? Hit Reset to start a fresh session. Your history is saved — the AI uses it to serve better recommendations on your next visit.',
    tip: 'The more sessions you run, the smarter OPTIXO gets for you.',
  },
];

const faqs = [
  { q: 'Is OPTIXO really free?', a: 'Yes, completely free. No hidden charges, no premium tiers, no subscription. OPTIXO is free now and always will be.' },
  { q: 'What product categories does OPTIXO cover?', a: 'Electronics, Fashion, Home & Living, Health & Wellness, Entertainment, and Grocery. More categories are being added regularly.' },
  { q: 'How does the AI personalise recommendations?', a: 'The AI uses your answers and session history to build a preference profile. Each recommendation is scored against your profile — the higher the match %, the better the fit.' },
  { q: 'Can I use OPTIXO in my language?', a: 'OPTIXO currently supports English and Portuguese. You can switch languages mid-session using the language toggle in the header.' },
  { q: 'Is my data safe?', a: 'Absolutely. We don\'t sell or share your data with third parties. All communication is encrypted and your account is protected by industry-standard authentication.' },
];

export default function UsagePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      <PublicHeader />

      {/* Hero */}
      <section style={{ padding: '6rem 2rem 4rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse, rgba(6,214,160,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--accent)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>HOW IT WORKS</div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '1.25rem', lineHeight: 1.15 }}>
            From zero to perfect product<br/>
            <span style={{ background: 'linear-gradient(135deg, var(--accent), var(--primary-l))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>in 5 simple steps</span>
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            No learning curve. No manual to read. Just follow the AI's lead and walk away knowing exactly what to buy.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section style={{ padding: '4rem 2rem', maxWidth: 820, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
          {/* Vertical line */}
          <div style={{ position: 'absolute', left: 28, top: 48, bottom: 48, width: 2, background: 'linear-gradient(to bottom, var(--primary), rgba(99,102,241,0.05))', pointerEvents: 'none' }} />

          {steps.map((s, i) => (
            <div key={i} style={{
              display: 'flex', gap: '1.75rem', alignItems: 'flex-start',
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 20, padding: '1.75rem', position: 'relative',
            }}>
              {/* Step circle */}
              <div style={{
                width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))',
                border: '1.5px solid rgba(99,102,241,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem',
              }}>{s.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--primary-l)', letterSpacing: '0.12em' }}>STEP {s.num}</span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.title}</h3>
                </div>
                <p style={{ fontSize: '0.87rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '0.75rem' }}>{s.desc}</p>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  background: 'rgba(6,214,160,0.08)', border: '1px solid rgba(6,214,160,0.18)',
                  borderRadius: 8, padding: '0.3rem 0.75rem', fontSize: '0.75rem', color: 'var(--accent)',
                }}>
                  <span>💡</span> {s.tip}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '5rem 2rem', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>Frequently asked questions</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqs.map((f, i) => (
              <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.6rem' }}>Q: {f.q}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '5rem 2rem', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '1rem' }}>You know how it works. Now try it.</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Free. Fast. No credit card required.</p>
        <Link href="/signup" style={{
          display: 'inline-flex', alignItems: 'center',
          background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
          color: 'white', textDecoration: 'none', borderRadius: 12,
          padding: '1rem 2.25rem', fontSize: '1rem', fontWeight: 800,
          boxShadow: '0 8px 30px rgba(99,102,241,0.45)',
        }}>Get My Free Recommendations →</Link>
      </section>

      <Footer />
    </div>
  );
}
