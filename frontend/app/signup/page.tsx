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

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('smart_token')) {
        router.replace('/');
        return;
      }
      setAuthChecked(true);
    }
  }, [router]);

  function handleTermsClick(e: React.MouseEvent) {
    if (!agreedToTerms) { e.preventDefault(); setError('Please agree to the Terms of Service and Privacy Policy first.'); }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!agreedToTerms) { setError('You must agree to the Terms of Service and Privacy Policy to continue.'); return; }
    if (name.trim().length < 2) { setError('Name must be at least 2 characters.'); return; }
    if (!email.includes('@'))    { setError('Enter a valid email address.'); return; }
    if (password.length < 8)     { setError('Password must be at least 8 characters.'); return; }

    setLoading(true);
    try {
      const data = await api.sendOtp(name.trim(), email, password);
      sessionStorage.setItem('otp_session', JSON.stringify({ tempUserId: data.tempUserId, email }));
      router.push('/verify-email');
    } catch (err: any) {
      setError(err.message || 'Failed to send code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function signInWithGoogle() {
    setError('');
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
    errorBox: { background:'rgba(244,63,94,0.1)', border:'1px solid rgba(244,63,94,0.3)', borderRadius:10, padding:'0.7rem 1rem', fontSize:'0.8rem', color:'#fb7185', marginBottom:'0.75rem' },
    googleBtn: { width:'100%', background:'var(--bg-card)', color:'var(--text-primary)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'0.75rem 1rem', fontSize:'0.88rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.65rem', transition:'all 0.2s' },
    divider: { display:'flex', alignItems:'center', gap:'0.75rem', margin:'1.25rem 0', color:'var(--text-muted)', fontSize:'0.75rem' },
    dividerLine: { flex:1, height:1, background:'rgba(255,255,255,0.07)' },
    fields: { display:'flex', flexDirection:'column' as const, gap:'1rem' },
    field: { display:'flex', flexDirection:'column' as const, gap:'0.4rem' },
    fieldLabel: { fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase' as const, color:'var(--text-secondary)' },
    fieldInput: { background:'var(--bg-input)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'0.75rem 1rem', color:'var(--text-primary)', fontFamily:'inherit', fontSize:'0.9rem', outline:'none', width:'100%' },
    passHint: { fontSize:'0.7rem', color:'var(--text-muted)', marginTop:'0.2rem' },
    submitBtn: { width:'100%', background:'linear-gradient(135deg,var(--primary) 0%,#7c3aed 100%)', color:'white', border:'none', borderRadius:10, padding:'0.85rem', fontSize:'0.95rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 18px rgba(99,102,241,0.35)', marginTop:'0.5rem' },
    signinLink: { textAlign:'center' as const, fontSize:'0.82rem', color:'var(--text-secondary)', marginTop:'1.25rem' },
  };

  if (!authChecked) return null;

  return (
    <div style={s.pageWrap}>
      <LeftPanel
        headline={<>Join thousands<br/>getting <span style={{ background:'linear-gradient(90deg,var(--primary-l),var(--accent))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>smarter<br/>recommendations</span>.</>}
        sub="Create your free account in seconds. Verify your email and get instant access to AI-powered product discovery."
        features={[
          { icon:'✓', color:'teal',   title:'Email Verified Account', desc:'One-time code confirms your identity — no spam ever' },
          { icon:'◎', color:'indigo', title:'Instant Access', desc:'Start chatting with the AI right after your first login' },
          { icon:'⬡', color:'purple', title:'Google Sign-In', desc:'One click with your existing Google account — no password needed' },
          { icon:'◈', color:'gold',   title:'Persistent History', desc:'Your recommendations and sessions are saved to your profile' },
        ]}
        stats={[
          { num:'Free',  label:'Always' },
          { num:'<30s',  label:'Setup' },
          { num:'100%',  label:'Secure' },
          { num:'AI',    label:'Powered' },
        ]}
      />

      <div style={s.rightPanel}>
        <div style={s.formCard}>
          {error && <div style={s.errorBox}>{error}</div>}

          <div style={s.eyebrow}>Get started</div>
          <div style={s.title}>Create your account</div>
          <div style={s.desc}>
            Already have an account?&nbsp;
            <Link href="/login" style={{ color:'var(--primary-l)', fontWeight:600 }}>Sign in →</Link>
          </div>

          <button style={{ ...s.googleBtn, opacity: googleLoading ? 0.5 : 1 }} onClick={signInWithGoogle} disabled={googleLoading} type="button">
            <GoogleIcon />
            {googleLoading ? 'Connecting…' : 'Continue with Google'}
          </button>

          <div style={s.divider}>
            <div style={s.dividerLine}/>
            or create with email
            <div style={s.dividerLine}/>
          </div>

          <form style={s.fields} onSubmit={handleSendOtp} noValidate>
            <div style={s.field}>
              <label style={s.fieldLabel}>Full Name</label>
              <input style={s.fieldInput} type="text" placeholder="John Smith" value={name} onChange={e => setName(e.target.value)} autoComplete="name" required minLength={2} maxLength={100}/>
            </div>
            <div style={s.field}>
              <label style={s.fieldLabel}>Email Address</label>
              <input style={s.fieldInput} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required/>
            </div>
            <div style={s.field}>
              <label style={s.fieldLabel}>Password</label>
              <input style={s.fieldInput} type="password" placeholder="Minimum 8 characters" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" required minLength={8} maxLength={128}/>
              <div style={s.passHint}>At least 8 characters</div>
            </div>
            {/* Terms checkbox */}
            <label style={{ display:'flex', alignItems:'flex-start', gap:'0.6rem', cursor:'pointer' }}>
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={e => { setAgreedToTerms(e.target.checked); setError(''); }}
                style={{ width:15, height:15, accentColor:'var(--primary)', cursor:'pointer', marginTop:2, flexShrink:0 }}
              />
              <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)', lineHeight:1.5 }}>
                I agree to the{' '}
                <Link href="/terms" onClick={handleTermsClick} style={{ color:'var(--primary-l)', fontWeight:600 }}>Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" onClick={handleTermsClick} style={{ color:'var(--primary-l)', fontWeight:600 }}>Privacy Policy</Link>
              </span>
            </label>
            <button style={{ ...s.submitBtn, opacity: (loading || !agreedToTerms) ? 0.5 : 1 }} type="submit" disabled={loading || !agreedToTerms}>
              {loading ? 'Sending code…' : 'Send Verification Code'}
            </button>
          </form>

          <div style={s.signinLink}>
            Have an account?&nbsp;
            <Link href="/login" style={{ color:'var(--primary-l)', fontWeight:700 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
