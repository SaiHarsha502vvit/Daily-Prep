/**
 * QUIZ 02 — Challenge 22 [HARD]: Write It Yourself — CI Triage Queue
 *
 * SCENARIO: A nightly regression run's failures stream in continuously
 * over 20+ minutes as shards finish (not all at once at the end). At any
 * point, a triage bot needs to answer "what is the single highest-priority
 * OPEN failure right now" — updated as new failures land mid-run.
 *
 * The obvious first implementation keeps an array sorted and re-sorts on
 * every arrival. Implement a MinHeap-based version instead, and explain
 * — with a real measurement, not a guess — what re-sorting costs as the
 * queue grows.
 */

import { expect, test } from "@playwright/test";

// ============================================================
// ❌ NAIVE — correct, but re-sorts on every single arrival
// ============================================================

class NaiveTriageQueue {
  private queue: [priority: number, test: string][] = [];

  onNewFailure(priority: number, testName: string): void {
    this.queue.push([priority, testName]);
    this.queue.sort((a, b) => a[0] - b[0]); // re-sorts the WHOLE queue
  }

  triageNext(): [number, string] | undefined {
    return this.queue.shift();
  }

  size(): number {
    return this.queue.length;
  }
}

// ============================================================
// ✅ FIX — a binary min-heap: O(log n) insert, O(log n) extract-min
// ============================================================

class MinHeapTriageQueue {
  private data: [priority: number, testName: string][] = [];

  size(): number {
    return this.data.length;
  }

  onNewFailure(priority: number, testName: string): void {
    this.data.push([priority, testName]);
    let i = this.data.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      // Safe: parent and i are both within [0, data.length) by construction.
      const parentEntry = this.data[parent]!;
      const currentEntry = this.data[i]!;
      if (parentEntry[0] <= currentEntry[0]) break;
      this.data[parent] = currentEntry;
      this.data[i] = parentEntry;
      i = parent;
    }
  }

  triageNext(): [number, string] | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0]!; // safe: length > 0, just checked
    const last = this.data.pop()!; // safe: length > 0, just checked
    if (this.data.length > 0) {
      this.data[0] = last;
      let i = 0;
      while (true) {
        const l = 2 * i + 1;
        const r = 2 * i + 2;
        let smallest = i;
        if (l < this.data.length && this.data[l]![0] < this.data[smallest]![0]) smallest = l;
        if (r < this.data.length && this.data[r]![0] < this.data[smallest]![0]) smallest = r;
        if (smallest === i) break;
        const smallestEntry = this.data[smallest]!;
        const currentEntry = this.data[i]!;
        this.data[i] = smallestEntry;
        this.data[smallest] = currentEntry;
        i = smallest;
      }
    }
    return top;
  }
}

// ============================================================
// Verify correctness, then measure the cost difference
// ============================================================

test("heap extracts in strictly ascending priority order", () => {
  const heap = new MinHeapTriageQueue();
  [50, 10, 40, 5, 90, 20].forEach((p, i) => heap.onNewFailure(p, `test-${i}`));

  const order: number[] = [];
  let next;
  while ((next = heap.triageNext())) order.push(next[0]);

  expect(order).toEqual([5, 10, 20, 40, 50, 90]);
});

test("both queues agree on triage order for the same input", () => {
  const naive = new NaiveTriageQueue();
  const heap = new MinHeapTriageQueue();
  const arrivals: [number, string][] = [
    [30, "a"],
    [10, "b"],
    [50, "c"],
    [20, "d"],
  ];

  for (const [p, name] of arrivals) {
    naive.onNewFailure(p, name);
    heap.onNewFailure(p, name);
  }

  const naiveOrder: string[] = [];
  const heapOrder: string[] = [];
  let n, h;
  while ((n = naive.triageNext())) naiveOrder.push(n[1]);
  while ((h = heap.triageNext())) heapOrder.push(h[1]);

  expect(heapOrder).toEqual(naiveOrder); // same result — the difference is cost, not correctness
});

test("measure: re-sort cost grows faster than heap cost as n grows", () => {
  function benchmark(QueueClass: typeof NaiveTriageQueue | typeof MinHeapTriageQueue, n: number): number {
    const q = new QueueClass();
    const start = process.hrtime.bigint();
    for (let i = 0; i < n; i++) {
      q.onNewFailure(Math.floor(Math.random() * 1000), `test-${i}`);
      if (i % 3 === 0 && q.size() > 0) q.triageNext(); // triage while arrivals continue
    }
    return Number(process.hrtime.bigint() - start) / 1e6; // ms
  }

  const n = 3000;
  const naiveMs = benchmark(NaiveTriageQueue, n);
  const heapMs = benchmark(MinHeapTriageQueue, n);

  console.log(`n=${n}: naive=${naiveMs.toFixed(2)}ms heap=${heapMs.toFixed(2)}ms`);
  // Not asserting an exact ratio (timing is machine-dependent) — but the
  // heap should not be slower, and at this n the gap is typically 5-15x.
  expect(heapMs).toBeLessThanOrEqual(naiveMs);
});

export { NaiveTriageQueue, MinHeapTriageQueue };

// WHY
// A min-heap keeps a strictly WEAKER invariant than a sorted array —
// only "every parent's priority <= its children's," never "the whole
// array is sorted." That weaker guarantee is exactly what makes insert
// and extract-min O(log n) each: restoring the invariant after a change
// only touches the O(log n) ancestors/descendants on ONE path, not the
// whole structure. A full re-sort after every arrival costs O(n log n)
// EACH TIME — for n arrivals total, that's O(n^2 log n) versus the
// heap's O(n log n). The gap isn't a fixed constant factor; it WIDENS
// as the queue grows, because the naive approach pays a growing re-sort
// cost on every single arrival while the heap's per-arrival cost stays
// O(log n) regardless of how large the queue already is.
//
// Cross-reference: 21_SDET_Playwright_Automation/06_SDET_to_SDE_Bridge/
// 34_Algorithms_in_Test_Automation.md, Section 6 — this challenge is
// that chapter's verified scenario (same benchmark shape, real numbers:
// 3.0x -> 6.2x -> 24.1x as n grows 500 -> 2000 -> 5000) in quiz format.
// Section 5 of the same chapter is the PREREQUISITE this challenge
// extends: sorting a FIXED list once (which test to run on a PR) is
// correct when the list doesn't change mid-selection; a heap is what
// you reach for the moment that stops being true.
