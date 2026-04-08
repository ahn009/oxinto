'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LeftPanel from '@/components/LeftPanel';
import * as api from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [strength, setStrength] = useState(0);
  const [resetId, setResetId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  function startCooldown(secs: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(secs);
    timerRef.current = setInterval(() => {
      setCountdown(p => { if (p <= 1) { clearInterval(timerRef.current!); return 0; } return p - 1; });
    }, 1000);
  }

  function computeStrength(p: string) {
    let s = 0;
    if (p.length >= 8)  s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.includes('@')) { setError('Enter a valid email address.'); return; }
    setLoading(true);
    try {
      const data = await api.forgotPassword(email);
      // resetId may be absent if email not found (anti-enumeration) — still advance to step 2
      setResetId(data.resetId || '');
      setStep(2);
      startCooldown(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) { setError(err.message || 'Failed to send code. Please try again.'); }
    finally { setLoading(false); }
  }

  async function handleVerifyReset(e: React.FormEvent) {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length !== 6) { setError('Enter all 6 digits.'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError('');
    setLoading(true);
    try {
      await api.resetPassword(resetId, otp, newPassword);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Incorrect code or expired. Please try again.');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally { setLoading(false); }
  }

  async function handleResend() {
    if (countdown > 0) return;
    setError('');
    try {
      const data = await api.forgotPassword(email);
      setResetId(data.resetId || '');
      setSuccess('New code sent!');
      startCooldown(60);
    } catch (err: any) { setError(err.message || 'Connection error.'); }
  }

  function handleDigitChange(i: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1);
    const nd = [...digits]; nd[i] = digit; setDigits(nd);
    if (digit && i < 5) inputRefs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (digits[i]) { const nd = [...digits]; nd[i] = ''; setDigits(nd); }
      else if (i > 0) { const nd = [...digits]; nd[i-1]=''; setDigits(nd); inputRefs.current[i-1]?.focus(); }
    }
    if (e.key==='ArrowLeft'  && i>0) inputRefs.current[i-1]?.focus();
    if (e.key==='ArrowRight' && i<5) inputRefs.current[i+1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0,6);
    const nd = [...digits];
    Array.from(text).forEach((ch,idx) => { if(idx<6) nd[idx]=ch; });
    setDigits(nd);
    inputRefs.current[Math.min(text.length,5)]?.focus();
  }

  const strengthColors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#06d6a0'];
  const strengthLabels = ['', 'Too weak', 'Could be stronger', 'Good password', 'Strong password'];

  const s = {
    pageWrap: { minHeight:'100vh', display:'flex', position:'relative' as const, zIndex:1 },
    rightPanel: { flex:1, display:'flex', flexDirection:'column' as const, justifyContent:'center', alignItems:'center', padding:'2.5rem 2rem', background:'var(--bg-surface)' },
    formCard: { width:'100%', maxWidth:420 },
    eyebrow: { fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase' as const, color:'var(--primary-l)', marginBottom:'0.5rem' },
    title: { fontSize:'1.9rem', fontWeight:800, letterSpacing:'-0.025em', marginBottom:'0.35rem' },
    desc: { fontSize:'0.82rem', color:'var(--text-secondary)', marginBottom:'1.5rem', lineHeight:1.5 },
    errorBox: { background:'rgba(244,63,94,0.1)', border:'1px solid rgba(244,63,94,0.3)', borderRadius:10, padding:'0.7rem 1rem', fontSize:'0.8rem', color:'#fb7185', marginBottom:'0.75rem' },
    successBox: { background:'rgba(6,214,160,0.1)', border:'1px solid rgba(6,214,160,0.3)', borderRadius:10, padding:'0.7rem 1rem', fontSize:'0.8rem', color:'var(--accent)', marginBottom:'0.75rem' },
    fields: { display:'flex', flexDirection:'column' as const, gap:'1rem' },
    field: { display:'flex', flexDirection:'column' as const, gap:'0.4rem' },
    fieldLabel: { fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase' as const, color:'var(--text-secondary)' },
    fieldInput: { background:'var(--bg-input)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'0.75rem 1rem', color:'var(--text-primary)', fontFamily:'inherit', fontSize:'0.9rem', outline:'none', width:'100%' },
    submitBtn: { width:'100%', background:'linear-gradient(135deg,var(--primary) 0%,#7c3aed 100%)', color:'white', border:'none', borderRadius:10, padding:'0.85rem', fontSize:'0.95rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 18px rgba(99,102,241,0.35)', marginTop:'0.5rem' },
    stepsBar: { display:'flex', alignItems:'center', marginBottom:'1.75rem' },
    stepDot: (active: boolean, done: boolean) => ({ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.72rem', fontWeight:700, border:`2px solid ${active ? 'var(--primary)' : done ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`, background: active ? 'var(--primary)' : done ? 'var(--accent)' : 'var(--bg-card)', color: active || done ? 'white' : 'var(--text-muted)', flexShrink:0 }),
    stepLine: (done: boolean) => ({ flex:1, height:2, background: done ? 'var(--accent)' : 'rgba(255,255,255,0.07)' }),
    otpGroup: { display:'flex', gap:'0.55rem', justifyContent:'center' },
    otpDigit: { width:48, height:56, background:'var(--bg-input)', border:'1.5px solid rgba(255,255,255,0.1)', borderRadius:10, color:'var(--text-primary)', fontFamily:'inherit', fontSize:'1.4rem', fontWeight:700, textAlign:'center' as const, outline:'none' },
    infoBox: { background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:10, padding:'0.65rem 1rem', fontSize:'0.78rem', color:'var(--primary-l)', marginBottom:'1rem' },
    passWrapper: { position:'relative' as const },
    passToggle: { position:'absolute' as const, right:'0.75rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:0 },
    strengthBar: { height:3, background:'rgba(255,255,255,0.07)', borderRadius:2, marginTop:'0.5rem', overflow:'hidden' },
    resendRow: { textAlign:'center' as const, marginTop:'0.5rem', fontSize:'0.8rem', color:'var(--text-secondary)' },
    resendBtn: { background:'none', border:'none', color:'var(--primary-l)', fontWeight:600, cursor:'pointer', fontFamily:'inherit', fontSize:'inherit', padding:0 },
    backLink: { marginTop:'1.5rem', fontSize:'0.82rem', color:'var(--text-secondary)', textAlign:'center' as const },
    doneIcon: { width:64, height:64, borderRadius:'50%', background:'rgba(6,214,160,0.1)', border:'2px solid rgba(6,214,160,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem' },
  };

  return (
    <div style={s.pageWrap}>
      <LeftPanel
        headline={<>Forgot your<br/>password? <span style={{ background:'linear-gradient(90deg,var(--primary-l),var(--accent))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>No<br/>problem.</span></>}
        sub="Reset it securely in under a minute. We'll send a one-time code to your registered email."
        features={[
          { icon:'✓', color:'teal',   title:'Secure OTP Reset', desc:'6-digit code expires in 10 minutes — nobody else can intercept it' },
          { icon:'◎', color:'indigo', title:'Email Verified', desc:'Only works for your registered email address' },
          { icon:'⬡', color:'purple', title:'Rate Protected', desc:'Brute-force attempts are automatically blocked' },
          { icon:'◈', color:'gold',   title:'Stay Logged In', desc:'After reset, sign in once and stay authenticated for 7 days' },
        ]}
        stats={[
          { num:'10m', label:'OTP Expiry' },
          { num:'5',   label:'Max Tries' },
          { num:'AES', label:'Encrypted' },
          { num:'JWT', label:'Session' },
        ]}
      />

      <div style={s.rightPanel}>
        <div style={s.formCard}>
          {/* Step indicator */}
          <div style={s.stepsBar}>
            <div style={s.stepDot(step===1, step>1)}>1</div>
            <div style={s.stepLine(step>1)}/>
            <div style={s.stepDot(step===2, step>2)}>2</div>
            <div style={s.stepLine(step>2)}/>
            <div style={s.stepDot(step===3, false)}>3</div>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1.5rem', marginTop:'-0.75rem' }}>
            {['Email','Verify','New Password'].map((l,i) => (
              <div key={i} style={{ fontSize:'0.65rem', fontWeight:600, color: step===i+1 ? 'var(--primary-l)' : step>i+1 ? 'var(--accent)' : 'var(--text-muted)', textTransform:'uppercase' as const, letterSpacing:'0.06em', flex:1, textAlign:'center' as const }}>{l}</div>
            ))}
          </div>

          {error   && <div style={s.errorBox}>{error}</div>}
          {success && <div style={s.successBox}>{success}</div>}

          {/* Step 1 */}
          {step === 1 && (
            <form style={s.fields} onSubmit={handleForgot} noValidate>
              <div style={s.eyebrow}>Password reset</div>
              <div style={s.title}>Forgot password?</div>
              <div style={s.desc}>
                Enter your email and we&apos;ll send a 6-digit reset code.<br/>
                <Link href="/login" style={{ color:'var(--primary-l)', fontWeight:600 }}>← Back to sign in</Link>
              </div>
              <div style={s.field}>
                <label style={s.fieldLabel}>Email Address</label>
                <input style={s.fieldInput} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required/>
              </div>
              <button style={{ ...s.submitBtn, opacity: loading ? 0.5 : 1 }} type="submit" disabled={loading}>
                {loading ? 'Sending…' : 'Send Reset Code'}
              </button>
            </form>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <form style={s.fields} onSubmit={handleVerifyReset} noValidate>
              <div style={s.eyebrow}>Check your email</div>
              <div style={s.title}>Enter the code</div>
              <div style={s.desc}>We sent a 6-digit code to <strong>{email}</strong></div>
              <div style={s.infoBox}>Code expires in <strong>10 minutes</strong>. Check your spam folder if needed.</div>
              <div style={{ ...s.field, alignItems:'center' }}>
                <label style={{ ...s.fieldLabel, textAlign:'center', width:'100%' }}>Reset Code</label>
                <div style={s.otpGroup} onPaste={handlePaste}>
                  {digits.map((d,i) => (
                    <input key={i} ref={el => { inputRefs.current[i] = el; }} style={{ ...s.otpDigit, borderColor: d ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)' }} type="text" inputMode="numeric" maxLength={1} value={d} onChange={e => handleDigitChange(i, e.target.value)} onKeyDown={e => handleKeyDown(i, e)} autoComplete={i===0?'one-time-code':undefined}/>
                  ))}
                </div>
              </div>
              <div style={s.field}>
                <label style={s.fieldLabel}>New Password</label>
                <div style={s.passWrapper}>
                  <input
                    style={{ ...s.fieldInput, paddingRight:'2.5rem' }}
                    type={showPass ? 'text' : 'password'}
                    placeholder="Minimum 8 characters"
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setStrength(computeStrength(e.target.value)); }}
                    autoComplete="new-password" required minLength={8}
                  />
                  <button style={s.passToggle} type="button" onClick={() => setShowPass(p => !p)}>
                    {showPass
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                <div style={s.strengthBar}>
                  <div style={{ height:'100%', width:`${(strength/4)*100}%`, background: strengthColors[strength] || 'transparent', borderRadius:2, transition:'all 0.3s' }}/>
                </div>
                <div style={{ fontSize:'0.7rem', color: strengthColors[strength] || 'var(--text-muted)', marginTop:'0.2rem' }}>
                  {newPassword ? strengthLabels[strength] : 'At least 8 characters'}
                </div>
              </div>
              <button style={{ ...s.submitBtn, opacity: loading ? 0.5 : 1 }} type="submit" disabled={loading}>
                {loading ? 'Resetting…' : 'Reset Password'}
              </button>
              <div style={s.resendRow}>
                Didn&apos;t get the code?&nbsp;
                <button style={{ ...s.resendBtn, opacity: countdown > 0 ? 0.4 : 1 }} onClick={handleResend} disabled={countdown > 0} type="button">
                  Resend {countdown > 0 && `(${countdown}s)`}
                </button>
              </div>
              <div style={{ ...s.resendRow, marginTop:'0.4rem' }}>
                <button style={{ ...s.resendBtn, color:'var(--text-muted)' }} onClick={() => { setStep(1); setDigits(['','','','','','']); setError(''); }} type="button">
                  ← Use a different email
                </button>
              </div>
            </form>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div style={{ textAlign:'center', padding:'1rem 0' }}>
              <div style={s.doneIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--primary-l)', marginBottom:'0.4rem' }}>All done</div>
              <div style={{ fontSize:'1.6rem', fontWeight:800, letterSpacing:'-0.025em', marginBottom:'0.5rem' }}>Password reset!</div>
              <div style={{ fontSize:'0.82rem', color:'var(--text-secondary)', lineHeight:1.5 }}>
                Your password has been updated successfully. You can now sign in with your new password.
              </div>
              <Link href="/login" style={{ display:'inline-block', marginTop:'1.5rem', background:'linear-gradient(135deg,var(--primary),#7c3aed)', color:'white', padding:'0.85rem 2rem', borderRadius:10, fontWeight:700, fontSize:'0.95rem', boxShadow:'0 4px 18px rgba(99,102,241,0.35)' }}>
                Sign In Now →
              </Link>
            </div>
          )}

          <div style={s.backLink}>
            Remember your password?&nbsp;
            <Link href="/login" style={{ color:'var(--primary-l)', fontWeight:600 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
