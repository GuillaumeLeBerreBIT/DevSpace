// Keep token in memory (always works) and mirror to localStorage for reload persistence.
// localStorage ops are wrapped in try/catch — private browsing or storage-blocked
// contexts throw on setItem, which would otherwise silently swallow the login success.

const KEY = 'ds_access_token';

let _token = null;

// On module init, restore from storage if available
try { _token = localStorage.getItem(KEY); } catch { /* private browsing */ }

export const getToken = () => _token;

export const setToken = (t) => {
  _token = t;
  try { localStorage.setItem(KEY, t); } catch { /* private browsing */ }
};

export const clearToken = () => {
  _token = null;
  try { localStorage.removeItem(KEY); } catch { /* private browsing */ }
};
