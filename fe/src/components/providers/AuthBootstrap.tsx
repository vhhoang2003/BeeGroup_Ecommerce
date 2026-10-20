'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

/** Restores the session from the refresh cookie once on app load (README §6.3 FE rules). */
export default function AuthBootstrap() {
  const init = useAuthStore((state) => state.init);
  useEffect(() => {
    void init();
  }, [init]);
  return null;
}
