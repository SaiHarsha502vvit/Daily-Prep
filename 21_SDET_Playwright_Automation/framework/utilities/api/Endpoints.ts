/**
 * Layer 4 — Endpoint Registry.
 *
 * Namespace-style route builder for the reqres.in public demo API.
 * All paths are relative to the baseURL configured in playwright.config.ts.
 */
export const Endpoints = {
  users: {
    /** GET /api/users?page={page} */
    list: (page?: number) => `/api/users?page=${page ?? 1}`,
    /** GET /api/users/{id} */
    getById: (id: number) => `/api/users/${id}`,
    /** POST /api/users */
    create: () => '/api/users',
    /** PUT /api/users/{id} */
    update: (id: number) => `/api/users/${id}`,
    /** PATCH /api/users/{id} */
    patch: (id: number) => `/api/users/${id}`,
    /** DELETE /api/users/{id} */
    delete: (id: number) => `/api/users/${id}`,
  },
  resources: {
    /** GET /api/unknown?page={page} */
    list: (page?: number) => `/api/unknown?page=${page ?? 1}`,
    /** GET /api/unknown/{id} */
    getById: (id: number) => `/api/unknown/${id}`,
  },
  auth: {
    /** POST /api/register */
    register: () => '/api/register',
    /** POST /api/login */
    login: () => '/api/login',
  },
} as const;
