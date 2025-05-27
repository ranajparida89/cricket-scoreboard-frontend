// src/services/auth.js
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  // On mount, load from localStorage ("user" key)
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) setCurrentUser(user);
  }, []);

  // Whenever currentUser changes, update localStorage ("user" key)
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('user');
    }
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
