# Chapter 12 — FFT and Applications

> "The naïve Fourier transform is O(n²): n frequencies, each needing n multiplications. The FFT's insight: the computation at frequency k and at frequency k+n/2 share most of their work. One pass of sharing cuts the problem in half. Recurse. O(n log n) falls out."

---

## The Problem

Given N samples of a signal x[0], x[1], ..., x[N-1], find its frequency content.

**Discrete Fourier Transform (DFT):**
```
X[k] = Σⱼ₌₀^(N-1) x[j] · e^(-i2πjk/N),   k = 0, 1, ..., N-1
```

X[k] is the amplitude and phase of the frequency f = k/N in the signal.

**Naïve computation:** N values of X[k], each requiring N multiplications → O(N²). For N = 10⁶: 10¹² operations. At 10⁹ ops/sec: ~17 minutes.

**FFT:** O(N log N). For N = 10⁶: 2×10⁷ operations. At 10⁹ ops/sec: 0.02 seconds. Speedup: ~50,000×.

**Why it matters:**
- Audio/video compression (MP3, JPEG, HEVC)
- Signal filtering (noise removal, equalization)
- Solving PDEs (spectral methods)
- Polynomial multiplication O(n log n) vs O(n²)
- Convolution theorem: y = h * x takes O(N log N) via FFT vs O(N²) direct
- Radar/sonar processing
- MRI image reconstruction

---

## 12.1 The DFT Matrix View

Write the DFT as a matrix-vector product X = F·x:
```
Fⱼₖ = ωᴺ^(jk),   ωᴺ = e^(-i2π/N)   (Nth root of unity)
```

The N×N DFT matrix F is symmetric, unitary (F·F* = N·I), and **Vandermonde** in the roots of unity.

**Key property:** ωᴺᴺ = 1, ωᴺ^(N/2) = -1, ωᴺ^(N/4) = -i. The roots of unity form a regular polygon on the unit circle in ℂ.

**DFT properties:**
- **Linearity:** DFT(ax + by) = a·DFT(x) + b·DFT(y)
- **Periodicity:** X[k+N] = X[k], x[j+N] = x[j]
- **Conjugate symmetry:** For real x: X[N-k] = X[k]* (complex conjugate). Spectrum is symmetric — only first N/2+1 values are independent.
- **Parseval's theorem:** Σ|x[j]|² = (1/N)Σ|X[k]|² (energy preserved)
- **Convolution theorem:** DFT(x * y) = DFT(x) · DFT(y) (pointwise product)
- **Shift:** DFT(x[j-d]) = ωᴺ^(dk) · X[k] (time shift = phase shift in frequency)

---

## 12.2 Cooley-Tukey FFT: The Butterfly

Assume N = 2ᴹ (power of 2). The **Cooley-Tukey decimation-in-time** algorithm:

**Split even/odd indices:**
```
X[k] = Σⱼ x[j] ωᴺ^(jk)
     = Σⱼ even x[j] ωᴺ^(jk) + Σⱼ odd x[j] ωᴺ^(jk)
     = Σⱼ₌₀^(N/2-1) x[2j] ωᴺ^(2jk) + Σⱼ₌₀^(N/2-1) x[2j+1] ωᴺ^((2j+1)k)
     = Σⱼ x[2j] ω_(N/2)^(jk) + ωᴺ^k Σⱼ x[2j+1] ω_(N/2)^(jk)
```

The key: ωᴺ^(2j) = e^(-i2π·2j/N) = e^(-i2πj/(N/2)) = ω_(N/2)^j.

Define:
- E[k] = DFT_{N/2}(x[0], x[2], x[4], ...) (even-indexed samples)
- O[k] = DFT_{N/2}(x[1], x[3], x[5], ...) (odd-indexed samples)

Then:
```
X[k]     = E[k] + ωᴺ^k · O[k],   k = 0, 1, ..., N/2-1
X[k+N/2] = E[k] - ωᴺ^k · O[k],   k = 0, 1, ..., N/2-1
```

**The butterfly:** From one pair (E[k], O[k]), get two outputs with one complex multiply:
```
        E[k] ──────┬──── + ωᴺ^k · O[k]  → X[k]
                   │
        O[k] ──ω──┤
                   └──── - ωᴺ^k · O[k]  → X[k+N/2]
```

This is the "butterfly" diagram. One complex multiply → two outputs. If we had to compute E[k] and O[k] independently: no sharing. By pairing k and k+N/2: they share the same ωᴺ^k · O[k] computation!

**Recursion:**
```
T(N) = 2T(N/2) + N/2  (two half-size DFTs + N/2 butterflies)
```

By the Master Theorem (a=2, b=2, f(N)=N/2):
```
T(N) = O(N log N)
```

Specifically: (N/2) log₂(N) complex multiplications.

---

## 12.3 Worked Trace: N = 4 FFT

Input: x = [1, 2, 3, 4]. Compute X[0], X[1], X[2], X[3].

ω₄ = e^(-iπ/2) = -i. Powers: ω₄⁰=1, ω₄¹=-i, ω₄²=-1, ω₄³=i.

**Level 1: Split into even/odd:**
- Even: x_e = [x[0], x[2]] = [1, 3]
- Odd: x_o = [x[1], x[3]] = [2, 4]

**Level 2: 2-point DFT of each:**
- E = DFT₂([1, 3]): E[0] = 1+3 = 4, E[1] = 1 + ω₂¹·3 = 1 + (-1)·3 = -2.
- O = DFT₂([2, 4]): O[0] = 2+4 = 6, O[1] = 2 + (-1)·4 = -2.

(ω₂ = e^(-iπ) = -1, so 2-point DFT is just [x[0]+x[1], x[0]-x[1]].)

**Level 3: Butterflies (N=4, k=0,1):**

k=0: ω₄⁰ = 1.
```
X[0] = E[0] + 1·O[0] = 4 + 6 = 10
X[2] = E[0] - 1·O[0] = 4 - 6 = -2
```

k=1: ω₄¹ = -i.
```
X[1] = E[1] + (-i)·O[1] = -2 + (-i)·(-2) = -2 + 2i
X[3] = E[1] - (-i)·O[1] = -2 - 2i
```

**Result:** X = [10, -2+2i, -2, -2-2i].

**Verify with naïve DFT (X[1]):**
X[1] = x[0]·ω₄⁰ + x[1]·ω₄¹ + x[2]·ω₄² + x[3]·ω₄³
     = 1·1 + 2·(-i) + 3·(-1) + 4·(i)
     = 1 - 2i - 3 + 4i = -2 + 2i. ✓

**Operation count:**
- Naïve: 4² = 16 complex multiplications.
- FFT: log₂(4)·4/2 = 2·2 = 4 complex multiplications + some additions. 4× speedup for N=4.
- For N=10⁶: speedup ~50,000×.

---

## 12.4 Bit-Reversal Permutation

The Cooley-Tukey FFT (as implemented in-place) rearranges the input in **bit-reversed order**.

For N = 8 = 2³, rewrite indices in binary:
```
Index  Binary  Bit-reversed  Permuted
  0     000       000           0
  1     001       100           4
  2     010       010           2
  3     011       110           6
  4     100       001           1
  5     101       101           5
  6     110       011           3
  7     111       111           7
```

**Why:** Each level of recursion splits even/odd. Even indices have last bit 0, odd indices have last bit 1. Separating even/odd is equivalent to sorting by last bit. After M levels: sorted by all M bits in reverse order = bit reversal.

**In-place FFT:**
```
1. Bit-reverse the input: x[j] ↔ x[bit_rev(j)]
2. For each stage s = 1, 2, ..., log₂(N):
   For each butterfly group:
     Apply butterfly (E[k], O[k]) → (X[k], X[k+N/2])
```

The in-place algorithm uses only O(1) extra memory beyond the input.

---

## 12.5 Convolution via FFT

**Cyclic convolution:**
```
(x * h)[n] = Σₖ x[k]·h[n-k]   (indices mod N)
```

Naïve computation: O(N²). With FFT:
```
1. X = FFT(x)         O(N log N)
2. H = FFT(h)         O(N log N)
3. Y = X · H          O(N)       ← pointwise
4. y = IFFT(Y)        O(N log N)
```

**Total:** O(N log N). Why? By the convolution theorem: **DFT(x * h) = DFT(x) · DFT(h)** (pointwise product, not matrix product).

**Proof:**
```
Y[k] = Σₙ (x*h)[n]·ωᴺ^(nk)
     = Σₙ Σⱼ x[j]·h[n-j] ω^(nk)
     = Σⱼ x[j] Σₙ h[n-j] ω^(nk)
     = Σⱼ x[j] ω^(jk) Σₘ h[m] ω^(mk)   (m = n-j, shift theorem)
     = X[k]·H[k]. □
```

**Linear vs cyclic convolution:** True convolution (no wraparound) needs zero-padding: pad both x and h to length ≥ len(x)+len(h)-1, FFT, multiply, IFFT, trim. Standard technique: "overlap-add" or "overlap-save" for streaming audio.

**Polynomial multiplication:** Represent polynomials as coefficient vectors. Multiply = linear convolution of coefficients. O(n log n) via FFT. This is how fast integer multiplication works (FFT-based Schönhage-Strassen algorithm: O(n log n log log n) for n-digit integers).

---

## 12.6 Spectral Analysis and Windowing

**Spectral leakage:** If x[j] is a single pure tone but NOT periodic in the DFT window (N samples don't contain an exact integer number of periods), energy "leaks" from the true frequency into neighboring bins.

**Example:** True frequency f = 2.5 (between bins 2 and 3). DFT smears the single spike into a wide bump. This masks nearby frequencies.

**Why leakage happens:** The DFT assumes the N samples are one period of a periodic signal. If the signal is sin(2π·2.5·j/N), the samples don't close into a period — there's a discontinuity at the boundary. The DFT sees this discontinuity and distributes energy across many frequencies.

**Window functions:** Taper the signal at the edges before applying DFT.
```
x_windowed[j] = x[j] · w[j]
```

Common windows:
- **Rectangular:** w[j] = 1 (no windowing, worst leakage)
- **Hann:** w[j] = (1 - cos(2πj/N))/2 (good sidelobe suppression)
- **Hamming:** w[j] = 0.54 - 0.46·cos(2πj/N)
- **Blackman:** w[j] = 0.42 - 0.5·cos(2πj/N) + 0.08·cos(4πj/N) (best leakage, widest main lobe)
- **Kaiser:** parameterized tradeoff between main-lobe width and sidelobe level

**Tradeoff:** Wider window → better sidelobe suppression, worse frequency resolution. Narrow main lobe → better resolution, worse leakage. Always choose window based on whether resolution or dynamic range matters more.

---

## 12.7 Fast Algorithms for Special Cases

**Real FFT (rfft):** For real input x, the output satisfies X[N-k] = X[k]*. Only N/2+1 values are independent. Algorithms exploit this to reduce work by 2×.

**Split-radix FFT:** Uses a combination of radix-2 and radix-4 butterflies. Achieves the minimum known operation count for power-of-2 sizes.

**Non-power-of-2 (radix-N FFT):** When N = N₁×N₂: factor the DFT into DFT_{N₁} and DFT_{N₂}. Generalized Cooley-Tukey. Works for any N = 2^a × 3^b × 5^c × ... (highly composite numbers). Worst case: N prime → O(N²). FFTW library detects N and selects the best plan at runtime.

**NUFFT (Non-Uniform FFT):** For irregularly sampled data. O(N log N + M) where M = number of target frequencies. Used in MRI reconstruction (data acquired in k-space on non-Cartesian grid).

**Sparse FFT:** When the signal has K significant frequencies and K << N. Can compute in O(K log N) using sublinear sampling. Active research area.

---

## 12.8 FFT in Scientific Computing

**Spectral methods for PDEs:** The PDE u_t = u_xx (heat equation). Apply FFT to x: d/dt Û[k] = -(2πk/L)²·Û[k]. This is just an ODE in time for each Fourier mode. Evolve each mode independently, IFFT to recover u(x,t). Spectral accuracy: exponential convergence for smooth initial data vs O(h²) for finite differences.

**Pseudospectral methods:** Nonlinear terms (like u·uₓ in Burgers equation): compute in physical space (pointwise product), transform to frequency space. Aliasing handled via dealiasing filters.

**Cross-correlation:** detect one signal within another (radar, sonar, template matching):
```
R_xy[n] = IFFT(X*[k] · Y[k])
```
O(N log N). In image processing: matched filter = cross-correlation with template.

**Power Spectral Density:** PSD = |X[k]|²/N. Averaged over multiple windows (Welch's method) for noise reduction. Fundamental tool in signal analysis.

---

## Section Challenge

---

**Q1.** Compute the 4-point DFT of x = [1, 0, -1, 0] directly (using the formula X[k] = Σ x[j]ω₄^(jk)). Then verify your answer tells you that x is a pure sinusoid.

<details>
<summary>Answer</summary>

ω₄ = e^(-iπ/2) = -i. Powers: ω₄⁰=1, ω₄¹=-i, ω₄²=-1, ω₄³=i.

**X[0]:** Σ x[j]·1 = 1+0+(-1)+0 = 0.

**X[1]:** Σ x[j]·ω₄^j = x[0]·1 + x[1]·(-i) + x[2]·(-1) + x[3]·i
= 1·1 + 0·(-i) + (-1)·(-1) + 0·i = 1 + 1 = 2.

**X[2]:** Σ x[j]·(-1)^j = 1·1 + 0·(-1) + (-1)·1 + 0·(-1) = 1 - 1 = 0.

**X[3]:** Σ x[j]·ω₄^(3j) = x[0]·1 + x[1]·i + x[2]·(-1) + x[3]·(-i)
= 1 + 0 + (-1)·(-1) + 0 = 1 + 1 = 2.

**Result:** X = [0, 2, 0, 2].

**Interpretation:**
- X[0] = 0: no DC component.
- X[1] = 2: component at frequency 1 (one full cycle in N samples).
- X[2] = 0: no frequency-2 component.
- X[3] = 2: conjugate of X[1] (real signal symmetry: X[N-k] = X[k]* → X[3] = X[1]* = 2 ✓).

**Single frequency at k=1.** The signal is a pure sinusoid at the fundamental frequency.

```
Verify: x[j] = IDFT(X)[j] = (1/N)Σ X[k]·e^(i2πjk/N).
= (1/4)[0 + 2·e^(i·πj/2) + 0 + 2·e^(i·3πj/2)]
= (1/2)[e^(iπj/2) + e^(-iπj/2)]  (since e^(i3πj/2) = e^(-iπj/2) for real signals)
= cos(πj/2).
```

j=0: cos(0)=1 ✓, j=1: cos(π/2)=0 ✓, j=2: cos(π)=-1 ✓, j=3: cos(3π/2)=0 ✓.

x is exactly cos(πj/2) — a pure cosine at frequency 1. DFT correctly shows energy only at k=1 (and k=3 by symmetry).
</details>

---

**Q2.** Explain in detail why the FFT butterfly operation allows X[k] and X[k+N/2] to share computation, and give the total operation count for N=8.

<details>
<summary>Answer</summary>

**The sharing:**

From the Cooley-Tukey split:
```
X[k]     = E[k] + ωᴺ^k · O[k]
X[k+N/2] = E[k] - ωᴺ^k · O[k]
```

Computing X[k] and X[k+N/2] separately (if we didn't know about the -1 symmetry) would require:
- ωᴺ^k · O[k] once for X[k]
- ωᴺ^(k+N/2) · O[k] for X[k+N/2]

But ωᴺ^(k+N/2) = e^(-i2π(k+N/2)/N) = e^(-i2πk/N) · e^(-iπ) = -ωᴺ^k.

So ωᴺ^(k+N/2) · O[k] = -ωᴺ^k · O[k]! The SAME computation (just negated).

**Shared work per butterfly:** 1 complex multiply (compute ωᴺ^k · O[k]) + 2 complex additions (one + and one -). Two output values for the price of one multiply.

**Total operations for N=8:**

Structure: log₂(8) = 3 stages, N/2 = 4 butterflies per stage.

Stage 1: 4 butterflies (2-point DFTs at N=2, no twiddle factors — just additions)
- 0 multiplies, 4×2 = 8 additions.

Stage 2: 4 butterflies at N=4 level.
- 4 multiplies × 1 complex multiply each = 4 complex multiplies. 8 additions.

Stage 3: 4 butterflies at N=8 level.
- 4 complex multiplies. 8 additions.

**Total:** 8 complex multiplies, 24 complex additions.

**Naïve DFT:** 8² = 64 complex multiplies, 8×7 = 56 complex additions.

**Speedup:** 64/8 = 8× fewer multiplies.

**General formula for N = 2ᴹ:** (N/2)·M complex multiplies = (N/2)·log₂(N).
For N=8: 4·3 = 12... but stage 1 has no multiplies (twiddle factor = 1), so actual count is (N/2)·(log₂N - 1) = 4·2 = 8 non-trivial multiplies.
</details>

---

**Q3.** Use the convolution theorem to explain how MP3 compression works at a high level.

<details>
<summary>Answer</summary>

MP3 (MPEG-1 Audio Layer III) exploits both FFT-based frequency analysis and human psychoacoustics. Here's the signal processing pipeline:

**Step 1: Polyphase filterbank + MDCT**

The audio is split into 32 subbands using a polyphase filterbank (essentially a bank of bandpass filters applied efficiently via FFT). Each subband is then modified discrete cosine transformed (MDCT) to produce 18 frequency lines per subband = 576 frequency coefficients per frame.

**Why FFT/MDCT matters:** Computing the equivalent via time-domain convolution with 32 different FIR filters would cost O(32·N·L) where L = filter length ≈ 512. Using FFT-based convolution: O(N log N). The FFT makes this real-time computation feasible.

**Step 2: Psychoacoustic model**

The FFT of the same audio frame (with a longer 1024 or 2048 point FFT, better frequency resolution) estimates masking thresholds:
- **Simultaneous masking:** A loud frequency component makes nearby frequencies inaudible.
- **Temporal masking:** Loud events mask sounds 5-10ms before and 100ms after (pre-masking, post-masking).

These masking thresholds are computed by modeling how the cochlea processes sound (critical bands, spreading functions — themselves applied via convolution → FFT).

**Step 3: Quantization**

Allocate bits to each of the 576 frequency coefficients proportionally: allocate more bits to perceptually important coefficients (below the masking threshold → zero bits). High-frequency components (>15kHz for normal music) → few or zero bits.

**Step 4: Entropy coding**

Huffman encode the quantized coefficients (sparse vector with many zeros) → further compression.

**Convolution theorem role:**
- FFT used directly to compute the frequency-domain masking model.
- MDCT/IMDCT are FFT variants applied to overlap-add synthesis.
- Polyphase filterbank = time-domain FIR filter applied via FFT convolution.

**Compression ratio:** 44.1kHz × 16-bit × 2 channels = 1.41 Mbps. MP3 at 128 kbps → 11:1 compression. At 320 kbps: near-transparent. The FFT is what makes the psychoacoustic model computationally tractable for real-time encoding.
</details>

---

**Q4.** You are filtering an audio signal by multiplying its DFT by H[k] (a frequency-domain filter). What is the time-domain operation this corresponds to, and what happens if you want to apply a causal filter (h[j] = 0 for j < 0)?

<details>
<summary>Answer</summary>

**Time-domain operation:**

Multiplying in the frequency domain = **cyclic convolution** in the time domain:
```
y[n] = (x * h)[n] = Σₖ x[k]·h[n-k]   (indices modulo N)
```

where h[n] = IDFT(H[k]) is the impulse response of the filter.

**This is cyclic (circular) convolution**, not linear convolution. Samples wrap around: h[n-k] with n-k < 0 uses h[n-k+N].

**Why causality matters:**

A causal filter h[j] = 0 for j < 0 means: the output depends only on current and past inputs, not future inputs. Essential for real-time processing.

**The problem with cyclic convolution:** Even if h[j] = 0 for j < 0, the cyclic convolution wraps h[n-k+N] back in for small n (when n-k < 0, it uses h[n-k+N] which may be nonzero). This "circular leakage" is **time-aliasing** — it looks like the filter is non-causal.

**Fix: Zero-padding (linear convolution via cyclic convolution)**

If x has length M and h has length L (h[j] = 0 for j ≥ L):

1. Pad both to length N ≥ M + L - 1 (zero-pad).
2. Compute X = FFT(padded x), H = FFT(padded h).
3. Y = X · H (pointwise).
4. y = IFFT(Y).
5. Take first M + L - 1 samples.

With sufficient zero-padding, the cyclic convolution equals the linear convolution. The wrap-around terms are all zero (because the padded zeros prevent overlap).

**Causal filter implementation in practice (streaming):**
Use **overlap-add** method: process audio in blocks of length M. For each block:
1. Zero-pad block to length M + L - 1.
2. FFT, multiply by H, IFFT.
3. Add the "tail" (last L-1 samples) to the beginning of the next block's output.

This gives exactly the output of a linear (non-circular, causal) FIR filter applied to the entire signal, processed one block at a time. Real-time audio plugins use exactly this algorithm.
</details>

---

**Q5.** The DFT of a signal of length N takes O(N log N). But you want to detect whether a specific frequency f₀ is present in a signal — and you only need ONE DFT bin. Is there a faster algorithm?

<details>
<summary>Answer</summary>

Yes: the **Goertzel algorithm**, which computes a single DFT bin X[k] in O(N) operations (versus O(N log N) for the full FFT).

**Algorithm:** X[k] = Σⱼ₌₀^(N-1) x[j]·ω^(jk) is a polynomial in ω^k evaluated at z = ω^k = e^(-i2πk/N).

Goertzel reformulates this as a **second-order linear recurrence** (IIR filter):

Define sₙ for n = 0, 1, ..., N:
```
s₋₁ = s₋₂ = 0  (initial conditions)
sₙ = x[n] + 2cos(2πk/N)·sₙ₋₁ - sₙ₋₂   (real coefficients!)
```

Then: X[k] = sₙ - sₙ₋₁·e^(-i2πk/N).

**Cost:** N real multiplications and 2N real additions. Compared to FFT: N log₂N complex multiplications.

**When to use Goertzel vs FFT:**

- Need 1-2 specific bins → Goertzel: O(N) each
- Need ≥ log₂(N) bins → FFT: O(N log N) total is better
- For N=1000: log₂(1000) ≈ 10. If you need ≥ 10 bins, use FFT.

**Real-world application: DTMF tone detection (phone keypad)**

Each key press generates two simultaneous tones from {697, 770, 852, 941 Hz} × {1209, 1336, 1477 Hz}. Need to detect exactly 8 frequencies in ~8ms of audio.

Goertzel at each of the 8 frequencies: 8 × O(N) = O(8N) = 8× less work than FFT.

This is exactly how phone systems detect keypad tones — Goertzel is the standard algorithm, implemented in every telephone DTMF decoder chip worldwide.

**Extension:** The Chirp Z-Transform (Bluestein's algorithm) generalizes: compute M DFT values at arbitrary complex frequencies (not just the N equally-spaced ones) in O((N+M) log(N+M)) via FFT. Useful when N is prime (defeating standard Cooley-Tukey) or when non-uniform frequency sampling is needed.
</details>

---

## Chapter Summary

### DFT/FFT Quick Reference

| Property | Formula | Use case |
|----------|---------|----------|
| Definition | X[k] = Σ x[j]·ω^(jk) | Frequency analysis |
| Inverse | x[j] = (1/N)Σ X[k]·ω^(-jk) | Synthesis |
| Convolution thm | DFT(x*h) = X·H | Fast filtering |
| Shift | DFT(x[j-d]) = ω^(dk)·X[k] | Phase shifts |
| Parseval | Σ|x|² = (1/N)Σ|X|² | Energy preservation |
| Conjugate sym | X[N-k] = X[k]* (real x) | Halve storage |

### Algorithm Comparison

| Task | Algorithm | Cost |
|------|-----------|------|
| All N bins | FFT (Cooley-Tukey) | O(N log N) |
| 1 specific bin | Goertzel | O(N) |
| M specific bins, M < log N | M × Goertzel | O(MN) |
| Non-uniform frequencies | Chirp Z-Transform | O(N log N) |
| Sparse spectrum (K bins) | Sparse FFT | O(K log N) |
| Linear convolution | FFT + zero-pad + IFFT | O(N log N) |

### Key Applications Chain

```
Audio:    samples → FFT → |X[k]|² → psychoacoustic model → MP3
Filtering: x,h → FFT both → multiply → IFFT → filtered y
PDE:      u(x) → FFT → evolve each mode → IFFT → u(x,t)
Radar:    received signal → cross-correlate via FFT → delay map
Image:    2D FFT → frequency domain filtering → IFFT → sharpened image
```

---

## CSE304 Complete

This chapter completes the CSE304 Numerical Methods curriculum.

**Full course arc:**

| Ch | Topic | Key algorithm |
|----|-------|--------------|
| 01 | Floating-Point & Error | Kahan summation, condition number |
| 02 | Root Finding | Newton-Raphson (quadratic), Brent's method |
| 03 | Linear Systems: Direct | Gaussian elim, LU, Cholesky, Thomas O(n) |
| 04 | Linear Systems: Iterative | CG, GMRES, preconditioning |
| 05 | Polynomial Interpolation | Chebyshev nodes, cubic splines |
| 06 | Least Squares | QR decomposition, ridge/LASSO via SVD |
| 07 | Numerical Differentiation | Complex-step, automatic diff |
| 08 | Numerical Integration | Gauss-Legendre, Romberg, Monte Carlo |
| 09 | ODEs: Initial Value | RK4, adaptive step, stiffness, A-stability |
| 10 | ODEs: Boundary Value | Shooting, finite differences, Sturm-Liouville |
| 11 | Eigenvalue Problems | QR algorithm, Lanczos, SVD |
| 12 | FFT and Applications | Cooley-Tukey butterfly, convolution theorem |

---

*Previous: [11 — Eigenvalue Problems](11_Eigenvalue_Problems.md)*
*Course index: [CSE304 Numerical Methods README](README.md)*
