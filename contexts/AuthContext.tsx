'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  User
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  error: null,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Set persistence to local
    setPersistence(auth, browserLocalPersistence);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Store minimal user info in cookies for middleware
        Cookies.set('user', JSON.stringify({
          uid: user.uid,
          email: user.email,
          role: 'user' // You can fetch the actual role from Firestore if needed
        }));
        
        // If on login page, redirect to dashboard
        if (window.location.pathname === '/auth/login') {
          router.push('/');
        }
      } else {
        setUser(null);
        Cookies.remove('user');
        // If not on a public path, redirect to login
        if (!window.location.pathname.startsWith('/auth/')) {
          router.push('/auth/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignIn = async (email: string, password: string) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userData = userDoc.data();

      // Store user data in cookies
      Cookies.set('user', JSON.stringify({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        role: userData?.role || 'user'
      }));

      // Redirect to dashboard
      router.push('/');
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      Cookies.remove('user');
      router.push('/auth/login');
    } catch (error: any) {
      console.error('Sign out error:', error);
      setError(error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn: handleSignIn,
        signOut: handleSignOut,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}