'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const SessionContext = createContext<User | null>(null);

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!auth) {
      console.warn('Firebase auth is not initialized. Authentication features will be disabled.');
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}
