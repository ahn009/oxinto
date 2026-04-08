'use client';

interface Feature {
  icon: string;
  color: 'indigo' | 'teal' | 'purple' | 'gold';
  title: string;
  desc: string;
}

interface Stat {
  num: string;
  label: string;
}

interface LeftPanelProps {
  headline: React.ReactNode;
  sub: string;
  features: Feature[];
  stats: Stat[];
}

const LogoSVG = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z" fill="white" opacity="0.95"/>
    <path d="M19 16L19.9 18.1L22 19L19.9 19.9L19 22L18.1 19.9L16 19L18.1 18.1L19 16Z" fill="white" opacity="0.7"/>
    <path d="M5 3L5.7 5.3L8 6L5.7 6.7L5 9L4.3 6.7L2 6L4.3 5.3L5 3Z" fill="white" opacity="0.6"/>
  </svg>
);

const dotColors: Record<string, React.CSSProperties> = {
  indigo: { background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.25)' },
  teal:   { background: 'rgba(6,214,160,0.15)',  border: '1px solid rgba(6,214,160,0.2)' },
  purple: { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)' },
  gold:   { background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.2)' },
};

export default function LeftPanel({ headline, sub, features, stats }: LeftPanelProps) {
  return (
    <div style={{
      width: '46%',
      background: 'linear-gradient(155deg, #130d2e 0%, #0c0a1e 35%, #0a0f1e 65%, #060b18 100%)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '3rem 3.5rem',
      borderRight: '1px solid rgba(99,102,241,0.12)',
    }}>
      {/* Orbs */}
      <div style={{ position:'absolute', width:480, height:480, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 70%)', top:-140, left:-140, pointerEvents:'none' }}/>
      <div style={{ position:'absolute', width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle,rgba(139,92,246,0.12) 0%,transparent 70%)', bottom:-80, right:-80, pointerEvents:'none' }}/>
      <div style={{ position:'absolute', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(6,214,160,0.06) 0%,transparent 70%)', bottom:'30%', right:'10%', pointerEvents:'none' }}/>
      {/* Dot grid overlay */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,0.06) 1px,transparent 1px)', backgroundSize:'28px 28px', pointerEvents:'none' }}/>

      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', position:'relative', zIndex:2 }}>
        <div style={{ width:40, height:40, borderRadius:11, background:'linear-gradient(135deg,var(--primary),#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 20px var(--primary-glow)', flexShrink:0 }}>
          <LogoSVG />
        </div>
        <div style={{ fontSize:'1rem', fontWeight:700, background:'linear-gradient(90deg,#fff,var(--primary-l))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
          Smart Product Advisor
        </div>
      </div>

      {/* Center */}
      <div style={{ position:'relative', zIndex:2 }}>
        <div style={{ fontSize:'2.5rem', fontWeight:900, lineHeight:1.15, letterSpacing:'-0.03em', marginBottom:'1rem', background:'linear-gradient(135deg,#fff 0%,rgba(255,255,255,0.75) 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
          {headline}
        </div>
        <div style={{ fontSize:'0.95rem', color:'rgba(255,255,255,0.5)', lineHeight:1.6, marginBottom:'2.5rem', maxWidth:340 }}>
          {sub}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {features.map((f, i) => (
            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'0.85rem' }}>
              <div style={{ width:32, height:32, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem', flexShrink:0, marginTop:1, ...dotColors[f.color] }}>
                {f.icon}
              </div>
              <div>
                <strong style={{ display:'block', fontSize:'0.85rem', fontWeight:600, color:'rgba(255,255,255,0.88)', marginBottom:1 }}>{f.title}</strong>
                <span style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)' }}>{f.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ position:'relative', zIndex:2, paddingTop:'2rem', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex', gap:'1.5rem' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign:'center' }}>
              <div style={{ fontSize:'1.4rem', fontWeight:800, background:'linear-gradient(90deg,var(--primary-l),var(--accent))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{s.num}</div>
              <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.35)', fontWeight:500, marginTop:1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
