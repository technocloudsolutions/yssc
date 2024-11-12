'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  setPersistence, 
  browserLocalPersistence,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { CustomUser, UserData } from '@/types/user';
import { useRouter } from 'next/navigation';

export interface AuthContextType {
  user: CustomUser | null;
  userData: UserData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  userData: null, 
  loading: true,
  login: async () => { throw new Error('login not implemented') },
  logout: async () => { throw new Error('logout not implemented') }
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const login = async (email: string, password: string) => {
    try {
      console.log('Starting login process...');
      await setPersistence(auth, browserLocalPersistence);
      console.log('Persistence set to browserLocalPersistence');
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User signed in:', userCredential.user.email);
      
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = { id: userDoc.id, ...userDoc.data() } as UserData;
        console.log('User data fetched:', userData);
        setUserData(userData);
        
        const customUser = {
          ...userCredential.user,
          role: userData.role
        } as CustomUser;
        setUser(customUser);
        console.log('Login successful, user set with role:', userData.role);
      } else {
        console.error('No user document found in Firestore');
        throw new Error('User data not found');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserData(null);
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  useEffect(() => {
    console.log('AuthProvider useEffect running...');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed. User:', firebaseUser?.email);
      try {
        if (firebaseUser) {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where("email", "==", firebaseUser.email));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = { id: userDoc.id, ...userDoc.data() } as UserData;
            console.log('User data retrieved:', userData);
            setUserData(userData);
            
            const customUser = {
              ...firebaseUser,
              role: userData.role
            } as CustomUser;
            setUser(customUser);
            console.log('User state updated with role:', userData.role);
          } else {
            console.error('No user document found for:', firebaseUser.email);
          }
        } else {
          console.log('No firebase user, clearing state');
          setUser(null);
          setUserData(null);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
        setUser(null);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      console.log('Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    console.log('Current auth state:', {
      user: user?.email,
      userRole: user?.role,
      userData: userData,
      loading
    });
  }, [user, userData, loading]);

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);