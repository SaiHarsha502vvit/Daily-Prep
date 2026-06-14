/**
 * MergeSort.java — stable O(n log n) sort with loop invariant documentation.
 *
 * Compile: javac MergeSort.java
 * Run:     java MergeSort
 *
 * Proof Corner reference: 02c_Divide_And_Conquer.md (Proof Corner § Merge Sort)
 */
public class MergeSort {

    /**
     * Public entry point. Sorts arr in place (ascending).
     * Invariant: after sort(), arr[0] ≤ arr[1] ≤ … ≤ arr[n-1].
     */
    public static void sort(int[] arr) {
        if (arr == null || arr.length < 2) return;
        int[] tmp = new int[arr.length];
        mergeSort(arr, tmp, 0, arr.length - 1);
    }

    // Recurrence: T(n) = 2T(n/2) + O(n) → Θ(n log n) by Master Theorem Case 2
    private static void mergeSort(int[] arr, int[] tmp, int lo, int hi) {
        if (lo >= hi) return;                   // base case: single element is sorted
        int mid = lo + (hi - lo) / 2;           // avoids overflow (key lesson!)
        mergeSort(arr, tmp, lo, mid);            // sort left half
        mergeSort(arr, tmp, mid + 1, hi);        // sort right half
        merge(arr, tmp, lo, mid, hi);            // merge two sorted halves
    }

    /**
     * Merge arr[lo..mid] and arr[mid+1..hi] — both already sorted — into
     * arr[lo..hi] in sorted order.
     *
     * Loop invariant: at the start of each iteration, tmp[lo..k-1] contains
     * the k-lo smallest elements from the two halves, in sorted order.
     */
    private static void merge(int[] arr, int[] tmp, int lo, int mid, int hi) {
        // Copy both halves to tmp (O(n) extra space)
        System.arraycopy(arr, lo, tmp, lo, hi - lo + 1);

        int i = lo;       // pointer into left half  [lo..mid]
        int j = mid + 1;  // pointer into right half [mid+1..hi]
        int k = lo;       // write pointer into arr

        while (i <= mid && j <= hi) {
            // Take the smaller; on tie take left (preserves stability)
            if (tmp[i] <= tmp[j]) arr[k++] = tmp[i++];
            else                  arr[k++] = tmp[j++];
        }
        // Drain remaining elements (at most one side has leftovers)
        while (i <= mid) arr[k++] = tmp[i++];
        while (j <= hi)  arr[k++] = tmp[j++];
        // Postcondition: arr[lo..hi] is sorted ✓
    }

    // -------------------------------------------------------------------------
    // Tests — run with: java MergeSort
    // -------------------------------------------------------------------------
    public static void main(String[] args) {
        test("empty", new int[]{}, new int[]{});
        test("single", new int[]{42}, new int[]{42});
        test("two reversed", new int[]{2, 1}, new int[]{1, 2});
        test("sorted", new int[]{1, 2, 3, 4, 5}, new int[]{1, 2, 3, 4, 5});
        test("reverse sorted", new int[]{5, 4, 3, 2, 1}, new int[]{1, 2, 3, 4, 5});
        test("duplicates", new int[]{3, 1, 4, 1, 5, 9, 2, 6}, new int[]{1, 1, 2, 3, 4, 5, 6, 9});
        test("all same", new int[]{7, 7, 7}, new int[]{7, 7, 7});
        test("negative values", new int[]{-3, 1, -1, 0}, new int[]{-3, -1, 0, 1});

        // Large random test: O(n log n) should handle 100_000 elements fast
        int n = 100_000;
        int[] large = new int[n];
        for (int i = 0; i < n; i++) large[i] = (int)(Math.random() * 1_000_000);
        long start = System.currentTimeMillis();
        sort(large);
        long ms = System.currentTimeMillis() - start;
        assertSorted(large);
        System.out.printf("large n=%d: sorted in %dms%n", n, ms);

        System.out.println("All MergeSort tests PASSED ✓");
    }

    private static void test(String name, int[] input, int[] expected) {
        sort(input);
        for (int i = 0; i < expected.length; i++) {
            assert input[i] == expected[i]
                : name + ": at index " + i + " expected " + expected[i] + " got " + input[i];
        }
        System.out.println("PASS: " + name);
    }

    private static void assertSorted(int[] arr) {
        for (int i = 1; i < arr.length; i++)
            assert arr[i - 1] <= arr[i] : "Not sorted at index " + i;
    }
}
