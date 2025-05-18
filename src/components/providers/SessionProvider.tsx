'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface SessionContextType {
  user: User | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  loading: true,
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      console.error('Firebase auth is not initialized');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, user => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return <SessionContext.Provider value={{ user, loading }}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
