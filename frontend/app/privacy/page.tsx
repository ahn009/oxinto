'use client';

import PublicHeader from '@/components/PublicHeader';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  const sections = [
    {
      title: '1. Introduction',
      body: 'OPTIXO ("we," "our," or "us") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service. Please read this policy carefully. By using OPTIXO, you consent to the practices described herein.',
    },
    {
      title: '2. Information We Collect',
      body: 'We collect: (a) Account information — name, email address, and hashed password when you register; (b) Usage data — your session responses and product recommendation history, used to personalise your experience; (c) Technical data — IP address, browser type, and device information collected automatically for security and analytics purposes.',
    },
    {
      title: '3. How We Use Your Information',
      body: 'We use your information to: provide and improve the OPTIXO Service; personalise recommendations based on your history; send transactional emails (e.g., OTP verification, password reset); monitor for fraud and security threats; comply with legal obligations. We do not use your data for targeted advertising.',
    },
    {
      title: '4. Data Sharing',
      body: 'We do not sell, rent, or trade your personal information to third parties. We may share data with: service providers who assist in operating our platform (e.g., hosting, email delivery), under strict confidentiality agreements; law enforcement or regulatory bodies when required by law. We will always notify you of any such disclosures where legally permitted.',
    },
    {
      title: '5. Data Retention',
      body: 'We retain your account data for as long as your account is active. Session history is retained to improve personalisation. You may request deletion of your account and all associated data at any time via the Settings page. Deleted data is purged from our systems within 30 days.',
    },
    {
      title: '6. Cookies & Tracking',
      body: 'OPTIXO uses essential browser storage (localStorage/sessionStorage) to maintain your login session and preferences. We do not use third-party tracking cookies or advertising pixels. You can clear your browser storage at any time via your browser settings.',
    },
    {
      title: '7. Security',
      body: 'We implement industry-standard security measures including: encrypted data transmission (HTTPS/TLS); hashed password storage; JWT-based authentication with expiry; email OTP verification for new accounts. While we take every precaution, no online service is 100% secure. Please use a strong, unique password.',
    },
    {
      title: '8. Your Rights',
      body: 'Depending on your jurisdiction, you may have the right to: access the personal data we hold about you; correct inaccurate information; request deletion of your data; object to or restrict processing; data portability. To exercise any of these rights, contact us at privacy@optixo.ai.',
    },
    {
      title: '9. Children\'s Privacy',
      body: 'OPTIXO is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us immediately and we will delete it promptly.',
    },
    {
      title: '10. Changes to This Policy',
      body: 'We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a prominent notice on the platform. Your continued use of OPTIXO after changes take effect constitutes acceptance of the revised policy.',
    },
    {
      title: '11. Contact Us',
      body: 'If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us at privacy@optixo.ai. We aim to respond to all privacy-related inquiries within 5 business days.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      <PublicHeader />

      <main style={{ flex: 1, padding: '5rem 2rem 6rem', maxWidth: 820, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--accent)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>LEGAL</div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.035em', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Privacy Policy</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Last updated: January 1, 2026</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {sections.map((s, i) => (
            <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.75rem' }}>{s.title}</h2>
              <p style={{ fontSize: '0.87rem', color: 'var(--text-secondary)', lineHeight: 1.75 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
