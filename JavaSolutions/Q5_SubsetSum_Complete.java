import java.util.*;

/**
 * Q5: Subset Sum - COMPLETE SOLUTION
 * 
 * PATTERN: Recursion + Backtracking
 * This is the most difficult question (Hard level)
 * 
 * APPROACH:
 * 1. Generate all possible subsets
 * 2. For each subset, check if sum equals key
 * 3. Print matching subsets
 * 
 * KEY CONCEPT: Backtracking
 * - Make a choice (include element)
 * - Recurse with that choice
 * - Undo the choice (backtrack)
 * - Try next choice
 * 
 * TIME COMPLEXITY: O(2^N) - exponential
 * 
 * TEST CASES:
 * Input: 8, [4, 5, 8, 2, 6, 1, 3, 9], 8
 * Output: 8
 * 2 6
 * 5 2 1
 * 5 3
 * 4 1 3
 */

public class Q5_SubsetSum_Complete {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();

        // CONSTRAINT: Array size must be positive
        if (n <= 0) {
            System.out.println("Invalid Input");
            return;
        }

        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        int key = sc.nextInt();

        // Find all subsets with sum = key
        ArrayList<ArrayList<Integer>> allSubsets = new ArrayList<>();
        ArrayList<Integer> current = new ArrayList<>();

        findSubsets(arr, key, 0, current, allSubsets);

        // Output
        if (allSubsets.isEmpty()) {
            System.out.println("No Possibilites Available.");
        } else {
            for (ArrayList<Integer> subset : allSubsets) {
                for (int num : subset) {
                    System.out.print(num + " ");
                }
                System.out.println();
            }
        }
    }

    /**
     * Recursive backtracking to find all subsets with given sum
     * 
     * @param arr     - input array
     * @param key     - target sum
     * @param index   - current position in array
     * @param current - current subset being built
     * @param result  - list of all valid subsets
     */
    public static void findSubsets(int[] arr, int key, int index,
            ArrayList<Integer> current,
            ArrayList<ArrayList<Integer>> result) {
        // Calculate current sum
        int sum = 0;
        for (int num : current) {
            sum += num;
        }

        // BASE CASE: If sum matches key, store this subset
        if (sum == key && !current.isEmpty()) {
            result.add(new ArrayList<>(current)); // CRITICAL: Deep copy!
        }

        // RECURSIVE CASE: Try including each remaining element
        for (int i = index; i < arr.length; i++) {
            // MAKE CHOICE: Include arr[i]
            current.add(arr[i]);

            // RECURSE: Explore with this choice
            findSubsets(arr, key, i + 1, current, result);

            // UNDO CHOICE: Backtrack
            current.remove(current.size() - 1);
        }
    }
}

/**
 * DETAILED EXPLANATION:
 * 
 * Example: arr=[4,5,8], key=8
 * 
 * Call Tree:
 * 
 * findSubsets([4,5,8], 8, 0, [])
 * ├── Include 4: current=[4]
 * │ ├── Include 5: current=[4,5], sum=9 ≠ 8
 * │ │ └── Include 8: current=[4,5,8], sum=17 ≠ 8
 * │ ├── Include 8: current=[4,8], sum=12 ≠ 8
 * │ └── Backtrack to [4]
 * ├── Include 5: current=[5]
 * │ └── Include 8: current=[5,8], sum=13 ≠ 8
 * └── Include 8: current=[8], sum=8 = 8 ✓ PRINT
 * 
 * Output: 8
 * 
 * 
 * WHY THIS IS HARD:
 * 1. Requires understanding of recursion (function calling itself)
 * 2. Requires backtracking (undo choices)
 * 3. Requires deep copy (new ArrayList<>(current))
 * 4. Time complexity is exponential O(2^N)
 * 
 * Don't worry if you don't master this in 2 days.
 * Focus on understanding the pattern structure.
 * 
 * 
 * SIMPLIFIED VERSION (For Practice):
 * 
 * Start with printing all subsets (no sum condition):
 * 
 * public static void printAllSubsets(int[] arr, int index, ArrayList<Integer>
 * current) {
 * System.out.println(current); // Print every subset
 * 
 * for (int i = index; i < arr.length; i++) {
 * current.add(arr[i]);
 * printAllSubsets(arr, i + 1, current);
 * current.remove(current.size() - 1);
 * }
 * }
 * 
 * Once you understand this, adding sum check is easy!
 */
