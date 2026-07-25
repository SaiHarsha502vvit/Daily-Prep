

---

## Reality Check

**"Java serialization is the standard way to persist objects"** → Java's built-in Serialization (`implements Serializable`) is considered legacy — it has security vulnerabilities (arbitrary code execution via malicious streams, documented in dozens of CVEs), brittle versioning (serialVersionUID mismatch), and poor performance. Use JSON (Jackson, Gson), Protocol Buffers, or database persistence instead. `ObjectInputStream.readObject()` from untrusted sources is a known attack vector. New Java code should avoid Java serialization entirely.

**"BufferedReader is optional for reading files"** → Reading character-by-character from a `FileReader` means a system call for every character — potentially millions of calls. `BufferedReader` wraps `FileReader` and reads large chunks (8KB default) into memory, then serves characters from the buffer. For a 1MB file, that's 1 system call vs 1,000,000. Always wrap unbuffered streams with their buffered counterparts: `BufferedReader`, `BufferedWriter`, `BufferedInputStream`, `BufferedOutputStream`. The JVM does not automatically buffer for you.

**"try-with-resources works with any object"** → try-with-resources works only with `AutoCloseable` implementations. The standard I/O streams (InputStream, OutputStream, Reader, Writer, Channel) all implement it. Your custom resource classes must implement `AutoCloseable` with `close()`. Multiple resources in one try: `try (R1 r1 = ...; R2 r2 = ...)` — closed in reverse order of declaration (r2 closed before r1). This is important when r2 depends on r1 (e.g., a BufferedReader wrapping a FileReader).

**"`Files.readAllBytes()` and `Files.readString()` are the same as streams"** → `Files.readAllBytes()` reads the entire file into a byte array at once — convenient but requires the whole file in memory. For large files, use `Files.lines()` (returns a Stream<String> that reads lazily, must be closed) or `Files.newBufferedReader()`. `Files.readString()` (Java 11+) is a convenience for small text files. For anything over a few MB, streaming is memory-critical.

**"File.delete() always works"** → `File.delete()` returns `boolean` — on failure it returns `false` with NO exception. Common failures: file is open by another process (Windows locks open files), insufficient permissions, directory is not empty, file is in use by JVM itself. Use `Files.delete(path)` (NIO.2) instead — it throws `IOException` with a meaningful message on failure. Always check the return value of `File.delete()` or use `Files.delete()`.
