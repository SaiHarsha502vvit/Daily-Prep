# Chapter 01 — Bits, Bytes & Data Representation

> [Course Index](README.md) | [Next → 02 Integer Arithmetic & Two's Complement](02_Integer_Arithmetic_Twos_Complement.md)

---

## Why Binary? The Physical Argument

Before we touch numbers, ask: why does a computer use 0s and 1s at all? Why not 0-9 like humans?

A transistor is a voltage-controlled switch. The voltage across it is a continuous physical value — it could in principle be 0V, 1V, 2V, ..., 9V (10 states, giving decimal). But physical reality intervenes:

- Voltage fluctuates due to thermal noise, electromagnetic interference, and manufacturing variation.
- The further apart the valid states are, the easier it is to distinguish them reliably.
- With only TWO states (OFF ≈ 0V, ON ≈ 3.3V), you need a 1.6V gap to protect against noise.
- With TEN states, the gap shrinks to 0.3V — too close for reliable high-speed switching.

**Binary wins because it's the most noise-resistant encoding.** Every bit is a transistor state. Every byte is 8 transistors. A modern CPU chip has ~50 billion transistors, all switching billions of times per second, all in binary.

---

## Bits and Bytes

**1 bit** = a single binary digit: 0 or 1.

**1 byte** = 8 bits. Range: 0 to 255 (unsigned), or 2⁸ = 256 possible values.

**Why 8 bits per byte?** Historical reason: early computers used 6- or 7-bit bytes. IBM's System/360 (1964) standardized the 8-bit byte because 8 = 2³ is a convenient power of 2, and it fit the ASCII character set (128 chars = 7 bits, with one parity bit). The byte has been 8 bits ever since.

**Size vocabulary:**

| Unit | Bytes | Power of 2 | Common use |
|------|-------|------------|------------|
| Byte (B) | 1 | 2⁰ | One character |
| Kilobyte (KB) | 1,024 | 2¹⁰ | Small file |
| Megabyte (MB) | 1,048,576 | 2²⁰ | A photo, a song |
| Gigabyte (GB) | ~10⁹ | 2³⁰ | RAM, game save |
| Terabyte (TB) | ~10¹² | 2⁴⁰ | Hard drive |
| Petabyte (PB) | ~10¹⁵ | 2⁵⁰ | Data center storage |

Note: "1 KB" in storage marketing often means 1000 bytes, not 1024. Use KiB/MiB/GiB for powers of 2 (IEC standard).

---

## Binary ↔ Decimal Conversion

### Decimal to Binary

Repeatedly divide by 2, collect remainders from bottom to top:

```
Convert 53 to binary:

53 ÷ 2 = 26 remainder 1   ← LSB (least significant bit)
26 ÷ 2 = 13 remainder 0
13 ÷ 2 = 6  remainder 1
 6 ÷ 2 = 3  remainder 0
 3 ÷ 2 = 1  remainder 1
 1 ÷ 2 = 0  remainder 1   ← MSB (most significant bit)

Reading remainders bottom to top: 110101

53₁₀ = 0011 0101₂
```

### Binary to Decimal

Each bit position has weight 2ⁿ (right-to-left, starting at n=0):

```
0011 0101₂

Position:  7   6   5   4   3   2   1   0
Bit:       0   0   1   1   0   1   0   1
Weight:   128  64  32  16   8   4   2   1

Value: 0+0+32+16+0+4+0+1 = 53 ✓
```

**Pattern shortcut:** Group bits into nibbles (4 bits) from the right. Each nibble is one hex digit.

---

## Hexadecimal: The Programmer's Shorthand

Binary is verbose. Writing `0011 0101` to mean 53 is tedious. Hexadecimal (base 16) solves this:

| Hex | Decimal | Binary |
|-----|---------|--------|
| 0-9 | 0-9 | 0000-1001 |
| A | 10 | 1010 |
| B | 11 | 1011 |
| C | 12 | 1100 |
| D | 13 | 1101 |
| E | 14 | 1110 |
| F | 15 | 1111 |

One hex digit = exactly 4 bits (one nibble). One byte = two hex digits.

```
Binary:  0011  0101
Nibble:   3     5
Hex:      35

53₁₀ = 0x35   (prefix 0x denotes hexadecimal)

Verify: 3×16 + 5×1 = 48 + 5 = 53 ✓
```

**Why programmers use hex everywhere:**
- Memory addresses: `0x7FFF4A2C8E00`
- Bit masks: `0xFF` = 11111111, `0x0F` = 00001111
- Color codes: `#FF5733` = RGB(255, 87, 51)
- Unicode code points: U+0041 = 'A'

Hex is not a different number system — it's just a compact notation for binary.

---

## How Data Is Stored: Types Are Interpretations

**Critical insight:** A computer doesn't store "integers," "strings," or "floats." It stores bytes. The type tells you how to interpret those bytes.

```
The 4 bytes: 01000001 01000010 01000011 01000100

Interpreted as a 32-bit integer:   1,094,861,636
Interpreted as ASCII text:         "ABCD"
Interpreted as IEEE 754 float:     12.141569...
Interpreted as x86 instructions:   some machine code
```

The bytes are IDENTICAL in all four cases. The interpretation is entirely in the software.

This is why:
- In C, reading past an array boundary (buffer overflow) can corrupt other data or expose secret values — you're reading raw bytes without the type system's protection.
- In Python, `b'\x41\x42\x43\x44'.decode()` gives `"ABCD"`.
- A `.jpg` renamed to `.txt` isn't corrupted — the bytes are unchanged, just interpreted differently.

---

## Representing Text: ASCII and Unicode

### ASCII (1963)

American Standard Code for Information Interchange. Maps 128 characters to 7-bit codes:

```
'A' = 65  = 0x41 = 01000001
'a' = 97  = 0x61 = 01100001   (lowercase = uppercase + 32 = flip bit 5)
'0' = 48  = 0x30
' ' = 32  = 0x20
'\n'= 10  = 0x0A
'\0'= 0   = 0x00  (null terminator in C strings)
```

**Pattern:** letters are contiguous. `'A' + 25 = 'Z'`. `'0' + n` gives the char for digit n. This makes parsing easy.

**Problem:** ASCII only covers English + a few symbols. No accents, no Chinese, no Arabic, no emoji.

### Unicode and UTF-8

Unicode assigns a **code point** (an integer) to every character in every writing system: U+0041 = 'A', U+4E2D = '中', U+1F600 = '😀'.

**UTF-8** is the dominant encoding. It's variable-length:
- 1 byte for U+0000–U+007F (all ASCII — backward compatible)
- 2 bytes for U+0080–U+07FF (accented Latin, Greek, Arabic, Hebrew)
- 3 bytes for U+0800–U+FFFF (CJK characters)
- 4 bytes for U+10000–U+10FFFF (emoji, ancient scripts)

```
'A'  = 0x41             (1 byte)
'é'  = 0xC3 0xA9        (2 bytes)
'中' = 0xE4 0xB8 0xAD   (3 bytes)
'😀' = 0xF0 0x9F 0x98 0x80  (4 bytes)
```

**Why UTF-8 dominates:** It's backward compatible with ASCII (all ASCII files are valid UTF-8), it's self-synchronizing (you can find character boundaries from any byte position), and it doesn't waste space for English text.

```python
# Python example
s = "Hello 😀"
print(len(s))          # 7 characters
print(len(s.encode()))  # 10 bytes (5 ASCII + 1 space + 4 bytes for emoji)
print(s.encode())       # b'Hello \xf0\x9f\x98\x80'
```

**Common bug:** `str.length()` in JavaScript gives UTF-16 code units, not Unicode characters. `"😀".length` returns 2 (it's a surrogate pair in UTF-16), not 1. This catches developers who don't understand encodings.

---

## Bitwise Operations

Computers perform logical operations directly on bits. Every integer type supports:

| Operation | Symbol | Action | Example (8-bit) |
|-----------|--------|--------|-----------------|
| AND | `&` | 1 if BOTH bits are 1 | `0b1100 & 0b1010 = 0b1000` |
| OR | `\|` | 1 if EITHER bit is 1 | `0b1100 \| 0b1010 = 0b1110` |
| XOR | `^` | 1 if bits DIFFER | `0b1100 ^ 0b1010 = 0b0110` |
| NOT | `~` | Flip all bits | `~0b1100 = 0b0011` (for 4-bit) |
| Left shift | `<<` | Move bits left, fill 0s | `0b0011 << 2 = 0b1100` |
| Right shift | `>>` | Move bits right | `0b1100 >> 2 = 0b0011` |

**Arithmetic insight:** `x << n` = x × 2ⁿ. `x >> n` = x ÷ 2ⁿ (for non-negative integers). Shifts are faster than multiplication/division.

### Practical Bitmask Patterns

```java
// Check if bit k is set
boolean isSet = (flags & (1 << k)) != 0;

// Set bit k
flags = flags | (1 << k);

// Clear bit k
flags = flags & ~(1 << k);

// Toggle bit k
flags = flags ^ (1 << k);

// Extract lower n bits (mask)
int lower4 = value & 0x0F;   // mask = 00001111

// Check if n is a power of 2
boolean isPow2 = (n > 0) && (n & (n-1)) == 0;
// Why: powers of 2 have exactly one 1-bit. Subtracting 1 flips all lower bits.
// E.g., 8 = 1000, 7 = 0111 → 8 & 7 = 0.

// Count number of set bits (Brian Kernighan's algorithm)
int count = 0;
while (n != 0) {
    n &= (n - 1);   // clear the lowest set bit
    count++;
}
```

---

## Endianness: How Bytes Are Ordered in Memory

When storing a multi-byte value (like a 32-bit integer), which byte goes first in memory?

**Big-endian (network byte order):** Most significant byte at lowest address. Like reading left-to-right.
```
Value: 0x12345678
Memory (address ↑): 12  34  56  78
```

**Little-endian (x86, ARM):** Least significant byte at lowest address.
```
Value: 0x12345678
Memory (address ↑): 78  56  34  12
```

x86 and ARM (the dominant CPU architectures) are little-endian. SPARC, PowerPC, and network protocols use big-endian.

**Why it matters:**
```c
// C: reading a file of 32-bit integers written on a big-endian machine
// on a little-endian x86 machine gives WRONG values.
// Must byte-swap: 0x12345678 ↔ 0x78563412

uint32_t swap32(uint32_t v) {
    return ((v & 0xFF000000) >> 24) |
           ((v & 0x00FF0000) >>  8) |
           ((v & 0x0000FF00) <<  8) |
           ((v & 0x000000FF) << 24);
}

// In Java: DataInputStream uses big-endian; ByteBuffer.order() switches.
// In Python: struct.unpack('<I', bytes) for little-endian uint32.
```

Network protocols (TCP/IP) always use big-endian — which is why it's called "network byte order." `htonl()` (host-to-network long) converts between the two.

---

## Section Challenge

> ### Forensic Byte Analysis
>
> A bug report arrives: a file is being corrupted during transmission between a big-endian server (SPARC) and a little-endian client (x86). The server sends the 4-byte sequence: `0x00 0x00 0x27 0x10`.
>
> **Q1:** What 32-bit unsigned integer value does the server intend to send?
>
> **Q2:** What value does the x86 client read if it naively interprets the bytes in the order they arrive (without swapping)?
>
> **Q3:** Write the byte-swap operation in binary (show all 32 bits) to fix the client's reading.
>
> **Q4:** The client code uses a bitmask `flags & 0xFF00` on the (incorrectly read) value from Q2. What does it extract? Is this the correct answer?
>
> **Q5 (Stretch):** A developer suggests "just store everything as text (ASCII digits)." What is the byte cost of storing 10,000 as ASCII vs as a 32-bit integer? For a file of 10 million such values, what is the size difference?

<details>
<summary>Full answers</summary>

```
Q1: Server's intended value

Big-endian: most significant byte first.
Bytes: 0x00  0x00  0x27  0x10
       MSB                LSB

Value = 0x00002710
      = 0×16³ + 0×16² + 2×16¹ + 7×16⁰ (for last two bytes: 0x27 and 0x10)

0x2710 = 2×16³ + 7×16² + 1×16¹ + 0×16⁰
       = 2×4096 + 7×256 + 16 + 0
       = 8192 + 1792 + 16
       = 10000

Intended value: 10,000

──────────────────────────────────────────────────────

Q2: What x86 reads (little-endian, no swap)

x86 interprets the bytes at the LOWEST address as the LEAST significant byte.
Bytes arrive in order: 0x00, 0x00, 0x27, 0x10.
x86 stores/reads as: 0x10270000

0x10270000 = 1×16⁷ + 0×... + 2×16⁵ + 7×16⁴ + 0...
           = 268,959,744

The client reads 268,959,744 instead of 10,000!

──────────────────────────────────────────────────────

Q3: Byte swap (binary)

Original (as received): 0x00002710
Binary: 0000 0000  0000 0000  0010 0111  0001 0000

Swap bytes (reverse byte order):
Byte 0 (MSB) = 0x00 = 0000 0000  → becomes byte 3 (LSB)
Byte 1       = 0x00 = 0000 0000  → becomes byte 2
Byte 2       = 0x27 = 0010 0111  → becomes byte 1
Byte 3 (LSB) = 0x10 = 0001 0000  → becomes byte 0 (MSB)

After swap: 0x10 0x27 0x00 0x00
= 0x10270000  ← wait, this is what x86 ALREADY read!

The correct interpretation after swap:
We want to go from what x86 read (0x10270000) → correct value (0x00002710).

swap32(0x10270000):
  byte 0 (0x10) → position 3
  byte 1 (0x27) → position 2
  byte 2 (0x00) → position 1
  byte 3 (0x00) → position 0
Result: 0x00002710 = 10,000 ✓

Binary of swap operation:
Original: 0001 0000  0010 0111  0000 0000  0000 0000
Swapped:  0000 0000  0000 0000  0010 0111  0001 0000  = 0x00002710 ✓

──────────────────────────────────────────────────────

Q4: Bitmask on incorrectly read value

Incorrectly read value: 0x10270000
Mask:                   0x0000FF00 (NOT 0xFF00 for 32-bit!)

Assuming Q4 means & 0x0000FF00:
0x10270000 & 0x0000FF00 = 0x00000000 → extracts 0x00

But the intended extraction (on the CORRECT value 0x00002710):
0x00002710 & 0x0000FF00 = 0x00002700 → extracts the "27" byte = 0x27 = 39

So the client extracted 0 instead of 0x2700 (39 in that byte position).
WRONG result — the bug propagates beyond just reading the number wrong.

──────────────────────────────────────────────────────

Q5: Text vs binary storage

Binary (32-bit integer): 4 bytes per number, always.
  10 million numbers × 4 bytes = 40 MB

ASCII text for 10,000:
"10000" = 5 digits × 1 byte + 1 delimiter ('\n' or ',') = 6 bytes
  10 million numbers × 6 bytes = 60 MB

Difference: 60MB - 40MB = 20MB extra for text.
That's a 50% size penalty just for using ASCII.

For larger numbers the gap grows:
  2,147,483,647 (max int32) = 10 ASCII digits = 11 bytes → 2.75× overhead

Additionally:
- Text parsing (atoi) is slower than raw memory copy
- Text loses exact binary representation for floats (0.1 in text ≠ 0.1 in IEEE 754)
- Binary files are NOT human-readable — trade-off: efficiency vs debuggability

The developer's suggestion is only appropriate when human-readability is required
(config files, logs, network protocols that mix text and data).
For bulk numerical data: always use binary.
```

</details>

---

## Common Mistakes

**Mistake 1: Confusing KB (marketing, 1000 bytes) with KiB (exact, 1024 bytes)**
- A "500 GB" hard drive holds 500,000,000,000 bytes = 465.6 GiB. This is why it "appears smaller" in your OS.
- Use KiB/MiB/GiB when exact powers of 2 matter.

**Mistake 2: Assuming `char` is 1 byte for all characters**
- `char` in Java/C is a code unit, not a character. UTF-16 surrogate pairs use 2 `char` values for characters above U+FFFF (like most emoji).
- Use `s.codePointCount()` in Java, not `s.length()`, for Unicode character count.

**Mistake 3: Treating bit operations as language-specific magic**
- `n & (n-1)` always clears the lowest set bit. `n & -n` always isolates the lowest set bit. These work in every language that has `&`. Memorize them.

**Mistake 4: Ignoring endianness when doing network I/O or file parsing**
- Any time you read multi-byte integers from a file or network socket, you must know the byte order. Assume big-endian for network protocols (IETF standard); check the spec for file formats.

---

## Connections

- **Chapter 02 — Integer Arithmetic:** Bits become signed integers via two's complement. Overflow is a binary phenomenon.
- **Chapter 03 — Floating Point:** IEEE 754 floats are 32 or 64 bits with specific bit-field layout: sign + exponent + mantissa.
- **Chapter 06 — Memory Hierarchy:** Memory addresses are integers. Address arithmetic is bit arithmetic.
- **Chapter 07 — Linking:** Object files and executables are binary data with defined byte-level formats (ELF, Mach-O, PE).

---

> [Course Index](README.md) | [Next → 02 Integer Arithmetic & Two's Complement](02_Integer_Arithmetic_Twos_Complement.md)
