> **Navigation**: [< Previous Chapter](01f_Trees_Heaps.md) | [Back to Index](../00_MASTER_INDEX.md)

---

# 🔬 PART 10A: DEEP INTERNALS - EVERY DATA STRUCTURE AT CPU/MEMORY LEVEL

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║        THE COMPLETE INTERNAL VIEW - HOW DATA STRUCTURES ACTUALLY WORK            ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║  This section shows what REALLY happens when you use each data structure:        ║
║                                                                                  ║
║  • Exact memory layout (byte by byte)                                            ║
║  • CPU instructions executed                                                     ║
║  • Cache behavior and performance                                                ║
║  • JVM object overhead                                                           ║
║  • Real assembly/bytecode operations                                             ║
║                                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

## 📊 1. Arraylist Deep Internals

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ARRAYLIST - COMPLETE INTERNAL VIEW                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ArrayList<Integer> list = new ArrayList<>();                                   │
│  list.add(42);                                                                  │
│  list.add(99);                                                                  │
│  list.add(15);                                                                  │
│                                                                                 │
│  MEMORY LAYOUT (JVM HotSpot, 64-bit, compressed oops):                          │
│                                                                                 │
│  ArrayList Object (HEAP):                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ OFFSET │ SIZE │ FIELD                  │ VALUE                         │     │
│  ├────────┼──────┼────────────────────────┼───────────────────────────────┤     │
│  │ 0      │ 8    │ Mark Word              │ 0x00000001 (unlocked)         │     │
│  │ 8      │ 4    │ Class Pointer          │ → ArrayList.class             │     │
│  │ 12     │ 4    │ padding                │ (alignment)                    │    │
│  │ 16     │ 4    │ elementData (ref)      │ 0x00ABC000 → Object[]         │     │
│  │ 20     │ 4    │ size                   │ 3                              │    │
│  │ 24     │ 4    │ modCount               │ 3 (modification counter)       │    │
│  │ 28     │ 4    │ padding                │                                │    │
│  └────────┴──────┴────────────────────────┴───────────────────────────────┘     │
│  TOTAL: 32 bytes for ArrayList object itself                                    │
│                                                                                 │
│                                                                                 │
│  Object[] elementData (at 0x00ABC000):                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ OFFSET │ SIZE │ CONTENT                │ VALUE                         │     │
│  ├────────┼──────┼────────────────────────┼───────────────────────────────┤     │
│  │ 0      │ 8    │ Mark Word              │ 0x00000001                     │    │
│  │ 8      │ 4    │ Class Pointer          │ → Object[].class              │     │
│  │ 12     │ 4    │ Array Length           │ 10 (default capacity)         │     │
│  │ 16     │ 4    │ element[0] ref         │ 0x00DEF000 → Integer(42)      │     │
│  │ 20     │ 4    │ element[1] ref         │ 0x00DEF010 → Integer(99)      │     │
│  │ 24     │ 4    │ element[2] ref         │ 0x00DEF020 → Integer(15)      │     │
│  │ 28     │ 4    │ element[3] ref         │ null (empty slot)             │     │
│  │ ...    │ ...  │ ...                    │ null                          │     │
│  │ 52     │ 4    │ element[9] ref         │ null                          │     │
│  └────────┴──────┴────────────────────────┴───────────────────────────────┘     │
│  TOTAL: 56 bytes for Object[10] array                                           │
│                                                                                 │
│                                                                                 │
│  Integer Object (at 0x00DEF000 - for value 42):                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ OFFSET │ SIZE │ FIELD                  │ VALUE                         │     │
│  ├────────┼──────┼────────────────────────┼───────────────────────────────┤     │
│  │ 0      │ 8    │ Mark Word              │ 0x00000001                     │    │
│  │ 8      │ 4    │ Class Pointer          │ → Integer.class               │     │
│  │ 12     │ 4    │ value                  │ 42                             │    │
│  └────────┴──────┴────────────────────────┴───────────────────────────────┘     │
│  TOTAL: 16 bytes per Integer object!                                            │
│                                                                                 │
│                                                                                 │
│  TOTAL MEMORY FOR 3 INTEGERS:                                                   │
│  ─────────────────────────────                                                  │
│  • ArrayList object:    32 bytes                                                │
│  • Object[] array:      56 bytes                                                │
│  • 3 Integer objects:   48 bytes (16 × 3)                                       │
│  ───────────────────────────────                                                │
│  TOTAL:                 136 bytes!                                              │
│                                                                                 │
│  Compare to:                                                                    │
│  int[] arr = {42, 99, 15}; → 28 bytes (12 header + 4 length + 3×4 values)       │
│                                                                                 │
│  ArrayList uses 4.8x MORE memory than primitive array!                          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ARRAYLIST.GET() - WHAT ACTUALLY HAPPENS                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  int value = list.get(1);  // Get element at index 1                            │
│                                                                                 │
│  JAVA SOURCE (simplified):                                                      │
│  ─────────────────────────                                                      │
│  public E get(int index) {                                                      │
│      rangeCheck(index);                                                         │
│      return elementData(index);                                                 │
│  }                                                                              │
│                                                                                 │
│                                                                                 │
│  BYTECODE (actual JVM instructions):                                            │
│  ────────────────────────────────────                                           │
│  aload_1           // Load 'list' reference onto stack                          │
│  iconst_1          // Push constant 1 (index) onto stack                        │
│  invokevirtual #4  // Method ArrayList.get:(I)Ljava/lang/Object;                │
│                                                                                 │
│  Inside get():                                                                  │
│  iload_1           // Load index parameter                                      │
│  aload_0           // Load 'this' reference                                     │
│  getfield #2       // Field elementData:[Ljava/lang/Object;                     │
│  iload_1           // Load index again                                          │
│  aaload            // Load element from array (THE KEY OPERATION!)              │
│  areturn           // Return object reference                                   │
│                                                                                 │
│                                                                                 │
│  ASSEMBLY (x86-64, after JIT compilation):                                      │
│  ──────────────────────────────────────────                                     │
│  ; Bounds check (usually eliminated by JIT if in loop)                          │
│  cmp    edx, [rax+0x10]      ; Compare index with array length                  │
│  jae    THROW_EXCEPTION      ; Jump if index >= length                          │
│                                                                                 │
│  ; Calculate element address                                                    │
│  movsxd rdx, edx             ; Sign-extend index to 64-bit                      │
│  mov    rax, [rax+0x18+rdx*4]; Load element reference from array                │
│  ; rax now contains reference to Integer object                                 │
│                                                                                 │
│                                                                                 │
│  CPU CYCLES BREAKDOWN:                                                          │
│  ─────────────────────                                                          │
│  1. bounds check:     ~1 cycle (comparison)                                     │
│  2. address calc:     ~1 cycle (multiply-add)                                   │
│  3. memory load:      ~4 cycles (L1 hit) or ~200 cycles (cache miss)            │
│  4. method overhead:  ~15-25 cycles (if not inlined by JIT)                     │
│                                                                                 │
│  BEST CASE: ~5-10 cycles (JIT inlined, L1 cache hit)                            │
│  WORST CASE: ~200+ cycles (cache miss on array or object)                       │
│                                                                                 │
│                                                                                 │
│  CACHE BEHAVIOR:                                                                │
│  ───────────────                                                                │
│  When you access list.get(0):                                                   │
│  • CPU loads cache line containing array reference pointers                     │
│  • Adjacent elements (indices 1, 2, 3...) also loaded!                          │
│  • But actual Integer objects are scattered in heap                             │
│  • Each Integer object access may be a CACHE MISS                               │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                                                                         │    │
│  │  Cache Line (64 bytes) loaded for array:                               │     │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │     │
│  │  │ ref[0] │ ref[1] │ ref[2] │ ref[3] │ ... │ ref[15] │              │  │     │
│  │  │ 4 bytes│ 4 bytes│ 4 bytes│ 4 bytes│ ... │ 4 bytes │              │  │     │
│  │  └────┬───┴────┬───┴────┬───┴────┬───┴─────┴─────────┘              │  │     │
│  │       │        │        │        │                                   │  │    │
│  │       ▼        ▼        ▼        ▼                                   │  │    │
│  │    Integer  Integer  Integer  Integer   ← SCATTERED IN HEAP!        │  │     │
│  │    @0x1000  @0x5000  @0x8000  @0x2000   ← EACH IS CACHE MISS!       │  │     │
│  │                                                                      │  │    │
│  └─────────────────────────────────────────────────────────────────────┘   │    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ARRAYLIST RESIZE - WHAT ACTUALLY HAPPENS                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  // When ArrayList is full and you add another element:                         │
│  list.add(newElement);                                                          │
│                                                                                 │
│  STEP 1: Allocate new array (1.5x size)                                         │
│  ───────────────────────────────────────                                        │
│  int newCapacity = oldCapacity + (oldCapacity >> 1);  // 10 → 15                │
│  Object[] newElementData = new Object[newCapacity];                             │
│                                                                                 │
│  Memory: Request 15 × 8 = 120 bytes (+ header) from heap                        │
│  JVM: Find free space, potentially trigger GC if heap full                      │
│                                                                                 │
│                                                                                 │
│  STEP 2: Copy all elements                                                      │
│  ─────────────────────────                                                      │
│  System.arraycopy(oldArray, 0, newArray, 0, size);                              │
│                                                                                 │
│  What System.arraycopy actually does:                                           │
│  • Uses CPU's SIMD instructions (SSE/AVX) for bulk memory copy                  │
│  • Can copy 32-64 bytes per cycle using vector registers                        │
│  • Much faster than manual loop!                                                │
│                                                                                 │
│  Assembly (AVX-256 enabled):                                                    │
│  vmovdqu ymm0, [rsi]        ; Load 32 bytes from source                         │
│  vmovdqu [rdi], ymm0        ; Store 32 bytes to destination                     │
│  add     rsi, 32            ; Advance source pointer                            │
│  add     rdi, 32            ; Advance destination pointer                       │
│  ; Repeat until all copied                                                      │
│                                                                                 │
│                                                                                 │
│  STEP 3: Update reference                                                       │
│  ─────────────────────────                                                      │
│  this.elementData = newElementData;                                             │
│                                                                                 │
│  Old array becomes garbage → collected later by GC                              │
│                                                                                 │
│                                                                                 │
│  TIME COMPLEXITY ANALYSIS:                                                      │
│  ─────────────────────────                                                      │
│  • Single add() with resize: O(n) - must copy n elements                        │
│  • But resize happens rarely!                                                   │
│                                                                                 │
│  After n adds, how many total copies?                                           │
│  • 10 elements → 10 copies (resize from 10 to 15)                               │
│  • 15 elements → 15 copies (resize from 15 to 22)                               │
│  • 22 elements → 22 copies (resize from 22 to 33)                               │
│  • ...                                                                          │
│                                                                                 │
│  Total copies ≈ n + n/1.5 + n/1.5² + ... ≈ 3n                                   │
│  Average per add = 3n / n = 3 = O(1) AMORTIZED!                                 │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## #️⃣ 2. Hashmap Deep Internals

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    HASHMAP - COMPLETE INTERNAL VIEW                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  HashMap<String, Integer> map = new HashMap<>();                                │
│  map.put("Alice", 25);                                                          │
│  map.put("Bob", 30);                                                            │
│  map.put("Charlie", 35);                                                        │
│                                                                                 │
│  MEMORY LAYOUT (Java 8+, 64-bit JVM):                                           │
│                                                                                 │
│  HashMap Object:                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ OFFSET │ SIZE │ FIELD                  │ VALUE                         │     │
│  ├────────┼──────┼────────────────────────┼───────────────────────────────┤     │
│  │ 0      │ 8    │ Mark Word              │ 0x00000001                     │    │
│  │ 8      │ 4    │ Class Pointer          │ → HashMap.class               │     │
│  │ 12     │ 4    │ padding                │                                │    │
│  │ 16     │ 4    │ table (ref)            │ 0x00AA0000 → Node[]           │     │
│  │ 20     │ 4    │ size                   │ 3                              │    │
│  │ 24     │ 4    │ modCount               │ 3                              │    │
│  │ 28     │ 4    │ threshold              │ 12 (capacity × loadFactor)    │     │
│  │ 32     │ 4    │ loadFactor             │ 0.75f (as int bits)           │     │
│  │ 36     │ 4    │ padding                │                                │    │
│  └────────┴──────┴────────────────────────┴───────────────────────────────┘     │
│  TOTAL: 40 bytes for HashMap object                                             │
│                                                                                 │
│                                                                                 │
│  Node[] table (bucket array, at 0x00AA0000):                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ INDEX │ CONTENT                                                         │    │
│  ├───────┼─────────────────────────────────────────────────────────────────┤    │
│  │ [0]   │ null                                                            │    │
│  │ [1]   │ null                                                            │    │
│  │ [2]   │ 0x00BB0000 → Node("Alice", 25, null)                           │     │
│  │ [3]   │ null                                                            │    │
│  │ [4]   │ 0x00BB0040 → Node("Bob", 30, null)                             │     │
│  │ [5]   │ null                                                            │    │
│  │ [6]   │ null                                                            │    │
│  │ [7]   │ 0x00BB0080 → Node("Charlie", 35, null)                         │     │
│  │ ...   │ null                                                            │    │
│  │ [15]  │ null                                                            │    │
│  └───────┴─────────────────────────────────────────────────────────────────┘    │
│  TOTAL: 16 + (16 × 4) = 80 bytes for Node[16]                                   │
│                                                                                 │
│                                                                                 │
│  Node Object (at 0x00BB0000 for "Alice"):                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ OFFSET │ SIZE │ FIELD                  │ VALUE                         │     │
│  ├────────┼──────┼────────────────────────┼───────────────────────────────┤     │
│  │ 0      │ 8    │ Mark Word              │ 0x00000001                     │    │
│  │ 8      │ 4    │ Class Pointer          │ → HashMap$Node.class          │     │
│  │ 12     │ 4    │ hash                   │ 63479193 (cached hash)        │     │
│  │ 16     │ 4    │ key (ref)              │ 0x00CC0000 → "Alice"          │     │
│  │ 20     │ 4    │ value (ref)            │ 0x00DD0000 → Integer(25)      │     │
│  │ 24     │ 4    │ next (ref)             │ null (no collision)           │     │
│  │ 28     │ 4    │ padding                │                                │    │
│  └────────┴──────┴────────────────────────┴───────────────────────────────┘     │
│  TOTAL: 32 bytes per Node                                                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                    HASHMAP.PUT() - WHAT ACTUALLY HAPPENS                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  map.put("Alice", 25);                                                          │
│                                                                                 │
│  STEP 1: Calculate hash                                                         │
│  ───────────────────────                                                        │
│  int h = key.hashCode();           // "Alice".hashCode() = 63479193             │
│  int hash = h ^ (h >>> 16);        // Spread high bits to low bits              │
│                                                                                 │
│  Why XOR with right shift?                                                      │
│  • Original:  h    = 0011_1100_0110_0100_0000_0000_1001_1001                    │
│  • Shifted:   h>>>16 = 0000_0000_0000_0000_0011_1100_0110_0100                  │
│  • XOR:       hash = 0011_1100_0110_0100_0011_1100_1111_1101                    │
│                                                                                 │
│  This makes low bits depend on high bits, better distribution!                  │
│                                                                                 │
│                                                                                 │
│  STEP 2: Calculate bucket index                                                 │
│  ───────────────────────────────                                                │
│  int index = hash & (n - 1);       // n = 16 (power of 2)                       │
│                                                                                 │
│  Why AND with (n-1)?                                                            │
│  • n = 16 = 0001_0000                                                           │
│  • n-1 = 15 = 0000_1111                                                         │
│  • hash & 15 = extracts last 4 bits = index 0-15                                │
│                                                                                 │
│  This is FASTER than modulo:                                                    │
│  • hash % n → ~20-80 CPU cycles (division)                                      │
│  • hash & (n-1) → 1 CPU cycle (bitwise AND)                                     │
│                                                                                 │
│                                                                                 │
│  STEP 3: Insert into bucket                                                     │
│  ──────────────────────────                                                     │
│  if (table[index] == null) {                                                    │
│      table[index] = new Node(hash, key, value, null);                           │
│  } else {                                                                       │
│      // Collision! Walk the chain or convert to tree                            │
│      Node e = table[index];                                                     │
│      while (e != null) {                                                        │
│          if (e.hash == hash && e.key.equals(key)) {                             │
│              e.value = value;  // Update existing                               │
│              return;                                                            │
│          }                                                                      │
│          e = e.next;                                                            │
│      }                                                                          │
│      // Add at end of chain                                                     │
│  }                                                                              │
│                                                                                 │
│                                                                                 │
│  STEP 4: Check for tree conversion (Java 8+)                                    │
│  ─────────────────────────────────────────────                                  │
│  if (chainLength >= 8 && tableSize >= 64) {                                     │
│      treeifyBin(table, index);  // Convert chain to Red-Black Tree              │
│  }                                                                              │
│                                                                                 │
│  Why threshold = 8?                                                             │
│  • Probability of 8 collisions under random hash is 0.00000006                  │
│  • Tree overhead (48 bytes/node) only worthwhile for long chains                │
│  • Tree: O(log n) search vs Chain: O(n) search                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                    HASHMAP.GET() - CPU INSTRUCTION LEVEL                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Integer age = map.get("Alice");                                                │
│                                                                                 │
│  BYTECODE:                                                                      │
│  ─────────                                                                      │
│  aload_1                    // Load map reference                               │
│  ldc "Alice"                // Push string constant                             │
│  invokevirtual #5           // HashMap.get(Object)Object                        │
│  checkcast #6               // Cast to Integer                                  │
│  invokevirtual #7           // Integer.intValue()                               │
│  istore_2                   // Store in local variable                          │
│                                                                                 │
│                                                                                 │
│  INSIDE HashMap.get() - JIT COMPILED x86-64:                                    │
│  ─────────────────────────────────────────────                                  │
│  ; rdi = this (HashMap), rsi = key ("Alice")                                    │
│                                                                                 │
│  ; Step 1: Get hash                                                             │
│  mov    eax, [rsi+0x08]     ; Load cached hashCode from String                  │
│  mov    edx, eax            ; Copy hash                                         │
│  shr    edx, 16             ; h >>> 16                                          │
│  xor    eax, edx            ; h ^ (h >>> 16)                                    │
│                                                                                 │
│  ; Step 2: Get table and index                                                  │
│  mov    rcx, [rdi+0x10]     ; Load table reference                              │
│  mov    r8d, [rcx+0x0C]     ; Load table.length                                 │
│  sub    r8d, 1              ; n - 1                                             │
│  and    eax, r8d            ; hash & (n-1) = index                              │
│                                                                                 │
│  ; Step 3: Get bucket                                                           │
│  mov    rcx, [rcx+0x10+rax*8] ; Load table[index] (Node reference)              │
│  test   rcx, rcx            ; Check if null                                     │
│  jz     NOT_FOUND           ; Return null if empty bucket                       │
│                                                                                 │
│  ; Step 4: Check node                                                           │
│  LOOP:                                                                          │
│  cmp    [rcx+0x0C], eax     ; Compare cached hash                               │
│  jne    NEXT_NODE           ; Skip if hash different                            │
│  mov    rdi, [rcx+0x10]     ; Load node.key                                     │
│  call   String.equals       ; Compare keys                                      │
│  test   al, al              ; Check result                                      │
│  jz     NEXT_NODE           ; Continue if not equal                             │
│  mov    rax, [rcx+0x14]     ; Load node.value - FOUND!                          │
│  ret                                                                            │
│                                                                                 │
│  NEXT_NODE:                                                                     │
│  mov    rcx, [rcx+0x18]     ; Load node.next                                    │
│  test   rcx, rcx            ; Check if null                                     │
│  jnz    LOOP                ; Continue if more nodes                            │
│                                                                                 │
│  NOT_FOUND:                                                                     │
│  xor    eax, eax            ; Return null                                       │
│  ret                                                                            │
│                                                                                 │
│                                                                                 │
│  CPU CYCLES (no collision, L1 cache hit):                                       │
│  ────────────────────────────────────────                                       │
│  • Hash calculation:     ~5 cycles                                              │
│  • Index calculation:    ~2 cycles                                              │
│  • Memory loads:         ~12 cycles (3 loads × 4 cycles)                        │
│  • Method call:          ~20 cycles (if not fully inlined)                      │
│  ───────────────────────────────────────                                        │
│  TOTAL:                  ~40 cycles ≈ 15 nanoseconds @ 3GHz                     │
│                                                                                 │
│  With cache miss: Add ~200 cycles per miss!                                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                    HASHMAP COLLISION HANDLING - DEEP VIEW                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  SCENARIO: Two keys with same bucket index                                      │
│                                                                                 │
│  map.put("Aa", 1);   // "Aa".hashCode() = 2112                                  │
│  map.put("BB", 2);   // "BB".hashCode() = 2112  (SAME HASH!)                    │
│                                                                                 │
│  This happens because:                                                          │
│  'A' = 65, 'a' = 97, 'B' = 66                                                   │
│  "Aa" = 31 × 65 + 97 = 2015 + 97 = 2112                                         │
│  "BB" = 31 × 66 + 66 = 2046 + 66 = 2112                                         │
│                                                                                 │
│                                                                                 │
│  LINKED LIST COLLISION CHAIN (before 8 nodes):                                  │
│  ─────────────────────────────────────────────                                  │
│  table[bucket]:                                                                 │
│                                                                                 │
│  ┌─────────────────┐     ┌─────────────────┐                                    │
│  │ Node            │     │ Node            │                                    │
│  │ hash: 2112      │     │ hash: 2112      │                                    │
│  │ key: "Aa"       │────►│ key: "BB"       │────► null                          │
│  │ value: 1        │     │ value: 2        │                                    │
│  └─────────────────┘     └─────────────────┘                                    │
│                                                                                 │
│  get("BB") requires:                                                            │
│  1. Hash calculation → 2112                                                     │
│  2. Bucket lookup → table[2112 & 15]                                            │
│  3. Check "Aa" hash (2112) and equals() → NOT MATCH                             │
│  4. Follow next pointer                                                         │
│  5. Check "BB" hash (2112) and equals() → MATCH!                                │
│  Time: O(n) where n = chain length                                              │
│                                                                                 │
│                                                                                 │
│  RED-BLACK TREE (after 8 nodes in same bucket, Java 8+):                        │
│  ──────────────────────────────────────────────────────                         │
│                                                                                 │
│  table[bucket]:                                                                 │
│                                                                                 │
│           ┌─────────────────┐                                                   │
│           │ TreeNode (BLACK)│                                                   │
│           │ hash: 2112      │                                                   │
│           │ key: "Cc"       │                                                   │
│           └────────┬────────┘                                                   │
│                    │                                                            │
│         ┌──────────┴──────────┐                                                 │
│         ▼                     ▼                                                 │
│  ┌─────────────┐      ┌─────────────┐                                           │
│  │ TreeNode    │      │ TreeNode    │                                           │
│  │ (RED)       │      │ (RED)       │                                           │
│  │ key: "Aa"   │      │ key: "Ee"   │                                           │
│  └──────┬──────┘      └──────┬──────┘                                           │
│         │                    │                                                  │
│    ┌────┴────┐          ┌────┴────┐                                             │
│    ▼         ▼          ▼         ▼                                             │
│  [node]   [node]      [node]   [node]                                           │
│                                                                                 │
│  Tree lookup: O(log n) instead of O(n)!                                         │
│  8 nodes: 3 comparisons instead of 8                                            │
│                                                                                 │
│                                                                                 │
│  TreeNode Memory (MORE than regular Node):                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ OFFSET │ SIZE │ FIELD                  │ VALUE                         │     │
│  ├────────┼──────┼────────────────────────┼───────────────────────────────┤     │
│  │ 0      │ 8    │ Mark Word              │                                │    │
│  │ 8      │ 4    │ Class Pointer          │                                │    │
│  │ 12     │ 4    │ hash                   │                                │    │
│  │ 16     │ 4    │ key                    │                                │    │
│  │ 20     │ 4    │ value                  │                                │    │
│  │ 24     │ 4    │ next                   │ (for iteration)               │     │
│  │ 28     │ 4    │ parent                 │ (tree structure)              │     │
│  │ 32     │ 4    │ left                   │ (tree structure)              │     │
│  │ 36     │ 4    │ right                  │ (tree structure)              │     │
│  │ 40     │ 1    │ red (boolean)          │ (color flag)                  │     │
│  │ 41     │ 7    │ padding                │                                │    │
│  └────────┴──────┴────────────────────────┴───────────────────────────────┘     │
│  TOTAL: 48 bytes vs 32 bytes for regular Node (50% more memory)                 │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔬 3. Linkedlist Deep Internals

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    LINKEDLIST - COMPLETE INTERNAL VIEW                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  LinkedList<String> list = new LinkedList<>();                                  │
│  list.add("A");                                                                 │
│  list.add("B");                                                                 │
│  list.add("C");                                                                 │
│                                                                                 │
│  MEMORY LAYOUT:                                                                 │
│                                                                                 │
│  LinkedList Object:                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ OFFSET │ SIZE │ FIELD                  │ VALUE                         │     │
│  ├────────┼──────┼────────────────────────┼───────────────────────────────┤     │
│  │ 0      │ 8    │ Mark Word              │ 0x00000001                     │    │
│  │ 8      │ 4    │ Class Pointer          │ → LinkedList.class            │     │
│  │ 12     │ 4    │ padding                │                                │    │
│  │ 16     │ 4    │ first (ref)            │ 0x00110000 → Node("A")        │     │
│  │ 20     │ 4    │ last (ref)             │ 0x00330000 → Node("C")        │     │
│  │ 24     │ 4    │ size                   │ 3                              │    │
│  │ 28     │ 4    │ modCount               │ 3                              │    │
│  └────────┴──────┴────────────────────────┴───────────────────────────────┘     │
│  TOTAL: 32 bytes                                                                │
│                                                                                 │
│                                                                                 │
│  Node Objects (SCATTERED in heap - not contiguous!):                            │
│                                                                                 │
│  Node @ 0x00110000:           Node @ 0x00220000:           Node @ 0x00330000:   │
│  ┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐│
│  │ Mark Word   │ 8     │     │ Mark Word   │ 8     │     │ Mark Word   │ 8     ││
│  │ Class Ptr   │ 4     │     │ Class Ptr   │ 4     │     │ Class Ptr   │ 4     ││
│  │ padding     │ 4     │     │ padding     │ 4     │     │ padding     │ 4     ││
│  │ item: "A"   │ 4     │     │ item: "B"   │ 4     │     │ item: "C"   │ 4     ││
│  │ prev: null  │ 4     │     │ prev: 0x110 │ 4     │     │ prev: 0x220 │ 4     ││
│  │ next: 0x220 │ 4     │     │ next: 0x330 │ 4     │     │ next: null  │ 4     ││
│  │ padding     │ 4     │     │ padding     │ 4     │     │ padding     │ 4     ││
│  └─────────────────────┘     └─────────────────────┘     └─────────────────────┘│
│  32 bytes each                32 bytes each                32 bytes each        │
│                                                                                 │
│                                                                                 │
│  MEMORY LAYOUT IN HEAP (reality):                                               │
│  ────────────────────────────────                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  Address │ Content                                                       │   │
│  ├──────────┼───────────────────────────────────────────────────────────────┤   │
│  │ 0x00110  │ [Node A]                                                      │   │
│  │ 0x00120  │ [Some other object...]                                        │   │
│  │ 0x00150  │ [Some other object...]                                        │   │
│  │ 0x00220  │ [Node B]  ← FAR from Node A!                                 │    │
│  │ 0x00250  │ [Some other object...]                                        │   │
│  │ 0x00330  │ [Node C]  ← FAR from Node B!                                 │    │
│  └──────────┴───────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  THIS IS WHY LINKEDLIST HAS POOR CACHE PERFORMANCE!                             │
│  Each node access is likely a cache miss (~200 cycles penalty)                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                    LINKEDLIST.ADD(index, element) - INTERNAL VIEW               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  list.add(1, "X");  // Insert "X" at index 1                                    │
│                                                                                 │
│  BEFORE:                                                                        │
│                                                                                 │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐                                    │
│  │ Node A  │────►│ Node B  │────►│ Node C  │                                    │
│  │         │◄────│         │◄────│         │                                    │
│  └─────────┘     └─────────┘     └─────────┘                                    │
│     first                           last                                        │
│                                                                                 │
│                                                                                 │
│  STEP 1: Find position (O(n) traversal)                                         │
│  ───────────────────────────────────────                                        │
│  if (index < size/2) {                                                          │
│      // Start from HEAD (index 1 < 3/2, so start from head)                     │
│      Node node = first;                                                         │
│      for (int i = 0; i < index; i++)                                            │
│          node = node.next;                                                      │
│  } else {                                                                       │
│      // Start from TAIL (optimization for second half)                          │
│      Node node = last;                                                          │
│      for (int i = size - 1; i > index; i--)                                     │
│          node = node.prev;                                                      │
│  }                                                                              │
│                                                                                 │
│                                                                                 │
│  STEP 2: Create new node and relink (O(1))                                      │
│  ─────────────────────────────────────────                                      │
│  Node newNode = new Node("X");   // Allocate 32 bytes on heap                   │
│  Node succ = node;               // successor = Node B                          │
│  Node pred = node.prev;          // predecessor = Node A                        │
│                                                                                 │
│  // Relink pointers (4 pointer updates)                                         │
│  newNode.prev = pred;            // X.prev = A                                  │
│  newNode.next = succ;            // X.next = B                                  │
│  pred.next = newNode;            // A.next = X                                  │
│  succ.prev = newNode;            // B.prev = X                                  │
│                                                                                 │
│                                                                                 │
│  AFTER:                                                                         │
│                                                                                 │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐                    │
│  │ Node A  │────►│ Node X  │────►│ Node B  │────►│ Node C  │                    │
│  │         │◄────│  (NEW)  │◄────│         │◄────│         │                    │
│  └─────────┘     └─────────┘     └─────────┘     └─────────┘                    │
│     first                                           last                        │
│                                                                                 │
│                                                                                 │
│  ASSEMBLY FOR POINTER UPDATE:                                                   │
│  ─────────────────────────────                                                  │
│  ; pred.next = newNode                                                          │
│  mov    [rax+0x18], rcx      ; Store newNode reference in pred.next             │
│                                                                                 │
│  ; succ.prev = newNode                                                          │
│  mov    [rbx+0x14], rcx      ; Store newNode reference in succ.prev             │
│                                                                                 │
│  Each pointer update: 1 CPU cycle (just a memory store)                         │
│  But finding the position: O(n) memory accesses with cache misses!              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 📚 4. Stack Deep Internals

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    STACK - COMPLETE INTERNAL VIEW                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Java's Stack class extends Vector (legacy, synchronized)                       │
│  Modern alternative: Deque<E> stack = new ArrayDeque<>();                       │
│                                                                                 │
│                                                                                 │
│  ARRAYDEQUE AS STACK - MEMORY LAYOUT:                                           │
│  ─────────────────────────────────────                                          │
│  ArrayDeque<Integer> stack = new ArrayDeque<>();                                │
│  stack.push(10);                                                                │
│  stack.push(20);                                                                │
│  stack.push(30);                                                                │
│                                                                                 │
│  ArrayDeque Object:                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ OFFSET │ SIZE │ FIELD                  │ VALUE                         │     │
│  ├────────┼──────┼────────────────────────┼───────────────────────────────┤     │
│  │ 0      │ 8    │ Mark Word              │ 0x00000001                     │    │
│  │ 8      │ 4    │ Class Pointer          │ → ArrayDeque.class            │     │
│  │ 12     │ 4    │ padding                │                                │    │
│  │ 16     │ 4    │ elements (ref)         │ → Object[16]                  │     │
│  │ 20     │ 4    │ head                   │ 13 (index of first element)   │     │
│  │ 24     │ 4    │ tail                   │ 0 (index after last element)  │     │
│  └────────┴──────┴────────────────────────┴───────────────────────────────┘     │
│                                                                                 │
│  Circular Buffer (elements array):                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ Index │  0  │  1  │ ... │ 13  │ 14  │ 15  │                            │     │
│  │ Value │null │null │ ... │  30 │  20 │  10 │                            │     │
│  │       │     │     │     │ TOP │     │BOTTOM│                           │     │
│  │       │tail │     │     │head │     │     │                            │     │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  push() grows towards index 0 (head decrements)                                 │
│  pop() shrinks from head (head increments)                                      │
│                                                                                 │
│                                                                                 │
│  PUSH OPERATION - CPU LEVEL:                                                    │
│  ───────────────────────────                                                    │
│  stack.push(40);                                                                │
│                                                                                 │
│  Java:                                                                          │
│  head = (head - 1) & (elements.length - 1);  // 13-1 = 12                       │
│  elements[head] = element;                                                      │
│                                                                                 │
│  Bytecode:                                                                      │
│  aload_0                     // Load 'this'                                     │
│  aload_0                     // Load 'this' again                               │
│  getfield #2                 // Get head                                        │
│  iconst_1                    // Push 1                                          │
│  isub                        // head - 1                                        │
│  aload_0                     // Load 'this'                                     │
│  getfield #3                 // Get elements.length                             │
│  iconst_1                    // Push 1                                          │
│  isub                        // length - 1                                      │
│  iand                        // & (circular wrap)                               │
│  dup                         // Duplicate for store                             │
│  putfield #2                 // Store new head                                  │
│  aload_0                     // Load 'this'                                     │
│  getfield #4                 // Get elements array                              │
│  swap                        // Swap index and array ref                        │
│  aload_1                     // Load element                                    │
│  aastore                     // Store in array                                  │
│                                                                                 │
│  CPU Cycles: ~15-20 (if JIT inlined and cache hit)                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🌳 5. Binary Tree / Bst Deep Internals

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    BINARY SEARCH TREE - COMPLETE INTERNAL VIEW                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  TreeMap<Integer, String> tree = new TreeMap<>();                               │
│  tree.put(50, "A");                                                             │
│  tree.put(30, "B");                                                             │
│  tree.put(70, "C");                                                             │
│  tree.put(20, "D");                                                             │
│  tree.put(40, "E");                                                             │
│                                                                                 │
│  TREE STRUCTURE:                                                                │
│                        [50,"A"]                                                 │
│                       /        \                                                │
│                  [30,"B"]    [70,"C"]                                           │
│                 /      \                                                        │
│            [20,"D"]  [40,"E"]                                                   │
│                                                                                 │
│                                                                                 │
│  RED-BLACK TREE NODE (TreeMap.Entry):                                           │
│  ─────────────────────────────────────                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ OFFSET │ SIZE │ FIELD                  │ VALUE                         │     │
│  ├────────┼──────┼────────────────────────┼───────────────────────────────┤     │
│  │ 0      │ 8    │ Mark Word              │ 0x00000001                     │    │
│  │ 8      │ 4    │ Class Pointer          │ → TreeMap$Entry.class         │     │
│  │ 12     │ 4    │ key (ref)              │ → Integer(50)                 │     │
│  │ 16     │ 4    │ value (ref)            │ → "A"                         │     │
│  │ 20     │ 4    │ left (ref)             │ → Entry(30)                   │     │
│  │ 24     │ 4    │ right (ref)            │ → Entry(70)                   │     │
│  │ 28     │ 4    │ parent (ref)           │ null (root)                   │     │
│  │ 32     │ 1    │ color (boolean)        │ BLACK                         │     │
│  │ 33     │ 7    │ padding                │                                │    │
│  └────────┴──────┴────────────────────────┴───────────────────────────────┘     │
│  TOTAL: 40 bytes per Entry                                                      │
│                                                                                 │
│                                                                                 │
│  TREE TRAVERSAL - CPU LEVEL (find key 40):                                      │
│  ─────────────────────────────────────────                                      │
│  Integer key = 40;                                                              │
│  Entry<K,V> p = root;  // Start at root (50)                                    │
│                                                                                 │
│  while (p != null) {                                                            │
│      int cmp = key.compareTo(p.key);                                            │
│      if (cmp < 0)                                                               │
│          p = p.left;                                                            │
│      else if (cmp > 0)                                                          │
│          p = p.right;                                                           │
│      else                                                                       │
│          return p;  // Found!                                                   │
│  }                                                                              │
│                                                                                 │
│  Iteration 1: key=40, node=50 → 40 < 50 → go left                               │
│  Iteration 2: key=40, node=30 → 40 > 30 → go right                              │
│  Iteration 3: key=40, node=40 → FOUND!                                          │
│                                                                                 │
│  Total: 3 comparisons, 3 memory accesses                                        │
│  For n nodes: O(log n) comparisons in balanced tree                             │
│                                                                                 │
│                                                                                 │
│  MEMORY ACCESS PATTERN:                                                         │
│  ─────────────────────                                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  Access 1: Load Entry(50) from RAM                                       │   │
│  │            → CACHE MISS (200 cycles)                                     │   │
│  │            → Also loads Entry(50).left and right pointers               │    │
│  │                                                                          │   │
│  │  Access 2: Load Entry(30) from RAM                                       │   │
│  │            → CACHE MISS (200 cycles) - different memory location        │    │
│  │                                                                          │   │
│  │  Access 3: Load Entry(40) from RAM                                       │   │
│  │            → CACHE MISS (200 cycles) - different memory location        │    │
│  │                                                                          │   │
│  │  TOTAL: ~600 cycles just for memory access!                             │    │
│  │                                                                          │   │
│  │  Compare to Array: 3 accesses in same cache line = ~12 cycles           │    │
│  │                                                                          │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│                                                                                 │
│  WHY TREES ARE STILL USEFUL:                                                    │
│  ──────────────────────────                                                     │
│  • Sorted order guaranteed                                                      │
│  • Range queries: O(log n + k) where k = results                                │
│  • Insert/Delete: O(log n) vs O(n) for sorted array                             │
│  • No resize needed like HashMap                                                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 📦 6. Heap / Priority Queue Deep Internals

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    HEAP (PRIORITY QUEUE) - COMPLETE INTERNAL VIEW               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  PriorityQueue<Integer> heap = new PriorityQueue<>();                           │
│  heap.offer(50); heap.offer(30); heap.offer(70);                                │
│  heap.offer(20); heap.offer(40);                                                │
│                                                                                 │
│  HEAP STRUCTURE (MIN HEAP):                                                     │
│                                                                                 │
│                   20  (index 0)                                                 │
│                  /  \                                                           │
│                30    70  (index 1, 2)                                           │
│               /  \                                                              │
│             50   40  (index 3, 4)                                               │
│                                                                                 │
│  STORED AS ARRAY (CONTIGUOUS - CACHE FRIENDLY!):                                │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ Index │  0  │  1  │  2  │  3  │  4  │  5  │  6  │ ... │                  │   │
│  │ Value │ 20  │ 30  │ 70  │ 50  │ 40  │null │null │ ... │                  │   │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  PARENT-CHILD RELATIONSHIP (NO POINTERS NEEDED!):                               │
│  • Parent of index i:     (i - 1) / 2                                           │
│  • Left child of i:       2 * i + 1                                             │
│  • Right child of i:      2 * i + 2                                             │
│                                                                                 │
│  Example: Node at index 1 (value 30)                                            │
│  • Parent: (1-1)/2 = 0 → value 20 ✓                                             │
│  • Left:   2*1+1 = 3   → value 50 ✓                                             │
│  • Right:  2*1+2 = 4   → value 40 ✓                                             │
│                                                                                 │
│                                                                                 │
│  WHY ARRAY IS BRILLIANT FOR HEAP:                                               │
│  ─────────────────────────────────                                              │
│  1. No pointer overhead (saves memory)                                          │
│  2. All nodes in contiguous memory (cache friendly)                             │
│  3. Parent/child calculation: just arithmetic (fast!)                           │
│  4. Complete binary tree guaranteed by structure                                │
│                                                                                 │
│                                                                                 │
│  HEAPIFY UP (after insert) - CPU LEVEL:                                         │
│  ───────────────────────────────────────                                        │
│  heap.offer(10);  // Insert 10 (smaller than root!)                             │
│                                                                                 │
│  Step 1: Add at end                                                             │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ Index │  0  │  1  │  2  │  3  │  4  │  5  │                              │   │
│  │ Value │ 20  │ 30  │ 70  │ 50  │ 40  │ 10  │ ← NEW                        │   │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  Step 2: Bubble up (swap with parent if smaller)                                │
│  • index=5, parent=(5-1)/2=2, arr[5]=10 < arr[2]=70 → SWAP                      │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ Index │  0  │  1  │  2  │  3  │  4  │  5  │                              │   │
│  │ Value │ 20  │ 30  │ 10  │ 50  │ 40  │ 70  │                              │   │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  • index=2, parent=(2-1)/2=0, arr[2]=10 < arr[0]=20 → SWAP                      │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ Index │  0  │  1  │  2  │  3  │  4  │  5  │                              │   │
│  │ Value │ 10  │ 30  │ 20  │ 50  │ 40  │ 70  │ ← FINAL                      │   │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  Assembly for parent calculation:                                               │
│  mov    eax, edi            ; eax = index                                       │
│  sub    eax, 1              ; eax = index - 1                                   │
│  sar    eax, 1              ; eax = (index-1) >> 1 (signed right shift)         │
│  ; Only 3 CPU cycles!                                                           │
│                                                                                 │
│                                                                                 │
│  COMPLEXITY ANALYSIS:                                                           │
│  ────────────────────                                                           │
│  • offer() / add(): O(log n) - bubble up at most log n levels                   │
│  • poll() / remove(): O(log n) - bubble down at most log n levels               │
│  • peek(): O(1) - just return arr[0]                                            │
│  • heapify array: O(n) - bottom-up construction (not O(n log n)!)               │
│                                                                                 │
│                                                                                 │
│  CACHE PERFORMANCE vs TREE:                                                     │
│  ──────────────────────────                                                     │
│  For poll() traversing 3 levels:                                                │
│                                                                                 │
│  HEAP (array):                                                                  │
│  • All nodes likely in same cache line: ~4 cycles per access                    │
│  • Total: ~12 cycles                                                            │
│                                                                                 │
│  TREE (pointers):                                                               │
│  • Each node in different cache line: ~200 cycles per access                    │
│  • Total: ~600 cycles                                                           │
│                                                                                 │
│  HEAP IS 50x FASTER due to cache locality!                                      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🕸️ 7. Graph Representation Deep Internals

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    GRAPH - COMPLETE INTERNAL VIEW                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  GRAPH:                                                                         │
│        0 ─── 1                                                                  │
│        │     │                                                                  │
│        │     │                                                                  │
│        3 ─── 2                                                                  │
│                                                                                 │
│                                                                                 │
│  REPRESENTATION 1: ADJACENCY MATRIX                                             │
│  ─────────────────────────────────────                                          │
│  int[][] matrix = {                                                             │
│      {0, 1, 0, 1},  // Node 0 connected to 1, 3                                 │
│      {1, 0, 1, 0},  // Node 1 connected to 0, 2                                 │
│      {0, 1, 0, 1},  // Node 2 connected to 1, 3                                 │
│      {1, 0, 1, 0}   // Node 3 connected to 0, 2                                 │
│  };                                                                             │
│                                                                                 │
│  MEMORY LAYOUT:                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  int[][] object header:           24 bytes                              │    │
│  │  int[] row 0 (+ header):          16 + 16 = 32 bytes                   │     │
│  │  int[] row 1 (+ header):          16 + 16 = 32 bytes                   │     │
│  │  int[] row 2 (+ header):          16 + 16 = 32 bytes                   │     │
│  │  int[] row 3 (+ header):          16 + 16 = 32 bytes                   │     │
│  │  ────────────────────────────────────────────────────                   │    │
│  │  TOTAL:                           152 bytes for 4 nodes                 │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  Space: O(V²) - wasteful for sparse graphs!                                     │
│  Check edge (u,v): O(1) - just matrix[u][v]                                     │
│  Get all neighbors: O(V) - must scan entire row                                 │
│                                                                                 │
│                                                                                 │
│  REPRESENTATION 2: ADJACENCY LIST                                               │
│  ────────────────────────────────────                                           │
│  List<List<Integer>> adjList = new ArrayList<>();                               │
│  adjList.add(Arrays.asList(1, 3));  // Node 0                                   │
│  adjList.add(Arrays.asList(0, 2));  // Node 1                                   │
│  adjList.add(Arrays.asList(1, 3));  // Node 2                                   │
│  adjList.add(Arrays.asList(0, 2));  // Node 3                                   │
│                                                                                 │
│  MEMORY LAYOUT:                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                                                                         │    │
│  │  adjList[0] ──────► ArrayList [1, 3]                                   │     │
│  │  adjList[1] ──────► ArrayList [0, 2]                                   │     │
│  │  adjList[2] ──────► ArrayList [1, 3]                                   │     │
│  │  adjList[3] ──────► ArrayList [0, 2]                                   │     │
│  │                                                                         │    │
│  │  Outer ArrayList:         32 bytes                                      │    │
│  │  Inner ArrayList × 4:     32 × 4 = 128 bytes                           │     │
│  │  Integer objects × 8:     16 × 8 = 128 bytes                           │     │
│  │  ────────────────────────────────────────                               │    │
│  │  TOTAL:                   ~288 bytes                                    │    │
│  │                                                                         │    │
│  │  BUT for sparse graph with 1000 nodes and 50 edges:                    │     │
│  │  Matrix: 1000 × 1000 × 4 = 4 MB                                        │     │
│  │  List:   ~50 × 48 = 2.4 KB                                             │     │
│  │  ADJACENCY LIST IS 1000x SMALLER!                                      │     │
│  │                                                                         │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  Space: O(V + E) - much better for sparse graphs                                │
│  Check edge (u,v): O(degree(u)) - must search neighbor list                     │
│  Get all neighbors: O(degree(u)) - just return the list                         │
│                                                                                 │
│                                                                                 │
│  BFS TRAVERSAL - CPU LEVEL:                                                     │
│  ──────────────────────────                                                     │
│  Queue<Integer> queue = new LinkedList<>();                                     │
│  boolean[] visited = new boolean[V];                                            │
│  queue.offer(0);                                                                │
│  visited[0] = true;                                                             │
│                                                                                 │
│  while (!queue.isEmpty()) {                                                     │
│      int node = queue.poll();                                                   │
│      for (int neighbor : adjList.get(node)) {                                   │
│          if (!visited[neighbor]) {                                              │
│              visited[neighbor] = true;                                          │
│              queue.offer(neighbor);                                             │
│          }                                                                      │
│      }                                                                          │
│  }                                                                              │
│                                                                                 │
│  CACHE BEHAVIOR:                                                                │
│  • visited[] array: CONTIGUOUS, cache-friendly                                  │
│  • adjList traversal: SCATTERED, cache-unfriendly                               │
│  • Queue operations: depends on implementation                                  │
│                                                                                 │
│  OPTIMIZATION: Use int[] instead of List<Integer> for neighbors                 │
│  • Avoids Integer autoboxing overhead                                           │
│  • Better cache locality for neighbor iteration                                 │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# 🔬 PART 10B: JAVA COLLECTIONS FRAMEWORK - INTERNAL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    JAVA COLLECTIONS HIERARCHY - COMPLETE VIEW                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                              Iterable<E>                                        │
│                                  │                                              │
│                             Collection<E>                                       │
│                    ┌────────────┼────────────┐                                  │
│                    │            │            │                                  │
│                 List<E>      Set<E>      Queue<E>                               │
│                    │            │            │                                  │
│        ┌──────────┬┴─────┐     │      ┌─────┴─────┐                             │
│        │          │      │     │      │           │                             │
│   ArrayList  LinkedList  │  ┌──┴──┐   │       Deque<E>                          │
│                    Vector │  │     │  │           │                             │
│                          │ HashSet  TreeSet      │                              │
│                          │  │       │     PriorityQueue                         │
│                          │  │  LinkedHashSet   ArrayDeque                       │
│                          │  │                                                   │
│                          │  └─────────────────────┐                             │
│                          │                        │                             │
│                        Map<K,V>           SortedSet<E>                          │
│                    ┌─────┴─────┐           (TreeSet)                            │
│                    │           │                                                │
│                HashMap    TreeMap                                               │
│                    │                                                            │
│              LinkedHashMap                                                      │
│                                                                                 │
│                                                                                 │
│  THREAD-SAFE VERSIONS (java.util.concurrent):                                   │
│  ─────────────────────────────────────────────                                  │
│  • ConcurrentHashMap    - Lock-free reads, segment locks for writes             │
│  • CopyOnWriteArrayList - Copy on write, great for read-heavy                   │
│  • ConcurrentLinkedQueue - Lock-free queue using CAS operations                 │
│  • BlockingQueue        - Thread coordination (producer-consumer)               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│               WHEN TO USE WHICH COLLECTION - DECISION TREE                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  START HERE: What do you need?                                                  │
│              │                                                                  │
│              ├─── Key-Value pairs?                                              │
│              │         │                                                        │
│              │         ├─── Need sorted keys? ──────► TreeMap                   │
│              │         │                                                        │
│              │         ├─── Need insertion order? ──► LinkedHashMap             │
│              │         │                                                        │
│              │         ├─── Need thread-safety? ────► ConcurrentHashMap         │
│              │         │                                                        │
│              │         └─── Just fast lookup? ──────► HashMap                   │
│              │                                                                  │
│              ├─── Unique elements only?                                         │
│              │         │                                                        │
│              │         ├─── Need sorted? ───────────► TreeSet                   │
│              │         │                                                        │
│              │         ├─── Need insertion order? ──► LinkedHashSet             │
│              │         │                                                        │
│              │         └─── Just uniqueness? ───────► HashSet                   │
│              │                                                                  │
│              ├─── Ordered sequence with duplicates?                             │
│              │         │                                                        │
│              │         ├─── Frequent random access? ─► ArrayList                │
│              │         │                                                        │
│              │         ├─── Frequent insert/delete                              │
│              │         │    at both ends? ──────────► LinkedList                │
│              │         │                                                        │
│              │         └─── Thread-safe needed? ────► CopyOnWriteArrayList      │
│              │                                                                  │
│              ├─── LIFO (Stack behavior)?                                        │
│              │         │                                                        │
│              │         └─── Use ArrayDeque as stack                             │
│              │                                                                  │
│              ├─── FIFO (Queue behavior)?                                        │
│              │         │                                                        │
│              │         ├─── Need priority? ─────────► PriorityQueue             │
│              │         │                                                        │
│              │         ├─── Thread coordination? ───► BlockingQueue             │
│              │         │                                                        │
│              │         └─── Simple queue? ──────────► ArrayDeque                │
│              │                                                                  │
│              └─── Double-ended operations?                                      │
│                        │                                                        │
│                        └─── Use ArrayDeque (Deque)                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# 🔬 PART 10C: PERFORMANCE COMPARISON - ALL DATA STRUCTURES

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE TIME COMPLEXITY COMPARISON                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌────────────────┬────────┬────────┬────────┬────────┬────────┬──────────┐     │
│  │ Data Structure │ Access │ Search │ Insert │ Delete │ Space  │ Notes    │     │
│  ├────────────────┼────────┼────────┼────────┼────────┼────────┼──────────┤     │
│  │ Array          │ O(1)   │ O(n)   │ O(n)   │ O(n)   │ O(n)   │ Fixed sz │     │
│  │ ArrayList      │ O(1)   │ O(n)   │ O(1)*  │ O(n)   │ O(n)   │ Dynamic  │     │
│  │ LinkedList     │ O(n)   │ O(n)   │ O(1)†  │ O(1)†  │ O(n)   │ Pointers │     │
│  │ Stack          │ O(n)   │ O(n)   │ O(1)   │ O(1)   │ O(n)   │ LIFO     │     │
│  │ Queue          │ O(n)   │ O(n)   │ O(1)   │ O(1)   │ O(n)   │ FIFO     │     │
│  │ HashSet        │ -      │ O(1)   │ O(1)   │ O(1)   │ O(n)   │ No order │     │
│  │ TreeSet        │ -      │O(logn) │O(logn) │O(logn) │ O(n)   │ Sorted   │     │
│  │ HashMap        │ -      │ O(1)   │ O(1)   │ O(1)   │ O(n)   │ No order │     │
│  │ TreeMap        │ -      │O(logn) │O(logn) │O(logn) │ O(n)   │ Sorted   │     │
│  │ LinkedHashMap  │ -      │ O(1)   │ O(1)   │ O(1)   │ O(n)   │ Ins ordr │     │
│  │ Heap/PQ        │ -      │ O(n)   │O(logn) │O(logn) │ O(n)   │ Priority │     │
│  │ BST (balanced) │ -      │O(logn) │O(logn) │O(logn) │ O(n)   │ Sorted   │     │
│  │ BST (unbal)    │ -      │ O(n)   │ O(n)   │ O(n)   │ O(n)   │ Avoid!   │     │
│  │ Trie           │ -      │ O(m)   │ O(m)   │ O(m)   │ O(n×m) │ Strings  │     │
│  │ Graph (Adj L)  │ -      │O(V+E)  │ O(1)   │O(E/V)  │O(V+E)  │ Sparse   │     │
│  │ Graph (Adj M)  │ -      │ O(1)   │ O(1)   │ O(1)   │O(V²)   │ Dense    │     │
│  └────────────────┴────────┴────────┴────────┴────────┴────────┴──────────┘     │
│                                                                                 │
│  * Amortized O(1), worst case O(n) during resize                                │
│  † O(1) if position known, O(n) to find position                                │
│  m = length of string (for Trie)                                                │
│  V = vertices, E = edges (for Graph)                                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                    MEMORY OVERHEAD COMPARISON                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Storing 1,000,000 integers:                                                    │
│                                                                                 │
│  ┌────────────────────┬─────────────┬─────────────────────────────────────┐     │
│  │ Data Structure     │ Memory      │ Overhead Explanation                │     │
│  ├────────────────────┼─────────────┼─────────────────────────────────────┤     │
│  │ int[]              │ ~4 MB       │ 4 bytes × 1M + 16 header            │     │
│  │ Integer[]          │ ~20 MB      │ 16 bytes × 1M + references          │     │
│  │ ArrayList<Integer> │ ~24 MB      │ Integer objects + ArrayList overhead│     │
│  │ LinkedList<Integer>│ ~48 MB      │ Node(24) + Integer(16) per element  │     │
│  │ HashSet<Integer>   │ ~52 MB      │ Entry overhead + Integer objects    │     │
│  │ TreeSet<Integer>   │ ~56 MB      │ TreeNode + Integer objects          │     │
│  └────────────────────┴─────────────┴─────────────────────────────────────┘     │
│                                                                                 │
│  KEY INSIGHT:                                                                   │
│  • Primitive arrays are 5-14x more memory efficient!                            │
│  • Use primitive arrays when possible for large datasets                        │
│  • Consider libraries like Trove or Eclipse Collections for primitive support   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                    REAL-WORLD BENCHMARK (nanoseconds)                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Test: 100,000 elements, JDK 17, Intel i7-10700 @ 3.8GHz                        │
│                                                                                 │
│  ADD OPERATIONS:                                                                │
│  ┌────────────────┬───────────┬────────────────────────────────────────────┐    │
│  │ Collection     │ Time (ns) │ Visualization                              │    │
│  ├────────────────┼───────────┼────────────────────────────────────────────┤    │
│  │ ArrayList.add  │ 8         │ ██                                         │    │
│  │ LinkedList.add │ 15        │ ████                                       │    │
│  │ HashSet.add    │ 25        │ ██████                                     │    │
│  │ TreeSet.add    │ 150       │ █████████████████████████████████████      │    │
│  └────────────────┴───────────┴────────────────────────────────────────────┘    │
│                                                                                 │
│  GET/CONTAINS OPERATIONS:                                                       │
│  ┌────────────────┬───────────┬────────────────────────────────────────────┐    │
│  │ Collection     │ Time (ns) │ Visualization                              │    │
│  ├────────────────┼───────────┼────────────────────────────────────────────┤    │
│  │ ArrayList.get  │ 5         │ █                                          │    │
│  │ LinkedList.get │ 25000     │ (off the chart - 5000x slower!)           │     │
│  │ HashSet.contain│ 12        │ ███                                        │    │
│  │ TreeSet.contain│ 80        │ ████████████████████                       │    │
│  └────────────────┴───────────┴────────────────────────────────────────────┘    │
│                                                                                 │
│  ITERATION OVER ALL ELEMENTS:                                                   │
│  ┌────────────────┬───────────┬────────────────────────────────────────────┐    │
│  │ Collection     │ Time (ms) │ Notes                                      │    │
│  ├────────────────┼───────────┼────────────────────────────────────────────┤    │
│  │ int[]          │ 0.3       │ Best cache locality                        │    │
│  │ ArrayList      │ 0.8       │ Good cache locality                        │    │
│  │ LinkedList     │ 12.0      │ Poor cache locality (40x slower!)         │     │
│  │ HashSet        │ 3.2       │ Moderate - must traverse buckets          │     │
│  │ TreeSet        │ 2.5       │ In-order traversal                         │    │
│  └────────────────┴───────────┴────────────────────────────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## PRACTICE PROBLEMS — Data Structures Fundamentals

### Arrays

| # | Problem | Difficulty | Source | Key Concept |
|---|---------|-----------|--------|-------------|
| 1 | Two Sum | Easy | LC 1 | HashMap lookup |
| 2 | Best Time to Buy and Sell Stock | Easy | LC 121 | Kadane's variant |
| 3 | Contains Duplicate | Easy | LC 217 | HashSet |
| 4 | Product of Array Except Self | Medium | LC 238 | Prefix/suffix arrays |
| 5 | Maximum Subarray | Medium | LC 53 | Kadane's algorithm |
| 6 | Merge Intervals | Medium | LC 56 | Sort + sweep |
| 7 | 3Sum | Medium | LC 15 | Sort + two pointers |
| 8 | Trapping Rain Water | Hard | LC 42 | Two pointers / stack |
| 9 | First Missing Positive | Hard | LC 41 | Cyclic sort |
| 10 | Maximize Distance to Closest Person | Medium | LC 849 | Gap analysis (less famous, great logic!) |
| 11 | Subarray Sum Equals K | Medium | LC 560 | Prefix sum + HashMap |
| 12 | Rotate Array | Medium | LC 189 | Reverse trick |
| 13 | Next Permutation | Medium | LC 31 | Scan from right |
| 14 | Minimum Size Subarray Sum | Medium | LC 209 | Sliding window |
| 15 | Longest Consecutive Sequence | Medium | LC 128 | HashSet sequence |

### LinkedLists

| # | Problem | Difficulty | Source | Key Concept |
|---|---------|-----------|--------|-------------|
| 1 | Reverse Linked List | Easy | LC 206 | Pointer reversal |
| 2 | Merge Two Sorted Lists | Easy | LC 21 | Dummy head |
| 3 | Linked List Cycle | Easy | LC 141 | Floyd's slow/fast |
| 4 | Remove Nth Node From End | Medium | LC 19 | Two-pointer gap |
| 5 | Add Two Numbers | Medium | LC 2 | Carry propagation |
| 6 | Reorder List | Medium | LC 143 | Find mid + reverse + merge |
| 7 | Copy List with Random Pointer | Medium | LC 138 | HashMap clone |
| 8 | LRU Cache | Medium | LC 146 | HashMap + Doubly LL |
| 9 | Merge K Sorted Lists | Hard | LC 23 | Min-heap of heads |
| 10 | Palindrome Linked List | Easy | LC 234 | Reverse 2nd half + compare |
| 11 | Swap Nodes in Pairs | Medium | LC 24 | Recursive or iterative |
| 12 | Sort List | Medium | LC 148 | Merge sort on LL |

### Stacks & Queues

| # | Problem | Difficulty | Source | Key Concept |
|---|---------|-----------|--------|-------------|
| 1 | Valid Parentheses | Easy | LC 20 | Matching brackets |
| 2 | Min Stack | Medium | LC 155 | Auxiliary min tracking |
| 3 | Evaluate Reverse Polish Notation | Medium | LC 150 | Operand stack |
| 4 | Daily Temperatures | Medium | LC 739 | Monotonic stack |
| 5 | Largest Rectangle in Histogram | Hard | LC 84 | Monotonic stack |
| 6 | Implement Queue using Stacks | Easy | LC 232 | Amortized O(1) |
| 7 | Simplify Path | Medium | LC 71 | Stack + split |
| 8 | Asteroid Collision | Medium | LC 735 | Stack simulation |
| 9 | Online Stock Span | Medium | LC 901 | Monotonic stack |
| 10 | Sliding Window Maximum | Hard | LC 239 | Monotonic deque |
| 11 | Remove All Adjacent Duplicates | Easy | LC 1047 | Stack simulation |
| 12 | Next Greater Element I | Easy | LC 496 | Monotonic stack + map |

### HashMaps & HashSets

| # | Problem | Difficulty | Source | Key Concept |
|---|---------|-----------|--------|-------------|
| 1 | Two Sum | Easy | LC 1 | Complement lookup |
| 2 | Group Anagrams | Medium | LC 49 | Sorted key grouping |
| 3 | Longest Substring Without Repeating | Medium | LC 3 | Sliding window + set |
| 4 | Top K Frequent Elements | Medium | LC 347 | HashMap + heap |
| 5 | Valid Anagram | Easy | LC 242 | Frequency count |
| 6 | Isomorphic Strings | Easy | LC 205 | Two-way mapping |
| 7 | Word Pattern | Easy | LC 290 | Bijection check |
| 8 | Subarray Sum Equals K | Medium | LC 560 | Prefix sum map |
| 9 | First Unique Character | Easy | LC 387 | Frequency → scan |
| 10 | Design HashMap | Easy | LC 706 | Implement from scratch |
| 11 | Encode and Decode TinyURL | Medium | LC 535 | Hash function design |
| 12 | Intersection of Two Arrays II | Easy | LC 350 | Frequency matching |

**Hidden Gem Problems (rarely listed but highly educational):**

| Problem | Source | Why It's Great |
|---------|--------|---------------|
| Brick Wall | LC 554 | HashMap on gaps — think differently |
| Contiguous Array | LC 525 | Prefix sum + HashMap (0/1 balance) |
| Find All Anagrams in String | LC 438 | Fixed window + frequency match |
| Minimum Window Substring | LC 76 | Variable window + HashMap (Hard, classic) |
| Design Linked List | LC 707 | Build from scratch — tests everything |
| Flatten Nested List Iterator | LC 341 | Stack + recursion on nested structures |

---

_Continue in Part 2: 02_DataStructures_Variants.md_


---

> **Navigation**: [< Previous](01f_Trees_Heaps.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](02a_DS_Variants_Core.md)