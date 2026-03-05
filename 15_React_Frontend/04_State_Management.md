> **Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [← Hooks](03_Hooks_Deep_Dive.md) | [Next: TypeScript →](05_React_TypeScript.md)

---

# 🏪 State Management — Context, Redux Toolkit, Zustand

---

## When Do You Need State Management?

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  LOCAL STATE (useState): Form inputs, toggles, component-specific data           ║
║  → Default choice. Keep state close to where it's used.                          ║
║                                                                                  ║
║  LIFTED STATE: Shared between siblings → lift to nearest common parent           ║
║                                                                                  ║
║  CONTEXT: Theme, auth, locale — read by many, updated rarely                     ║
║  → NOT for frequently changing data (causes re-renders to all consumers)         ║
║                                                                                  ║
║  EXTERNAL STORE (Redux/Zustand): Complex app-wide state with frequent updates    ║
║  → Shopping cart, dashboard filters, real-time data                              ║
║                                                                                  ║
║  SERVER STATE (React Query/SWR): Data from API that needs caching/syncing        ║
║  → MOST "global state" is actually server state!                                 ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

## Context API (Built-in)

```jsx
// Good for: Auth, Theme, Locale (infrequent updates)
// Pattern: Context + useReducer = poor man's Redux

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, { user: null, token: null });

  const login = async (credentials) => {
    const { user, token } = await api.login(credentials);
    dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
  };

  const logout = () => dispatch({ type: 'LOGOUT' });

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for clean access
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be within AuthProvider');
  return context;
}

// Usage in any component:
function NavBar() {
  const { user, logout } = useAuth();
  return user ? <button onClick={logout}>Logout {user.name}</button> : <LoginLink />;
}
```

---

## Redux Toolkit (RTK) — Industry Standard

```jsx
// ── 1. Create a Slice (reducer + actions auto-generated) ──
import { createSlice, configureStore } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [], total: 0 },
  reducers: {
    addItem(state, action) {
      state.items.push(action.payload);  // Immer handles immutability!
      state.total += action.payload.price;
    },
    removeItem(state, action) {
      const index = state.items.findIndex(i => i.id === action.payload);
      if (index >= 0) {
        state.total -= state.items[index].price;
        state.items.splice(index, 1);
      }
    },
    clearCart(state) {
      state.items = [];
      state.total = 0;
    },
  },
});

export const { addItem, removeItem, clearCart } = cartSlice.actions;

// ── 2. Create Store ──
const store = configureStore({
  reducer: {
    cart: cartSlice.reducer,
    // other slices...
  },
});

// ── 3. Provide to App ──
// <Provider store={store}><App /></Provider>

// ── 4. Use in Components ──
import { useSelector, useDispatch } from 'react-redux';

function CartSummary() {
  const { items, total } = useSelector(state => state.cart);
  const dispatch = useDispatch();
  
  return (
    <div>
      <p>{items.length} items — ${total.toFixed(2)}</p>
      <button onClick={() => dispatch(clearCart())}>Clear</button>
    </div>
  );
}

// ── 5. Async Thunks (API calls) ──
import { createAsyncThunk } from '@reduxjs/toolkit';

export const fetchProducts = createAsyncThunk('products/fetch', async () => {
  const response = await fetch('/api/products');
  return response.json();
});

// In slice: extraReducers to handle pending/fulfilled/rejected
```

---

## React Query (TanStack Query) — Server State

```jsx
// THE GAME CHANGER: Handles caching, refetching, loading, errors automatically

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ── Fetch data ──
function UserList() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],                    // cache key
    queryFn: () => fetch('/api/users').then(r => r.json()),
    staleTime: 5 * 60 * 1000,              // fresh for 5 minutes
  });

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}

// ── Mutate data (create/update/delete) ──
function CreateUser() {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: (newUser) => fetch('/api/users', {
      method: 'POST', body: JSON.stringify(newUser),
      headers: { 'Content-Type': 'application/json' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] }); // refetch user list!
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate({ name: 'Alice' }); }}>
      <button disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

---

## Zustand — Lightweight Alternative to Redux

```jsx
import { create } from 'zustand';

// One-file store — no boilerplate!
const useCartStore = create((set) => ({
  items: [],
  total: 0,
  addItem: (item) => set((state) => ({
    items: [...state.items, item],
    total: state.total + item.price,
  })),
  removeItem: (id) => set((state) => {
    const item = state.items.find(i => i.id === id);
    return {
      items: state.items.filter(i => i.id !== id),
      total: state.total - (item?.price || 0),
    };
  }),
  clearCart: () => set({ items: [], total: 0 }),
}));

// Usage — just call the hook!
function CartButton() {
  const total = useCartStore(state => state.total);     // selective subscription
  const clearCart = useCartStore(state => state.clearCart);
  return <button onClick={clearCart}>Cart: ${total}</button>;
}
```

---

## Decision Matrix

```
┌──────────────────┬────────────────────────────────────────────────────┐
│ Solution         │ When to Use                                        │
├──────────────────┼────────────────────────────────────────────────────┤
│ useState         │ Local component state (default)                    │
│ useReducer       │ Complex local state with many transitions          │
│ Context          │ Theme, auth, locale (infrequent updates)           │
│ Redux Toolkit    │ Large app, many devs, complex cross-cutting state  │
│ Zustand          │ Simple global state, minimal boilerplate           │
│ React Query      │ Server state (API data, caching, sync)             │
│ Jotai/Recoil     │ Atomic state, fine-grained reactivity              │
└──────────────────┴────────────────────────────────────────────────────┘
```

---
