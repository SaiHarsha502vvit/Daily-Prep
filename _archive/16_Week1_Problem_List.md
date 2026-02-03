# 📋 Week 1: Arrays & Strings Problem List

## 🎯 Goal: Build Foundation + Pattern Recognition

**Total Problems**: 21 (3 per day)
**Difficulty**: 70% Easy, 30% Medium

---

## Day 1 (Monday) - Array Basics

### Problem 1: Two Sum ⭐ EASY

- **Platform**: LeetCode #1
- **Link**: https://leetcode.com/problems/two-sum/
- **Pattern**: HashMap
- **Time Limit**: 20 mins
- **Key Insight**: Use HashMap to store complement

```java
// Template to use:
Map<Integer, Integer> map = new HashMap<>();
for (int i = 0; i < nums.length; i++) {
    int complement = target - nums[i];
    if (map.containsKey(complement)) {
        return new int[]{map.get(complement), i};
    }
    map.put(nums[i], i);
}
```

### Problem 2: Contains Duplicate ⭐ EASY

- **Platform**: LeetCode #217
- **Link**: https://leetcode.com/problems/contains-duplicate/
- **Pattern**: HashSet
- **Time Limit**: 15 mins

### Problem 3: Maximum Subarray ⭐⭐ MEDIUM

- **Platform**: LeetCode #53
- **Link**: https://leetcode.com/problems/maximum-subarray/
- **Pattern**: Kadane's Algorithm
- **Time Limit**: 25 mins
- **Key Insight**: Track currentMax and globalMax

---

## Day 2 (Tuesday) - Array Manipulation

### Problem 4: Move Zeroes ⭐ EASY

- **Platform**: LeetCode #283
- **Link**: https://leetcode.com/problems/move-zeroes/
- **Pattern**: Two Pointers (same direction)
- **Time Limit**: 20 mins

### Problem 5: Remove Duplicates from Sorted Array ⭐ EASY

- **Platform**: LeetCode #26
- **Link**: https://leetcode.com/problems/remove-duplicates-from-sorted-array/
- **Pattern**: Two Pointers
- **Time Limit**: 20 mins

### Problem 6: Rotate Array ⭐⭐ MEDIUM

- **Platform**: LeetCode #189
- **Link**: https://leetcode.com/problems/rotate-array/
- **Pattern**: Reverse technique
- **Time Limit**: 25 mins
- **Key Insight**: Reverse all → Reverse first k → Reverse rest

---

## Day 3 (Wednesday) - String Basics

### Problem 7: Valid Anagram ⭐ EASY

- **Platform**: LeetCode #242
- **Link**: https://leetcode.com/problems/valid-anagram/
- **Pattern**: Frequency Array
- **Time Limit**: 15 mins

```java
// Template:
int[] freq = new int[26];
for (char c : s.toCharArray()) freq[c - 'a']++;
for (char c : t.toCharArray()) freq[c - 'a']--;
// Check all zeros
```

### Problem 8: Reverse String ⭐ EASY

- **Platform**: LeetCode #344
- **Link**: https://leetcode.com/problems/reverse-string/
- **Pattern**: Two Pointers (opposite)
- **Time Limit**: 10 mins

### Problem 9: First Unique Character ⭐ EASY

- **Platform**: LeetCode #387
- **Link**: https://leetcode.com/problems/first-unique-character-in-a-string/
- **Pattern**: Frequency Count
- **Time Limit**: 15 mins

---

## Day 4 (Thursday) - String Manipulation

### Problem 10: Valid Palindrome ⭐ EASY

- **Platform**: LeetCode #125
- **Link**: https://leetcode.com/problems/valid-palindrome/
- **Pattern**: Two Pointers
- **Time Limit**: 20 mins

### Problem 11: Longest Common Prefix ⭐ EASY

- **Platform**: LeetCode #14
- **Link**: https://leetcode.com/problems/longest-common-prefix/
- **Pattern**: Vertical/Horizontal Scan
- **Time Limit**: 20 mins

### Problem 12: Implement strStr() ⭐⭐ MEDIUM

- **Platform**: LeetCode #28
- **Link**: https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/
- **Pattern**: String matching
- **Time Limit**: 25 mins

---

## Day 5 (Friday) - Mixed Practice

### Problem 13: Best Time to Buy and Sell Stock ⭐ EASY

- **Platform**: LeetCode #121
- **Link**: https://leetcode.com/problems/best-time-to-buy-and-sell-stock/
- **Pattern**: Track minimum so far
- **Time Limit**: 20 mins

### Problem 14: Plus One ⭐ EASY

- **Platform**: LeetCode #66
- **Link**: https://leetcode.com/problems/plus-one/
- **Pattern**: Array manipulation
- **Time Limit**: 15 mins

### Problem 15: Merge Sorted Array ⭐ EASY

- **Platform**: LeetCode #88
- **Link**: https://leetcode.com/problems/merge-sorted-array/
- **Pattern**: Two Pointers (from end)
- **Time Limit**: 20 mins

### Problem 16: Product of Array Except Self ⭐⭐ MEDIUM

- **Platform**: LeetCode #238
- **Link**: https://leetcode.com/problems/product-of-array-except-self/
- **Pattern**: Prefix/Suffix
- **Time Limit**: 30 mins

---

## Day 6 (Saturday) - Mock Test Day

### 🕐 Timed Test (90 minutes total)

**Rules:**

- No looking at solutions
- No internet search
- Write on paper first, then code
- Move on if stuck > 25 mins

### Problem 17: Single Number ⭐ EASY (15 mins)

- **Platform**: LeetCode #136
- **Pattern**: XOR

### Problem 18: Intersection of Two Arrays II ⭐ EASY (20 mins)

- **Platform**: LeetCode #350
- **Pattern**: HashMap

### Problem 19: Group Anagrams ⭐⭐ MEDIUM (30 mins)

- **Platform**: LeetCode #49
- **Pattern**: HashMap + Sorting

### Problem 20: 3Sum ⭐⭐ MEDIUM (25 mins)

- **Platform**: LeetCode #15
- **Pattern**: Two Pointers + Sorting

---

## Day 7 (Sunday) - Review & Rest

### Morning (1 hour):

- [ ] Review all mistakes from Week 1
- [ ] Re-solve 2 problems you got wrong
- [ ] Update your notes with learnings

### Problem 21: Majority Element ⭐ EASY

- **Platform**: LeetCode #169
- **Pattern**: Boyer-Moore / HashMap
- **Time Limit**: 15 mins (relaxed practice)

### Rest of Day:

- Light activity
- No new problems
- Prepare Week 2 mindset

---

## 📊 Week 1 Tracking Table

| Day | P1  | P2  | P3  | Total | Notes  |
| --- | --- | --- | --- | ----- | ------ | ---- |
| Mon | ⬜  | ⬜  | ⬜  | /3    |        |
| Tue | ⬜  | ⬜  | ⬜  | /3    |        |
| Wed | ⬜  | ⬜  | ⬜  | /3    |        |
| Thu | ⬜  | ⬜  | ⬜  | /3    |        |
| Fri | ⬜  | ⬜  | ⬜  | ⬜    | /4     |      |
| Sat | ⬜  | ⬜  | ⬜  | ⬜    | /4     | Mock |
| Sun | ⬜  |     |     | /1    | Review |

**Legend**: ⬜ Not done | ✅ Solved | 🔄 Needed help | ❌ Couldn't solve

---

## 🔑 Key Templates for Week 1

### 1. Two Pointers (Opposite Direction)

```java
int left = 0, right = arr.length - 1;
while (left < right) {
    // Process
    if (condition) left++;
    else right--;
}
```

### 2. Two Pointers (Same Direction)

```java
int slow = 0;
for (int fast = 0; fast < arr.length; fast++) {
    if (condition) {
        arr[slow++] = arr[fast];
    }
}
```

### 3. Frequency Array (for lowercase letters)

```java
int[] freq = new int[26];
for (char c : s.toCharArray()) {
    freq[c - 'a']++;
}
```

### 4. HashMap for Counting

```java
Map<Integer, Integer> map = new HashMap<>();
for (int num : arr) {
    map.put(num, map.getOrDefault(num, 0) + 1);
}
```

### 5. Kadane's Algorithm

```java
int maxSoFar = arr[0], maxEndingHere = arr[0];
for (int i = 1; i < arr.length; i++) {
    maxEndingHere = Math.max(arr[i], maxEndingHere + arr[i]);
    maxSoFar = Math.max(maxSoFar, maxEndingHere);
}
```

---

## ⚠️ Common Mistakes to Avoid

1. **Off-by-one errors**: Always check `<` vs `<=`
2. **Empty array**: Check `if (arr == null || arr.length == 0)`
3. **Integer overflow**: Use `long` for large calculations
4. **Modifying while iterating**: Create copy if needed
5. **Not handling duplicates**: Read problem carefully

---

## 🎯 End of Week 1 Goals

By Sunday, you should be able to:

- [ ] Recognize Two Pointer problems instantly
- [ ] Write frequency array code without thinking
- [ ] Solve any Easy array problem in < 15 mins
- [ ] Attempt Medium problems without fear

**Next Week Preview**: Sliding Window (Your weakness area!)
