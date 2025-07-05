'use client';

import { browserLocalPersistence, onAuthStateChanged, setPersistence, User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';

import { auth } from '@/lib/firebase';
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
  firebaseUser: User | null;
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
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      logger.error('Firebase auth is not initialized');
      setLoading(false);
      return;
    }

    // Enable persistence
    setPersistence(auth, browserLocalPersistence).catch(error => {
      logger.error('Error setting persistence:', { error });
    });

    // Get initial user state
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(serializeUser(currentUser));
      setFirebaseUser(currentUser);
      setLoading(false);
    }

    const unsubscribe = onAuthStateChanged(auth, async user => {
      setUser(serializeUser(user));
      setFirebaseUser(user);
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
          logger.error('Error creating session:', { error });
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
