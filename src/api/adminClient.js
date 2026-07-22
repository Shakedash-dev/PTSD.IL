// Authenticated API client for the admin panel. This is the client the write
// stage (create/update/delete wiring) will use for every mutating call - keep
// it generic and reusable, do not wire it into any panel yet.
//
// Every call attaches `Authorization: Bearer <token>` from src/lib/auth.js.
// On 401 the session is dropped (logout()) so the /admin route guard
// re-renders the login page - no manual refresh needed. On 403 a distinct
// error is thrown so the UI can show "insufficient role" rather than a
// generic failure.

import { getToken, logout } from '@/lib/auth';

const API = import.meta.env.VITE_API_URL;

export class UnauthorizedError extends Error {
  constructor(message = 'Session expired or invalid - please log in again') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Insufficient role for this action') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

// method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
// path: e.g. '/admin/articles' (joined onto VITE_API_URL)
// body: optional plain object, JSON-encoded
export async function adminApi(method, path, body) {
  const token = getToken();

  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    // Token missing/expired/rejected by the BE - drop the session cleanly.
    // logout() dispatches AUTH_CHANGE_EVENT, which the /admin route guard
    // listens for and re-renders the login view.
    logout();
    throw new UnauthorizedError();
  }

  if (res.status === 403) {
    throw new ForbiddenError();
  }

  if (!res.ok) {
    let detail = '';
    try {
      detail = await res.text();
    } catch {
      detail = res.statusText;
    }
    throw new Error(`${res.status} ${detail}`.trim());
  }

  // DELETE and some mutations return an empty 200 body.
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
