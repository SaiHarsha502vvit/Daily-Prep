**Navigation**: [< Previous](10_Custom_Hooks_Library.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](../19_Frontend_Integration/05_DevTools_Debugging_Mastery.md)

# 🏗️ Chapter 11 — Complex UI Pages & Patterns: Building Real Applications

**"Every SaaS product, every dashboard, every modern web app is built from the same 10-15 complex UI patterns. Master these patterns and you can build ANY interface."**

---

## 5W1H — Why Complex UI Patterns?

- **WHAT**: Standardized combinations of React components, CSS, and state logic to solve recurring layout and interaction problems (e.g., Modals, Data Tables).
- **WHY**: Without patterns, every developer reinvents the wheel. This leads to accessibility (a11y) failures, z-index wars, and fragile state management.
- **WHO**: Frontend engineers bridging the gap between raw UI components and full application pages.
- **WHEN**: Starting a new feature. Instead of asking "how do I build this?", you ask "which of the 10 patterns does this fit?".
- **HOW**: By combining layout techniques (CSS Grid), accessibility APIs (ARIA), and React state (portals, refs) into cohesive, reusable structures.

---

## Table of Contents

1. [Dashboard Layout — Grid + Sidebar + Charts](#1-dashboard-layout--grid--sidebar--charts)
2. [Data Table — Sorting, Filtering, Pagination](#2-data-table--sorting-filtering-pagination)
3. [Modal System — Stacking, Focus Trap, Animations](#3-modal-system--stacking-focus-trap-animations)
4. [Form System — Multi-Step with Validation](#4-form-system--multi-step-with-validation)
5. [Infinite Scroll with Virtual List](#5-infinite-scroll-with-virtual-list)
6. [Search with Autocomplete & Suggestions](#6-search-with-autocomplete--suggestions)
7. [Tabs & Accordion — Content Organization](#7-tabs--accordion--content-organization)
8. [Drag and Drop — Reorderable Lists](#8-drag-and-drop--reorderable-lists)
9. [Toast/Notification System](#9-toastnotification-system)
10. [Responsive Sidebar Navigation](#10-responsive-sidebar-navigation)

---

## 1. Dashboard Layout — Grid + Sidebar + Charts

```jsx
// ═══ DASHBOARD LAYOUT STRUCTURE ═══

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className={`dashboard__sidebar ${sidebarOpen ? 'open' : ''}`}>
        <nav className="sidebar-nav">
          <SidebarItem icon="📊" label="Overview" active />
          <SidebarItem icon="👥" label="Users" />
          <SidebarItem icon="📦" label="Products" />
          <SidebarItem icon="⚙️" label="Settings" />
        </nav>
      </aside>

      {/* Main content */}
      <main className="dashboard__main">
        {/* Top bar */}
        <header className="dashboard__header">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <h1>Dashboard</h1>
          <UserMenu />
        </header>

        {/* Stats cards row */}
        <div className="dashboard__stats">
          <StatCard title="Revenue" value="$48,200" change="+12%" positive />
          <StatCard title="Orders" value="1,234" change="+8%" positive />
          <StatCard title="Users" value="8,491" change="+23%" positive />
          <StatCard title="Bounce Rate" value="24%" change="-3%" positive />
        </div>

        {/* Charts row */}
        <div className="dashboard__charts">
          <div className="chart-card chart-card--large">
            <h3>Revenue Over Time</h3>
            <LineChart data={revenueData} />
          </div>
          <div className="chart-card">
            <h3>Sales by Category</h3>
            <PieChart data={categoryData} />
          </div>
        </div>

        {/* Recent orders table */}
        <div className="dashboard__table">
          <h3>Recent Orders</h3>
          <DataTable data={recentOrders} columns={orderColumns} />
        </div>
      </main>
    </div>
  );
}
```

```css
/* Dashboard CSS with Grid */
.dashboard {
  display: grid;
  grid-template-columns: auto 1fr;
  min-height: 100vh;
}

.dashboard__sidebar {
  width: 250px;
  background: #1e293b;
  color: white;
  transition: width 0.3s ease;
  overflow: hidden;
}

.dashboard__sidebar:not(.open) {
  width: 60px; /* Collapsed: icon only */
}

.dashboard__main {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  background: #f1f5f9;
  overflow-y: auto;
}

.dashboard__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.dashboard__charts {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
}

/* Stat Card */
.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.stat-card__value { font-size: 2rem; font-weight: 700; }
.stat-card__change--positive { color: #22c55e; }
.stat-card__change--negative { color: #ef4444; }

/* Mobile: Stack everything */
@media (max-width: 768px) {
  .dashboard { grid-template-columns: 1fr; }
  .dashboard__sidebar { position: fixed; z-index: 50; }
  .dashboard__charts { grid-template-columns: 1fr; }
}
```

---

## 2. Data Table — Sorting, Filtering, Pagination

```jsx
import { useState, useMemo } from 'react';

function DataTable({ data, columns, pageSize = 10 }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // FILTER
  const filteredData = useMemo(() => {
    if (!filterText) return data;
    const lower = filterText.toLowerCase();
    return data.filter(row =>
      columns.some(col => 
        String(row[col.key]).toLowerCase().includes(lower)
      )
    );
  }, [data, columns, filterText]);

  // SORT
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // PAGINATE
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Reset page when filter changes
  const handleFilter = (text) => {
    setFilterText(text);
    setCurrentPage(1);
  };

  return (
    <div className="data-table-container">
      {/* Search */}
      <input
        type="text"
        placeholder="Search..."
        value={filterText}
        onChange={e => handleFilter(e.target.value)}
        className="data-table__search"
      />

      {/* Table */}
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} onClick={() => handleSort(col.key)}>
                {col.label}
                {sortConfig.key === col.key && (
                  <span>{sortConfig.direction === 'asc' ? ' ▲' : ' ▼'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, i) => (
            <tr key={row.id ?? i}>
              {columns.map(col => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="data-table__pagination">
        <span>{sortedData.length} results</span>
        <div>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══ USAGE ═══
const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Customer' },
  { key: 'email', label: 'Email' },
  { key: 'amount', label: 'Amount', render: (val) => `$${val.toFixed(2)}` },
  { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
];

<DataTable data={orders} columns={columns} pageSize={20} />
```

---



🔬 **Section Challenge — 2. Data Table — Sorting, Filtering, Pagination**

**Challenge 1 (Reasoning):** QuickSort average O(N log N) but worst case O(N²). When exactly does the worst case happen and how do you prevent it?
<details><summary>Answer</summary>

Worst case: pivot always ends up at position 0 or N-1 (completely unbalanced partition). This happens when: (1) always picking first/last element as pivot on already-sorted or reverse-sorted data. (2) Pivot happens to be the minimum or maximum. Prevention: random pivot (randomized quicksort — expected O(N log N) even on adversarial input), or median-of-three (pick median of first/middle/last element as pivot). Java's dual-pivot quicksort uses careful pivot selection to avoid this.
</details>


## 3. Modal System — Stacking, Focus Trap, Animations

```jsx
import { useEffect, useRef, createContext, useContext, useState } from 'react';
import { createPortal } from 'react-dom';

// Modal renders outside the component tree (in portal)
function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const modalRef = useRef(null);
  const previousFocus = useRef(null);

  // FOCUS TRAP — keep focus inside modal
  useEffect(() => {
    if (!isOpen) return;

    // Save current focus to restore later
    previousFocus.current = document.activeElement;

    // Focus the modal
    modalRef.current?.focus();

    // Trap focus inside modal
    const handleTab = (e) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements?.length) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    // Close on Escape
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleTab);
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden'; // Prevent background scroll

    return () => {
      document.removeEventListener('keydown', handleTab);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
      previousFocus.current?.focus(); // Restore focus
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' };

  return createPortal(
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        ref={modalRef}
        className={`modal ${sizeClasses[size]}`}
        onClick={e => e.stopPropagation()} // Don't close when clicking inside
        tabIndex={-1}
      >
        <div className="modal__header">
          <h2>{title}</h2>
          <button onClick={onClose} aria-label="Close modal">&times;</button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>,
    document.getElementById('modal-root') // Portal target
  );
}

// ═══ USAGE ═══
function App() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>Open Modal</button>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Confirm Action">
        <p>Are you sure you want to proceed?</p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button onClick={() => setShowModal(false)}>Cancel</button>
          <button onClick={handleConfirm}>Confirm</button>
        </div>
      </Modal>
    </>
  );
}
```

```css
/* Modal CSS with animation */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

.modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal__body { padding: 1.5rem; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---




## 4. Form System — Multi-Step with Validation

```jsx
function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Personal
    firstName: '', lastName: '', email: '',
    // Step 2: Address
    street: '', city: '', zipCode: '',
    // Step 3: Payment
    cardNumber: '', expiry: '',
  });
  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const validateStep = (stepNumber) => {
    const newErrors = {};
    
    if (stepNumber === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'Required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email';
      }
    }
    if (stepNumber === 2) {
      if (!formData.street.trim()) newErrors.street = 'Required';
      if (!formData.city.trim()) newErrors.city = 'Required';
      if (!/^\d{5,6}$/.test(formData.zipCode)) newErrors.zipCode = 'Invalid zip code';
    }
    if (stepNumber === 3) {
      if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
        newErrors.cardNumber = 'Invalid card number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="form-wizard">
      {/* Progress indicator */}
      <div className="form-wizard__steps">
        {['Personal', 'Address', 'Payment', 'Confirm'].map((label, i) => (
          <div key={label} className={`step ${i + 1 <= step ? 'step--active' : ''} ${i + 1 < step ? 'step--completed' : ''}`}>
            <div className="step__circle">{i + 1 < step ? '✓' : i + 1}</div>
            <span className="step__label">{label}</span>
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === 1 && (
        <div className="form-wizard__content">
          <FormField label="First Name" error={errors.firstName}>
            <input value={formData.firstName} onChange={e => updateField('firstName', e.target.value)} />
          </FormField>
          <FormField label="Last Name" error={errors.lastName}>
            <input value={formData.lastName} onChange={e => updateField('lastName', e.target.value)} />
          </FormField>
          <FormField label="Email" error={errors.email}>
            <input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} />
          </FormField>
        </div>
      )}

      {step === 2 && (
        <div className="form-wizard__content">
          <FormField label="Street" error={errors.street}>
            <input value={formData.street} onChange={e => updateField('street', e.target.value)} />
          </FormField>
          <FormField label="City" error={errors.city}>
            <input value={formData.city} onChange={e => updateField('city', e.target.value)} />
          </FormField>
          <FormField label="Zip Code" error={errors.zipCode}>
            <input value={formData.zipCode} onChange={e => updateField('zipCode', e.target.value)} />
          </FormField>
        </div>
      )}

      {/* Navigation */}
      <div className="form-wizard__nav">
        {step > 1 && <button onClick={prevStep}>← Back</button>}
        {step < 4 ? (
          <button onClick={nextStep} className="btn-primary">Next →</button>
        ) : (
          <button onClick={handleSubmit} className="btn-primary">Submit</button>
        )}
      </div>
    </div>
  );
}

function FormField({ label, error, children }) {
  return (
    <div className={`form-field ${error ? 'form-field--error' : ''}`}>
      <label>{label}</label>
      {children}
      {error && <span className="form-field__error">{error}</span>}
    </div>
  );
}
```

---

## 5. Infinite Scroll with Virtual List

```jsx
// Virtual list — only renders visible items (handles 100,000+ items)
function VirtualList({ items, itemHeight, containerHeight }) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={e => setScrollTop(e.target.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, i) => (
            <div key={startIndex + i} style={{ height: itemHeight }}>
              {item.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══ USAGE ═══
// Renders 100,000 items smoothly — only ~20 DOM nodes at a time!
<VirtualList items={allItems} itemHeight={50} containerHeight={600} />
```

---




## 6. Search with Autocomplete & Suggestions

```jsx
function SearchAutocomplete({ onSelect }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useClickOutside(() => setIsOpen(false));

  // Fetch suggestions
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(r => r.json())
      .then(data => {
        setSuggestions(data);
        setIsOpen(true);
        setActiveIndex(-1);
      });
  }, [debouncedQuery]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        if (activeIndex >= 0) {
          selectItem(suggestions[activeIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const selectItem = (item) => {
    setQuery(item.name);
    setIsOpen(false);
    onSelect(item);
  };

  return (
    <div ref={containerRef} className="search-autocomplete">
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        placeholder="Search products..."
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
      />
      {isOpen && suggestions.length > 0 && (
        <ul className="search-autocomplete__list" role="listbox">
          {suggestions.map((item, i) => (
            <li
              key={item.id}
              className={i === activeIndex ? 'active' : ''}
              onClick={() => selectItem(item)}
              role="option"
              aria-selected={i === activeIndex}
            >
              <strong>{highlightMatch(item.name, query)}</strong>
              <span className="category">{item.category}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Highlight matching text in suggestions
function highlightMatch(text, query) {
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  );
}
```

---



🔬 **Section Challenge — 6. Search with Autocomplete & Suggestions**
>>

## 7. Tabs & Accordion — Content Organization

```jsx
// ═══ ACCESSIBLE TABS ═══
function Tabs({ tabs }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="tabs">
      <div className="tabs__list" role="tablist">
        {tabs.map((tab, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === activeTab}
            aria-controls={`panel-${i}`}
            className={i === activeTab ? 'tabs__tab active' : 'tabs__tab'}
            onClick={() => setActiveTab(i)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') setActiveTab((i + 1) % tabs.length);
              if (e.key === 'ArrowLeft') setActiveTab((i - 1 + tabs.length) % tabs.length);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, i) => (
        <div
          key={i}
          role="tabpanel"
          id={`panel-${i}`}
          hidden={i !== activeTab}
          className="tabs__panel"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}

// ═══ ACCORDION ═══
function Accordion({ items }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="accordion">
      {items.map((item, i) => (
        <div key={i} className="accordion__item">
          <button
            className="accordion__trigger"
            aria-expanded={i === openIndex}
            onClick={() => setOpenIndex(i === openIndex ? null : i)}
          >
            {item.title}
            <span className="accordion__icon">{i === openIndex ? '−' : '+'}</span>
          </button>
          <div
            className="accordion__content"
            style={{
              maxHeight: i === openIndex ? '500px' : '0',
              overflow: 'hidden',
              transition: 'max-height 0.3s ease',
            }}
          >
            <div className="accordion__body">{item.content}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 8. Drag and Drop — Reorderable Lists

```jsx
function DragDropList({ initialItems }) {
  const [items, setItems] = useState(initialItems);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    setItems(prev => {
      const updated = [...prev];
      const [removed] = updated.splice(draggedIndex, 1);
      updated.splice(index, 0, removed);
      return updated;
    });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <ul className="drag-list">
      {items.map((item, index) => (
        <li
          key={item.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={`drag-list__item ${draggedIndex === index ? 'dragging' : ''}`}
        >
          <span className="drag-handle">⠿</span>
          {item.content}
        </li>
      ))}
    </ul>
  );
}
```

```css
.drag-list__item {
  cursor: grab;
  padding: 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: box-shadow 0.2s, transform 0.2s;
}

.drag-list__item.dragging {
  opacity: 0.5;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  transform: scale(1.02);
}

.drag-list__item:active { cursor: grabbing; }
```

---

## 9. Toast/Notification System

```jsx
import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

// Provider wraps your entire app
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container — fixed at top-right */}
      <div className="toast-container" aria-live="polite">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast--${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={() => removeToast(toast.id)}>&times;</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be inside ToastProvider');
  return context;
}

// ═══ USAGE ═══
function SaveButton() {
  const { addToast } = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      addToast({ message: 'Saved successfully!', type: 'success' });
    } catch (err) {
      addToast({ message: `Error: ${err.message}`, type: 'error', duration: 6000 });
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

```css
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.toast {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-width: 280px;
  animation: slideInRight 0.3s ease;
}

.toast--success { background: #22c55e; }
.toast--error { background: #ef4444; }
.toast--info { background: #3b82f6; }
.toast--warning { background: #f59e0b; }

@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

---

## 10. Responsive Sidebar Navigation

```jsx
function SidebarLayout({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const sidebarRef = useClickOutside(() => isMobile && setIsOpen(false));

  return (
    <div className="layout">
      {/* Mobile overlay */}
      {isMobile && isOpen && <div className="layout__overlay" />}

      <aside ref={sidebarRef} className={`layout__sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar__header">
          <img src="/logo.svg" alt="Logo" />
          {isMobile && (
            <button onClick={() => setIsOpen(false)} aria-label="Close menu">&times;</button>
          )}
        </div>

        <nav className="sidebar__nav">
          <NavLink href="/dashboard" icon="📊">Dashboard</NavLink>
          <NavLink href="/projects" icon="📁">Projects</NavLink>
          <NavLink href="/team" icon="👥">Team</NavLink>

          <div className="sidebar__divider" />
          <span className="sidebar__section-title">Settings</span>
          <NavLink href="/profile" icon="👤">Profile</NavLink>
          <NavLink href="/settings" icon="⚙️">Settings</NavLink>
        </nav>

        <div className="sidebar__footer">
          <button onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <main className="layout__main">
        <header className="layout__topbar">
          <button className="menu-toggle" onClick={() => setIsOpen(true)} aria-label="Open menu">
            ☰
          </button>
          <h1>Page Title</h1>
        </header>
        <div className="layout__content">{children}</div>
      </main>
    </div>
  );
}
```

```css
.layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 100vh;
}

.layout__sidebar {
  background: #0f172a;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;
}

.sidebar__nav { flex: 1; padding: 0.5rem; overflow-y: auto; }
.sidebar__footer { padding: 1rem; border-top: 1px solid #1e293b; }

/* Mobile: sidebar becomes overlay */
@media (max-width: 768px) {
  .layout { grid-template-columns: 1fr; }

  .layout__sidebar {
    position: fixed;
    z-index: 100;
    width: 280px;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .layout__sidebar.open { transform: translateX(0); }

  .layout__overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 99;
  }
}
```

---

## 🏋️ Practice Challenges

**Challenge 1 (Z-Index and Modals):** A junior engineer creates a Modal component but places it directly inside the deeply-nested `<Header>` component. When it opens, it is cut off by the `<main>` container's `overflow: hidden`. How do you fix this without changing the layout CSS?
<details><summary>Answer</summary>

**The Fix:** Use a **React Portal**. `createPortal(modalElement, document.body)`.
**Why:** The modal was trapped inside the stacking context and overflow boundaries of its parent (`<Header>`). A Portal physically renders the DOM nodes at the end of `document.body`, completely escaping the parent's CSS trap, while maintaining its logical position in the React tree (so context and events still bubble).
</details>

**Challenge 2 (Search Performance):** Your `SearchAutocomplete` component fetches results on every keystroke. Typing "laptop" sends 6 API requests. How do you prevent this?
<details><summary>Answer</summary>

Use a **Debounce Hook**. Wrap the raw input query: `const debouncedQuery = useDebounce(query, 300);` and trigger the API `useEffect` using `debouncedQuery` instead of `query`. This waits until the user stops typing for 300ms before firing a single API request.
</details>

---

**Next Chapter**: [DevTools Debugging Mastery →](../19_Frontend_Integration/05_DevTools_Debugging_Mastery.md)

