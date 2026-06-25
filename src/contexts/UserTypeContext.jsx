import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const UserTypeContext = createContext(null);

const STORAGE_KEY = 'ptsd_il_user_type';

const PATH_TO_TYPE = {
  '/first-circle': 'first_circle',
  '/second-circle': 'second_circle',
  '/second-circle-tools': 'second_circle',
  '/questionnaire': 'undecided',
};

export function UserTypeProvider({ children }) {
  const location = useLocation();
  const [userType, setUserType] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || null; }
    catch { return null; }
  });

  // Picking a path on the home page implicitly identifies the user. We persist
  // that so the nav can reflect it on later visits without forcing a re-choice.
  useEffect(() => {
    const matched = PATH_TO_TYPE[location.pathname];
    if (matched && matched !== userType) {
      setUserType(matched);
      try { localStorage.setItem(STORAGE_KEY, matched); } catch {}
    }
  }, [location.pathname, userType]);

  const clearUserType = () => {
    setUserType(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return (
    <UserTypeContext.Provider value={{ userType, setUserType, clearUserType }}>
      {children}
    </UserTypeContext.Provider>
  );
}

export function useUserType() {
  const ctx = useContext(UserTypeContext);
  if (!ctx) throw new Error('useUserType must be used within UserTypeProvider');
  return ctx;
}
