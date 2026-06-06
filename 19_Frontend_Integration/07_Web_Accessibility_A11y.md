**Navigation**: [< Previous](06_Web_Performance_CoreWebVitals.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](../16_JavaScript/11_Advanced_Web_APIs.md)

# ♿ Chapter 7 — Web Accessibility (a11y): Building for Everyone

**"1 in 4 adults have a disability. Accessibility isn't charity — it's engineering quality. An accessible app is a well-structured app. And in many countries, it's legally required."**

---

## Table of Contents

1. [Why Accessibility Matters — Beyond Compliance](#1-why-accessibility-matters--beyond-compliance)
2. [Semantic HTML — The Foundation](#2-semantic-html--the-foundation)
3. [ARIA — When HTML Isn't Enough](#3-aria--when-html-isnt-enough)
4. [Keyboard Navigation — No Mouse Required](#4-keyboard-navigation--no-mouse-required)
5. [Focus Management in SPAs](#5-focus-management-in-spas)
6. [Color & Contrast](#6-color--contrast)
7. [Forms — Labels, Errors, and Validation](#7-forms--labels-errors-and-validation)
8. [Images & Media](#8-images--media)
9. [Live Regions — Dynamic Content Updates](#9-live-regions--dynamic-content-updates)
10. [Testing Accessibility](#10-testing-accessibility)

---

## 1. Why Accessibility Matters — Beyond Compliance

```
  WHO BENEFITS FROM ACCESSIBILITY:
  ────────────────────────────────
  
  • Blind users           → Screen readers (NVDA, JAWS, VoiceOver)
  • Low vision users      → Screen magnification, high contrast
  • Deaf users            → Captions, visual indicators
  • Motor impairments     → Keyboard-only, voice control, switch devices
  • Cognitive disabilities → Clear layout, simple language, focus indicators
  • Temporary injuries    → Broken arm? Now you're keyboard-only
  • Situational           → Bright sunlight? Need high contrast
  • Slow connections      → Semantic HTML works without CSS/JS
  
  LEGAL: WCAG 2.1 AA is the standard. ADA, EAA (EU) require it.
  SEO: Screen readers read what Google reads. a11y = better SEO.
```

---

## 2. Semantic HTML — The Foundation

```html
<!-- BAD — Divs tell screen readers NOTHING: -->
<div class="header">
  <div class="nav">
    <div class="nav-item" onclick="goHome()">Home</div>
    <div class="nav-item" onclick="goAbout()">About</div>
  </div>
</div>
<div class="main">
  <div class="article">
    <div class="title">Article Title</div>
    <div class="content">Lorem ipsum...</div>
  </div>
</div>
<div class="footer">Copyright 2024</div>

<!-- 
Screen reader hears: "group, group, group, group, group..."
No structure, no navigation, no meaning.
-->


<!-- GOOD — Semantic HTML gives structure: -->
<header>
  <nav aria-label="Main navigation">
    <a href="/">Home</a>
    <a href="/about">About</a>
  </nav>
</header>
<main>
  <article>
    <h1>Article Title</h1>
    <p>Lorem ipsum...</p>
  </article>
</main>
<footer>Copyright 2024</footer>

<!-- 
Screen reader hears: "banner, navigation, main navigation,
link Home, link About, main, article, heading level 1 Article Title..."
User can jump between landmarks, headings, links!
-->
```

```
  SEMANTIC ELEMENT CHEAT SHEET:
  ─────────────────────────────
  
  ┌──────────────┬──────────────────────────────────────────────────┐
  │ Element      │ When to use                                      │
  ├──────────────┼──────────────────────────────────────────────────┤
  │ <header>     │ Site header or section header                    │
  │ <nav>        │ Navigation links (main nav, breadcrumbs, etc.)  │
  │ <main>       │ Primary content (ONE per page)                  │
  │ <article>    │ Self-contained content (blog post, comment)     │
  │ <section>    │ Thematic grouping with a heading                │
  │ <aside>      │ Tangential content (sidebar, related links)     │
  │ <footer>     │ Footer info (copyright, links)                  │
  │ <h1>-<h6>   │ Headings (DON'T skip levels: h1→h3)            │
  │ <button>     │ Clickable action (NOT <div onclick>!)           │
  │ <a>          │ Navigation to URL or anchor                     │
  │ <ul>/<ol>    │ Lists (nav links, menus, options)               │
  │ <table>      │ Tabular data (NOT layout!)                      │
  │ <form>       │ User input collection                           │
  │ <label>      │ Form field label (clickable!)                   │
  │ <fieldset>   │ Group related form fields                       │
  │ <dialog>     │ Modal/dialog content                            │
  │ <time>       │ Dates/times with machine-readable value         │
  │ <figure>     │ Self-contained media with caption               │
  │ <details>    │ Expandable/collapsible content                  │
  └──────────────┴──────────────────────────────────────────────────┘
```

---

## 3. ARIA — When HTML Isn't Enough

```
  FIRST RULE OF ARIA: Don't use ARIA if native HTML can do it.
  
  <div role="button" tabindex="0" onclick="submit()">Submit</div>
  ← WHY? Just use <button>Submit</button>!
  
  ARIA is for CUSTOM widgets that don't have native HTML equivalents.
```

### Essential ARIA Attributes

```html
<!-- ROLE — What is this element? -->
<div role="tablist">
  <button role="tab" aria-selected="true">Tab 1</button>
  <button role="tab" aria-selected="false">Tab 2</button>
</div>
<div role="tabpanel">Tab 1 content</div>

<!-- ARIA-LABEL — Name for elements without visible text -->
<button aria-label="Close dialog">&times;</button>
<button aria-label="Search"><svg>...</svg></button>
<nav aria-label="Breadcrumb">...</nav>

<!-- ARIA-LABELLEDBY — Reference another element as the label -->
<h2 id="cart-title">Shopping Cart</h2>
<section aria-labelledby="cart-title">
  <!-- Screen reader: "Shopping Cart, region" -->
</section>

<!-- ARIA-DESCRIBEDBY — Additional description -->
<input 
  type="password" 
  aria-describedby="password-help"

<p id="password-help">Must be at least 8 characters with one number.</p>

<!-- ARIA-EXPANDED — Is this expandable thing open? -->
<button aria-expanded="false" aria-controls="menu">Menu ▼</button>
<ul id="menu" hidden>...</ul>

<!-- ARIA-HIDDEN — Hide from screen readers (decorative) -->
<span aria-hidden="true">🎉</span>
<img src="decorative-line.svg" alt="" aria-hidden="true">

<!-- ARIA-LIVE — Announce dynamic changes -->
<div aria-live="polite">3 items in cart</div>
<!-- When text changes, screen reader announces it -->

<!-- ARIA-CURRENT — Indicate current page/step -->
<nav>
  <a href="/" aria-current="page">Home</a>
  <a href="/about">About</a>
</nav>
```

---

## 4. Keyboard Navigation — No Mouse Required

```
  EXPECTED KEYBOARD BEHAVIOR:
  ───────────────────────────
  
  ┌────────────┬───────────────────────────────────────────────┐
  │ Key        │ Expected behavior                             │
  ├────────────┼───────────────────────────────────────────────┤
  │ Tab        │ Move to next interactive element              │
  │ Shift+Tab  │ Move to previous interactive element          │
  │ Enter      │ Activate button/link                          │
  │ Space      │ Activate button, toggle checkbox              │
  │ Escape     │ Close modal/popup/dropdown                    │
  │ Arrow keys │ Navigate within components (tabs, menus)      │
  │ Home/End   │ Jump to first/last item in list               │
  └────────────┴───────────────────────────────────────────────┘
```

```jsx
// Keyboard-navigable custom dropdown:
function Dropdown({ options, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen) {
          onChange(options[activeIndex]);
          setIsOpen(false);
        } else {
          setIsOpen(true);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) setIsOpen(true);
        setActiveIndex(i => Math.min(i + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, 0));
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'Home':
        setActiveIndex(0);
        break;
      case 'End':
        setActiveIndex(options.length - 1);
        break;
    }
  };

  return (
    <div 
      role="combobox"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <span>{value || 'Select...'}</span>
      {isOpen && (
        <ul role="listbox">
          {options.map((opt, i) => (
            <li
              key={opt}
              role="option"
              aria-selected={i === activeIndex}
              className={i === activeIndex ? 'active' : ''}
              onClick={() => { onChange(opt); setIsOpen(false); }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

## 5. Focus Management in SPAs

```
  PROBLEM: In a SPA, clicking a link doesn't reload the page.
  Screen reader users don't know the page "changed."
  
  SOLUTION: Manage focus on route changes.
```

```jsx
// Focus management on route change:
function App() {
  const location = useLocation();
  const mainRef = useRef(null);

  useEffect(() => {
    // After route change, focus the main content area
    mainRef.current?.focus();
    // Also update the document title
    document.title = getPageTitle(location.pathname);
  }, [location]);

  return (
    <main ref={mainRef} tabIndex={-1} style={{ outline: 'none' }}>
      {/* tabIndex={-1} makes it focusable programmatically 
          but NOT part of tab order */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </main>
  );
}
```

### Skip Navigation Link

```html
<!-- First focusable element on the page — lets keyboard users 
     skip past the navigation directly to content -->
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <header>
    <nav><!-- 20 navigation links --></nav>
  </header>
  <main id="main-content" tabindex="-1">
    <!-- Main content -->
  </main>
</body>

<style>
  .skip-link {
    position: absolute;
    top: -100%;
    left: 0;
    padding: 0.5rem 1rem;
    background: #000;
    color: #fff;
    z-index: 9999;
  }
  .skip-link:focus {
    top: 0; /* Appears when focused via Tab */
  }
</style>
```

---




## 6. Color & Contrast

```
  WCAG CONTRAST REQUIREMENTS:
  ───────────────────────────
  
  AA (minimum):
  • Normal text (<18px): 4.5:1 contrast ratio
  • Large text (≥18px bold or ≥24px): 3:1 contrast ratio
  • UI components & graphics: 3:1 contrast ratio
  
  AAA (enhanced):
  • Normal text: 7:1 contrast ratio
  • Large text: 4.5:1 contrast ratio
  
  
  COMMON FAILURES:
  ────────────────
  
  ❌ Light gray on white:    #999 on #fff = 2.85:1 (FAILS AA)
  ❌ Placeholder text:       #aaa on #fff = 2.32:1 (FAILS AA)
  ✅ Dark gray on white:     #595959 on #fff = 7:1 (PASSES AAA!)
  ✅ Standard text:          #333 on #fff = 12.6:1 (PASSES AAA!)
  
  
  DON'T RELY ON COLOR ALONE:
  ──────────────────────────
  
  ❌ BAD:  Red text for errors (colorblind users can't see red)
  ✅ GOOD: Red text + icon + message: "⚠️ Error: Email is required"
  
  ❌ BAD:  Green = success, Red = error (only color difference)
  ✅ GOOD: ✓ Success (green + checkmark), ✗ Error (red + X icon)
```

---

## 7. Forms — Labels, Errors, and Validation

```html
<!-- EVERY input MUST have a label -->

<!-- Method 1: Wrapping (implicit association) -->
<label>
  Email address
  <input type="email" name="email" required>
</label>

<!-- Method 2: for/id (explicit association) -->
<label for="email">Email address</label>
<input id="email" type="email" name="email" required
       aria-describedby="email-error email-hint">
<p id="email-hint">We'll never share your email.</p>
<p id="email-error" role="alert" hidden>Please enter a valid email.</p>

<!-- Method 3: aria-label (when visual label not desired) -->
<input type="search" aria-label="Search products" placeholder="Search...">


<!-- GROUP related fields with fieldset + legend -->
<fieldset>
  <legend>Shipping Address</legend>
  <label for="street">Street</label>
  <input id="street" type="text" required>
  <label for="city">City</label>
  <input id="city" type="text" required>
</fieldset>


<!-- ACCESSIBLE ERROR HANDLING -->
<form novalidate>
  <label for="password">Password</label>
  <input
    id="password"
    type="password"
    aria-invalid="true"
    aria-describedby="password-error password-requirements"
    required
  >
  <p id="password-requirements">
    Must be 8+ characters with one number and one uppercase letter.
  </p>
  <p id="password-error" role="alert" class="error">
    Password doesn't meet requirements.
  </p>
</form>
```

```
  ┌───────────────────────────────────────────────────────────────┐
  │  FORM ACCESSIBILITY CHECKLIST:                                │
  │                                                               │
  │  ✅ Every input has a visible <label>                        │
  │  ✅ Labels are associated (for/id or wrapping)               │
  │  ✅ Required fields marked with aria-required="true"         │
  │  ✅ Error messages use role="alert" (announced immediately)  │
  │  ✅ aria-invalid="true" on invalid fields                    │
  │  ✅ aria-describedby links to error + help text              │
  │  ✅ Don't rely on placeholder as label (disappears on focus) │
  │  ✅ Group related fields with <fieldset> + <legend>          │
  │  ✅ Submit button is a <button type="submit">, not a <div>  │
  │                                                               │
  └───────────────────────────────────────────────────────────────┘
```

---

## 8. Images & Media

```html
<!-- INFORMATIVE images — describe the content -->
<img src="chart.png" alt="Bar chart showing 45% revenue increase in Q3 2024">

<!-- DECORATIVE images — hide from screen readers -->
<img src="decorative-swirl.svg" alt="" role="presentation">

<!-- COMPLEX images — provide long description -->
<figure>
  <img src="org-chart.png" alt="Company organization chart" aria-describedby="org-desc">
  <figcaption id="org-desc">
    CEO reports to Board. CTO, CFO, and CMO report to CEO.
    Engineering, Product, and Design report to CTO.
  </figcaption>
</figure>

<!-- SVG icons — must have accessible name -->
<button aria-label="Close">
  <svg aria-hidden="true" focusable="false">
    <path d="M6 6L18 18M6 18L18 6" />
  </svg>
</button>

<!-- VIDEO — captions and transcripts -->
<video controls>
  <source src="tutorial.mp4" type="video/mp4">
  <track kind="captions" src="captions.vtt" srclang="en" label="English" default>
  <track kind="descriptions" src="descriptions.vtt" srclang="en">
</video>
```

---

## 9. Live Regions — Dynamic Content Updates

```html
<!-- 
  When content changes dynamically (notifications, chat, alerts),
  screen readers need to know. Use aria-live regions.
-->

<!-- POLITE: Announces AFTER user finishes current task -->
<div aria-live="polite">
  <!-- When this text changes, screen reader announces it at next pause -->
  3 items in your cart
</div>

<!-- ASSERTIVE: Interrupts immediately (use sparingly!) -->
<div aria-live="assertive" role="alert">
  <!-- Urgent messages: errors, time-sensitive alerts -->
  Session expires in 2 minutes!
</div>

<!-- STATUS: Polite status messages -->
<div role="status">
  Loading... 45% complete
</div>
```

```jsx
// React example — Live search results count:
function SearchResults({ results, query }) {
  return (
    <div>
      {/* This updates as user types — screen reader announces it */}
      <div role="status" aria-live="polite" className="sr-only">
        {results.length} results found for "{query}"
      </div>
      
      <ul>
        {results.map(r => <li key={r.id}>{r.name}</li>)}
      </ul>
    </div>
  );
}
```

```css
/* Screen-reader-only class — visually hidden but announced */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---



🔬 **Section Challenge — 9. Live Regions — Dynamic Content Updates**

**Challenge 1 (Reasoning):** How do you identify that a problem requires DP vs Greedy? What's the key test?
<details><summary>Answer</summary>

Greedy test: does the locally optimal choice always lead to the globally optimal solution? (Prove via exchange argument.) If yes → greedy. If making a local choice requires knowing future choices → DP. Example: Coin Change with standard coins [1,5,10,25] → greedy works (always pick largest). Coin Change with coins [1,3,4] and amount 6 → greedy picks 4+1+1=3 coins, optimal is 3+3=2 coins. Greedy fails → DP.
</details>

**Challenge 2 (Design):** You need to find the number of ways to climb N stairs taking 1 or 2 steps at a time. Define the DP state and recurrence.
<details><summary>Answer</summary>

State: `dp[i]` = number of ways to reach step i. Recurrence: `dp[i] = dp[i-1] + dp[i-2]` (come from step i-1 via 1 step, or from step i-2 via 2 steps). Base: `dp[0]=1` (one way: don't move), `dp[1]=1`. This is exactly Fibonacci. Space optimization: only need last 2 values → O(1) space.
</details>


## 10. Testing Accessibility

```
  AUTOMATED TESTING (catches ~30% of issues):
  ──────────────────────────────────────────────
  
  1. Lighthouse Accessibility Audit (Chrome DevTools)
  2. axe DevTools Extension (most popular)
  3. WAVE Evaluation Tool
  4. eslint-plugin-jsx-a11y (catches issues at build time)
  
  MANUAL TESTING (catches the rest):
  ───────────────────────────────────
  
  1. KEYBOARD TEST:
     • Tab through entire page — can you reach everything?
     • Is focus visible on every element?
     • Can you operate all controls (buttons, dropdowns, modals)?
     • Can you escape from modals?
     • Is tab order logical?
  
  2. SCREEN READER TEST:
     • VoiceOver (Mac): Cmd+F5 to enable
     • NVDA (Windows): Free download
     • Navigate by headings (H key), links (K key), landmarks (D key)
     • Is all content readable?
     • Are interactive elements labeled?
     • Do dynamic changes get announced?
  
  3. ZOOM TEST:
     • Zoom to 200% → Is content still usable?
     • Zoom to 400% → Can you still read and navigate?
  
  4. COLOR TEST:
     • Use browser grayscale filter — Still usable?
     • Check contrast ratios (Colour Contrast Analyzer tool)
```

```javascript
// Automated test with jest-axe:
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';

expect.extend(toHaveNoViolations);

test('form is accessible', async () => {
  const { container } = render(<LoginForm />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

**Next Chapter**: [Advanced Web APIs →](../16_JavaScript/11_Advanced_Web_APIs.md)



