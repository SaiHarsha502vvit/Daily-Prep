# 🔨 Mini-Project P01 — Frequency Analyzer CLI

> **Semester:** 1, Week 2  
> **Topic:** Arrays + HashMaps  
> **Est. time:** 3–4 hours  
> **Language:** Java 17+

---

## 🎯 Business Requirement

_You are hired by a publishing house. They process thousands of documents daily and need a CLI tool that analyzes word frequencies so editors can detect overused words. The tool must be fast, handle large files, and produce sorted output._

---

## 📋 Technical Specification

### Input

A plain text file path provided as a CLI argument:

```bash
java FrequencyAnalyzer input.txt
```

### Output

```
Top 10 most frequent words:
1. "the"    → 142 occurrences
2. "and"    → 98 occurrences
3. "data"   → 67 occurrences
...

Total unique words: 843
Total words: 2,451
Average frequency: 2.91
```

### Constraints

- Case-insensitive: "The", "THE", "the" = same word
- Ignore punctuation (`.`, `,`, `!`, `?`, `:`, `;`, `"`, `'`)
- Top-N configurable via second CLI argument (default: 10)
- Must handle files up to 100MB without `OutOfMemoryError`
- Time: O(n log n) where n = number of words

---

## 🏗️ Skeleton Code

```java
// JavaSolutions/projects/p01/FrequencyAnalyzer.java
import java.io.*;
import java.util.*;
import java.util.stream.*;

public class FrequencyAnalyzer {

    public static void main(String[] args) throws IOException {
        // TODO: parse args (file path, optional top-N)
        // TODO: call analyzeFile and printResults
    }

    /**
     * Reads a file and counts word frequencies.
     * @return Map of word -> count, sorted by count descending
     * Time: O(n log n), Space: O(u) where u = unique words
     */
    public static Map<String, Integer> analyzeFile(String filePath) throws IOException {
        Map<String, Integer> freq = new HashMap<>();

        // TODO: use BufferedReader to handle large files efficiently
        // TODO: for each line, split by whitespace
        // TODO: for each word, normalize (lowercase, strip punctuation)
        // TODO: update frequency map

        // TODO: return entries sorted by count descending (use stream + Comparator)
        return freq;
    }

    /**
     * Normalizes a word: lowercase and removes non-alphabetic characters.
     * "Hello," -> "hello", "it's" -> "its"
     */
    static String normalize(String word) {
        // TODO: word.toLowerCase().replaceAll("[^a-z]", "")
        return word;
    }

    /**
     * Prints the analysis report to stdout.
     */
    static void printResults(Map<String, Integer> freqMap, int topN, int totalWords) {
        // TODO: print top-N, total unique, total words, average
    }
}
```

---

## ✅ JUnit Test Stub

```java
// JavaSolutions/projects/p01/FrequencyAnalyzerTest.java
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;
import java.io.*;
import java.nio.file.*;
import java.util.*;

class FrequencyAnalyzerTest {

    @Test void testNormalize() {
        assertEquals("hello", FrequencyAnalyzer.normalize("Hello,"));
        assertEquals("its", FrequencyAnalyzer.normalize("it's"));
        assertEquals("data", FrequencyAnalyzer.normalize("DATA"));
    }

    @Test void testAnalyzeSmallText() throws IOException {
        // Write temp file
        Path tmp = Files.createTempFile("test", ".txt");
        Files.writeString(tmp, "the cat sat on the mat, the cat is fat");

        var result = FrequencyAnalyzer.analyzeFile(tmp.toString());

        assertEquals(3, result.get("the"));
        assertEquals(2, result.get("cat"));
        assertEquals(1, result.get("on"));

        Files.delete(tmp);
    }

    @Test void testEmptyFile() throws IOException {
        Path tmp = Files.createTempFile("empty", ".txt");
        var result = FrequencyAnalyzer.analyzeFile(tmp.toString());
        assertTrue(result.isEmpty());
        Files.delete(tmp);
    }

    @Test void testCaseInsensitive() throws IOException {
        Path tmp = Files.createTempFile("case", ".txt");
        Files.writeString(tmp, "Java JAVA java");
        var result = FrequencyAnalyzer.analyzeFile(tmp.toString());
        assertEquals(3, result.get("java"));
        Files.delete(tmp);
    }
}
```

---

## 🔴 Failure Scenarios & Erklärungen

| Mistake                                  | Why                                                | Fix                                                              |
| ---------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------- |
| `FileReader` instead of `BufferedReader` | Reads byte-by-byte → extremely slow on large files | Always wrap in `BufferedReader` for line-by-line                 |
| Loading entire file into `String`        | `OutOfMemoryError` on 100MB files                  | Stream lines with `Files.lines()` or `BufferedReader.readLine()` |
| Using `word.split(" ")`                  | Misses tabs, newlines, multiple spaces             | Use `word.split("\\s+")`                                         |
| Not handling empty strings after split   | `normalize("")` → `""` becomes a key               | Filter out empty strings after normalization                     |
| Sorting the HashMap directly             | `HashMap` has no guaranteed order                  | Collect entries to `List`, sort, then return `LinkedHashMap`     |

---

## 🚀 Extension Challenges

1. **Bigram analysis:** Instead of single words, count pairs of consecutive words (bigrams).
2. **Stop word filtering:** Accept a stop-words file (`--stopwords stop.txt`) and exclude common words.
3. **Multiple files:** Accept a directory and analyze all `.txt` files, showing per-file and aggregate stats.
4. **Output formats:** Add `--json` and `--csv` flags for machine-readable output.

---

[← Back to Semester 1 Week 2](../../00_CURRICULUM/SEMESTER_1_GUIDE.md)
