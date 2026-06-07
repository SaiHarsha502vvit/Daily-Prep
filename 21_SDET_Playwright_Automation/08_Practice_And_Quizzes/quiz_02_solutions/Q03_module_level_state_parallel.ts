/**
 * QUIZ 02 — Challenge 3 [HARD]: Module-Level State in Parallel Tests
 *
 * ORIGINAL BUGGY CODE:
 *   let createdOrderId: string;
 *   let createdCustomerId: string;
 *
 *   test('Create customer and order', async ({ page }) => { ... createdOrderId = ...; });
 *   test('Verify order exists',        async ({ page }) => { navigateToOrder(createdOrderId); });
 *   test('Delete order',               async ({ page }) => { deleteOrder(createdOrderId); });
 *
 * QUESTION: What are the two bugs that cause intermittent CI failures?
 */

import { test, expect } from '@playwright/test';

// ============================================================
// BUG 1 — Module-level variables are NOT shared across workers
// ============================================================
// Playwright spawns N worker processes. Each worker has its own JS heap.
// If "Verify order" lands in Worker 2, `createdOrderId` is undefined in
// Worker 2's memory — Worker 1 wrote to ITS copy of the module variable.
//
// BUG 2 — Test execution order is not guaranteed
// ============================================================
// Playwright does not guarantee sequential test execution unless you
// explicitly opt into serial mode.  "Delete order" might run before
// "Verify order", leaving the verify test hitting a 404.

// ❌ BUGGY — shared mutable module-level state
let createdOrderId_BAD: string;
let createdCustomerId_BAD: string;

test('Create customer and order — BUGGY', async ({ page: _page }) => {
  // Imagine an API call here that returns { id: 'C-1' }
  createdCustomerId_BAD = 'C-1';
  createdOrderId_BAD = 'ORD-1';
});

test('Verify order — BUGGY', async ({ page: _page }) => {
  // createdOrderId_BAD is undefined if this runs in a different worker
  console.log('order id:', createdOrderId_BAD); // may print "undefined"
});

// ============================================================
// ✅ FIX — describe.serial + object accumulator (same worker, same scope)
// ============================================================
// describe.serial pins all tests to the same worker AND enforces sequential
// execution.  Using a const object (not let primitives) keeps the reference
// stable across the describe block.

test.describe.serial('Order lifecycle', () => {
  // Shared state — an object so the reference is stable (reassigning a
  // primitive like `let orderId = ''` inside a test does NOT propagate to
  // other tests, because each `let` closure captures a different slot).
  const data = { customerId: '', orderId: '' };

  test('Create customer and order', async ({ page: _page }) => {
    // Simulate API call:
    data.customerId = 'C-1';
    data.orderId = 'ORD-1';
    expect(data.orderId).toBe('ORD-1'); // just to show it's set
  });

  test('Verify order exists for customer', async ({ page: _page }) => {
    // data.orderId is guaranteed to be set — same worker, sequential
    expect(data.orderId).toBe('ORD-1');
  });

  test('Delete order', async ({ page: _page }) => {
    // Still guaranteed to run AFTER "Verify"
    expect(data.orderId).toBe('ORD-1');
  });
});

// WHY
// Playwright runs tests across worker processes for speed.  Worker processes
// are separate Node.js processes — they share NO memory.  Module-level
// variables live in process memory, so mutating one worker's copy is
// invisible to other workers.
//
// describe.serial is the escape hatch for stateful sequences:
//   - It pins the describe block to one worker.
//   - It runs tests in the declared order.
//   - It stops the block on the first failure (like a short-circuit).
//
// Prefer independent idempotent tests whenever possible.  Use describe.serial
// only for true lifecycle sequences (create → verify → delete) where
// the later steps can't stand alone.
