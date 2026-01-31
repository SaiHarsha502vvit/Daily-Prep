import java.util.*;

/**
 * Q1: Prime Position - CORRECTED SOLUTION
 * 
 * YOUR MISTAKES FIXED:
 * 1. isPrime loop: Changed i<num/2 to i*i<=num (correct boundary)
 * 2. Counter timing: Increment BEFORE using count
 * 3. Added input validation: n <= 0 check
 * 4. Optimized approach: Check if prime first, then count
 * 
 * TEST CASES:
 * Input: 7 → Output: Prime, Position = 4.
 * Input: 19 → Output: Prime, Position = 8.
 * Input: 10 → Output: Not a Prime
 * Input: 0 → Output: Invalid Input
 * Input: -5 → Output: Invalid Input
 */

public class Q1_PrimePosition_Corrected {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int gpn = sc.nextInt();

        // CONSTRAINT: Must be greater than zero
        if (gpn <= 0) {
            System.out.println("Invalid Input");
            return;
        }

        // Check if gpn itself is prime
        if (!isPrime(gpn)) {
            System.out.println("Not a Prime");
            return;
        }

        // Count position: how many primes exist from 2 to gpn
        int position = 0;
        for (int i = 2; i <= gpn; i++) {
            if (isPrime(i)) { 
                position++; // INCREMENT FIRST
            }
        }

        System.out.println("Prime, Position = " + position + ".");
    }

    /**
     * Optimized isPrime check - O(√N) complexity
     * FIXED: Uses i*i <= num instead of i < num/2
     */
    public static boolean isPrime(int num) {
        if (num <= 1)
            return false;
        if (num == 2)
            return true;
        if (num % 2 == 0)
            return false;

        // CRITICAL FIX: Check up to sqrt(num), inclusive
        for (int i = 3; i * i <= num; i += 2) {
            if (num % i == 0) {
                return false;
            }
        }
        return true;
    }
}
