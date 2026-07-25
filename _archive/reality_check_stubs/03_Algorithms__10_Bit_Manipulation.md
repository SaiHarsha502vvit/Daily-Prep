

---

## Reality Check

**"Bit manipulation tricks are only for competitive programming"** → Production uses: network masks (IP addresses are 32-bit integers; subnet mask = bitwise AND), Redis bitmaps (1 bit per user for A/B flags — 128MB for 1 billion users), bloom filters (hash → set bit positions), image processing (pixel channels packed into 32-bit RGBA int), cryptography (XOR cipher, SHA/AES bit operations), game engines (flag fields for entity components). Bit manipulation is everywhere in systems programming.

**"n & (n-1) is a clever trick, not something to reason about"** → There is a structural reason: subtracting 1 from n flips the lowest set bit to 0 and all lower bits to 1. ANDing with n clears those. So `n & (n-1)` removes exactly the lowest set bit. This is why it counts set bits: loop `while (n) { n &= n-1; count++; }`. Brian Kernighan's bit counting is O(k) where k = set bits, not O(32). Understanding WHY tricks work lets you adapt them, not just memorize them.

**"Negative numbers behave like positive numbers with bits"** → Java (and most languages) use two's complement. The sign bit is the most significant bit. Right shift `>>` is arithmetic (fills with sign bit). `>>>` is unsigned right shift (fills with 0). `-1 >> 1` = -1 (arithmetic). `-1 >>> 1` = 2147483647 (Integer.MAX_VALUE). Mixing signed and unsigned shifts is a common bug. In Java, byte/short are widened to int before bit operations — `(byte)0xFF & 0xFF` gives 255, not -1.

**"XOR is just a bitwise operation"** → XOR has remarkable properties used in algorithms: `a XOR a = 0`, `a XOR 0 = a`, commutativity and associativity. Uses: finding the one unique element in an array where all others appear twice (XOR all elements — duplicates cancel), swapping without a temp variable (`a^=b; b^=a; a^=b`), parity checks, simple stream cipher (XOR with key), Gray code (bitwise `n XOR (n >> 1)` converts binary to Gray code where adjacent values differ in one bit).

**"Left shift by k equals multiplication by 2^k always"** → True for non-negative values within the integer range. For signed integers, shifting into the sign bit is undefined behavior in C/C++ (though defined in Java). In Java: `int x = Integer.MAX_VALUE; x <<= 1;` gives -2 (sign bit set). The JVM spec defines left shift behavior but the mathematical equivalence to multiplication breaks when overflow occurs. Compilers generate shift instructions for `x * 2` and `x / 2` automatically — you don't need to manually write shifts for performance.
