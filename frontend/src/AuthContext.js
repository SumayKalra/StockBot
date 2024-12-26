// src/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { auth } from './firebase'; // Ensure the path is correct
import { onAuthStateChanged } from 'firebase/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken();
          setToken(idToken);
        } catch (error) {
          console.error("Error fetching ID token:", error);
          setToken(null);
        }
      } else {
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = () => {
    return auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
