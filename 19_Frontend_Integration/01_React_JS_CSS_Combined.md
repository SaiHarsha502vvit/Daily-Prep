> **Frontend Integration Chapter 1/4** | [Index](../00_MASTER_INDEX.md) | [Next → Debugging](02_Frontend_Debugging.md)

# React + JavaScript + CSS — Building Complex UIs from Scratch

## 5W1H — Why This Chapter?

```
╔══════════════════════════════════════════════════════════════════════╗
║  WHAT: Combining React (structure + logic) + JavaScript (behavior)   ║
║        + CSS (visual design) to build production-quality UIs.        ║
║                                                                      ║
║  WHY:  Knowing React, JS, and CSS separately isn't enough.           ║
║        Real UIs need all three working together:                     ║
║        • State changes  → triggers re-render → updates visuals       ║
║        • User events    → JS handlers → CSS transitions feedback     ║
║        • Data flows     → component hierarchy → styled correctly     ║
║                                                                      ║
║  WHO:  Frontend developers building real applications.               ║
║                                                                      ║
║  WHEN: After understanding each technology independently.            ║
║                                                                      ║
║  HOW:  Component-by-component. Start with data → structure →         ║
║        styling → interaction → polish.                               ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 1. The Component Architecture Mental Model

```
╔══════════════════════════════════════════════════════════════════════╗
║  EVERY COMPONENT = DATA + STRUCTURE + STYLE + BEHAVIOR               ║
║                                                                      ║
║  ┌─────────────────────────────────────────────────────────┐         ║
║  │                    UserCard Component                    │        ║
║  │                                                         │         ║
║  │  DATA (Props + State):                                  │         ║
║  │  ├── user: { name, avatar, role, isOnline }            │          ║
║  │  └── isExpanded: boolean (local state)                  │         ║
║  │                                                         │         ║
║  │  STRUCTURE (JSX):                                       │         ║
║  │  ├── <div className="card">                             │         ║
║  │  │   ├── <img> (avatar)                                 │         ║
║  │  │   ├── <h3> (name)                                    │         ║
║  │  │   ├── <span> (role badge)                            │         ║
║  │  │   └── <div> (expanded details — conditional)         │         ║
║  │  └── </div>                                             │         ║
║  │                                                         │         ║
║  │  STYLE (CSS Module):                                    │         ║
║  │  ├── .card { display: flex; gap; padding; shadow }     │          ║
║  │  ├── .card.online::before { green dot }                │          ║
║  │  └── .details { animation: slideDown }                  │         ║
║  │                                                         │         ║
║  │  BEHAVIOR (Event Handlers):                             │         ║
║  │  ├── onClick → toggle isExpanded                        │         ║
║  │  └── onMouseEnter → show tooltip                        │         ║
║  └─────────────────────────────────────────────────────────┘         ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 2. Building a Complete Dashboard — Step by Step

### Step 1: Define Types (TypeScript First)

```typescript
// types.ts — Single source of truth
interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: "admin" | "editor" | "viewer";
    lastActive: Date;
    isOnline: boolean;
}

interface DashboardStats {
    totalUsers: number;
    activeNow: number;
    revenue: number;
    growth: number; // percentage
}

type SortField = "name" | "role" | "lastActive";
type SortDirection = "asc" | "desc";
type ViewMode = "grid" | "list";
```

### Step 2: Build Atomic Components

```tsx
// components/Badge.tsx + Badge.module.css
// ─── THE SMALLEST REUSABLE PIECE ───

// Badge.module.css
/*
.badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}
.admin  { background: #fef3c7; color: #92400e; }
.editor { background: #dbeafe; color: #1e40af; }
.viewer { background: #f1f5f9; color: #475569; }
*/

import styles from './Badge.module.css';

type BadgeVariant = "admin" | "editor" | "viewer";

interface BadgeProps {
    variant: BadgeVariant;
    children: React.ReactNode;
}

function Badge({ variant, children }: BadgeProps) {
    return (
        <span className={`${styles.badge} ${styles[variant]}`}>
            {children}
        </span>
    );
}
```

```tsx
// components/StatCard.tsx + StatCard.module.css
// ─── DASHBOARD STAT WIDGET ───

// StatCard.module.css
/*
.card {
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    box-shadow: var(--elevation-2);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.card:hover {
    box-shadow: var(--elevation-3);
    transform: translateY(-2px);
}
.label {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    font-weight: 500;
}
.value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-text);
}
.trend {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.875rem;
    font-weight: 500;
}
.trendUp   { color: #16a34a; }
.trendDown { color: #dc2626; }
*/

interface StatCardProps {
    label: string;
    value: string | number;
    trend?: number; // percentage change
    icon?: React.ReactNode;
}

function StatCard({ label, value, trend, icon }: StatCardProps) {
    const formattedTrend = trend !== undefined
        ? `${trend > 0 ? "+" : ""}${trend}%`
        : null;

    return (
        <div className={styles.card}>
            <span className={styles.label}>{label}</span>
            <span className={styles.value}>
                {typeof value === "number" ? value.toLocaleString() : value}
            </span>
            {formattedTrend && (
                <span className={`${styles.trend} ${
                    trend! > 0 ? styles.trendUp : styles.trendDown
                }`}>
                    {trend! > 0 ? "↑" : "↓"} {formattedTrend}
                </span>
            )}
        </div>
    );
}
```

### Step 3: Build Composite Components

```tsx
// components/UserTable.tsx
// ─── COMBINES Badge + sorting + list rendering ───

interface UserTableProps {
    users: User[];
    sortField: SortField;
    sortDirection: SortDirection;
    onSort: (field: SortField) => void;
    onUserClick: (user: User) => void;
}

function UserTable({ users, sortField, sortDirection, onSort, onUserClick }: UserTableProps) {
    const sortedUsers = useMemo(() => {
        return [...users].sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case "name":
                    comparison = a.name.localeCompare(b.name);
                    break;
                case "role":
                    comparison = a.role.localeCompare(b.role);
                    break;
                case "lastActive":
                    comparison = a.lastActive.getTime() - b.lastActive.getTime();
                    break;
            }
            return sortDirection === "asc" ? comparison : -comparison;
        });
    }, [users, sortField, sortDirection]);

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {(["name", "role", "lastActive"] as SortField[]).map(field => (
                            <th
                                key={field}
                                onClick={() => onSort(field)}
                                className={sortField === field ? styles.activeSort : ""}
                            >
                                {field}
                                {sortField === field && (
                                    <span>{sortDirection === "asc" ? " ↑" : " ↓"}</span>
                                )}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedUsers.map(user => (
                        <tr
                            key={user.id}
                            onClick={() => onUserClick(user)}
                            className={styles.row}
                        >
                            <td className={styles.nameCell}>
                                <img
                                    src={user.avatar}
                                    alt=""
                                    className={styles.avatar}
                                />
                                <div>
                                    <span className={styles.name}>{user.name}</span>
                                    <span className={styles.email}>{user.email}</span>
                                </div>
                                {user.isOnline && <span className={styles.onlineDot} />}
                            </td>
                            <td><Badge variant={user.role}>{user.role}</Badge></td>
                            <td className={styles.dateCell}>
                                {formatRelativeTime(user.lastActive)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Helper:
function formatRelativeTime(date: Date): string {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}
```

### Step 4: The Page Component (Orchestrator)

```tsx
// pages/Dashboard.tsx
// ─── ASSEMBLES EVERYTHING ───

function Dashboard() {
    // ─── STATE ───
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortField, setSortField] = useState<SortField>("name");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // ─── DATA FETCHING ───
    useEffect(() => {
        async function loadDashboard() {
            try {
                setLoading(true);
                const [usersData, statsData] = await Promise.all([
                    fetchData<User[]>("/api/users"),
                    fetchData<DashboardStats>("/api/stats")
                ]);
                setUsers(usersData);
                setStats(statsData);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load");
            } finally {
                setLoading(false);
            }
        }
        loadDashboard();
    }, []);

    // ─── DERIVED STATE (computed from state, not stored) ───
    const filteredUsers = useMemo(() => {
        if (!searchQuery) return users;
        const query = searchQuery.toLowerCase();
        return users.filter(u =>
            u.name.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query)
        );
    }, [users, searchQuery]);

    // ─── HANDLERS ───
    const handleSort = useCallback((field: SortField) => {
        setSortDirection(prev =>
            sortField === field
                ? (prev === "asc" ? "desc" : "asc")
                : "asc"
        );
        setSortField(field);
    }, [sortField]);

    const debouncedSearch = useMemo(
        () => debounce((value: string) => setSearchQuery(value), 300),
        []
    );

    // ─── LOADING STATE ───
    if (loading) return <DashboardSkeleton />;
    if (error) return <ErrorBanner message={error} onRetry={() => window.location.reload()} />;

    // ─── RENDER ───
    return (
        <div className={styles.dashboard}>
            {/* STATS ROW */}
            <section className={styles.statsGrid}>
                <StatCard label="Total Users" value={stats!.totalUsers} trend={12} />
                <StatCard label="Active Now" value={stats!.activeNow} />
                <StatCard label="Revenue" value={`$${stats!.revenue.toLocaleString()}`} trend={stats!.growth} />
            </section>

            {/* TOOLBAR */}
            <div className={styles.toolbar}>
                <input
                    type="search"
                    placeholder="Search users..."
                    className={styles.searchInput}
                    onChange={(e) => debouncedSearch(e.target.value)}
                />
                <div className={styles.viewToggle}>
                    <button
                        className={viewMode === "list" ? styles.active : ""}
                        onClick={() => setViewMode("list")}
                    >
                        List
                    </button>
                    <button
                        className={viewMode === "grid" ? styles.active : ""}
                        onClick={() => setViewMode("grid")}
                    >
                        Grid
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            {viewMode === "list" ? (
                <UserTable
                    users={filteredUsers}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    onUserClick={setSelectedUser}
                />
            ) : (
                <UserGrid users={filteredUsers} onUserClick={setSelectedUser} />
            )}

            {/* MODAL */}
            {selectedUser && (
                <UserDetailModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                />
            )}
        </div>
    );
}
```

### Step 5: The CSS Layout

```css
/* Dashboard.module.css */
.dashboard {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.statsGrid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1.5rem;
}

.toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
}

.searchInput {
    flex: 1;
    min-width: 200px;
    max-width: 400px;
    padding: 0.625rem 1rem;
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    transition: border-color 0.15s ease;
}
.searchInput:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.viewToggle {
    display: flex;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
}
.viewToggle button {
    padding: 0.5rem 1rem;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.15s ease;
}
.viewToggle button.active {
    background: var(--color-primary);
    color: white;
}

/* TABLE STYLES: */
.tableWrapper {
    overflow-x: auto;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
}
.table {
    width: 100%;
    border-collapse: collapse;
}
.table th {
    text-align: left;
    padding: 0.75rem 1rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    background: var(--color-bg-secondary);
    cursor: pointer;
    user-select: none;
}
.table th:hover {
    background: var(--color-border);
}
.row {
    border-top: 1px solid var(--color-border);
    cursor: pointer;
    transition: background 0.1s ease;
}
.row:hover {
    background: rgba(59, 130, 246, 0.04);
}
.row td {
    padding: 0.75rem 1rem;
}
.nameCell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}
.avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
}
.onlineDot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    flex-shrink: 0;
}

/* RESPONSIVE: */
@media (max-width: 768px) {
    .dashboard { padding: 1rem; }
    .toolbar { flex-direction: column; align-items: stretch; }
    .searchInput { max-width: none; }
}
```

---

## 3. State Management Patterns

```
╔══════════════════════════════════════════════════════════════════════╗
║  WHEN TO USE WHAT:                                                   ║
║                                                                      ║
║  useState:                                                           ║
║  ├── Simple values (toggle, counter, input)                          ║
║  ├── State used by ONE component only                                ║
║  └── Beginner-friendly                                               ║
║                                                                      ║
║  useReducer:                                                         ║
║  ├── Complex state logic (multiple related updates)                  ║
║  ├── State transitions depend on previous state                      ║
║  └── Like a mini Redux inside a component                            ║
║                                                                      ║
║  Context + useReducer:                                               ║
║  ├── State shared by 3-10 components                                 ║
║  ├── Auth, theme, language, cart                                     ║
║  └── Not for frequently changing state (perf!)                       ║
║                                                                      ║
║  Zustand / Redux Toolkit:                                            ║
║  ├── Global state for large apps                                     ║
║  ├── Many components reading same state                              ║
║  └── Complex async workflows                                         ║
║                                                                      ║
║  TanStack Query / SWR:                                               ║
║  ├── SERVER STATE (API data)                                         ║
║  ├── Caching, refetching, loading/error states                       ║
║  └── THE standard for data fetching in 2024                          ║
║                                                                      ║
║  RULE: If it comes from an API, use TanStack Query.                  ║
║  If it's UI state (open/closed, selected item), use useState.        ║
║  If it's complex UI state, use useReducer.                           ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 4. Conditional Rendering + CSS Patterns

```tsx
// PATTERN 1: Show/Hide with CSS transition
function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    return (
        <div className={styles.accordion}>
            <button
                className={styles.trigger}
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                {title}
                <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ""}`}>
                    ▶
                </span>
            </button>
            <div
                className={styles.content}
                style={{
                    maxHeight: isOpen
                        ? `${contentRef.current?.scrollHeight}px`
                        : "0",
                }}
            >
                <div ref={contentRef} className={styles.inner}>
                    {children}
                </div>
            </div>
        </div>
    );
}

// CSS:
/*
.content {
    overflow: hidden;
    transition: max-height 0.3s ease;
}
.arrow {
    transition: transform 0.2s ease;
    display: inline-block;
}
.arrowOpen {
    transform: rotate(90deg);
}
*/

// PATTERN 2: Loading skeleton
function UserCardSkeleton() {
    return (
        <div className={styles.card}>
            <div className={`${styles.skeleton} ${styles.avatarSkeleton}`} />
            <div className={`${styles.skeleton} ${styles.nameSkeleton}`} />
            <div className={`${styles.skeleton} ${styles.emailSkeleton}`} />
        </div>
    );
}

// PATTERN 3: Empty state
function UserList({ users }: { users: User[] }) {
    if (users.length === 0) {
        return (
            <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>👥</span>
                <h3>No users found</h3>
                <p>Try adjusting your search or filters</p>
                <button className={styles.btnPrimary}>Clear Filters</button>
            </div>
        );
    }
    return <ul>{users.map(u => <UserCard key={u.id} user={u} />)}</ul>;
}
```

---

## 5. CSS + JS Animation Integration

```tsx
// PATTERN: Animate list item enter/exit
function AnimatedList({ items }: { items: string[] }) {
    const [removing, setRemoving] = useState<Set<string>>(new Set());

    const handleRemove = (item: string) => {
        setRemoving(prev => new Set([...prev, item]));
        // Wait for animation, then actually remove
        setTimeout(() => {
            setRemoving(prev => {
                const next = new Set(prev);
                next.delete(item);
                return next;
            });
            // Actually remove from parent state
            onRemove(item);
        }, 300); // Match CSS animation duration
    };

    return (
        <ul className={styles.animatedList}>
            {items.map((item, index) => (
                <li
                    key={item}
                    className={`${styles.listItem} ${
                        removing.has(item) ? styles.removing : ""
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    {item}
                    <button onClick={() => handleRemove(item)}>✕</button>
                </li>
            ))}
        </ul>
    );
}

/* CSS:
.listItem {
    animation: slideIn 0.3s ease forwards;
    transform: translateX(-20px);
    opacity: 0;
}
@keyframes slideIn {
    to { transform: translateX(0); opacity: 1; }
}
.removing {
    animation: slideOut 0.3s ease forwards;
}
@keyframes slideOut {
    to { transform: translateX(20px); opacity: 0; height: 0; padding: 0; margin: 0; }
}
*/
```

---

## Interview Quick-Fire

```
Q: How do you structure a React component?
→ Types first → atomic components → composite components → page.
  Each component handles its own state, receives data via props,
  and has co-located CSS (CSS Module alongside TSX file).

Q: How do you handle loading states?
→ Skeleton components that match the layout of the real content.
  Use loading boolean from data fetching. Show skeleton while loading,
  error banner if failed, real content when loaded.

Q: When to use useMemo vs useCallback?
→ useMemo: cache expensive COMPUTED VALUES (sort, filter, format).
  useCallback: cache FUNCTION references for child component props.
  Both prevent unnecessary recalculation/re-renders.

Q: How to make a list animation smooth?
→ CSS transitions for simple show/hide. @keyframes for enter.
  For exit: add "removing" class first, wait for animation, then remove.
  Use animation-delay based on index for staggered effects.

Q: Server state vs client state?
→ Server state: data from APIs (users, products, orders).
  Use TanStack Query — handles caching, loading, error, refetching.
  Client state: UI state (open/closed, selected, filters).
  Use useState/useReducer — lives only in browser.
```

---

> [Index](../00_MASTER_INDEX.md) | [Next → Frontend Debugging](02_Frontend_Debugging.md)
