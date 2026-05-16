'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';

export function Providers({ children }: { children: React.ReactNode }) {
  const { bootstrap } = useAuthStore();

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return <>{children}</>;
}

