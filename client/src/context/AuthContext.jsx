import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, getGuestUserId } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(true); // Admin toggle enabled for operations

  const refreshProfile = async () => {
    try {
      setLoading(true);
      const res = await authApi.getProfile();
      if (res.user) {
        setUser(res.user);
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const updateProfile = async (profileData) => {
    await authApi.updateProfile(profileData);
    await refreshProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        updateProfile,
        refreshProfile,
        isAdmin,
        setIsAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
