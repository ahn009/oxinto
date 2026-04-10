'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LeftPanel from '@/components/LeftPanel';
import * as api from '@/lib/api';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('smart_token') && localStorage.getItem('smart_user')) {
        router.replace('/');
        return;
      }
      const params = new URLSearchParams(window.location.search);
      if (params.get('error') === 'google_failed') {
        setError('Google sign-in failed. Please try again or use email.');
      }
      setAuthChecked(true);
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const data = await api.login(email, password);
      localStorage.setItem('smart_token', data.token);
      localStorage.setItem('smart_user', JSON.stringify(data.user));
      localStorage.removeItem('smart_session_id');
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function signInWithGoogle() {
    setError(''); setSuccess('');
    setGoogleLoading(true);
    window.location.href = '/auth/google';
  }

  const s = {
    pageWrap: { height:'100vh', overflow:'hidden' as const, display:'flex', position:'relative' as const, zIndex:1 },
    rightPanel: { flex:1, display:'flex', flexDirection:'column' as const, justifyContent:'center', alignItems:'center', padding:'2.5rem 2rem', background:'var(--bg-surface)', position:'relative' as const },
    formCard: { width:'100%', maxWidth:420 },
    eyebrow: { fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase' as const, color:'var(--primary-l)', marginBottom:'0.5rem' },
    title: { fontSize:'1.9rem', fontWeight:800, letterSpacing:'-0.025em', color:'var(--text-primary)', marginBottom:'0.35rem' },
    desc: { fontSize:'0.82rem', color:'var(--text-secondary)', marginBottom:'2rem', lineHeight:1.5 },
    errorBox: { background:'rgba(244,63,94,0.1)', border:'1px solid rgba(244,63,94,0.3)', borderRadius:10, padding:'0.7rem 1rem', fontSize:'0.8rem', color:'#fb7185', marginBottom:'0.5rem' },
    successBox: { background:'rgba(6,214,160,0.1)', border:'1px solid rgba(6,214,160,0.3)', borderRadius:10, padding:'0.7rem 1rem', fontSize:'0.8rem', color:'var(--accent)', marginBottom:'0.5rem' },
    googleBtn: { width:'100%', background:'var(--bg-card)', color:'var(--text-primary)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'0.75rem 1rem', fontSize:'0.88rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.65rem', transition:'all 0.2s' },
    divider: { display:'flex', alignItems:'center', gap:'0.75rem', margin:'1.5rem 0', color:'var(--text-muted)', fontSize:'0.75rem' },
    dividerLine: { flex:1, height:1, background:'rgba(255,255,255,0.07)' },
    fields: { display:'flex', flexDirection:'column' as const, gap:'1rem' },
    field: { display:'flex', flexDirection:'column' as const, gap:'0.4rem' },
    fieldLabel: { fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase' as const, color:'var(--text-secondary)' },
    fieldInput: { background:'var(--bg-input)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'0.75rem 1rem', color:'var(--text-primary)', fontFamily:'inherit', fontSize:'0.9rem', outline:'none', width:'100%' },
    fieldRow: { display:'flex', alignItems:'center', justifyContent:'space-between' },
    rememberLabel: { display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.8rem', color:'var(--text-secondary)', cursor:'pointer' },
    forgotLink: { fontSize:'0.8rem', color:'var(--primary-l)', fontWeight:600 },
    submitBtn: { width:'100%', background:'linear-gradient(135deg,var(--primary) 0%,#7c3aed 100%)', color:'white', border:'none', borderRadius:10, padding:'0.85rem', fontSize:'0.95rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.01em', boxShadow:'0 4px 18px rgba(99,102,241,0.35)', marginTop:'0.5rem', opacity:1 },
    signupLink: { textAlign:'center' as const, fontSize:'0.82rem', color:'var(--text-secondary)' },
  };

  if (!authChecked) return null;

  return (
    <div style={s.pageWrap}>
      <LeftPanel
        headline={<>Find your<br/><span style={{ background:'linear-gradient(90deg,var(--primary-l),var(--accent))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>perfect product</span><br/>with AI.</>}
        sub="Answer a few smart questions. Get 3-tier personalised recommendations tailored exactly to your needs, budget and style."
        features={[
          { icon:'✦', color:'indigo', title:'6 Product Categories', desc:'Electronics, Fashion, Home, Health, Entertainment, Grocery' },
          { icon:'◎', color:'teal',   title:'7-Question Discovery', desc:'Smart branching questions that adapt to your preferences' },
          { icon:'⬡', color:'purple', title:'3-Tier Recommendations', desc:'Basic, Intermediate & Premium picks — ranked by match score' },
          { icon:'◈', color:'gold',   title:'Smarter Over Time', desc:'Your history personalises future recommendations automatically' },
        ]}
        stats={[
          { num:'26+', label:'Products' },
          { num:'6',   label:'Categories' },
          { num:'3-tier', label:'Results' },
          { num:'100%', label:'Personalised' },
        ]}
      />

      <div style={s.rightPanel}>
        <div style={s.formCard}>
          <div style={s.eyebrow}>Welcome back</div>
          <div style={s.title}>Sign in to your account</div>
          <div style={s.desc}>
            Don&apos;t have an account?&nbsp;
            <Link href="/signup" style={{ color:'var(--primary-l)', fontWeight:600 }}>Create one free →</Link>
          </div>

          {error   && <div style={s.errorBox}>{error}</div>}
          {success && <div style={s.successBox}>{success}</div>}

          <button style={{ ...s.googleBtn, opacity: googleLoading ? 0.5 : 1 }} onClick={signInWithGoogle} disabled={googleLoading} type="button">
            <GoogleIcon />
            {googleLoading ? 'Connecting…' : 'Continue with Google'}
          </button>

          <div style={s.divider}>
            <div style={s.dividerLine}/>
            or sign in with email
            <div style={s.dividerLine}/>
          </div>

          <form style={s.fields} onSubmit={handleSubmit} noValidate>
            <div style={s.field}>
              <label style={s.fieldLabel}>Email Address</label>
              <input style={s.fieldInput} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required/>
            </div>
            <div style={s.field}>
              <label style={s.fieldLabel}>Password</label>
              <input style={s.fieldInput} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required/>
            </div>
            <div style={s.fieldRow}>
              <label style={s.rememberLabel}>
                <input type="checkbox" style={{ width:15, height:15, accentColor:'var(--primary)', cursor:'pointer' }}/>
                Remember me
              </label>
              <Link href="/forgot-password" style={s.forgotLink}>Forgot password?</Link>
            </div>
            <button style={{ ...s.submitBtn, opacity: loading ? 0.5 : 1 }} type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div style={s.divider}>
            <div style={s.dividerLine}/> or <div style={s.dividerLine}/>
          </div>

          <div style={s.signupLink}>
            New to Smart Product Advisor?&nbsp;
            <Link href="/signup" style={{ color:'var(--primary-l)', fontWeight:700 }}>Create a free account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
