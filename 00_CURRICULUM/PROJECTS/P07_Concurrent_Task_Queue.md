# 🔨 Mini-Project P07 — Concurrent Task Queue

> **Semester:** 3, Week 14  
> **Topics:** Java Concurrency · `BlockingQueue` · `ExecutorService` · `CompletableFuture`  
> **Est. time:** 5–6 hours  
> **Language:** Java 17

---

## 🎯 Business Requirement (The PM Brief)

*A video transcoding startup needs a background job processor. Users upload videos, and jobs must be processed concurrently by a configurable number of worker threads. Jobs have priorities, can be cancelled, and the system must not lose jobs even if a worker crashes.*

---

## 📋 Technical Specification

### Core Components

| Component | Contract |
|---|---|
| `Task<T>` | Represents a unit of work: has an id, priority, and a `Callable<T>` |
| `TaskQueue` | Bounded priority-ordered queue of pending tasks |
| `TaskWorker` | Worker thread that pulls and executes tasks |
| `TaskExecutor` | Orchestrates workers, submits tasks, tracks results |
| `TaskResult<T>` | Holds outcome: `SUCCESS(value)` or `FAILURE(exception)` |

### Behaviour Requirements

- Tasks with higher priority are executed first
- Configurable number of worker threads (set at construction time)
- `submit(Task)` is non-blocking; returns a `CompletableFuture<TaskResult<T>>`
- `cancel(taskId)` removes the task if still pending (best-effort — cannot cancel a running task)
- `shutdown()` waits for all in-progress tasks to finish, then stops workers
- `shutdownNow()` stops workers immediately; returns all pending tasks as a list
- Worker crashes must be caught — worker must restart and log the error

### Constraints

- Queue capacity: configurable, default 1000
- Maximum concurrent workers: configurable, default 4
- A cancelled task's `CompletableFuture` completes with `CancellationException`

---

## 📝 Skeleton Code

```java
// ── Task.java ──────────────────────────────────────────────
package concurrent.taskqueue;

import java.util.UUID;
import java.util.concurrent.Callable;

public class Task<T> implements Comparable<Task<T>> {
    private final String id;
    private final int priority; // higher = more urgent
    private final Callable<T> work;
    
    public Task(int priority, Callable<T> work) {
        this.id = UUID.randomUUID().toString();
        this.priority = priority;
        this.work = work;
    }
    
    public String getId() { return id; }
    public int getPriority() { return priority; }
    public Callable<T> getWork() { return work; }
    
    @Override
    public int compareTo(Task<T> other) {
        // Higher priority = comes first (reverse natural order)
        return Integer.compare(other.priority, this.priority);
    }
}

// ── TaskResult.java ────────────────────────────────────────
package concurrent.taskqueue;

public sealed interface TaskResult<T> permits TaskResult.Success, TaskResult.Failure {
    record Success<T>(T value) implements TaskResult<T> {}
    record Failure<T>(Throwable error) implements TaskResult<T> {}
    
    default boolean isSuccess() { return this instanceof Success; }
    default T getOrThrow() {
        return switch (this) {
            case Success<T> s -> s.value();
            case Failure<T> f -> throw new RuntimeException(f.error());
        };
    }
}

// ── TaskExecutor.java ──────────────────────────────────────
package concurrent.taskqueue;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

public class TaskExecutor {
    private final int workerCount;
    private final int queueCapacity;
    
    // TODO: use PriorityBlockingQueue<PendingTask<?>> for priority ordering
    private final PriorityBlockingQueue<PendingTask<?>> queue;
    private final Map<String, PendingTask<?>> pendingById;
    private final List<Thread> workers;
    private final AtomicBoolean running = new AtomicBoolean(false);
    
    // Internal wrapper linking Task to its CompletableFuture
    record PendingTask<T>(Task<T> task, CompletableFuture<TaskResult<T>> future)
            implements Comparable<PendingTask<?>> {
        public int compareTo(PendingTask<?> other) {
            return task.compareTo((Task) other.task());
        }
    }
    
    public TaskExecutor(int workerCount, int queueCapacity) {
        this.workerCount = workerCount;
        this.queueCapacity = queueCapacity;
        this.queue = new PriorityBlockingQueue<>(queueCapacity);
        this.pendingById = new ConcurrentHashMap<>();
        this.workers = new ArrayList<>();
    }
    
    /**
     * Starts worker threads. Must be called before submit().
     */
    public void start() {
        running.set(true);
        for (int i = 0; i < workerCount; i++) {
            var worker = new Thread(this::workerLoop, "task-worker-" + i);
            worker.setDaemon(false);
            worker.start();
            workers.add(worker);
        }
    }
    
    /**
     * Submits a task for async execution.
     * @return CompletableFuture that will complete with the task result
     * @throws RejectedExecutionException if executor is shut down
     */
    @SuppressWarnings("unchecked")
    public <T> CompletableFuture<TaskResult<T>> submit(Task<T> task) {
        if (!running.get()) throw new RejectedExecutionException("Executor is shut down");
        
        var future = new CompletableFuture<TaskResult<T>>();
        var pending = new PendingTask<>(task, future);
        
        // TODO: add to queue, add to pendingById
        // TODO: if queue is full, throw RejectedExecutionException
        
        return future;
    }
    
    /**
     * Cancels a pending task. No-op if task is already running.
     * @return true if successfully cancelled, false if not found or already running
     */
    public boolean cancel(String taskId) {
        // TODO: remove from pendingById and queue
        // TODO: complete the future with CancellationException
        return false;
    }
    
    /**
     * Graceful shutdown: waits for in-progress tasks, rejects new submissions.
     */
    public void shutdown() throws InterruptedException {
        running.set(false);
        // TODO: send a poison pill per worker to unblock queue.take()
        for (var worker : workers) worker.join();
    }
    
    /**
     * The main loop for each worker thread.
     * Must catch ALL exceptions to prevent worker death.
     */
    @SuppressWarnings({"unchecked", "rawtypes"})
    private void workerLoop() {
        while (running.get() || !queue.isEmpty()) {
            try {
                // TODO: poll with timeout (not blocking take — allows checking running flag)
                var pending = queue.poll(100, TimeUnit.MILLISECONDS);
                if (pending == null) continue;
                
                // TODO: remove from pendingById (it's now running — cannot be cancelled)
                // TODO: execute pending.task().getWork().call()
                // TODO: complete future with Success or Failure result
                
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                // Log — worker must not die on task failure
                System.err.println("Worker error: " + e.getMessage());
            }
        }
    }
}
```

---

## ✅ JUnit Test Stub

```java
class TaskExecutorTest {
    TaskExecutor executor;
    
    @BeforeEach void setup() {
        executor = new TaskExecutor(2, 100);
        executor.start();
    }
    @AfterEach void teardown() throws InterruptedException { executor.shutdown(); }
    
    @Test void submit_singleTask_completesSuccessfully() throws Exception {
        var future = executor.submit(new Task<>(1, () -> "hello"));
        var result = future.get(2, TimeUnit.SECONDS);
        assertTrue(result.isSuccess());
        assertEquals("hello", result.getOrThrow());
    }
    
    @Test void submit_higherPriorityExecutedFirst() throws Exception {
        var order = Collections.synchronizedList(new ArrayList<Integer>());
        // Fill queue so workers process in sequence
        var f1 = executor.submit(new Task<>(1, () -> { order.add(1); return null; }));
        var f2 = executor.submit(new Task<>(10, () -> { order.add(10); return null; })); // higher priority
        CompletableFuture.allOf(f1, f2).get(3, TimeUnit.SECONDS);
        assertEquals(10, order.get(0)); // priority 10 should go first
    }
    
    @Test void cancel_pendingTask_completesWithCancellation() throws Exception {
        // Flood workers with slow tasks
        executor.submit(new Task<>(1, () -> { Thread.sleep(5000); return null; }));
        executor.submit(new Task<>(1, () -> { Thread.sleep(5000); return null; }));
        
        var target = new Task<Integer>(1, () -> 42);
        var future = executor.submit(target);
        
        executor.cancel(target.getId());
        assertThrows(CancellationException.class, () -> future.get(1, TimeUnit.SECONDS));
    }
    
    @Test void submit_taskThrowsException_futureCompletesWithFailure() throws Exception {
        var future = executor.submit(new Task<>(1, () -> { throw new RuntimeException("boom"); }));
        var result = future.get(2, TimeUnit.SECONDS);
        assertFalse(result.isSuccess());
        assertEquals("boom", result instanceof TaskResult.Failure<?> f ? f.error().getMessage() : "");
    }
    
    @Test void shutdown_afterShutdown_rejectsNewTasks() throws InterruptedException {
        executor.shutdown();
        assertThrows(RejectedExecutionException.class,
            () -> executor.submit(new Task<>(1, () -> "too late")));
    }
}
```

---

## 🔴 Failure Scenarios & Erklärungen

| Mistake | Why | Fix |
|---|---|---|
| `queue.take()` in worker loop (blocking) | Worker blocks forever when shutdown → `shutdown()` never returns | Use `queue.poll(timeout, unit)` with running flag check |
| Worker catches `InterruptedException` silently | Thread interrupt signal is swallowed → shutdown hangs | Re-interrupt the thread: `Thread.currentThread().interrupt(); break;` |
| `HashMap` for `pendingById` | Multiple threads access simultaneously → `ConcurrentModificationException` | Use `ConcurrentHashMap` |
| Completing future inside `synchronized` block | Callbacks attached to future may block → deadlock | Complete future OUTSIDE any lock |
| No poison pill on shutdown | Workers stuck in `queue.take()` even after `running = false` | Push N poison pills (one per worker) to unblock them |

---

## 🚀 Extension Challenges

1. **Task retry:** Add `maxRetries` to `Task` — on failure, re-enqueue with same priority up to max retries
2. **Task timeout:** Add a `timeoutMs` field — if task runs longer, cancel and fail the future
3. **Metrics:** Track: tasks submitted, completed, failed, cancelled, avg execution time
4. **Backpressure:** When queue is 80% full, `submit()` blocks briefly before throwing `RejectedExecutionException`

---

[← Back to Semester 3 Guide](../../00_CURRICULUM/SEMESTER_3_GUIDE.md)
