import java.util.*;

/**
 * Q4: Triangle Pattern - CORRECTED SOLUTION
 * 
 * YOUR MISTAKES FIXED:
 * 1. Added ZERO input check → print "ZERO"
 * 2. Added negative input check → print "Invalid Input"
 * 
 * These 2 simple checks would have fixed 33% of failures!
 * 
 * PATTERN: Nested loops for triangle
 * - Row i: (n-i) spaces + i characters
 * - Characters cycle through a-z, then asterisks
 * 
 * TEST CASES:
 * Input: 5 → Triangle with a-o
 * Input: 8 → Triangle with a-z, then asterisks
 * Input: 0 → ZERO
 * Input: -1 → Invalid Input
 */

public class Q4_Pattern_Corrected {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        // CONSTRAINT: Handle ZERO (YOUR MISSING CHECK #1)
        if (n == 0) {
            System.out.println("ZERO");
            return;
        }

        // CONSTRAINT: Handle negative (YOUR MISSING CHECK #2)
        if (n < 0) {
            System.out.println("Invalid Input");
            return;
        }

        // Pattern generation (YOUR CODE WAS CORRECT HERE)
        int charCode = 97; // 'a' = 97 in ASCII

        for (int i = 1; i <= n; i++) {
            // Print leading spaces
            for (int j = 1; j < (n - i + 1); j++) {
                System.out.print(" ");
            }

            // Print characters or asterisks
            for (int k = 1; k <= i; k++) {
                if (charCode > 122) { // 'z' = 122, after that use asterisk
                    System.out.print("* ");
                } else {
                    System.out.print((char) charCode + " ");
                    charCode++;
                }
            }

            System.out.println();
        }
    }
}

/**
 * ANALYSIS OF YOUR MISTAKE:
 * 
 * Your original code had perfect pattern logic!
 * You ONLY missed the constraint validation.
 * 
 * TC 2 (Failed): Input was 0
 * - Your output: (nothing)
 * - Expected: "ZERO"
 * 
 * TC 3 (Failed): Input was negative
 * - Your output: (nothing)
 * - Expected: "Invalid Input"
 * 
 * LESSON: ALWAYS READ AND VALIDATE CONSTRAINTS FIRST!
 * 
 * The problem statement explicitly said:
 * "if Input is equal to zero then, print 'ZERO'"
 * "if Input is less than zero then, print 'Invalid Input'"
 * 
 * These 4 lines of code would have given you 100% score:
 * 
 * if (n == 0) {
 * System.out.println("ZERO");
 * return;
 * }
 * if (n < 0) {
 * System.out.println("Invalid Input");
 * return;
 * }
 */
