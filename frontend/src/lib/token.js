// Module-level variable — lives in memory only, never touches localStorage.
// Any file that imports this module reads/writes the same single variable.
// It is cleared automatically when the page refreshes, which forces re-login.
// This is intentional: it avoids XSS risk (no script can steal a token that
// isn't in the DOM or localStorage).

let _token = null;

export const getToken = () => _token;
export const setToken = (t) => { _token = t; };
export const clearToken = () => { _token = null; };
