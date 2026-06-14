/**
 * BinarySearch.java — 4 variants all from the same invariant.
 *
 * Compile: javac BinarySearch.java
 * Run:     java BinarySearch
 *
 * Key lesson: every binary search variant uses the same invariant:
 *   "if target exists, it is in arr[lo..hi]"
 * The only thing that changes is: what do we do when arr[mid] == target?
 *
 * Proof Corner reference: 02c_Divide_And_Conquer.md
 */
public class BinarySearch {

    /**
     * Standard search: returns any index where arr[index] == target, or -1.
     * Loop invariant: target ∈ arr[lo..hi] if it exists anywhere in arr[0..n-1].
     */
    public static int search(int[] arr, int target) {
        int lo = 0, hi = arr.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;   // overflow-safe: NOT (lo+hi)/2
            if (arr[mid] == target) return mid;
            else if (arr[mid] < target) lo = mid + 1;
            else                        hi = mid - 1;
        }
        return -1;
    }

    /**
     * First occurrence: returns leftmost index where arr[index] == target, or -1.
     * When arr[mid] == target, we don't stop — we narrow right (hi = mid) to keep looking left.
     * Uses half-open range [lo, hi).
     */
    public static int firstOccurrence(int[] arr, int target) {
        int lo = 0, hi = arr.length;  // half-open: [lo, hi)
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (arr[mid] < target) lo = mid + 1;
            else                   hi = mid;        // arr[mid] >= target → candidate or too big
        }
        // lo == hi → insertion point. Check if it's actually target.
        return (lo < arr.length && arr[lo] == target) ? lo : -1;
    }

    /**
     * Last occurrence: returns rightmost index where arr[index] == target, or -1.
     */
    public static int lastOccurrence(int[] arr, int target) {
        int lo = 0, hi = arr.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (arr[mid] <= target) lo = mid + 1;   // arr[mid] <= target → go right
            else                    hi = mid;
        }
        // lo - 1 is the last index ≤ target
        int idx = lo - 1;
        return (idx >= 0 && arr[idx] == target) ? idx : -1;
    }

    /**
     * Lower bound: first index where arr[index] >= target (like C++ lower_bound).
     * Returns arr.length if all elements < target.
     */
    public static int lowerBound(int[] arr, int target) {
        int lo = 0, hi = arr.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (arr[mid] < target) lo = mid + 1;
            else                   hi = mid;
        }
        return lo;
    }

    /**
     * Upper bound: first index where arr[index] > target (like C++ upper_bound).
     * Returns arr.length if all elements <= target.
     */
    public static int upperBound(int[] arr, int target) {
        int lo = 0, hi = arr.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (arr[mid] <= target) lo = mid + 1;
            else                    hi = mid;
        }
        return lo;
    }

    // -------------------------------------------------------------------------
    // Tests
    // -------------------------------------------------------------------------
    public static void main(String[] args) {
        int[] arr = {1, 2, 2, 3, 3, 3, 4, 5};

        // Standard search
        assert search(arr, 3) >= 3 && search(arr, 3) <= 5 : "search 3 in range [3,5]";
        assert search(arr, 6) == -1                        : "search 6 not found";
        System.out.println("PASS: search");

        // First / last occurrence
        assert firstOccurrence(arr, 3)  == 3 : "first 3 at index 3";
        assert firstOccurrence(arr, 2)  == 1 : "first 2 at index 1";
        assert firstOccurrence(arr, 6)  == -1: "first 6 not found";
        assert lastOccurrence(arr, 3)   == 5 : "last 3 at index 5";
        assert lastOccurrence(arr, 2)   == 2 : "last 2 at index 2";
        assert lastOccurrence(arr, 6)   == -1: "last 6 not found";
        System.out.println("PASS: first/last occurrence");

        // Lower / upper bound
        assert lowerBound(arr, 3) == 3 : "lower_bound(3) = 3";
        assert upperBound(arr, 3) == 6 : "upper_bound(3) = 6";
        // Count of 3s: upperBound - lowerBound = 6 - 3 = 3 ✓
        assert upperBound(arr, 3) - lowerBound(arr, 3) == 3 : "count of 3s = 3";
        assert lowerBound(arr, 0) == 0                      : "lower_bound(0) = 0 (before all)";
        assert lowerBound(arr, 9) == arr.length             : "lower_bound(9) = n (after all)";
        System.out.println("PASS: lower/upper bound");

        // Single-element edge cases
        int[] single = {7};
        assert search(single, 7) == 0  : "single found";
        assert search(single, 8) == -1 : "single not found";
        System.out.println("PASS: single element");

        System.out.println("All BinarySearch tests PASSED ✓");
    }
}
