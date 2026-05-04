import java.util.Arrays;

public class TwoSum {

    // Assume that nums is called from main method


    /**
     * 
     *  Question 
     *      🔹 1. Two Sum in Sorted Array (Pair Sum)

            Problem:
            Given a sorted array of integers nums and a target, determine whether there exists a pair of numbers that sum to the given target. Return true or false.

            Examples:

            Input:
            nums = [1, 3, 4, 6, 8, 10, 13]
            target = 13

            Output:
            true  # (3 + 10 = 13)

            Input:
            nums = [1, 3, 4, 6, 8, 10, 13]
            target = 6

            Output:
            false


            Tip: Two pointers from ends to check sum
                * 
     * 
     * 
     */


    public static boolean pairFinding(int nums[],int target){

        if (nums == null || nums.length<2) {
            return false;
        }

        int i=0;
        int j=nums.length-1;
        
        while(i<j){
            int sum=nums[i]+nums[j];
            
            if(sum==target){
                return true;
            }else if(sum>target){
                j--;
            }
            else{
                i++;
            }
        }
        return false;
    }

    // Another variant 

    public static int[] pairFindingSecondVersion(int nums[],int target){

        if(nums==null || nums.length<2) return null;

        Arrays.sort(nums);

        int i=0,j=nums.length-1;
        while (i<j) {
            int sum=nums[i]+nums[j];

            if (sum==target) return new int[]{nums[i],nums[j]};
            else if (sum>target) j--;
            else i++;
        }
        return  null;
    }
}
