'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 jam

export default function useSessionTimeout() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, TIMEOUT_MS);
  };

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, []);
}
