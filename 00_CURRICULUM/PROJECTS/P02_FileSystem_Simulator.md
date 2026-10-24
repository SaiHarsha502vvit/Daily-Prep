# 🗂️ Mini-Project P02 — In-Memory File System Simulator

> **Semester:** 1, Week 5
> **Topics:** Trees · DFS/BFS · HashMap
> **Cross-reference:** [`02_Data_Structures/01f_Trees_Heaps.md`](../../02_Data_Structures/01f_Trees_Heaps.md) · [`03_Algorithms/05_Trees.md`](../../03_Algorithms/05_Trees.md)
> **Est. time:** 5–7 hours
> **Language:** Java 17+

---

## 🎯 Business Requirement (PM Brief)

_CloudDrive Inc. is building a distributed object store. Before any real disk or network I/O is implemented, the engineering team needs a rigorous **mock in-memory file system** to serve as the backbone of the integration test suite. The mock must behave identically to a Unix file system from the caller's perspective, so every future microservice can be tested in isolation without touching real storage._

**Acceptance criteria from the PM:**

- All paths are Unix-style (e.g., `/home/user/docs/report.txt`).
- The root `/` always exists; it can never be deleted.
- `mkdir` is idempotent and creates all missing intermediate directories (Unix `mkdir -p` semantics).
- `listDir` returns the **immediate children** (names, not full paths).
- `search` returns all **absolute paths** whose filename matches the query — DFS traversal.
- `delete` on a directory removes the subtree recursively.
- Every operation that traverses a path must be **O(depth)** — O(n) or O(n²) path scans are a hard contract breach.

---

## 📋 Technical Specification

### 5W1H Frame

| Question                 | Answer                                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| **What problem?**        | Test suite needs deterministic file-system behavior without real I/O                                |
| **Naive approach?**      | One flat `HashMap<String, String>` keyed by full path                                               |
| **Repeated failure?**    | `listDir` requires a full scan of the map (O(n)); `delete` of directory leaves orphaned children    |
| **Optimized solution?**  | N-ary tree of `Node` objects; each `Node` holds a `Map<String, Node>` for O(1) child lookup         |
| **Invariant?**           | Every path traversal splits on `/` and walks the node tree one component at a time — O(depth)       |
| **Breaking constraint?** | Hard-links and symlinks break the tree model; scope is excluded                                     |
| **Edge cases?**          | Root `/`, empty segment from leading `/`, path not found, file vs. directory collision, delete root |

### Node Internal Model

```
Root node  "/"
├── home/          (isDirectory=true, children={user→Node})
│   └── user/      (isDirectory=true, children={docs→Node})
│       └── docs/  (isDirectory=true, children={report.txt→Node})
│           └── report.txt  (isDirectory=false, content="...")
└── tmp/           (isDirectory=true)
```

### API Contract

| Method       | Signature                                      | Semantics                                                               |
| ------------ | ---------------------------------------------- | ----------------------------------------------------------------------- |
| `mkdir`      | `void mkdir(String path)`                      | Create all intermediate directories. Idempotent.                        |
| `createFile` | `void createFile(String path, String content)` | Parent directory must exist. Throws if target is a directory.           |
| `readFile`   | `String readFile(String path)`                 | Returns content. Throws `FileNotFoundException` if absent or is a dir.  |
| `listDir`    | `List<String> listDir(String path)`            | Returns child names sorted lexicographically. Throws if path is a file. |
| `delete`     | `void delete(String path)`                     | Recursive for directories. Throws if root or path missing.              |
| `move`       | `void move(String src, String dest)`           | Detach node from source parent, attach to destination parent.           |
| `search`     | `List<String> search(String name)`             | DFS from root; collect all paths whose leaf name equals `name`.         |

### Complexity Targets

| Operation                           | Time                               | Space                    |
| ----------------------------------- | ---------------------------------- | ------------------------ |
| `mkdir` / `createFile` / `readFile` | O(depth)                           | O(depth) for path split  |
| `listDir`                           | O(depth + k) where k = child count | O(k)                     |
| `delete`                            | O(subtree size)                    | O(depth) recursion stack |
| `move`                              | O(depth_src + depth_dest)          | O(depth)                 |
| `search`                            | O(total nodes)                     | O(depth) recursion stack |

---

## 🏗️ Skeleton Code

```java
// JavaSolutions/projects/p02/FileSystem.java
package projects.p02;

import java.util.*;

/**
 * In-memory Unix-style file system.
 *
 * Invariant: every public method that accepts a path calls {@link #traverse(String[], boolean)}
 * to walk the tree — O(depth), never O(total nodes).
 *
 * Thread-safety: NOT thread-safe. For concurrent test suites, wrap in a synchronized proxy.
 */
public class FileSystem {

    // ─────────────────────────────────────────────────────────────────────────
    // Internal Node
    // ─────────────────────────────────────────────────────────────────────────

    private static class Node {
        final String name;
        final boolean isDirectory;
        String content;                        // null for directories
        final Map<String, Node> children;      // null for files

        /** Directory constructor */
        Node(String name) {
            this.name = name;
            this.isDirectory = true;
            this.content = null;
            this.children = new LinkedHashMap<>(); // preserve insertion order
        }

        /** File constructor */
        Node(String name, String content) {
            this.name = name;
            this.isDirectory = false;
            this.content = content;
            this.children = null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Root
    // ─────────────────────────────────────────────────────────────────────────

    private final Node root;

    public FileSystem() {
        root = new Node("/");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Creates all intermediate directories for {@code path}.
     * Idempotent: calling twice with the same path is safe.
     *
     * @param path Unix absolute path, e.g. "/home/user/docs"
     * @throws IllegalArgumentException if a path component is an existing file
     */
    public void mkdir(String path) {
        String[] parts = splitPath(path);
        // TODO: starting from root, walk each part.
        //       If the child does not exist, create a new directory Node and add it.
        //       If the child exists and isDirectory, keep walking.
        //       If the child exists and !isDirectory, throw IllegalArgumentException.
        throw new UnsupportedOperationException("TODO: implement mkdir");
    }

    /**
     * Creates a file at {@code path} with the given {@code content}.
     * The parent directory must already exist.
     *
     * @throws IllegalArgumentException if parent does not exist or target is a directory
     */
    public void createFile(String path, String content) {
        String[] parts = splitPath(path);
        // TODO: walk to the parent directory (all parts except the last).
        //       The last part is the filename.
        //       Throw if parent does not exist or is a file.
        //       Throw if target already exists as a directory.
        //       Create a new file Node and add to parent's children.
        throw new UnsupportedOperationException("TODO: implement createFile");
    }

    /**
     * Returns the content of the file at {@code path}.
     *
     * @throws java.io.FileNotFoundException if the path does not exist or is a directory
     */
    public String readFile(String path) throws java.io.FileNotFoundException {
        // TODO: traverse to the node.
        //       If not found or isDirectory, throw FileNotFoundException.
        //       Return node.content.
        throw new UnsupportedOperationException("TODO: implement readFile");
    }

    /**
     * Returns the names of immediate children of the directory at {@code path},
     * sorted lexicographically.
     *
     * @throws IllegalArgumentException if path does not exist or is a file
     */
    public List<String> listDir(String path) {
        // TODO: traverse to the node.
        //       Throw if not found or !isDirectory.
        //       Return new sorted list of children.keySet().
        throw new UnsupportedOperationException("TODO: implement listDir");
    }

    /**
     * Deletes the node at {@code path}.
     * If it is a directory, deletes the entire subtree recursively.
     *
     * @throws IllegalArgumentException if path is "/" (root) or does not exist
     */
    public void delete(String path) {
        if (path.equals("/")) throw new IllegalArgumentException("Cannot delete root");
        String[] parts = splitPath(path);
        // TODO: walk to the PARENT of the target (all parts except last).
        //       Remove the target key from parent.children.
        //       (Subtree is automatically GC'd — no explicit recursion needed for the delete itself.
        //        BUT: verify the target exists first, else throw.)
        throw new UnsupportedOperationException("TODO: implement delete");
    }

    /**
     * Moves the node at {@code src} to {@code dest}.
     * {@code dest} must be an existing directory; the moved node keeps its original name.
     *
     * @throws IllegalArgumentException if src does not exist or dest is not a directory
     */
    public void move(String src, String dest) {
        // TODO: traverse src to get the node AND its parent.
        //       traverse dest to get the destination directory node.
        //       Remove node from src parent's children.
        //       Add node to dest's children.
        //       Throw if src == "/" or dest is a file.
        throw new UnsupportedOperationException("TODO: implement move");
    }

    /**
     * Returns all absolute paths in the file system whose leaf name equals {@code name}.
     * Traversal order: DFS pre-order.
     *
     * @param name exact filename or directory name to search (no wildcards)
     * @return list of absolute paths, empty list if none found
     */
    public List<String> search(String name) {
        List<String> results = new ArrayList<>();
        // TODO: call a private DFS helper starting from root with prefix "".
        //       At each node: if node.name.equals(name), add the current absolute path to results.
        //       Recurse into children if isDirectory.
        throw new UnsupportedOperationException("TODO: implement search");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Splits an absolute Unix path into its non-empty components.
     * "/home/user/docs" → ["home", "user", "docs"]
     * "/"              → []
     *
     * CRITICAL: do NOT use path.split("/") naively — it produces a leading empty
     * string because the path starts with '/'. Use the approach below.
     */
    private String[] splitPath(String path) {
        // TODO: if path.equals("/"), return new String[0].
        //       Otherwise: return path.substring(1).split("/")
        //       Validate that no component is empty (reject "//home" etc.).
        throw new UnsupportedOperationException("TODO: implement splitPath");
    }

    /**
     * Walks the tree following {@code parts} starting from root.
     *
     * @param parts        path components from splitPath()
     * @param createDirs   if true, missing intermediate directories are created (mkdir -p mode)
     * @return the final node, or null if not found and createDirs=false
     */
    private Node traverse(String[] parts, boolean createDirs) {
        // TODO: start at root.
        //       For each component in parts:
        //         - look up in current.children
        //         - if missing and createDirs: create new directory Node, add, continue
        //         - if missing and !createDirs: return null
        //         - if found but !isDirectory and there are more parts: throw (cannot traverse through a file)
        //       Return the node reached after all parts are consumed.
        throw new UnsupportedOperationException("TODO: implement traverse");
    }

    /**
     * DFS helper for search(). Builds absolute paths incrementally.
     *
     * @param node    current node
     * @param prefix  absolute path of the PARENT (e.g. "/home/user")
     * @param name    search target name
     * @param results accumulator
     */
    private void dfsSearch(Node node, String prefix, String name, List<String> results) {
        // TODO: compute currentPath = (prefix.equals("/") ? "/" + node.name : prefix + "/" + node.name)
        //       Handle root specially: root's name is "/" and its prefix is "".
        //       If node.name.equals(name), add currentPath to results.
        //       If node.isDirectory, recurse into each child.
        throw new UnsupportedOperationException("TODO: implement dfsSearch");
    }
}
```

---

## ✅ JUnit 5 Test Stub

```java
// JavaSolutions/projects/p02/FileSystemTest.java
package projects.p02;

import org.junit.jupiter.api.*;
import java.io.FileNotFoundException;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Test contract for FileSystem.
 *
 * Each test is independent — a fresh FileSystem is created in @BeforeEach.
 * Tests are ordered from basic (mkdir) to compound (move + search).
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class FileSystemTest {

    private FileSystem fs;

    @BeforeEach
    void setUp() {
        fs = new FileSystem();
    }

    // ── Test 1: mkdir creates nested directories ───────────────────────────
    @Test @Order(1)
    @DisplayName("mkdir: creates all intermediate directories")
    void testMkdirCreatesIntermediateDirs() {
        fs.mkdir("/a/b/c");
        // listDir("/") should now contain "a"
        assertTrue(fs.listDir("/").contains("a"),
            "Root should contain 'a' after mkdir('/a/b/c')");
        // listDir("/a") should contain "b"
        assertTrue(fs.listDir("/a").contains("b"));
        // listDir("/a/b") should contain "c"
        assertTrue(fs.listDir("/a/b").contains("c"));
    }

    // ── Test 2: mkdir is idempotent ────────────────────────────────────────
    @Test @Order(2)
    @DisplayName("mkdir: idempotent — second call does not throw or duplicate")
    void testMkdirIdempotent() {
        fs.mkdir("/x/y");
        assertDoesNotThrow(() -> fs.mkdir("/x/y"));
        assertEquals(1, fs.listDir("/x").size(),
            "listDir('/x') should still contain exactly one child 'y'");
    }

    // ── Test 3: createFile and readFile round-trip ─────────────────────────
    @Test @Order(3)
    @DisplayName("createFile + readFile: content survives round-trip")
    void testCreateAndReadFile() throws FileNotFoundException {
        fs.mkdir("/docs");
        fs.createFile("/docs/readme.txt", "Hello, CloudDrive!");
        assertEquals("Hello, CloudDrive!", fs.readFile("/docs/readme.txt"));
    }

    // ── Test 4: readFile on missing path throws ────────────────────────────
    @Test @Order(4)
    @DisplayName("readFile: throws FileNotFoundException for missing path")
    void testReadFileMissingPath() {
        assertThrows(FileNotFoundException.class,
            () -> fs.readFile("/nonexistent/file.txt"));
    }

    // ── Test 5: listDir returns sorted immediate children ──────────────────
    @Test @Order(5)
    @DisplayName("listDir: returns immediate children sorted lexicographically")
    void testListDir() {
        fs.mkdir("/root/zebra");
        fs.mkdir("/root/apple");
        fs.mkdir("/root/mango");
        fs.createFile("/root/budget.csv", "data");
        List<String> children = fs.listDir("/root");
        assertEquals(List.of("apple", "budget.csv", "mango", "zebra"), children,
            "Children must be sorted lexicographically");
    }

    // ── Test 6: delete directory recursively ──────────────────────────────
    @Test @Order(6)
    @DisplayName("delete: removes directory and its entire subtree")
    void testDeleteDirRecursively() {
        fs.mkdir("/a/b/c");
        fs.createFile("/a/b/c/file.txt", "deep");
        fs.delete("/a");
        assertFalse(fs.listDir("/").contains("a"),
            "Root should no longer contain 'a' after deleting it");
    }

    // ── Test 7: delete root throws ────────────────────────────────────────
    @Test @Order(7)
    @DisplayName("delete: throws IllegalArgumentException when deleting root")
    void testDeleteRootThrows() {
        assertThrows(IllegalArgumentException.class, () -> fs.delete("/"));
    }

    // ── Test 8: move renames node from src to dest directory ─────────────
    @Test @Order(8)
    @DisplayName("move: detaches node from src parent and attaches to dest")
    void testMove() throws FileNotFoundException {
        fs.mkdir("/src");
        fs.mkdir("/dest");
        fs.createFile("/src/report.txt", "quarterly");
        fs.move("/src/report.txt", "/dest");
        // File should now live at /dest/report.txt
        assertEquals("quarterly", fs.readFile("/dest/report.txt"));
        // /src should no longer contain report.txt
        assertFalse(fs.listDir("/src").contains("report.txt"));
    }

    // ── Test 9: search returns all matching absolute paths ────────────────
    @Test @Order(9)
    @DisplayName("search: DFS finds all files matching the given name")
    void testSearch() {
        fs.mkdir("/home/alice");
        fs.mkdir("/home/bob");
        fs.mkdir("/tmp");
        fs.createFile("/home/alice/notes.txt", "a");
        fs.createFile("/home/bob/notes.txt", "b");
        fs.createFile("/tmp/notes.txt", "c");
        List<String> hits = fs.search("notes.txt");
        assertEquals(3, hits.size(), "Expected 3 files named notes.txt");
        assertTrue(hits.contains("/home/alice/notes.txt"));
        assertTrue(hits.contains("/home/bob/notes.txt"));
        assertTrue(hits.contains("/tmp/notes.txt"));
    }

    // ── Test 10: path-not-found edge case ─────────────────────────────────
    @Test @Order(10)
    @DisplayName("edge case: listDir on non-existent path throws")
    void testListDirPathNotFound() {
        assertThrows(IllegalArgumentException.class,
            () -> fs.listDir("/ghost/directory"));
    }

    // ── Test 11: createFile without parent throws ─────────────────────────
    @Test @Order(11)
    @DisplayName("edge case: createFile throws when parent directory does not exist")
    void testCreateFileWithoutParent() {
        assertThrows(IllegalArgumentException.class,
            () -> fs.createFile("/no/parent/file.txt", "content"));
    }

    // ── Test 12: search on empty file system ──────────────────────────────
    @Test @Order(12)
    @DisplayName("edge case: search returns empty list when no files match")
    void testSearchNoMatch() {
        fs.mkdir("/a/b");
        List<String> results = fs.search("ghost.txt");
        assertTrue(results.isEmpty());
    }
}
```

---

## 🔴 Failure Scenarios — Erklärung

| #   | Mistake                                                                                     | Why It Fails                                                                                                                                                                                                        | Invariant Violated                                                                       | Fix                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `path.split("/")` produces `["", "home", "user"]`                                           | Leading `/` creates an empty string at index 0; `root.children.get("")` returns `null` on every lookup                                                                                                              | Path split must yield only non-empty components                                          | Use `path.substring(1).split("/")` for non-root paths; return `[]` for `"/"`                                                                                                                    |
| 2   | `delete` removes the node from the tree without recursing into children                     | The child subtree is disconnected from the tree, but the caller added no GC guarantee; in production any retained reference would leak; moreover tests that check child absence after delete still pass by accident | Subtree must be fully unreachable                                                        | Since `Node.children` holds the only strong references, removing the node from its parent's map is sufficient — but you MUST also check the node exists before removal and throw if it does not |
| 3   | Flat `HashMap<String, String>` keyed by full path                                           | `listDir` requires iterating the entire map and filtering by prefix — O(n); `delete` requires a separate scan to find orphaned child keys                                                                           | O(depth) traversal invariant                                                             | Use the N-ary tree model; `listDir` reads `node.children.keySet()` directly                                                                                                                     |
| 4   | `traverse` returns `null` silently instead of throwing                                      | `mkdir("/a/b")` called after `createFile("/a", …)` silently overwrites; `listDir` on a file path gets `null.children.keySet()` → `NullPointerException`                                                             | Every traversal through a non-directory must be a contract violation, not a silent no-op | Check `!currentNode.isDirectory` and throw `IllegalArgumentException` immediately                                                                                                               |
| 5   | `search` starts from the first non-root node, skipping the root                             | Files stored directly at `/filename` are never found                                                                                                                                                                | DFS must start at root and include root's name check before recursing                    | Start `dfsSearch` at `root`; the root's own name `"/"` will never match a normal filename, but children at depth 1 are reached correctly                                                        |
| 6   | `move` reuses the existing `Node` reference but forgets to remove it from the source parent | Source parent retains the node; after move, the file appears in BOTH locations                                                                                                                                      | A `Node` must have exactly one parent at all times                                       | Remove from source `parent.children` BEFORE adding to destination                                                                                                                               |
| 7   | `listDir("/")` throws `ArrayIndexOutOfBoundsException`                                      | `splitPath("/")` returns `[""]` instead of `[]`; traversal tries `root.children.get("")` → null → throws                                                                                                            | Root is a special case that must map to the root node directly                           | Treat path `"/"` as a zero-part path: return root immediately in `traverse`                                                                                                                     |

---

## 🔬 Section Challenge

**Challenge (Tree Traversal Invariant):**
Given this state:

```
/
├── a/
│   └── b/
│       └── report.txt   (content="v1")
└── tmp/
    └── report.txt       (content="v2")
```

Trace through `fs.search("report.txt")`. In which order does DFS pre-order visit nodes? What is returned? What changes if you switch to BFS?

<details><summary>Answer</summary>

**DFS pre-order visit sequence (children iterated in insertion order):**
`/` → `/a` → `/a/b` → `/a/b/report.txt` ✓ → `/tmp` → `/tmp/report.txt` ✓

**Result:** `["/a/b/report.txt", "/tmp/report.txt"]`

**BFS visit sequence:**

- Level 0: `/`
- Level 1: `/a`, `/tmp`
- Level 2: `/a/b`, `/tmp/report.txt` ✓
- Level 3: `/a/b/report.txt` ✓

**Result:** `["/tmp/report.txt", "/a/b/report.txt"]` — same set, different order.

**Key insight:** DFS uses O(depth) stack space; BFS uses O(width) queue space. In a highly imbalanced file system (one very deep path), DFS is safer. In a wide, shallow file system with millions of root-level entries, BFS's queue can grow large. For a file system simulator, DFS is canonical.

</details>

---

## 🚀 Extension Challenges

### Challenge 1 — `copyFile(src, dest)`

Add `void copyFile(String src, String dest)` that deep-copies a file node (not a directory) to a destination directory. Think carefully: should this copy by value (new Node with same content string) or by reference? What invariant prevents sharing a mutable `content` field?

### Challenge 2 — File Versioning (Last 3 Versions)

Modify the `Node` class so that when `createFile` is called on an existing path, the old content is pushed onto a `Deque<String> history` (max size 3). Add `String getVersion(String path, int n)` where `n=0` is current, `n=1` is previous, etc. What data structure gives O(1) push and O(1) indexed access? (Hint: `ArrayDeque` vs `LinkedList` — see [`02_Data_Structures/01d_Stack_Queue.md`](../../02_Data_Structures/01d_Stack_Queue.md))

### Challenge 3 — Permissions Model

Add a `Permission` record:

```java
record Permission(boolean read, boolean write, boolean execute) {}
```

Store `Map<String, Permission> acl` on each `Node` (key = username). Modify `readFile`, `createFile`, `delete`, and `listDir` to accept a `String user` parameter and throw `SecurityException` if the user lacks the required permission. What invariant must hold for the root node's ACL?

---

## 📎 Reference Anchors

- 📎 **Reference Anchor:** [OpenJDK `LinkedHashMap.java`](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/LinkedHashMap.java)
- **Invariant learned:** `LinkedHashMap` maintains insertion order via a doubly-linked list overlay on the hash table, giving O(1) put/get AND preserving the order `listDir` needs.
- **Local rewrite:** Use `LinkedHashMap` for `Node.children` when insertion-order iteration matters; use `TreeMap` if you want alphabetical order without a sort step.
- **Constraint warning:** `TreeMap` gives O(log k) put/get per child lookup vs O(1) for `HashMap`/`LinkedHashMap`; for deep trees with many children this compounds.

- 📎 **Reference Anchor:** [cp-algorithms: DFS traversal](https://cp-algorithms.com/graph/depth-first-search.html)
- **Invariant learned:** DFS pre-order visits a node before its children; post-order visits after. For a file-system `delete`, post-order would be natural if you needed to clean up resources leaf-first.
- **Local rewrite:** `dfsSearch` here is pre-order (check name → recurse). A post-order variant would be needed for a bottom-up delete with custom hooks.
- **Constraint warning:** Java's default stack depth is ~500–1000 frames. A file system with path depth > 500 would overflow. In production, convert to an explicit `Deque<Node>` stack.

---

[← Back to Semester 1 Guide](../../00_CURRICULUM/SEMESTER_1_GUIDE.md)
