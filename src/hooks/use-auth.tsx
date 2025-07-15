
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
      setUser(user);
      if (user) {
        // Fetch user document from Firestore to get the role
        const db = getFirestore();
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const roleId = userData.roleId;

          // Fetch the specific role document to get its name
          const roleDocRef = doc(db, 'roles', roleId);
          const roleDoc = await getDoc(roleDocRef);

          if (roleDoc.exists()) {
            const roleName = roleDoc.data()?.name?.toLowerCase();
            setUserRole(roleName);
          } else {
             // Default to employee if role is not found, or handle as an error
             setUserRole(null);
          }
        } else {
            // If there's no user document, they might be an old user or an error occurred
            // Defaulting to null role for safety, but could also redirect or show error
            setUserRole(null); 
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
