import java.util.*;

/**
 * Q6: Closest Enemy with Wrap-Around (Coderbyte Challenge)
 * 
 * Problem: Find shortest distance from '1' to nearest '2' in a matrix.
 * Can wrap around edges (toroidal grid).
 * 
 * Example:
 * 0 0 0 0
 * 1 0 0 0 Answer: 2 (wrap left + move down)
 * 0 0 0 2
 * 0 0 0 2
 * 
 * Algorithm: BFS with wrap-around using modulo
 * Time: O(rows * cols)
 * Space: O(rows * cols)
 */
public class Q6_ClosestEnemy_Matrix {

    public static int findClosestEnemy(String[] strArr) {
        int rows = strArr.length;
        int cols = strArr[0].length();

        // Step 1: Find position of 1 (our starting position)
        int startRow = -1, startCol = -1;
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                if (strArr[i].charAt(j) == '1') {
                    startRow = i;
                    startCol = j;
                    break;
                }
            }
            if (startRow != -1)
                break;
        }

        // Step 2: BFS with wrap-around
        boolean[][] visited = new boolean[rows][cols];
        Queue<int[]> queue = new LinkedList<>();
        queue.offer(new int[] { startRow, startCol, 0 }); // {row, col, distance}
        visited[startRow][startCol] = true;

        // 4 directions: up, down, left, right
        int[][] directions = { { -1, 0 }, { 1, 0 }, { 0, -1 }, { 0, 1 } };

        while (!queue.isEmpty()) {
            int[] curr = queue.poll();
            int r = curr[0], c = curr[1], dist = curr[2];

            // Check if we found an enemy
            if (strArr[r].charAt(c) == '2') {
                return dist;
            }

            // Explore neighbors with WRAP-AROUND
            for (int[] dir : directions) {
                // KEY FORMULA: (pos + delta + size) % size
                // This handles both positive and negative deltas!
                int newR = (r + dir[0] + rows) % rows; // Wrap vertically
                int newC = (c + dir[1] + cols) % cols; // Wrap horizontally

                if (!visited[newR][newC]) {
                    visited[newR][newC] = true;
                    queue.offer(new int[] { newR, newC, dist + 1 });
                }
            }
        }

        return 0; // No enemy found
    }

    /**
     * With ChallengeToken removal (Coderbyte specific)
     */
    public static String ArrayChallenge(String[] strArr) {
        int result = findClosestEnemy(strArr);
        String resultStr = String.valueOf(result);
        return removeTokenChars(resultStr, "jdm93tyira1");
    }

    private static String removeTokenChars(String result, String token) {
        Set<Character> tokenChars = new HashSet<>();
        for (char c : token.toLowerCase().toCharArray()) {
            tokenChars.add(c);
        }

        StringBuilder sb = new StringBuilder();
        for (char c : result.toCharArray()) {
            if (!tokenChars.contains(Character.toLowerCase(c))) {
                sb.append(c);
            }
        }

        return sb.length() == 0 ? "EMPTY" : sb.toString();
    }

    public static void main(String[] args) {
        // Test Case 1: Simple case
        String[] test1 = { "000", "100", "200" };
        System.out.println("Test 1: " + findClosestEnemy(test1)); // Expected: 1

        // Test Case 2: Wrap-around needed
        String[] test2 = { "0000", "1000", "0002", "0002" };
        System.out.println("Test 2: " + findClosestEnemy(test2)); // Expected: 2

        // Test Case 3: No enemy
        String[] test3 = { "000", "010", "000" };
        System.out.println("Test 3: " + findClosestEnemy(test3)); // Expected: 0

        // Test Case 4: Enemy in same position (should not happen per problem)
        String[] test4 = { "0200", "0100", "0000" };
        System.out.println("Test 4: " + findClosestEnemy(test4)); // Expected: 1

        // Test Case 5: Larger grid with wrap
        String[] test5 = { "00000", "00001", "00000", "00000", "20000" };
        System.out.println("Test 5: " + findClosestEnemy(test5)); // Expected: 2 (wrap right + down)

        System.out.println("\n--- With ChallengeToken ---");
        System.out.println("ArrayChallenge test1: " + ArrayChallenge(test1)); // "EMPTY" (1 removed)
        System.out.println("ArrayChallenge test2: " + ArrayChallenge(test2)); // "EMPTY" (2 removed)
    }
}

/*
 * KEY PATTERNS TO REMEMBER:
 * 
 * 1. WRAP-AROUND FORMULA: (pos + delta + size) % size
 * - Works for both positive and negative deltas
 * - Adding 'size' before modulo handles negative case
 * 
 * 2. BFS FOR SHORTEST PATH:
 * - BFS guarantees shortest path in unweighted graphs
 * - Store distance in the queue with coordinates
 * 
 * 3. GRID AS GRAPH:
 * - Each cell is a node
 * - Edges connect adjacent cells (4-directional or 8-directional)
 * 
 * 4. DIRECTION ARRAY PATTERN:
 * int[][] dirs = {{-1,0}, {1,0}, {0,-1}, {0,1}}; // up, down, left, right
 * int[][] dirs8 = {{-1,-1}, {-1,0}, {-1,1}, {0,-1}, {0,1}, {1,-1}, {1,0},
 * {1,1}};
 */
