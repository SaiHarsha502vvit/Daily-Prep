import java.util.*;

/**
 * Q7: Vowel Square - Find 2x2 Square of Vowels (Coderbyte Challenge)
 * 
 * Problem: Find top-left position of first 2x2 square containing only vowels.
 * Return "row-col" format or "not found".
 * 
 * Example:
 * a b c d
 * e i k r Answer: "1-0" (the 2x2 square: ei/ou at row 1, col 0)
 * o u f j
 * 
 * Algorithm: Brute force - check each possible 2x2 starting position
 * Time: O(rows * cols)
 * Space: O(1)
 */
public class Q7_VowelSquare_Pattern {

    // Set of vowels for O(1) lookup
    private static final Set<Character> VOWELS = new HashSet<>(
            Arrays.asList('a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U'));

    public static String findVowelSquare(String[] strArr) {
        int rows = strArr.length;
        int cols = strArr[0].length();

        // Iterate through all possible 2x2 starting positions
        // Stop at rows-1 and cols-1 to have room for 2x2 square
        for (int i = 0; i < rows - 1; i++) {
            for (int j = 0; j < cols - 1; j++) {
                // Check all 4 cells of the 2x2 square
                if (isVowel(strArr[i].charAt(j)) && // Top-left
                        isVowel(strArr[i].charAt(j + 1)) && // Top-right
                        isVowel(strArr[i + 1].charAt(j)) && // Bottom-left
                        isVowel(strArr[i + 1].charAt(j + 1))) { // Bottom-right
                    return i + "-" + j;
                }
            }
        }

        return "not found";
    }

    private static boolean isVowel(char c) {
        return VOWELS.contains(c);
        // Alternative: return "aeiouAEIOU".indexOf(c) != -1;
    }

    /**
     * Generalized version: Find NxN square matching a condition
     */
    public static String findSquare(String[] strArr, int size,
            java.util.function.Predicate<Character> condition) {
        int rows = strArr.length;
        int cols = strArr[0].length();

        for (int i = 0; i <= rows - size; i++) {
            for (int j = 0; j <= cols - size; j++) {
                if (checkSquare(strArr, i, j, size, condition)) {
                    return i + "-" + j;
                }
            }
        }
        return "not found";
    }

    private static boolean checkSquare(String[] strArr, int startR, int startC,
            int size, java.util.function.Predicate<Character> condition) {
        for (int i = startR; i < startR + size; i++) {
            for (int j = startC; j < startC + size; j++) {
                if (!condition.test(strArr[i].charAt(j))) {
                    return false;
                }
            }
        }
        return true;
    }

    public static void main(String[] args) {
        // Test Case 1: Basic vowel square exists
        String[] test1 = { "abcd", "eikr", "oufj" };
        System.out.println("Test 1: " + findVowelSquare(test1)); // Expected: "1-0"

        // Test Case 2: Different position
        String[] test2 = { "aqrst", "ukaei", "ffooo" };
        System.out.println("Test 2: " + findVowelSquare(test2)); // Expected: "1-2"

        // Test Case 3: No vowel square
        String[] test3 = { "gg", "ff" };
        System.out.println("Test 3: " + findVowelSquare(test3)); // Expected: "not found"

        // Test Case 4: Multiple squares - should return top-left most
        String[] test4 = { "aei", "oua", "eio" };
        System.out.println("Test 4: " + findVowelSquare(test4)); // Expected: "0-0"

        // Test Case 5: Single row/column edge case
        String[] test5 = { "aeiou" };
        System.out.println("Test 5: " + findVowelSquare(test5)); // Expected: "not found" (no 2x2 possible)

        // Test Case 6: All vowels
        String[] test6 = { "aei", "oua", "eio" };
        System.out.println("Test 6: " + findVowelSquare(test6)); // Expected: "0-0"

        System.out.println("\n--- Generalized Square Finder ---");

        // Find 3x3 digit square
        String[] digitTest = { "abc123def", "ghi456jkl", "mno789pqr", "stuvwxyza" };
        String result = findSquare(digitTest, 3, Character::isDigit);
        System.out.println("3x3 digit square: " + result); // Expected: "0-3"

        // Find 2x2 uppercase square
        String[] upperTest = { "abAB", "cdCD", "efEF" };
        result = findSquare(upperTest, 2, Character::isUpperCase);
        System.out.println("2x2 uppercase square: " + result); // Expected: "0-2"
    }
}

/*
 * KEY PATTERNS TO REMEMBER:
 * 
 * 1. SUBMATRIX SEARCH:
 * - For finding NxN submatrix, iterate i from 0 to rows-N
 * - Iterate j from 0 to cols-N
 * - This ensures we have room for the full NxN square
 * 
 * 2. SET FOR O(1) CHARACTER LOOKUP:
 * Set<Character> chars = new HashSet<>(Arrays.asList('a', 'e', 'i', 'o', 'u'));
 * O(1) lookup vs O(n) for string indexOf
 * 
 * 3. ITERATION ORDER MATTERS:
 * - Iterating top-to-bottom, left-to-right ensures "most top-left" is found
 * first
 * - If we need bottom-right most, iterate in reverse
 * 
 * 4. GENERALIZE WITH PREDICATE:
 * - Use Predicate<Character> to make the solution reusable
 * - Can find any NxN pattern with any character condition
 * 
 * 5. EDGE CASES:
 * - Matrix smaller than NxN: return "not found"
 * - Empty matrix: handle separately
 * - Mixed case characters: include both in vowel set
 */
