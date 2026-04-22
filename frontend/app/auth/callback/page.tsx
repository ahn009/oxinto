'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as api from '@/lib/api';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      router.replace('/login?error=google_failed');
      return;
    }

    localStorage.setItem('smart_token', token);
    localStorage.removeItem('smart_session_id');

    api.getMe()
      .then((user) => {
        localStorage.setItem('smart_user', JSON.stringify(user));
        router.replace('/');
      })
      .catch(() => {
        router.replace('/');
      });
  }, [router, searchParams]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)' }}>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Signing you in…</div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackInner />
    </Suspense>
  );
}
