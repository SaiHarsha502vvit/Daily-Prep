> **Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [← Hooks](03_Hooks_Deep_Dive.md) | [Next: TypeScript →](05_React_TypeScript.md)

---

# 🏪 State Management — Complete Guide (Context → Redux → Zustand → React Query)

> _"State is the source of truth. The architecture of your state determines the architecture of your app."_

---

# PART 0: The 5W+H Framework

> **Mental Model:** State management is like a **nervous system** in a body. Local state = nerve endings (local reflexes). Context = spinal cord (simple relay). Redux = the brain (centralized control with strict protocols). React Query = the immune system (autonomous, self-healing, handles external threats/data).

| Question | State Management Context |
| :--- | :--- |
| **WHAT** | The discipline of managing how data flows through your UI — where it lives, how it's updated, and how components access it. |
| **WHY** | As apps grow, "prop drilling" becomes unmanageable. State scattered across components leads to inconsistencies, bugs, and impossible-to-track data flow. |
| **WHEN** | When 3+ components need the same data, when state transitions are complex, when data comes from external APIs, when you need time-travel debugging. |
| **WHERE** | Every production React app. E-commerce (cart state), dashboards (filter state), messaging apps (conversation state), auth (user session state). |
| **WHO** | Dan Abramov (Redux, 2015), Facebook (Flux architecture, 2014), Tanner Linsley (React Query/TanStack), Daishi Kato (Zustand, Jotai). |
| **HOW** | Choose the RIGHT level: useState → useReducer → Context → Zustand → Redux Toolkit → React Query. Each adds capability AND complexity. |

---

## When Do You Need State Management?


> LOCAL STATE (useState): Form inputs, toggles, component-specific data
> → Default choice. Keep state close to where it's used.
>
> LIFTED STATE: Shared between siblings → lift to nearest common parent
>
> CONTEXT: Theme, auth, locale — read by many, updated rarely
> → NOT for frequently changing data (causes re-renders to all consumers)
>
> EXTERNAL STORE (Redux/Zustand): Complex app-wide state with frequent updates
> → Shopping cart, dashboard filters, real-time data
>
> SERVER STATE (React Query/SWR): Data from API that needs caching/syncing
> → MOST "global state" is actually server state!


---

# PART 1: Context API (Built-in)

---

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

```
CONTEXT PERFORMANCE TRAP:
  When context value changes → ALL consumers re-render.
  
  ❌ BAD: large object in context that changes frequently
  <ThemeContext.Provider value={{ theme, fontSize, colors, toggleTheme }}>
  → toggleTheme changes the ENTIRE object → all consumers re-render!
  
  ✅ FIX 1: Split into separate contexts
  <ThemeContext.Provider value={theme}>
  <ThemeDispatchContext.Provider value={toggleTheme}>
  
  ✅ FIX 2: Memoize the context value
  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);
  
  ✅ FIX 3: Use Zustand or Redux for frequently updating state
```

---

# PART 2: Redux Architecture Deep Dive

> _Content enriched from Educative "Understanding Redux" — Theory, State Updates, Actions_

---

```
THE THREE PRINCIPLES OF REDUX:

1. SINGLE SOURCE OF TRUTH
   The entire app state lives in ONE store object.
   
   state = {
     auth: { user: { id: 1, name: "Alice" }, token: "abc123" },
     cart: { items: [...], total: 42.99 },
     ui:   { sidebar: true, theme: "dark" }
   }
   
   WHY: predictable, debuggable, serializable (save/restore state)

2. STATE IS READ-ONLY
   The ONLY way to change state is to dispatch an ACTION.
   You CANNOT do: state.cart.total = 50  ← FORBIDDEN
   You MUST do: dispatch({ type: 'cart/addItem', payload: item })
   
   WHY: every state change is trackable, reproducible, time-travel-able

3. CHANGES ARE MADE WITH PURE FUNCTIONS (Reducers)
   reducer(currentState, action) → newState
   
   PURE means:
   • Same inputs → same output (no randomness)
   • No side effects (no API calls, no DOM changes)
   • No mutation of input state
   
   WHY: testable, predictable, enables time-travel debugging
```

### 2.1 Unidirectional Data Flow

```
THE REDUX CYCLE (one-way data flow):

  ┌─────────────────────────────────────────────────────┐
  │                                                     │
  │  USER ACTION          DISPATCH          REDUCER     │
  │  (click button) ───→ (send action) ───→ (compute   │
  │                                          new state) │
  │       ↑                                    │        │
  │       │                                    ↓        │
  │  VIEW UPDATE    ←───── STORE ←──────── NEW STATE   │
  │  (re-render)           (holds state)               │
  │                                                     │
  └─────────────────────────────────────────────────────┘

  1. User clicks "Add to Cart"
  2. Component dispatches: { type: 'cart/addItem', payload: product }
  3. Reducer receives (oldState, action) → returns newState
  4. Store replaces state → notifies subscribers
  5. useSelector re-runs → component re-renders with new data
```

### 2.2 Middleware — The Power Layer

> _Content enriched from Educative "Understanding Redux" — Middleware chapter_

```
WHAT: Middleware intercepts EVERY action between dispatch and reducer.
      It's how Redux handles side effects (API calls, logging, analytics).

THE MIDDLEWARE PIPELINE:
  dispatch(action) → Middleware 1 → Middleware 2 → ... → Reducer

  Middleware signature:
  const middleware = (store) => (next) => (action) => {
    // Before reducer
    console.log('dispatching:', action.type);
    const result = next(action);  // pass to next middleware / reducer
    // After reducer
    console.log('new state:', store.getState());
    return result;
  };
```

```jsx
// ── Logger Middleware (manual) ──
const loggerMiddleware = (store) => (next) => (action) => {
  console.group(action.type);
  console.log('prev state:', store.getState());
  console.log('action:', action);
  const result = next(action);
  console.log('next state:', store.getState());
  console.groupEnd();
  return result;
};

// ── Thunk Middleware (already built into RTK) ──
// Allows dispatching FUNCTIONS instead of plain objects
// function receives (dispatch, getState) as arguments

export const fetchUser = createAsyncThunk('user/fetch', async (userId, thunkAPI) => {
  try {
    const response = await api.getUser(userId);
    return response.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message);
  }
});

// In slice:
const userSlice = createSlice({
  name: 'user',
  initialState: { data: null, loading: false, error: null },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => { state.loading = true; })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});
```

### 2.3 Normalized State Design

> _Content enriched from Educative "Understanding Redux" — Designing State Object_

```
THE PROBLEM WITH NESTED STATE:
  state = {
    chats: [
      { id: 1, messages: [
        { id: 101, text: "Hello", author: { id: 10, name: "Alice" }},
        { id: 102, text: "Hi", author: { id: 11, name: "Bob" }}
      ]},
    ]
  }
  
  ❌ Updating Alice's name → must find EVERY nested occurrence
  ❌ Deep cloning for immutability is expensive
  ❌ O(n) lookups to find specific message

THE SOLUTION — NORMALIZED STATE (like a database):
  state = {
    entities: {
      users:    { 10: { id: 10, name: "Alice" }, 11: { id: 11, name: "Bob" }},
      messages: { 101: { id: 101, text: "Hello", authorId: 10 }, 
                  102: { id: 102, text: "Hi", authorId: 11 }},
      chats:    { 1: { id: 1, messageIds: [101, 102] }},
    },
    ids: {
      users:    [10, 11],
      messages: [101, 102],
      chats:    [1],
    }
  }
  
  ✅ Flat structure — no deep nesting
  ✅ O(1) lookups by ID
  ✅ Update user name in ONE place
  ✅ Relationships via IDs (like foreign keys)
```

```jsx
// RTK EntityAdapter — automates normalized state
import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';

const messagesAdapter = createEntityAdapter({
  sortComparer: (a, b) => a.timestamp.localeCompare(b.timestamp),
});

const messagesSlice = createSlice({
  name: 'messages',
  initialState: messagesAdapter.getInitialState({ loading: false }),
  reducers: {
    addMessage: messagesAdapter.addOne,
    updateMessage: messagesAdapter.updateOne,
    removeMessage: messagesAdapter.removeOne,
    setAllMessages: messagesAdapter.setAll,
  },
});

// Built-in selectors:
const { selectAll, selectById, selectIds } = messagesAdapter.getSelectors(
  (state) => state.messages
);
```

---

# PART 3: Redux Toolkit (RTK) — Modern Redux

---

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
```

### 3.1 RTK Query — Built-in API Caching

> _Enriched: combines Redux data-fetching with React Query–style caching_

```jsx
// RTK Query: auto-generates hooks for API endpoints
// Replaces manual thunks + loading/error state for CRUD operations

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Product'],
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: () => '/products',
      providesTags: ['Product'],
    }),
    addProduct: builder.mutation({
      query: (product) => ({
        url: '/products',
        method: 'POST',
        body: product,
      }),
      invalidatesTags: ['Product'],  // auto-refetch product list!
    }),
  }),
});

export const { useGetProductsQuery, useAddProductMutation } = apiSlice;

// Usage — zero boilerplate!
function ProductList() {
  const { data: products, isLoading, error } = useGetProductsQuery();
  const [addProduct] = useAddProductMutation();
  
  if (isLoading) return <Spinner />;
  return (
    <div>
      {products.map(p => <ProductCard key={p.id} product={p} />)}
      <button onClick={() => addProduct({ name: 'New', price: 9.99 })}>Add</button>
    </div>
  );
}
```

---

# PART 4: React Query (TanStack Query) — Server State

---

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

```
REACT QUERY vs REDUX for Server State:

  Redux for server state:
    ❌ Manual loading/error states per endpoint
    ❌ Manual cache invalidation
    ❌ Manual refetching logic
    ❌ Stale data if you forget to refetch
    
  React Query for server state:
    ✅ Auto loading/error states
    ✅ Auto cache invalidation via tags/keys
    ✅ Auto refetch on window focus, reconnect, interval
    ✅ Stale-while-revalidate pattern built in
    ✅ Background refetching (show stale data while updating)
    ✅ Optimistic updates built in
    ✅ Infinite queries for pagination
  
  VERDICT: Use Redux for CLIENT state, React Query for SERVER state.
```

---

# PART 5: Zustand — Lightweight Alternative

---

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

```
ZUSTAND vs REDUX:
  Zustand:
    ✅ Zero boilerplate (no actions, no reducers, no providers)
    ✅ Works outside React (vanilla JS)
    ✅ Selective subscriptions by default (no re-render issues)
    ❌ No DevTools time-travel (basic DevTools available)
    ❌ Less structure for large teams
  
  Redux Toolkit:
    ✅ Strict patterns → less bugs in large teams
    ✅ Powerful DevTools (time-travel, action replay)
    ✅ RTK Query for API caching
    ✅ Huge ecosystem (middleware, saga, etc.)
    ❌ More boilerplate (slices, store config, Provider)
```

---

# Quick Reference — Decision Matrix

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

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| React Hooks (useReducer, useContext) | [Hooks Deep Dive](03_Hooks_Deep_Dive.md) |
| React Performance (memoization) | [React Performance](08_React_Performance.md) |
| Component patterns (Provider) | [Component Patterns](02_Component_Patterns.md) |
| TypeScript with state | [React TypeScript](05_React_TypeScript.md) |
| System design (state at scale) | [System Design](../20_Interview_Mastery/06_System_Design_Blueprint.md) |

### Where It's Used in Real World
- **E-commerce (Shopify):** Cart state in Redux Toolkit (complex promotions, multi-step checkout)
- **Slack/Discord:** Zustand for UI state (which channel is open, unread indicators), React Query for message data
- **Netflix:** Server state via React Query (user watchlist, recommendations), local context for playback settings
- **Notion:** Complex document state in Redux with normalized entity adapter patterns

---

> **Navigation**: [< Previous](03_Hooks_Deep_Dive.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](05_React_TypeScript.md)

