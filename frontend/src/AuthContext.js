// AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase"; // Ensure you've correctly set up Firebase

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Store the user object
  const [token, setToken] = useState(null); // Store the ID token
  const [loading, setLoading] = useState(true); // To show a loading spinner while checking auth state

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const newToken = await user.getIdToken(true); // Force token refresh
          setUser(user);
          setToken(newToken);
          localStorage.setItem("token", newToken); // Save the new token to localStorage
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

    return () => unsubscribe(); // Clean up the subscription on component unmount
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
