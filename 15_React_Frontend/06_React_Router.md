> **Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [← TypeScript](05_React_TypeScript.md) | [Next: Testing →](07_React_Testing.md)

---

# 🧭 React Router & Data Fetching Patterns

---

## React Router v6

```jsx
import { BrowserRouter, Routes, Route, Link, Navigate, useParams, useNavigate, Outlet } from 'react-router-dom';

// ── Route Configuration ──
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>         {/* Shared layout */}
          <Route index element={<Home />} />           {/* / */}
          <Route path="users" element={<Users />} />   {/* /users */}
          <Route path="users/:id" element={<UserDetail />} /> {/* /users/123 */}
          <Route path="dashboard" element={              /* Protected route */
            <RequireAuth><Dashboard /></RequireAuth>
          } />
          <Route path="*" element={<NotFound />} />    {/* Catch-all 404 */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// ── Layout with Outlet ──
function Layout() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/users">Users</Link>
      </nav>
      <main>
        <Outlet />  {/* ← Child route renders here */}
      </main>
    </div>
  );
}

// ── Dynamic Params ──
function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  return (
    <div>
      <h1>User {id}</h1>
      <button onClick={() => navigate('/users')}>Back to list</button>
      <button onClick={() => navigate(-1)}>Go back</button>
    </div>
  );
}

// ── Protected Routes ──
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

---

## Data Fetching Strategies

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  1. useEffect + fetch (basic, no caching)                                        ║
║  2. React Query / SWR (best for most apps — caching, refetch, dedup)             ║
║  3. React Router loaders (v6.4+ data router — fetch before render)               ║
║  4. Next.js / Remix server components (SSR/SSG — fetch on server)                ║
╚══════════════════════════════════════════════════════════════════════════════════╝

React Router v6.4 Loader (fetch before component renders):

const router = createBrowserRouter([
  {
    path: "/users/:id",
    element: <UserDetail />,
    loader: async ({ params }) => {
      const res = await fetch('/api/users/' + params.id);
      if (!res.ok) throw new Response("Not Found", { status: 404 });
      return res.json();
    },
    errorElement: <ErrorPage />,
  },
]);

function UserDetail() {
  const user = useLoaderData();  // data already loaded!
  return <h1>{user.name}</h1>;
}
```

---

## API Layer Pattern (Production)

```tsx
// ── api/client.ts — Base HTTP client ──
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  });
  
  if (response.status === 401) {
    // Token expired — redirect to login
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message);
  }
  
  return response.json();
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, data: unknown) => request<T>(url, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(url: string, data: unknown) => request<T>(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};

// ── api/users.ts — Domain-specific API ──
export const usersApi = {
  getAll: () => api.get<User[]>('/users'),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  create: (data: CreateUserDTO) => api.post<User>('/users', data),
  update: (id: string, data: UpdateUserDTO) => api.put<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete<void>(`/users/${id}`),
};

// ── hooks/useUsers.ts — React Query hooks ──
export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: usersApi.getAll });
}

export function useUser(id: string) {
  return useQuery({ queryKey: ['users', id], queryFn: () => usersApi.getById(id), enabled: !!id });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}
```

---

## Form Handling (React Hook Form + Zod)

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ── Validation Schema ──
const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be 18+').max(120),
  role: z.enum(['admin', 'user']),
});

type UserFormData = z.infer<typeof userSchema>;

// ── Form Component ──
function UserForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'user' },
  });

  const onSubmit = async (data: UserFormData) => {
    await createUser(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} placeholder="Name" />
      {errors.name && <span className="error">{errors.name.message}</span>}
      
      <input {...register('email')} placeholder="Email" />
      {errors.email && <span className="error">{errors.email.message}</span>}
      
      <input {...register('age', { valueAsNumber: true })} type="number" />
      {errors.age && <span className="error">{errors.age.message}</span>}
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Create User'}
      </button>
    </form>
  );
}
```

---
