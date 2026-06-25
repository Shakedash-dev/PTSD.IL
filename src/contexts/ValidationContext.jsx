import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ValidationContext = createContext(null);

const STORAGE_KEY = 'ptsd_il_validation';
const MODE_KEY = 'ptsd_il_validation_mode';

export function ValidationProvider({ children }) {
  const [state, setState] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  });

  // Hard-disabled for the demo. Flip back to the localStorage-backed state
  // (and restore the MODE_KEY persistence effect below) to re-enable.
  const [isValidationMode, setIsValidationMode] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const getStatus = useCallback((id) => state[id]?.status || 'unvalidated', [state]);
  const getEntry = useCallback((id) => state[id] || null, [state]);

  const updateValidation = useCallback((id, status, suggestion = '') => {
    setState(prev => ({
      ...prev,
      [id]: { status, suggestion, timestamp: new Date().toISOString() },
    }));
  }, []);

  const resetValidation = useCallback((id) => {
    setState(prev => { const n = { ...prev }; delete n[id]; return n; });
  }, []);

  const exportState = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const importState = useCallback((json) => {
    try {
      const imported = JSON.parse(json);
      setState(prev => ({ ...prev, ...imported }));
    } catch (e) {
      console.error('Invalid validation JSON', e);
    }
  }, []);

  const stats = Object.values(state).reduce(
    (acc, v) => { acc[v.status] = (acc[v.status] || 0) + 1; return acc; },
    { validated: 0, invalid: 0, needs_fix: 0 }
  );

  return (
    <ValidationContext.Provider value={{
      isValidationMode,
      toggleValidationMode: () => setIsValidationMode(v => !v),
      getStatus,
      getEntry,
      updateValidation,
      resetValidation,
      exportState,
      importState,
      stats,
      totalTracked: Object.keys(state).length,
    }}>
      {children}
    </ValidationContext.Provider>
  );
}

export const useValidation = () => {
  const ctx = useContext(ValidationContext);
  if (!ctx) throw new Error('useValidation must be used within ValidationProvider');
  return ctx;
};
