
"use client";

import { useState, useEffect, useContext, createContext, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { doc, getDoc, getFirestore } from 'firebase/firestore';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  userRole: string | null;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, userRole: null });

export function AuthContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Sidebar - Auth User:', user); // Log 1: Usuário do Firebase Auth
      setUser(user);
      if (user) {
        // Get user role from custom claims or Firestore
        const tokenResult = await user.getIdTokenResult();
        const claimsRole = tokenResult.claims.role;
        console.log('Sidebar - User Role from Claims:', claimsRole); // Log 2: Role dos claims

        if (claimsRole === 'student') {
            setUserRole('student');
        } else {
             setUserRole('employee');
        }

      } else {
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, userRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
