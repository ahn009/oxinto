'use client';

import PublicHeader from '@/components/PublicHeader';
import Footer from '@/components/Footer';

export default function TermsPage() {
  const sections = [
    {
      title: '1. Acceptance of Terms',
      body: 'By accessing or using OPTIXO ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. We reserve the right to update these terms at any time. Continued use of the Service after changes constitutes acceptance of the revised terms.',
    },
    {
      title: '2. Description of Service',
      body: 'OPTIXO is an AI-powered product recommendation platform. The Service uses conversational AI to understand your preferences and provide personalised product suggestions across various categories. Recommendations are for informational purposes only; we do not guarantee availability, pricing, or suitability for any specific use case.',
    },
    {
      title: '3. User Accounts',
      body: 'To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account. You must provide accurate information during registration. You must be at least 13 years of age to create an account.',
    },
    {
      title: '4. Acceptable Use',
      body: 'You agree not to: (a) use the Service for any illegal purpose; (b) attempt to disrupt, hack, or reverse-engineer the platform; (c) submit false, misleading, or harmful content; (d) use automated tools to access the Service without authorisation; or (e) violate any applicable laws or regulations.',
    },
    {
      title: '5. Intellectual Property',
      body: 'All content, features, and functionality of OPTIXO — including but not limited to text, graphics, logos, and software — are the exclusive property of OPTIXO and its licensors. You may not reproduce, distribute, or create derivative works without express written permission.',
    },
    {
      title: '6. Disclaimer of Warranties',
      body: 'The Service is provided "as is" without warranties of any kind, express or implied. We do not warrant that the Service will be uninterrupted, error-free, or that recommendations will meet your expectations. Use of the Service is at your own risk.',
    },
    {
      title: '7. Limitation of Liability',
      body: 'To the maximum extent permitted by law, OPTIXO shall not be liable for any indirect, incidental, special, or consequential damages arising out of or relating to your use of the Service, even if we have been advised of the possibility of such damages.',
    },
    {
      title: '8. Termination',
      body: 'We reserve the right to suspend or terminate your account at any time for violation of these terms or for any other reason at our sole discretion. You may also delete your account at any time via the Settings page.',
    },
    {
      title: '9. Governing Law',
      body: 'These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles. Any disputes shall be resolved through good-faith negotiation before pursuing legal remedies.',
    },
    {
      title: '10. Contact',
      body: 'If you have questions about these Terms, please contact us at legal@optixo.ai. We aim to respond to all inquiries within 5 business days.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      <PublicHeader />

      <main style={{ flex: 1, padding: '5rem 2rem 6rem', maxWidth: 820, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--primary-l)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>LEGAL</div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.035em', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Terms of Service</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Last updated: January 1, 2026</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {sections.map((s, i) => (
            <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-l)', marginBottom: '0.75rem' }}>{s.title}</h2>
              <p style={{ fontSize: '0.87rem', color: 'var(--text-secondary)', lineHeight: 1.75 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
