'use client';

import { browserLocalPersistence, onAuthStateChanged, setPersistence, User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';

import { auth } from '@/lib/firebase';

interface SessionContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

/**
 * Provider component that manages the user's session state
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      console.error('Firebase auth is not initialized');
      setLoading(false);
      return;
    }

    // Enable persistence
    setPersistence(auth, browserLocalPersistence).catch(error => {
      console.error('Error setting persistence:', error);
    });

    // Get initial user state
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      setLoading(false);
    }

    const unsubscribe = onAuthStateChanged(auth, async user => {
      setUser(user);
      setLoading(false);

      if (user) {
        try {
          // Get the ID token
          const idToken = await user.getIdToken();

          // Create a session cookie
          const response = await fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to create session');
          }
        } catch (error) {
          console.error('Error creating session:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // Delete the session cookie
      await fetch('/api/auth/session', {
        method: 'DELETE',
      });

      // Sign out from Firebase
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <SessionContext.Provider value={{ user, loading, signOut }}>{children}</SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
