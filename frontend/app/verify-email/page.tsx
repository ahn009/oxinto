'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as api from '@/lib/api';

const LogoSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z" fill="white" opacity="0.95"/>
    <path d="M19 16L19.9 18.1L22 19L19.9 19.9L19 22L18.1 19.9L16 19L18.1 18.1L19 16Z" fill="white" opacity="0.7"/>
  </svg>
);

export default function VerifyEmailPage() {
  const router = useRouter();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [session, setSession] = useState<{ tempUserId: string; email: string } | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = sessionStorage.getItem('otp_session');
    if (!raw) { router.replace('/signup'); return; }
    try {
      const s = JSON.parse(raw);
      if (!s.tempUserId || !s.email) { router.replace('/signup'); return; }
      setSession(s);
    } catch {
      router.replace('/signup');
    }
    startCooldown(60);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [router]);

  useEffect(() => {
    if (session && inputRefs.current[0]) inputRefs.current[0].focus();
  }, [session]);

  function startCooldown(seconds: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(seconds);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  function handleDigitChange(i: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[i] = digit;
    setDigits(newDigits);
    if (digit && i < 5) inputRefs.current[i + 1]?.focus();
    if (newDigits.every(d => d)) {
      setTimeout(() => submitOtp(newDigits.join('')), 120);
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        const nd = [...digits]; nd[i] = ''; setDigits(nd);
      } else if (i > 0) {
        const nd = [...digits]; nd[i - 1] = ''; setDigits(nd);
        inputRefs.current[i - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft'  && i > 0) inputRefs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) inputRefs.current[i + 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const nd = [...digits];
    Array.from(text).forEach((ch, idx) => { if (idx < 6) nd[idx] = ch; });
    setDigits(nd);
    const next = Math.min(text.length, 5);
    inputRefs.current[next]?.focus();
  }

  async function submitOtp(otp: string) {
    if (!session) return;
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const data = await api.verifyOtp(session.tempUserId, otp);
      localStorage.setItem('smart_token', data.token);
      localStorage.setItem('smart_user', JSON.stringify(data.user));
      sessionStorage.removeItem('otp_session');
      setDone(true);
      setTimeout(() => router.push('/'), 1500);
    } catch (err: any) {
      setError(err.message || 'Incorrect code. Please try again.');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!session || countdown > 0) return;
    setError(''); setSuccess('');
    setResendLoading(true);
    try {
      await api.resendOtp(session.tempUserId);
      setSuccess('New code sent! Check your inbox.');
      startCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to resend. Please try again.');
    } finally {
      setResendLoading(false);
    }
  }

  const s = {
    page: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem 1.25rem', position:'relative' as const, zIndex:1 },
    card: { width:'100%', maxWidth:440, background:'var(--bg-surface)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:20, padding:'2.5rem 2rem', boxShadow:'0 24px 80px rgba(0,0,0,0.5)' },
    logo: { display:'flex', alignItems:'center', gap:'0.65rem', marginBottom:'2rem' },
    logoIcon: { width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,var(--primary),#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 16px var(--primary-glow)', flexShrink:0 },
    logoText: { fontSize:'0.9rem', fontWeight:700, background:'linear-gradient(90deg,#fff,var(--primary-l))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' },
    emailIcon: { width:72, height:72, borderRadius:'50%', background:'rgba(99,102,241,0.1)', border:'2px solid rgba(99,102,241,0.25)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem' },
    eyebrow: { fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase' as const, color:'var(--primary-l)', textAlign:'center' as const, marginBottom:'0.4rem' },
    title: { fontSize:'1.7rem', fontWeight:800, letterSpacing:'-0.025em', textAlign:'center' as const, marginBottom:'0.5rem' },
    desc: { fontSize:'0.82rem', color:'var(--text-secondary)', textAlign:'center' as const, lineHeight:1.55, marginBottom:'1.5rem' },
    infoBox: { background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:10, padding:'0.65rem 1rem', fontSize:'0.78rem', color:'var(--primary-l)', textAlign:'center' as const, marginBottom:'1.5rem' },
    errorBox: { background:'rgba(244,63,94,0.1)', border:'1px solid rgba(244,63,94,0.3)', borderRadius:10, padding:'0.7rem 1rem', fontSize:'0.8rem', color:'#fb7185', marginBottom:'1rem', textAlign:'center' as const },
    successBox: { background:'rgba(6,214,160,0.1)', border:'1px solid rgba(6,214,160,0.3)', borderRadius:10, padding:'0.7rem 1rem', fontSize:'0.8rem', color:'var(--accent)', marginBottom:'1rem', textAlign:'center' as const },
    otpLabel: { fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase' as const, color:'var(--text-secondary)', textAlign:'center' as const, marginBottom:'0.75rem' },
    otpGroup: { display:'flex', gap:'0.55rem', justifyContent:'center', marginBottom:'1.5rem' },
    otpDigit: { width:52, height:60, background:'var(--bg-input)', border:'1.5px solid rgba(255,255,255,0.1)', borderRadius:12, color:'var(--text-primary)', fontFamily:'inherit', fontSize:'1.5rem', fontWeight:700, textAlign:'center' as const, outline:'none' },
    submitBtn: { width:'100%', background:'linear-gradient(135deg,var(--primary) 0%,#7c3aed 100%)', color:'white', border:'none', borderRadius:11, padding:'0.9rem', fontSize:'0.95rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 18px rgba(99,102,241,0.35)' },
    footerLinks: { display:'flex', flexDirection:'column' as const, alignItems:'center', gap:'0.6rem', marginTop:'1.25rem' },
    footerRow: { fontSize:'0.8rem', color:'var(--text-secondary)', textAlign:'center' as const },
    resendBtn: { background:'none', border:'none', color:'var(--primary-l)', fontWeight:600, cursor:'pointer', fontFamily:'inherit', fontSize:'0.8rem', padding:0 },
    doneIcon: { width:72, height:72, borderRadius:'50%', background:'rgba(6,214,160,0.1)', border:'2px solid rgba(6,214,160,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem' },
  };

  if (done) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.logo}>
            <div style={s.logoIcon}><LogoSVG /></div>
            <div style={s.logoText}>Smart Product Advisor</div>
          </div>
          <div style={{ textAlign:'center' as const }}>
            <div style={s.doneIcon}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <div style={{ fontSize:'1.6rem', fontWeight:800, marginBottom:'0.5rem' }}>You&apos;re all set!</div>
            <div style={{ fontSize:'0.85rem', color:'var(--text-secondary)', lineHeight:1.5, marginBottom:'1.5rem' }}>Account created and verified. Redirecting you to the app…</div>
            <div style={{ display:'flex', justifyContent:'center' }}>
              <div style={{ width:28, height:28, border:'3px solid rgba(99,102,241,0.2)', borderTopColor:'var(--primary-l)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>
          <div style={s.logoIcon}><LogoSVG /></div>
          <div style={s.logoText}>Smart Product Advisor</div>
        </div>

        <div style={s.emailIcon}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--primary-l)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>

        <div style={s.eyebrow}>Email verification</div>
        <div style={s.title}>Check your inbox</div>
        <div style={s.desc}>
          We sent a 6-digit code to <strong style={{ color:'var(--text-primary)' }}>{session?.email || 'your email'}</strong>.<br/>
          Enter it below to activate your account.
        </div>

        <div style={s.infoBox}>
          Code expires in <strong>10 minutes</strong> &nbsp;·&nbsp; Check spam if not received
        </div>

        {error   && <div style={s.errorBox}>{error}</div>}
        {success && <div style={s.successBox}>{success}</div>}

        <div style={s.otpLabel}>Verification Code</div>
        <div style={s.otpGroup} onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              style={{ ...s.otpDigit, borderColor: d ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)', background: d ? 'rgba(99,102,241,0.06)' : 'var(--bg-input)' }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleDigitChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              autoComplete={i === 0 ? 'one-time-code' : undefined}
            />
          ))}
        </div>

        <button
          style={{ ...s.submitBtn, opacity: loading || digits.join('').length !== 6 ? 0.5 : 1 }}
          onClick={() => submitOtp(digits.join(''))}
          disabled={loading || digits.join('').length !== 6}
          type="button"
        >
          {loading ? 'Verifying…' : 'Verify & Create Account'}
        </button>

        <div style={s.footerLinks}>
          <div style={s.footerRow}>
            Didn&apos;t receive it?&nbsp;
            <button
              style={{ ...s.resendBtn, opacity: countdown > 0 || resendLoading ? 0.4 : 1, cursor: countdown > 0 ? 'not-allowed' : 'pointer' }}
              onClick={handleResend}
              disabled={countdown > 0 || resendLoading}
              type="button"
            >
              Resend code {countdown > 0 && `(${countdown}s)`}
            </button>
          </div>
          <div style={s.footerRow}>
            <Link href="/signup" style={{ color:'var(--text-muted)', fontSize:'0.78rem' }}>← Use a different email</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
