import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OPTIXO — AI Product Advisor',
  description: 'OPTIXO: Find your perfect product with AI. Personalised recommendations in 60 seconds.',
  icons: { icon: '/optixo.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
