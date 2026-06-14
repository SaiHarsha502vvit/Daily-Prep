import { describe, it } from "node:test";
import assert from "node:assert";
import { aggregate, filterByTag, filterFailed } from "../src/data/aggregate";
import type { TestResult } from "../src/data/aggregate";

function makeTest(overrides: Partial<TestResult> = {}): TestResult {
  return {
    title: "Test foo",
    file: "foo.spec.ts",
    status: "passed",
    duration: 1000,
    errors: [],
    tags: [],
    resultsLength: 1,
    lastResultPassed: false,
    ...overrides,
  };
}

describe("aggregate", () => {
  it("counts total tests", () => {
    const results: TestResult[] = [
      makeTest({ title: "t1", status: "passed" }),
      makeTest({ title: "t2", status: "passed" }),
      makeTest({ title: "t3", status: "failed" }),
    ];
    const { overall } = aggregate(results);
    assert.strictEqual(overall.total, 3);
  });

  it("counts passed / failed / skipped correctly", () => {
    const results: TestResult[] = [
      makeTest({ title: "t1", status: "passed" }),
      makeTest({ title: "t2", status: "passed" }),
      makeTest({ title: "t3", status: "failed" }),
      makeTest({ title: "t4", status: "skipped" }),
    ];
    const { overall } = aggregate(results);
    assert.strictEqual(overall.passed, 2);
    assert.strictEqual(overall.failed, 1);
    assert.strictEqual(overall.skipped, 1);
  });

  it("detects flaky tests (retry > 1 and last result passed)", () => {
    const results: TestResult[] = [
      makeTest({
        title: "t1",
        resultsLength: 3,
        lastResultPassed: true,
        status: "passed",
      }),
      makeTest({
        title: "t2",
        resultsLength: 1,
        lastResultPassed: false,
        status: "passed",
      }),
    ];
    const { overall } = aggregate(results);
    assert.strictEqual(
      overall.flaky,
      1,
      "Only test with retry>1 and last pass should be flaky",
    );
  });

  it("aggregates duration", () => {
    const results: TestResult[] = [
      makeTest({ title: "t1", duration: 1000 }),
      makeTest({ title: "t2", duration: 2000 }),
    ];
    const { overall } = aggregate(results);
    assert.strictEqual(overall.duration, 3000);
  });

  it("breaks down by project", () => {
    const results: TestResult[] = [
      makeTest({ title: "t1", projectName: "chromium", status: "passed" }),
      makeTest({ title: "t2", projectName: "chromium", status: "failed" }),
      makeTest({ title: "t3", projectName: "firefox", status: "passed" }),
    ];
    const { byProject } = aggregate(results);
    assert.strictEqual(byProject["chromium"].total, 2);
    assert.strictEqual(byProject["firefox"].total, 1);
    assert.strictEqual(byProject["chromium"].failed, 1);
  });

  it("breaks down by owner", () => {
    const results: TestResult[] = [
      makeTest({ title: "t1", owner: "alice", status: "passed" }),
      makeTest({ title: "t2", owner: "alice", status: "failed" }),
      makeTest({ title: "t3", owner: "bob", status: "skipped" }),
    ];
    const { byOwner } = aggregate(results);
    assert.strictEqual(byOwner["alice"].total, 2);
    assert.strictEqual(byOwner["bob"].total, 1);
    // `(unassigned)` bucket is only created when at least one test lacks an owner.
    // All 3 tests here have owners, so the bucket is absent.
    assert.strictEqual(byOwner["(unassigned)"], undefined);
  });

  it("collects failed tests with error messages", () => {
    const results: TestResult[] = [
      makeTest({
        title: "t1",
        status: "failed",
        errors: ["Assertion failed: expected 1 to equal 2"],
      }),
      makeTest({ title: "t2", status: "passed" }),
    ];
    const { failedTests } = aggregate(results);
    assert.strictEqual(failedTests.length, 1);
    assert.ok(failedTests[0].error.includes("Assertion failed"));
  });

  it("sorts slowest tests descending", () => {
    const results: TestResult[] = [
      makeTest({ title: "fast", duration: 500 }),
      makeTest({ title: "slow", duration: 5000 }),
      makeTest({ title: "medium", duration: 2000 }),
    ];
    const { slowestTests } = aggregate(results);
    assert.strictEqual(slowestTests[0].title, "slow");
    assert.strictEqual(slowestTests[1].title, "medium");
    assert.strictEqual(slowestTests[2].title, "fast");
  });
});

describe("filterByTag", () => {
  it("returns only tests with the given tag", () => {
    const results: TestResult[] = [
      makeTest({ title: "t1", tags: ["smoke"] }),
      makeTest({ title: "t2", tags: ["regression"] }),
      makeTest({ title: "t3", tags: ["smoke", "regression"] }),
    ];
    const filtered = filterByTag(results, "smoke");
    assert.strictEqual(filtered.length, 2);
    assert.ok(filtered.every((t) => (t.tags ?? []).includes("smoke")));
  });
});

describe("filterFailed", () => {
  it("returns only failed and timedOut tests", () => {
    const results: TestResult[] = [
      makeTest({ title: "t1", status: "passed" }),
      makeTest({ title: "t2", status: "failed" }),
      makeTest({ title: "t3", status: "timedOut" }),
      makeTest({ title: "t4", status: "skipped" }),
    ];
    const filtered = filterFailed(results);
    assert.strictEqual(filtered.length, 2);
    assert.ok(
      filtered.every((t) => t.status === "failed" || t.status === "timedOut"),
    );
  });
});
