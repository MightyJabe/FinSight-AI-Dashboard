'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import logger from '@/lib/logger';

interface SerializableUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

interface SessionContextType {
  user: SerializableUser | null;
  firebaseUser: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  signOut: async () => {},
});

/**
 *
 */
function serializeUser(user: User | null): SerializableUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
  };
}

/**
 * Provider component that manages the user's session state
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SerializableUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: undefined | (() => void);

    const init = async () => {
      try {
        const [{ browserLocalPersistence, onAuthStateChanged, setPersistence }, { auth }] =
          await Promise.all([import('firebase/auth'), import('@/lib/firebase')]);

        if (!auth) {
          logger.error('Firebase auth is not initialized');
          setLoading(false);
          return;
        }

        setPersistence(auth, browserLocalPersistence).catch(error => {
          logger.error('Error setting persistence:', { error });
        });

        const currentUser = auth.currentUser;
        if (currentUser) {
          setUser(serializeUser(currentUser));
          setFirebaseUser(currentUser);
          setLoading(false);
        }

        unsubscribe = onAuthStateChanged(auth, async user => {
          setUser(serializeUser(user));
          setFirebaseUser(user);
          setLoading(false);

          if (user) {
            try {
              const idToken = await user.getIdToken();
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
              logger.error('Error creating session:', { error });
            }
          }
        });
      } catch (error) {
        logger.error('Error initializing Firebase auth', { error });
        setLoading(false);
      }
    };

    void init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      // Delete the session cookie
      await fetch('/api/auth/session', {
        method: 'DELETE',
      });

      const { auth } = await import('@/lib/firebase');
      await auth.signOut();
    } catch (error) {
      logger.error('Error signing out:', { error });
    }
  };

  return (
    <SessionContext.Provider value={{ user, firebaseUser, loading, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
