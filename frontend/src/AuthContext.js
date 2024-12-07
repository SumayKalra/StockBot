// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase"; // Adjust the path if necessary

// Create a Context for Authentication
export const AuthContext = createContext();

// Create a Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Store the user object
  const [token, setToken] = useState(null); // Store the ID token
  const [loading, setLoading] = useState(true); // To show a loading spinner while checking auth state

  useEffect(() => {
    // Subscribe to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const newToken = await currentUser.getIdToken(true); // Force token refresh
          setUser(currentUser);
          setToken(newToken);
          localStorage.setItem("token", newToken); // Optional: Persist token in localStorage
        } catch (error) {
          console.error("Error refreshing token:", error);
        }
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem("token"); // Clear token when logged out
      }
      setLoading(false); // Done checking auth state
    });

    // Clean up the subscription on component unmount
    return () => unsubscribe();
  }, []);

  // Function to log out the user
  const logout = () => {
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
