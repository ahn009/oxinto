'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as api from '@/lib/api';
import type { User, RecommendProduct } from '@/lib/api';
import Header from '@/components/Header';

// ── Icons ─────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const SpinnerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.9s linear infinite', flexShrink: 0 }}>
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────

function categoryEmoji(cat: string): string {
  const c = cat.toLowerCase();
  if (c.includes('headphone') || c.includes('audio') || c.includes('music')) return '🎧';
  if (c.includes('laptop') || c.includes('computer') || c.includes('pc')) return '💻';
  if (c.includes('phone') || c.includes('mobile')) return '📱';
  if (c.includes('camera') || c.includes('photo')) return '📷';
  if (c.includes('gaming') || c.includes('game')) return '🎮';
  if (c.includes('fitness') || c.includes('sport') || c.includes('health')) return '🏃';
  if (c.includes('home') || c.includes('kitchen')) return '🏠';
  if (c.includes('watch') || c.includes('wearable')) return '⌚';
  return '📦';
}

function scoreColor(score: number): string {
  if (score >= 85) return 'var(--accent)';
  if (score >= 65) return '#60a5fa';
  return 'var(--primary-l)';
}

// ── Simple debounce hook ──────────────────────────────────────────────────

function useDebounce<T extends unknown[]>(fn: (...args: T) => void, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (...args: T) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fn, delay],
  );
}

// ── Main Component ────────────────────────────────────────────────────────

export default function RecommendPage() {
  const router = useRouter();
  const [user, setUser]             = useState<User | null>(null);
  const [lang, setLangState]        = useState('en');
  const [authChecked, setAuthChecked] = useState(false);
  const [query, setQuery]           = useState('');
  const [products, setProducts]     = useState<RecommendProduct[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Auth ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const t = localStorage.getItem('smart_token');
    const u = localStorage.getItem('smart_user');
    const l = localStorage.getItem('smart_lang') || 'en';
    setLangState(l);
    if (t && u) {
      api.getMe()
        .then(me => {
          setUser(me);
          localStorage.setItem('smart_user', JSON.stringify(me));
          setAuthChecked(true);
        })
        .catch(() => {
          localStorage.removeItem('smart_token');
          localStorage.removeItem('smart_user');
          router.replace('/home');
        });
    } else {
      router.replace('/home');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setLang(l: string) {
    setLangState(l);
    if (typeof window !== 'undefined') localStorage.setItem('smart_lang', l);
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

  // ── Search ──────────────────────────────────────────────────────────────

  async function doSearch(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setProducts([]);
    setHasSearched(true);

    try {
      const data = await api.getRecommendations(trimmed);
      setProducts(data.products ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Debounce so fast typists don't fire too many requests
  const debouncedSearch = useDebounce(doSearch, 600);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    doSearch(query);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (val.trim().length >= 3) debouncedSearch(val);
  }

  if (!authChecked || !user) return null;

  const centered = !hasSearched && !loading;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* Ambient */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.07) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ flexShrink: 0, position: 'relative', zIndex: 10 }}>
        <Header user={user} lang={lang} onLogout={handleLogout} onLangChange={setLang} />
      </div>

      <main style={{ flex: 1, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: centered ? 'center' : 'stretch', justifyContent: centered ? 'center' : 'flex-start', padding: centered ? '0 1.5rem 4rem' : '2.5rem 1.5rem 3rem', transition: 'all 0.3s ease' }}>

        {/* ── Search section ── */}
        <div style={{ width: '100%', maxWidth: centered ? 640 : 760, margin: '0 auto', marginBottom: hasSearched ? '2.5rem' : 0 }}>

          {centered && (
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, padding: '0.3rem 0.9rem', marginBottom: '1.25rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary-l)', letterSpacing: '0.08em' }}>
                AI PRODUCT SEARCH
              </div>
              <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--text-primary)' }}>Find your</span>{' '}
                <span style={{ background: 'linear-gradient(135deg, var(--primary-l) 0%, #a78bfa 50%, var(--accent) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>perfect product</span>
              </h1>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Describe what you&apos;re looking for — our AI finds the best matches instantly.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.6rem' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: '0 1rem', transition: 'border-color 0.2s, box-shadow 0.2s', boxShadow: 'none' }}
              onFocus={() => {}} // handled by input focus
            >
              <span style={{ color: 'var(--text-muted)', display: 'flex', flexShrink: 0 }}><SearchIcon /></span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder="e.g. wireless headphones for gym under $100…"
                disabled={loading}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.95rem', fontFamily: 'inherit', padding: '0.85rem 0', lineHeight: 1.4 }}
                onFocus={e => { (e.target.closest('div') as HTMLElement).style.borderColor = 'rgba(99,102,241,0.5)'; (e.target.closest('div') as HTMLElement).style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                onBlur={e => { (e.target.closest('div') as HTMLElement).style.borderColor = 'rgba(255,255,255,0.09)'; (e.target.closest('div') as HTMLElement).style.boxShadow = 'none'; }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              style={{ padding: '0 1.5rem', borderRadius: 14, background: (loading || !query.trim()) ? 'rgba(99,102,241,0.25)' : 'var(--primary)', border: 'none', color: 'white', fontFamily: 'inherit', fontSize: '0.92rem', fontWeight: 700, cursor: (loading || !query.trim()) ? 'default' : 'pointer', opacity: (loading || !query.trim()) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, transition: 'all 0.2s', boxShadow: (!loading && query.trim()) ? '0 4px 20px rgba(99,102,241,0.4)' : 'none', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { if (!loading && query.trim()) { e.currentTarget.style.background = '#5254cc'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={e => { e.currentTarget.style.background = (!loading && query.trim()) ? 'var(--primary)' : 'rgba(99,102,241,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {loading ? <SpinnerIcon /> : <SearchIcon />}
              {loading ? 'Searching…' : 'Search'}
            </button>
          </form>

          {/* Suggestion chips */}
          {centered && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginTop: '1rem', justifyContent: 'center' }}>
              {['noise cancelling headphones', 'gaming laptop under $800', 'fitness tracker', 'wireless earbuds'].map(s => (
                <button
                  key={s}
                  onClick={() => { setQuery(s); doSearch(s); }}
                  style={{ padding: '0.35rem 0.85rem', borderRadius: 99, fontSize: '0.78rem', fontWeight: 500, border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.06)', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.color = 'var(--primary-l)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Loading state ── */}
        {loading && (
          <div style={{ maxWidth: 760, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem 0', animation: 'fadeUp 0.3s ease' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-l)' }}>
              <SpinnerIcon />
            </div>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Analysing your query…</p>
          </div>
        )}

        {/* ── Error state ── */}
        {!loading && error && (
          <div style={{ maxWidth: 760, width: '100%', margin: '0 auto', background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 14, padding: '1.1rem 1.4rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', animation: 'fadeUp 0.3s ease' }}>
            <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: 1 }}>⚠️</span>
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fb7185', marginBottom: 3 }}>Failed to fetch recommendations</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{error}</p>
            </div>
          </div>
        )}

        {/* ── Empty result ── */}
        {!loading && !error && hasSearched && products.length === 0 && (
          <div style={{ maxWidth: 760, width: '100%', margin: '0 auto', textAlign: 'center', padding: '3rem 0', animation: 'fadeUp 0.3s ease' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔍</p>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>No products found for &ldquo;{query}&rdquo;. Try a different search.</p>
          </div>
        )}

        {/* ── Results grid ── */}
        {!loading && products.length > 0 && (
          <div style={{ maxWidth: 760, width: '100%', margin: '0 auto' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem', fontWeight: 500 }}>
              {products.length} result{products.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {products.map((p, idx) => (
                <ProductCard key={p.id} product={p} idx={idx} />
              ))}
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: var(--text-muted); }
      `}</style>
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────

function ProductCard({ product: p, idx }: { product: RecommendProduct; idx: number }) {
  const [imgError, setImgError] = useState(false);
  const image = !imgError && p.images && p.images.length > 0 ? p.images[0] : null;
  const color = scoreColor(p.score);

  return (
    <div
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', display: 'flex', gap: 0, transition: 'border-color 0.2s, box-shadow 0.2s', animation: `fadeUp 0.35s ease ${idx * 0.07}s both` }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.35)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Image / icon */}
      <div style={{ width: 100, flexShrink: 0, background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--border)' }}>
        {image ? (
          <img
            src={image}
            alt={p.name}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: '2rem' }}>{categoryEmoji(p.category)}</span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '1rem 1.2rem', minWidth: 0 }}>
        {/* Top row: name + price */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.4rem' }}>
          <h3 style={{ fontSize: '0.97rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, margin: 0 }}>{p.name}</h3>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent)', flexShrink: 0 }}>${p.price}</span>
        </div>

        {/* Category badge */}
        <span style={{ display: 'inline-block', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 99, padding: '1px 8px', marginBottom: '0.6rem' }}>
          {p.category}
        </span>

        {/* Description */}
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 0.65rem' }}>
          {p.description}
        </p>

        {/* Reason — highlighted */}
        {p.reason && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginBottom: '0.65rem', background: 'rgba(6,214,160,0.05)', border: '1px solid rgba(6,214,160,0.15)', borderRadius: 9, padding: '0.4rem 0.7rem' }}>
            <span style={{ color: 'var(--accent)', fontSize: '0.8rem', flexShrink: 0, marginTop: 1 }}>✓</span>
            <p style={{ fontSize: '0.8rem', color: 'var(--accent)', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>{p.reason}</p>
          </div>
        )}

        {/* Score + tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 99, padding: '2px 9px' }}>
            {p.score}% match
          </span>
          {p.tags.slice(0, 3).map(tag => (
            <span key={tag} style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 99, padding: '2px 8px' }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
