// Admin user-management layer (docs/api.md §"Users", `/api/admin/users`).
// All endpoints there require role `masteradmin` (checked server-side; see
// src/lib/auth.js's hasUserManagementAccess() for the client-side UX gate).
//
// Every network call goes through adminApi() (src/api/adminClient.js) - Bearer
// auth, 401/403 handling already built there. Unlike src/api/adminSource.js,
// there is no Markdown/HTML conversion here - users are plain fields, no rich
// content column.

import { adminApi } from './adminClient';

const USERS = '/admin/users';

// GET /admin/users -> SafeUser[]
// SafeUser: { id, firstName, lastName, email, phone, roles, createdAt, updatedAt }
export function listUsers() {
  return adminApi('GET', USERS);
}

// POST /admin/users {firstName,lastName,email,password,phone?,roles?} -> SafeUser
// 409 if email already in use (surfaces as a generic Error via adminApi;
// callers/toast show err.message).
export function createUser(payload) {
  return adminApi('POST', USERS, payload);
}

// PUT /admin/users/:id/roles {roles} -> SafeUser. 404 if not found.
export function updateUserRoles(id, roles) {
  return adminApi('PUT', `${USERS}/${id}/roles`, { roles });
}

// PUT /admin/users/:id/password {newPassword} -> {message}. 404 if not found.
export function updateUserPassword(id, newPassword) {
  return adminApi('PUT', `${USERS}/${id}/password`, { newPassword });
}

// DELETE /admin/users/:id -> empty 200. 403 if id equals the caller's own id
// ("You cannot delete your own account"). 404 if not found.
export function deleteUser(id) {
  return adminApi('DELETE', `${USERS}/${id}`);
}
