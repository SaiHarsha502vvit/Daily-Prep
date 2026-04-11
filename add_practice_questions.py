#!/usr/bin/env python3
"""
Auto-generates 30+ topic-specific practice + interview questions
and appends them to every content .md file in the repo.
Skips: index files, daily logs, archive files.
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import os
import re

BASE = r"e:\Dev_World\04_Practice\Daily-Prep"

# ─────────────────────────────────────────────────────────────────────────────
# TOPIC → QUESTION BANK
# Each entry: (filename_pattern_keywords, questions_block_text)
# ─────────────────────────────────────────────────────────────────────────────

QUESTION_BANKS = {

    # ── DATA STRUCTURES ──────────────────────────────────────────────────────

    "Arrays": """
## 🏋️ Practice & Interview Questions — Arrays

> Attempt each before looking at the answer. Time yourself.

### Predict / Trace
**Q1.** What is the output? `int[] a = {1,2,3}; int[] b = a; b[0] = 99; System.out.println(a[0]);`
<details><summary>Answer</summary>

`99` — arrays are objects; `b = a` copies the **reference**, not the data. Both point to the same array.
</details>

**Q2.** What is the time complexity of inserting at index 0 of an array of size N?
<details><summary>Answer</summary>

O(N) — every element must shift right by one position.
</details>

**Q3.** Given sorted array `[1,3,5,7,9]`, binary search for 6 — trace the mid values.
<details><summary>Answer</summary>

lo=0,hi=4 → mid=2 (value=5) → lo=3,hi=4 → mid=3 (value=7) → lo=3,hi=2 → NOT FOUND
</details>

### LeetCode / Coding
**Q4.** ⭐ Two Sum — find indices of two numbers that add to target. O(N) solution.
<details><summary>Solution</summary>

```java
Map<Integer,Integer> map = new HashMap<>();
for(int i=0;i<nums.length;i++){
    int comp = target - nums[i];
    if(map.containsKey(comp)) return new int[]{map.get(comp), i};
    map.put(nums[i], i);
}
```
</details>

**Q5.** ⭐ Maximum Subarray (Kadane's Algorithm). Write the O(N) solution.
<details><summary>Solution</summary>

```java
int maxSum = nums[0], curr = nums[0];
for(int i=1;i<nums.length;i++){
    curr = Math.max(nums[i], curr + nums[i]);
    maxSum = Math.max(maxSum, curr);
}
return maxSum;
```
</details>

**Q6.** ⭐ Best Time to Buy and Sell Stock — single pass O(N).
<details><summary>Solution</summary>

```java
int minPrice = Integer.MAX_VALUE, maxProfit = 0;
for(int p : prices){
    minPrice = Math.min(minPrice, p);
    maxProfit = Math.max(maxProfit, p - minPrice);
}
return maxProfit;
```
</details>

**Q7.** ⭐ Product of Array Except Self — without division, O(N).
<details><summary>Solution</summary>

```java
int[] res = new int[n];
res[0] = 1;
for(int i=1;i<n;i++) res[i] = res[i-1] * nums[i-1];
int right = 1;
for(int i=n-1;i>=0;i--){ res[i] *= right; right *= nums[i]; }
return res;
```
</details>

**Q8.** ⭐⭐ Container With Most Water (Two Pointers).
<details><summary>Solution</summary>

```java
int l=0, r=nums.length-1, max=0;
while(l<r){
    max = Math.max(max, Math.min(height[l],height[r])*(r-l));
    if(height[l]<height[r]) l++; else r--;
}
```
</details>

**Q9.** ⭐⭐ 3Sum — find all unique triplets summing to 0. O(N²).
<details><summary>Solution</summary>

```java
Arrays.sort(nums);
for(int i=0;i<n-2;i++){
    if(i>0 && nums[i]==nums[i-1]) continue;
    int l=i+1, r=n-1;
    while(l<r){
        int s=nums[i]+nums[l]+nums[r];
        if(s==0){ result.add(List.of(nums[i],nums[l++],nums[r--])); 
            while(l<r&&nums[l]==nums[l-1])l++; while(l<r&&nums[r]==nums[r+1])r--; }
        else if(s<0) l++; else r--;
    }
}
```
</details>

**Q10.** ⭐⭐ Rotate Array by k positions in-place O(1) space.
<details><summary>Solution</summary>

```java
// Reverse full array, then reverse first k, then reverse rest
k %= n;
reverse(nums, 0, n-1);
reverse(nums, 0, k-1);
reverse(nums, k, n-1);
```
</details>

**Q11.** ⭐⭐ Find the duplicate number in array [1..n] — O(N) time, O(1) space (Floyd's cycle).
<details><summary>Solution</summary>

```java
int slow=nums[0], fast=nums[0];
do{ slow=nums[slow]; fast=nums[nums[fast]]; } while(slow!=fast);
slow=nums[0];
while(slow!=fast){ slow=nums[slow]; fast=nums[fast]; }
return slow;
```
</details>

**Q12.** ⭐⭐⭐ Trapping Rain Water — O(N) two-pointer solution.
<details><summary>Solution</summary>

```java
int l=0,r=n-1,lMax=0,rMax=0,water=0;
while(l<r){
    if(height[l]<=height[r]){
        if(height[l]>=lMax) lMax=height[l]; else water+=lMax-height[l];
        l++;
    } else {
        if(height[r]>=rMax) rMax=height[r]; else water+=rMax-height[r];
        r--;
    }
}
```
</details>

### Interview Questions
**Q13.** What's the difference between `ArrayList` and `LinkedList` for index access?
<details><summary>Answer</summary>

ArrayList: O(1) random access (array backing). LinkedList: O(N) — must traverse from head. Use ArrayList for most cases; LinkedList only when frequent insertions/deletions at head/tail.
</details>

**Q14.** When would you use `int[]` over `ArrayList<Integer>`?
<details><summary>Answer</summary>

`int[]`: primitive, no boxing overhead, fixed-size, cache-friendly. `ArrayList<Integer>`: dynamic resizing, collection API, but 4-16x memory overhead per element due to Integer boxing.
</details>

**Q15.** What is cache locality and why do arrays benefit from it?
<details><summary>Answer</summary>

CPU loads data in cache lines (~64 bytes). Arrays store elements contiguously → sequential access loads entire cache line at once → very fast. LinkedList nodes are scattered in heap → each node access = potential cache miss.
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | Array access a[i] time complexity | O(1) |
| 2 | Array insertion at middle time complexity | O(N) |
| 3 | Default value of int[] in Java | 0 |
| 4 | Arrays.sort() algorithm for primitives | Dual-pivot QuickSort |
| 5 | Arrays.sort() algorithm for objects | TimSort (stable) |
| 6 | Arrays.copyOfRange(a,2,5) — how many elements? | 3 (indices 2,3,4) |
| 7 | Can arrays store null? | Yes (reference arrays only) |
| 8 | Arrays.fill(a, 7) — what does it do? | Sets every element to 7 |
| 9 | Multi-dim array a[3][4] — total elements? | 12 |
| 10 | Arrays.binarySearch requires? | Sorted array |
""",

    "LinkedList": """
## 🏋️ Practice & Interview Questions — Linked Lists

### Predict / Trace
**Q1.** Trace: reverse a linked list `1→2→3→null` manually. Show prev/curr at each step.
<details><summary>Answer</summary>

Step 1: prev=null, curr=1 → 1.next=null, prev=1, curr=2
Step 2: prev=1, curr=2 → 2.next=1, prev=2, curr=3
Step 3: prev=2, curr=3 → 3.next=2, prev=3, curr=null
Result: 3→2→1→null
</details>

**Q2.** Floyd's cycle detection — if fast and slow both start at head, and list has no cycle, when does fast reach null?
<details><summary>Answer</summary>

Fast moves 2 steps per iteration. For odd length N: fast reaches null at step (N+1)/2. For even N: fast reaches null at step N/2.
</details>

### LeetCode / Coding
**Q3.** ⭐ Reverse a Linked List (iterative + recursive).
<details><summary>Solution</summary>

```java
// Iterative
ListNode prev=null, curr=head;
while(curr!=null){ ListNode next=curr.next; curr.next=prev; prev=curr; curr=next; }
return prev;

// Recursive
ListNode reverseList(ListNode head){
    if(head==null||head.next==null) return head;
    ListNode rest = reverseList(head.next);
    head.next.next = head; head.next = null;
    return rest;
}
```
</details>

**Q4.** ⭐ Detect cycle in LinkedList (Floyd's Algorithm).
<details><summary>Solution</summary>

```java
ListNode slow=head, fast=head;
while(fast!=null && fast.next!=null){
    slow=slow.next; fast=fast.next.next;
    if(slow==fast) return true;
}
return false;
```
</details>

**Q5.** ⭐ Find middle of LinkedList.
<details><summary>Solution</summary>

```java
ListNode slow=head, fast=head;
while(fast!=null && fast.next!=null){ slow=slow.next; fast=fast.next.next; }
return slow; // slow is at middle
```
</details>

**Q6.** ⭐ Merge two sorted linked lists.
<details><summary>Solution</summary>

```java
ListNode dummy=new ListNode(0), curr=dummy;
while(l1!=null && l2!=null){
    if(l1.val<=l2.val){ curr.next=l1; l1=l1.next; }
    else { curr.next=l2; l2=l2.next; }
    curr=curr.next;
}
curr.next = (l1!=null)?l1:l2;
return dummy.next;
```
</details>

**Q7.** ⭐⭐ Remove Nth node from end of list.
<details><summary>Solution</summary>

```java
ListNode dummy=new ListNode(0); dummy.next=head;
ListNode fast=dummy, slow=dummy;
for(int i=0;i<=n;i++) fast=fast.next;
while(fast!=null){ fast=fast.next; slow=slow.next; }
slow.next=slow.next.next;
return dummy.next;
```
</details>

**Q8.** ⭐⭐ Find the start of a cycle (Floyd's phase 2).
<details><summary>Solution</summary>

```java
// After meeting point found, reset slow to head
slow=head;
while(slow!=fast){ slow=slow.next; fast=fast.next; }
return slow; // start of cycle
```
</details>

**Q9.** ⭐⭐ LRU Cache — implement with O(1) get and put.
<details><summary>Solution</summary>

```java
// HashMap<key, Node> + Doubly Linked List
// Most recently used at tail, least recently used at head
// put: add to tail, if capacity exceeded remove head
// get: move accessed node to tail
class LRUCache {
    Map<Integer,Node> map = new HashMap<>();
    Node head, tail;
    int cap;
    // ... (standard doubly-linked list implementation)
}
```
</details>

**Q10.** ⭐⭐ Palindrome LinkedList — O(N) time, O(1) space.
<details><summary>Solution</summary>

```java
// 1. Find middle (slow/fast)
// 2. Reverse second half
// 3. Compare first and reversed second half
// 4. Restore list (optional)
```
</details>

**Q11.** ⭐⭐⭐ Merge K sorted lists — O(N log K) with PriorityQueue.
<details><summary>Solution</summary>

```java
PriorityQueue<ListNode> pq = new PriorityQueue<>((a,b)->a.val-b.val);
for(ListNode l:lists) if(l!=null) pq.offer(l);
ListNode dummy=new ListNode(0), curr=dummy;
while(!pq.isEmpty()){
    ListNode node=pq.poll(); curr.next=node; curr=curr.next;
    if(node.next!=null) pq.offer(node.next);
}
return dummy.next;
```
</details>

### Interview Questions
**Q12.** Why is deleting from the middle of a LinkedList O(1) if you have the node reference, but finding it is O(N)?
<details><summary>Answer</summary>

LinkedList nodes store next/prev pointers. Given a node reference: `prev.next = node.next` is O(1). But traversal from head to find the node is O(N) since there's no index-based access.
</details>

**Q13.** `ArrayList` vs `LinkedList` — when is LinkedList NEVER the right choice?
<details><summary>Answer</summary>

For random access (get by index), sorting, or bulk iteration — ArrayList wins due to cache locality. LinkedList's O(N) random access kills performance. In practice, ArrayList + ArrayDeque cover almost all use cases.
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | Singly linked list deletion from tail | O(N) — must find second-to-last |
| 2 | Doubly linked list deletion from tail | O(1) — use tail.prev |
| 3 | Java LinkedList implements | List + Deque |
| 4 | addFirst() vs addLast() time complexity | O(1) both |
| 5 | Floyd's algorithm space complexity | O(1) |
| 6 | Reversing a linked list space complexity | O(1) iterative, O(N) recursive |
| 7 | Sentinel/dummy node purpose | Simplifies edge cases (empty list, single node) |
| 8 | Skip List uses linked lists for | O(log N) average search |
""",

    "Stack": """
## 🏋️ Practice & Interview Questions — Stack & Queue

### Predict / Trace
**Q1.** Stack has [1,2,3] (3 is top). After pop(), pop(), push(5) — what's the stack?
<details><summary>Answer</summary>

[1, 5] — popped 3 and 2, pushed 5 on top of 1.
</details>

**Q2.** Evaluate postfix `3 4 + 2 *` using a stack — trace each step.
<details><summary>Answer</summary>

push 3 → [3]; push 4 → [3,4]; + → pop 3,4, push 7 → [7]; push 2 → [7,2]; * → pop 7,2, push 14 → [14]. Result: 14
</details>

### LeetCode / Coding
**Q3.** ⭐ Valid Parentheses — O(N).
<details><summary>Solution</summary>

```java
Deque<Character> stack = new ArrayDeque<>();
for(char c : s.toCharArray()){
    if(c=='('||c=='{'||c=='[') stack.push(c);
    else {
        if(stack.isEmpty()) return false;
        char top = stack.pop();
        if(c==')'&&top!='('||c=='}'&&top!='{'||c==']'&&top!='[') return false;
    }
}
return stack.isEmpty();
```
</details>

**Q4.** ⭐ Min Stack — O(1) getMin().
<details><summary>Solution</summary>

```java
Deque<Integer> stack=new ArrayDeque<>(), minStack=new ArrayDeque<>();
void push(int v){ stack.push(v); if(minStack.isEmpty()||v<=minStack.peek()) minStack.push(v); }
void pop(){ if(stack.pop().equals(minStack.peek())) minStack.pop(); }
int getMin(){ return minStack.peek(); }
```
</details>

**Q5.** ⭐⭐ Daily Temperatures — next warmer day for each day (monotonic stack).
<details><summary>Solution</summary>

```java
int[] res = new int[n]; Deque<Integer> stack = new ArrayDeque<>();
for(int i=0;i<n;i++){
    while(!stack.isEmpty()&&temperatures[i]>temperatures[stack.peek()])
        res[stack.peek()] = i - stack.pop();
    stack.push(i);
}
```
</details>

**Q6.** ⭐⭐ Largest Rectangle in Histogram (monotonic stack).
<details><summary>Solution</summary>

```java
Deque<Integer> stack = new ArrayDeque<>();
int maxArea = 0;
for(int i=0;i<=n;i++){
    int h = (i==n)?0:heights[i];
    while(!stack.isEmpty()&&h<heights[stack.peek()]){
        int height=heights[stack.pop()];
        int width=stack.isEmpty()?i:(i-stack.peek()-1);
        maxArea=Math.max(maxArea,height*width);
    }
    stack.push(i);
}
```
</details>

**Q7.** ⭐⭐ Implement Queue using 2 Stacks.
<details><summary>Solution</summary>

```java
// Two stacks: inbox (for push), outbox (for pop)
// Move inbox→outbox only when outbox is empty
void push(int x){ inbox.push(x); }
int pop(){ if(outbox.isEmpty()) while(!inbox.isEmpty()) outbox.push(inbox.pop()); return outbox.pop(); }
```
</details>

**Q8.** ⭐⭐ Decode String — `3[a2[bc]]` → `abcbcabcbcabcbc`.
<details><summary>Solution</summary>

```java
Deque<Integer> counts=new ArrayDeque<>();
Deque<StringBuilder> builders=new ArrayDeque<>();
StringBuilder curr=new StringBuilder(); int k=0;
for(char c:s.toCharArray()){
    if(Character.isDigit(c)) k=k*10+(c-'0');
    else if(c=='['){ counts.push(k); builders.push(curr); curr=new StringBuilder(); k=0; }
    else if(c==']'){ int times=counts.pop(); StringBuilder prev=builders.pop(); while(times-->0) prev.append(curr); curr=prev; }
    else curr.append(c);
}
return curr.toString();
```
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | Stack LIFO/FIFO? | LIFO |
| 2 | Queue LIFO/FIFO? | FIFO |
| 3 | Java Stack class — recommended alternative? | Deque / ArrayDeque |
| 4 | ArrayDeque vs LinkedList for stack/queue | ArrayDeque (no boxing, cache-friendly) |
| 5 | Monotonic stack usage | Next greater/smaller element problems |
| 6 | BFS uses which data structure? | Queue |
| 7 | DFS (iterative) uses which structure? | Stack |
| 8 | peek() vs poll() on empty queue | peek()=null, poll()=null (no exception) |
""",

    "HashTable": """
## 🏋️ Practice & Interview Questions — Hash Tables

### Predict / Trace
**Q1.** HashMap with capacity 4. Insert keys: "a"(hash=1), "b"(hash=2), "c"(hash=5). Which bucket does "c" go into?
<details><summary>Answer</summary>

`5 % 4 = 1` → bucket 1. Collision with "a"! Resolved by chaining (Java: linked list / tree at bucket).
</details>

**Q2.** What's the load factor? If HashMap capacity=16 and size=13, is a resize triggered?
<details><summary>Answer</summary>

Default load factor = 0.75. Threshold = 16 × 0.75 = 12. Size 13 > 12 → YES, resize to capacity 32 was triggered when 13th element was inserted.
</details>

### LeetCode / Coding
**Q3.** ⭐ Two Sum with HashMap.
<details><summary>Solution</summary>

```java
Map<Integer,Integer> map=new HashMap<>();
for(int i=0;i<nums.length;i++){
    if(map.containsKey(target-nums[i])) return new int[]{map.get(target-nums[i]),i};
    map.put(nums[i],i);
}
```
</details>

**Q4.** ⭐ Group Anagrams — group strings that are anagrams of each other.
<details><summary>Solution</summary>

```java
Map<String,List<String>> map=new HashMap<>();
for(String s:strs){
    char[] c=s.toCharArray(); Arrays.sort(c);
    String key=new String(c);
    map.computeIfAbsent(key,k->new ArrayList<>()).add(s);
}
return new ArrayList<>(map.values());
```
</details>

**Q5.** ⭐ Valid Anagram — check if two strings are anagrams.
<details><summary>Solution</summary>

```java
if(s.length()!=t.length()) return false;
int[] count=new int[26];
for(char c:s.toCharArray()) count[c-'a']++;
for(char c:t.toCharArray()) if(--count[c-'a']<0) return false;
return true;
```
</details>

**Q6.** ⭐ Longest Consecutive Sequence — O(N).
<details><summary>Solution</summary>

```java
Set<Integer> set=new HashSet<>(Arrays.asList(nums));
int maxLen=0;
for(int n:set){
    if(!set.contains(n-1)){ // start of sequence
        int len=1; while(set.contains(n+len)) len++;
        maxLen=Math.max(maxLen,len);
    }
}
```
</details>

**Q7.** ⭐⭐ Top K Frequent Elements.
<details><summary>Solution</summary>

```java
Map<Integer,Integer> freq=new HashMap<>();
for(int n:nums) freq.merge(n,1,Integer::sum);
PriorityQueue<Integer> pq=new PriorityQueue<>((a,b)->freq.get(a)-freq.get(b));
for(int n:freq.keySet()){ pq.offer(n); if(pq.size()>k) pq.poll(); }
int[] res=new int[k]; for(int i=k-1;i>=0;i--) res[i]=pq.poll();
```
</details>

**Q8.** ⭐⭐ Subarray Sum Equals K (prefix sum + HashMap).
<details><summary>Solution</summary>

```java
Map<Integer,Integer> map=new HashMap<>(); map.put(0,1);
int sum=0, count=0;
for(int n:nums){ sum+=n; count+=map.getOrDefault(sum-k,0); map.merge(sum,1,Integer::sum); }
return count;
```
</details>

**Q9.** ⭐⭐ LFU Cache — Least Frequently Used eviction.
<details><summary>Key insight</summary>

Use: `HashMap<key→value>`, `HashMap<key→freq>`, `HashMap<freq→LinkedHashSet<key>>`, `int minFreq`. On get/put: update freq, move key to higher freq set, update minFreq.
</details>

### Interview Questions
**Q10.** How does Java's HashMap handle hash collisions?
<details><summary>Answer</summary>

Java 8+: Each bucket uses a linked list. If bucket size ≥ 8 AND total capacity ≥ 64: list converts to a Red-Black Tree (O(log N) worst case instead of O(N)).
</details>

**Q11.** Why must you override both `hashCode()` and `equals()` together?
<details><summary>Answer</summary>

HashMap first checks `hashCode()` to find the bucket, then `equals()` to find the exact key. If you override only `equals()`: two "equal" objects land in different buckets. If only `hashCode()`: bucket is found but equals() can't identify the right entry. Both must be consistent.
</details>

**Q12.** `ConcurrentHashMap` vs `Collections.synchronizedMap()` — why is CHM preferred?
<details><summary>Answer</summary>

`synchronizedMap`: wraps entire map with a single lock — every operation serialized. `ConcurrentHashMap`: segments/lock striping in Java 7, CAS + synchronized per-bucket in Java 8 — concurrent reads don't block at all, writes only lock individual buckets.
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | Default HashMap capacity | 16 |
| 2 | Default load factor | 0.75 |
| 3 | HashMap.get() avg/worst | O(1) avg, O(N) worst (all collide) |
| 4 | HashMap maintains insertion order? | ❌ No — use LinkedHashMap |
| 5 | TreeMap ordering | Natural ordering (Red-Black Tree) |
| 6 | HashSet is backed by | HashMap (key only, value=dummy) |
| 7 | HashMap allows null key? | ✅ Yes, exactly one null key |
| 8 | HashMap thread-safe? | ❌ No — use ConcurrentHashMap |
""",

    "Trees": """
## 🏋️ Practice & Interview Questions — Trees & Heaps

### Predict / Trace
**Q1.** BST insert 5,3,7,1,4. Draw the tree. What is inorder traversal?
<details><summary>Answer</summary>

```
      5
     / \\
    3   7
   / \\
  1   4
```
Inorder: 1, 3, 4, 5, 7 (always sorted for BST!)
</details>

**Q2.** PriorityQueue in Java — is it a min-heap or max-heap by default?
<details><summary>Answer</summary>

**Min-heap** by default (`poll()` returns the minimum). For max-heap: `new PriorityQueue<>(Comparator.reverseOrder())`.
</details>

### LeetCode / Coding
**Q3.** ⭐ Maximum Depth of Binary Tree.
<details><summary>Solution</summary>

```java
int maxDepth(TreeNode root){
    if(root==null) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```
</details>

**Q4.** ⭐ Invert Binary Tree.
<details><summary>Solution</summary>

```java
TreeNode invertTree(TreeNode root){
    if(root==null) return null;
    TreeNode tmp=root.left; root.left=root.right; root.right=tmp;
    invertTree(root.left); invertTree(root.right);
    return root;
}
```
</details>

**Q5.** ⭐ Validate Binary Search Tree.
<details><summary>Solution</summary>

```java
boolean validate(TreeNode node, long min, long max){
    if(node==null) return true;
    if(node.val<=min||node.val>=max) return false;
    return validate(node.left,min,node.val)&&validate(node.right,node.val,max);
}
// call: validate(root, Long.MIN_VALUE, Long.MAX_VALUE)
```
</details>

**Q6.** ⭐ Level Order Traversal (BFS with Queue).
<details><summary>Solution</summary>

```java
Queue<TreeNode> q=new LinkedList<>(); q.offer(root);
while(!q.isEmpty()){
    int size=q.size();
    for(int i=0;i<size;i++){
        TreeNode n=q.poll(); process(n);
        if(n.left!=null) q.offer(n.left);
        if(n.right!=null) q.offer(n.right);
    }
}
```
</details>

**Q7.** ⭐ Lowest Common Ancestor of BST.
<details><summary>Solution</summary>

```java
TreeNode lca(TreeNode root, TreeNode p, TreeNode q){
    if(p.val<root.val&&q.val<root.val) return lca(root.left,p,q);
    if(p.val>root.val&&q.val>root.val) return lca(root.right,p,q);
    return root; // split point = LCA
}
```
</details>

**Q8.** ⭐⭐ Binary Tree Right Side View.
<details><summary>Solution</summary>

```java
// BFS, take last element of each level
// or DFS: track level, add to result only when level==result.size()
void dfs(TreeNode node, int level){
    if(node==null) return;
    if(level==res.size()) res.add(node.val);
    dfs(node.right,level+1); dfs(node.left,level+1);
}
```
</details>

**Q9.** ⭐⭐ Kth Smallest Element in BST.
<details><summary>Solution</summary>

```java
// Inorder traversal is sorted — take kth element
int k, result;
void inorder(TreeNode node){
    if(node==null) return;
    inorder(node.left);
    if(--k==0){ result=node.val; return; }
    inorder(node.right);
}
```
</details>

**Q10.** ⭐⭐ Serialize and Deserialize Binary Tree.
<details><summary>Key approach</summary>

BFS level-order with null markers. Serialize: `1,2,3,null,null,4,5`. Deserialize: queue-based reconstruction level by level.
</details>

**Q11.** ⭐⭐⭐ Binary Tree Maximum Path Sum.
<details><summary>Solution</summary>

```java
int maxSum = Integer.MIN_VALUE;
int dfs(TreeNode node){
    if(node==null) return 0;
    int left=Math.max(0,dfs(node.left)), right=Math.max(0,dfs(node.right));
    maxSum=Math.max(maxSum, node.val+left+right); // path through this node
    return node.val+Math.max(left,right); // return single path
}
```
</details>

### Heap / Priority Queue Problems
**Q12.** ⭐ Kth Largest Element in Array.
<details><summary>Solution</summary>

```java
PriorityQueue<Integer> minHeap=new PriorityQueue<>();
for(int n:nums){ minHeap.offer(n); if(minHeap.size()>k) minHeap.poll(); }
return minHeap.peek(); // kth largest
```
</details>

**Q13.** ⭐⭐ Median from Data Stream (two heaps).
<details><summary>Solution</summary>

```java
PriorityQueue<Integer> lo=new PriorityQueue<>(Comparator.reverseOrder()); // max-heap
PriorityQueue<Integer> hi=new PriorityQueue<>(); // min-heap
void addNum(int n){
    lo.offer(n);
    hi.offer(lo.poll());
    if(lo.size()<hi.size()) lo.offer(hi.poll());
}
double findMedian(){ return lo.size()>hi.size()?lo.peek():(lo.peek()+hi.peek())/2.0; }
```
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | BST search avg/worst | O(log N) avg, O(N) worst (degenerate) |
| 2 | Complete binary tree with N nodes height | O(log N) |
| 3 | Heap insertHeapify direction | Bubble up |
| 4 | Heap extractMin direction | Bubble down (sift down) |
| 5 | Java PriorityQueue poll() time | O(log N) |
| 6 | Tree DFS pre/in/post order uses | Stack (or recursion) |
| 7 | Tree BFS uses | Queue |
| 8 | Red-Black Tree guarantee | O(log N) worst case for search/insert/delete |
""",

    "Algorithms": """
## 🏋️ Practice & Interview Questions — Algorithms

### Sorting
**Q1.** Which sorting algorithm does Java use for `Arrays.sort(int[])`? Why not MergeSort?
<details><summary>Answer</summary>

**Dual-Pivot QuickSort** — for primitives. MergeSort requires O(N) extra space. QuickSort is in-place and cache-friendly. Stability doesn't matter for primitives (equal ints are indistinguishable). For objects (`Arrays.sort(Object[])`), Java uses **TimSort** (stable, O(N log N) worst).
</details>

**Q2.** Trace Merge Sort on `[4,2,7,1]`.
<details><summary>Answer</summary>

Split: `[4,2]` `[7,1]` → Split: `[4]` `[2]` `[7]` `[1]` → Merge: `[2,4]` `[1,7]` → Merge: `[1,2,4,7]`
</details>

**Q3.** ⭐⭐ Sort Colors (Dutch National Flag — 3-way partition).
<details><summary>Solution</summary>

```java
int lo=0, mid=0, hi=n-1;
while(mid<=hi){
    if(nums[mid]==0) swap(nums,lo++,mid++);
    else if(nums[mid]==1) mid++;
    else swap(nums,mid,hi--);
}
```
</details>

### Binary Search
**Q4.** ⭐ Search in Rotated Sorted Array.
<details><summary>Solution</summary>

```java
int lo=0, hi=n-1;
while(lo<=hi){
    int mid=(lo+hi)/2;
    if(nums[mid]==target) return mid;
    if(nums[lo]<=nums[mid]){ // left half sorted
        if(nums[lo]<=target&&target<nums[mid]) hi=mid-1; else lo=mid+1;
    } else { // right half sorted
        if(nums[mid]<target&&target<=nums[hi]) lo=mid+1; else hi=mid-1;
    }
}
return -1;
```
</details>

**Q5.** ⭐ Find First and Last Position (binary search twice).
<details><summary>Solution</summary>

```java
// First: find leftmost with while(lo<hi){ if arr[mid]>=target hi=mid else lo=mid+1 }
// Last: find rightmost with while(lo<hi){ if arr[mid]<=target lo=mid+1 else hi=mid } return lo-1
```
</details>

**Q6.** ⭐⭐ Koko Eating Bananas — binary search on answer.
<details><summary>Key insight</summary>

Binary search the eating speed k in range [1, max(piles)]. For each k, calculate hours needed. Find minimum k where hours ≤ H.
</details>

### Dynamic Programming
**Q7.** ⭐ Climbing Stairs — n steps, 1 or 2 at a time. How many ways?
<details><summary>Solution</summary>

```java
// Fibonacci sequence! dp[i] = dp[i-1] + dp[i-2]
int a=1, b=1;
for(int i=2;i<=n;i++){ int c=a+b; a=b; b=c; }
return b;
```
</details>

**Q8.** ⭐ Coin Change — minimum coins for amount.
<details><summary>Solution</summary>

```java
int[] dp = new int[amount+1]; Arrays.fill(dp, amount+1);
dp[0]=0;
for(int i=1;i<=amount;i++)
    for(int c:coins) if(c<=i) dp[i]=Math.min(dp[i],dp[i-c]+1);
return dp[amount]>amount?-1:dp[amount];
```
</details>

**Q9.** ⭐⭐ Longest Common Subsequence.
<details><summary>Solution</summary>

```java
int[][] dp=new int[m+1][n+1];
for(int i=1;i<=m;i++) for(int j=1;j<=n;j++){
    if(text1.charAt(i-1)==text2.charAt(j-1)) dp[i][j]=dp[i-1][j-1]+1;
    else dp[i][j]=Math.max(dp[i-1][j],dp[i][j-1]);
}
return dp[m][n];
```
</details>

**Q10.** ⭐⭐ Word Break — can string be segmented using dictionary words?
<details><summary>Solution</summary>

```java
boolean[] dp=new boolean[n+1]; dp[0]=true;
for(int i=1;i<=n;i++) for(String w:wordDict)
    if(i>=w.length()&&dp[i-w.length()]&&s.substring(i-w.length(),i).equals(w)) dp[i]=true;
return dp[n];
```
</details>

**Q11.** ⭐⭐⭐ Edit Distance (Levenshtein).
<details><summary>Solution</summary>

```java
int[][] dp=new int[m+1][n+1];
for(int i=0;i<=m;i++) dp[i][0]=i;
for(int j=0;j<=n;j++) dp[0][j]=j;
for(int i=1;i<=m;i++) for(int j=1;j<=n;j++){
    if(word1.charAt(i-1)==word2.charAt(j-1)) dp[i][j]=dp[i-1][j-1];
    else dp[i][j]=1+Math.min(dp[i-1][j-1],Math.min(dp[i-1][j],dp[i][j-1]));
}
```
</details>

### Graph Algorithms
**Q12.** ⭐ Number of Islands (BFS/DFS grid traversal).
<details><summary>Solution</summary>

```java
for each cell (i,j) if grid[i][j]=='1': count++; BFS/DFS to mark all connected land as visited
```
</details>

**Q13.** ⭐⭐ Course Schedule — detect cycle in directed graph (Topological sort).
<details><summary>Solution</summary>

```java
// Kahn's algorithm: indegree array + BFS queue
// If result size == numCourses → no cycle → can finish
```
</details>

**Q14.** ⭐⭐ Dijkstra's Shortest Path.
<details><summary>Solution</summary>

```java
PriorityQueue<int[]> pq=new PriorityQueue<>((a,b)->a[1]-b[1]); // [node, dist]
pq.offer(new int[]{src,0}); dist[src]=0;
while(!pq.isEmpty()){
    int[] curr=pq.poll(); int u=curr[0],d=curr[1];
    if(d>dist[u]) continue; // stale
    for(int[] neighbor:graph[u]) if(dist[u]+neighbor[1]<dist[neighbor[0]]){
        dist[neighbor[0]]=dist[u]+neighbor[1]; pq.offer(new int[]{neighbor[0],dist[neighbor[0]]});
    }
}
```
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | QuickSort avg/worst | O(N log N) avg, O(N²) worst |
| 2 | MergeSort space complexity | O(N) |
| 3 | HeapSort space complexity | O(1) (in-place) |
| 4 | Binary search precondition | Sorted array |
| 5 | BFS time complexity on graph | O(V+E) |
| 6 | DFS space complexity | O(V) (recursion stack) |
| 7 | Dijkstra fails on | Negative weight edges |
| 8 | Bellman-Ford handles | Negative weights, detects negative cycles |
| 9 | Floyd-Warshall use case | All-pairs shortest path, O(V³) |
| 10 | Topological sort requires | Directed Acyclic Graph (DAG) |
""",

    "SQL": """
## 🏋️ Practice & Interview Questions — SQL

### Predict / Trace
**Q1.** What's the difference between WHERE and HAVING?
<details><summary>Answer</summary>

`WHERE` filters rows **before** grouping. `HAVING` filters groups **after** `GROUP BY`. You can't use aggregate functions in WHERE. `HAVING COUNT(*) > 5` works, `WHERE COUNT(*) > 5` does not.
</details>

**Q2.** What does this return? `SELECT 1 FROM dual WHERE NULL = NULL`
<details><summary>Answer</summary>

**No rows returned.** NULL is not equal to NULL — use `IS NULL` or `IS NOT NULL`. `NULL = NULL` evaluates to UNKNOWN, not TRUE.
</details>

### Coding Problems
**Q3.** ⭐ Second highest salary — handle the case where it doesn't exist (return NULL).
<details><summary>Solution</summary>

```sql
SELECT MAX(salary) AS SecondHighestSalary
FROM Employee
WHERE salary < (SELECT MAX(salary) FROM Employee);
-- or
SELECT IFNULL((SELECT DISTINCT salary FROM Employee ORDER BY salary DESC LIMIT 1 OFFSET 1), NULL)
```
</details>

**Q4.** ⭐ Find employees earning more than their manager.
<details><summary>Solution</summary>

```sql
SELECT e.name FROM Employee e
JOIN Employee m ON e.managerId = m.id
WHERE e.salary > m.salary;
```
</details>

**Q5.** ⭐ Find duplicate emails.
<details><summary>Solution</summary>

```sql
SELECT email FROM Person GROUP BY email HAVING COUNT(*) > 1;
```
</details>

**Q6.** ⭐⭐ Rank scores without RANK() function.
<details><summary>Solution</summary>

```sql
SELECT s.score,
  (SELECT COUNT(DISTINCT s2.score) FROM Scores s2 WHERE s2.score >= s.score) AS rank
FROM Scores s ORDER BY score DESC;
```
</details>

**Q7.** ⭐⭐ Consecutive numbers — find numbers that appear 3+ times consecutively.
<details><summary>Solution</summary>

```sql
SELECT DISTINCT l1.Num AS ConsecutiveNums
FROM Logs l1, Logs l2, Logs l3
WHERE l1.Id=l2.Id-1 AND l2.Id=l3.Id-1
AND l1.Num=l2.Num AND l2.Num=l3.Num;
-- or use LAG/LEAD window functions
```
</details>

**Q8.** ⭐⭐ Department top 3 salaries (dense rank).
<details><summary>Solution</summary>

```sql
SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary
FROM Employee e JOIN Department d ON e.departmentId = d.id
WHERE (SELECT COUNT(DISTINCT e2.salary) FROM Employee e2
       WHERE e2.departmentId=e.departmentId AND e2.salary>e.salary) < 3;
```
</details>

**Q9.** ⭐⭐ Running total with window function.
<details><summary>Solution</summary>

```sql
SELECT date, amount,
  SUM(amount) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM transactions;
```
</details>

**Q10.** ⭐⭐ Pivot rows to columns (conditional aggregation).
<details><summary>Solution</summary>

```sql
SELECT year,
  SUM(CASE WHEN quarter=1 THEN revenue END) AS Q1,
  SUM(CASE WHEN quarter=2 THEN revenue END) AS Q2,
  SUM(CASE WHEN quarter=3 THEN revenue END) AS Q3,
  SUM(CASE WHEN quarter=4 THEN revenue END) AS Q4
FROM sales GROUP BY year;
```
</details>

**Q11.** ⭐⭐⭐ Find the median salary — without MEDIAN() function.
<details><summary>Solution</summary>

```sql
SELECT AVG(salary) AS median
FROM (SELECT salary, ROW_NUMBER() OVER(ORDER BY salary) AS rn, COUNT(*) OVER() AS cnt FROM Employee) t
WHERE rn IN (FLOOR((cnt+1)/2), CEIL((cnt+1)/2));
```
</details>

### Interview Questions
**Q12.** INNER JOIN vs LEFT JOIN — when does LEFT produce more rows?
<details><summary>Answer</summary>

LEFT JOIN includes ALL rows from the left table even if no match in right table (fills NULLs). INNER JOIN only includes rows where both sides have a match. If left table has rows with no match in right: LEFT produces more rows.
</details>

**Q13.** What is a covering index?
<details><summary>Answer</summary>

An index that contains ALL columns needed by a query — the DB can answer from the index alone without touching the table ("index-only scan"). Faster because it avoids the extra heap fetch.
</details>

**Q14.** EXPLAIN shows "Full Table Scan" — how do you fix it?
<details><summary>Answer</summary>

Add an index on the WHERE/JOIN/ORDER BY column. Check if the column has low cardinality (boolean — index may not help). Ensure the query isn't wrapping the column in a function (`WHERE YEAR(date) = 2024` prevents index use — rewrite as `WHERE date BETWEEN '2024-01-01' AND '2024-12-31'`).
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | NULL = NULL evaluates to? | UNKNOWN (use IS NULL) |
| 2 | COUNT(*) vs COUNT(col) | COUNT(*) counts all rows, COUNT(col) skips NULLs |
| 3 | RANK() vs DENSE_RANK() | RANK() skips numbers after ties, DENSE_RANK() doesn't |
| 4 | CROSS JOIN produces | Cartesian product (m × n rows) |
| 5 | Can you ORDER BY in a subquery? | Only when using TOP/LIMIT |
| 6 | TRUNCATE vs DELETE | TRUNCATE: no WHERE, no undo, faster. DELETE: filterable, transactional |
| 7 | What does COALESCE do? | Returns first non-NULL value from its arguments |
| 8 | Index on VARCHAR — what to watch out for? | Case sensitivity, collation, function-based searches bypass index |
""",

    "Exception": """
## 🏋️ Practice & Interview Questions — Exceptions & Error Handling

### Predict / Trace
**Q1.** What prints?
```java
try { int x = 1/0; } catch(Exception e) { System.out.println("caught"); } finally { System.out.println("finally"); }
```
<details><summary>Answer</summary>

```
caught
finally
```
`finally` ALWAYS runs (except JVM crash or `System.exit()`).
</details>

**Q2.** What prints? Does `finally` override the return value?
```java
static int test() { try { return 1; } finally { return 2; } }
System.out.println(test());
```
<details><summary>Answer</summary>

`2` — `finally` overrides the `try` block's return. This is an anti-pattern! Avoid returning from finally.
</details>

**Q3.** What happens when you swallow `InterruptedException`?
```java
try { Thread.sleep(1000); } catch(InterruptedException e) { /* ignore */ }
```
<details><summary>Answer</summary>

The interrupted flag is **cleared** by catching InterruptedException. The thread has no way to know it was interrupted. Callers that rely on interruption to stop the thread will hang forever. **Fix**: `catch(InterruptedException e) { Thread.currentThread().interrupt(); throw new RuntimeException(e); }`
</details>

### Coding Problems
**Q4.** Write a method that reads a file and properly handles multiple exception types.
<details><summary>Solution</summary>

```java
public String readFile(Path path) throws IOException {
    try (BufferedReader reader = Files.newBufferedReader(path)) {
        return reader.lines().collect(Collectors.joining("\n"));
    } catch (NoSuchFileException e) {
        throw new FileNotFoundException("File not found: " + path, e);
    } catch (AccessDeniedException e) {
        throw new SecurityException("Cannot read file: " + path, e);
    }
    // IOException (parent) propagated as-is
    // try-with-resources auto-closes reader
}
```
</details>

**Q5.** Design a custom exception hierarchy for an e-commerce system.
<details><summary>Solution</summary>

```java
// Base domain exception
public class ECommerceException extends RuntimeException {
    private final String errorCode;
    public ECommerceException(String code, String message) {
        super(message); this.errorCode=code;
    }
    public ECommerceException(String code, String message, Throwable cause) {
        super(message, cause); this.errorCode=code;
    }
}
public class OrderNotFoundException extends ECommerceException { ... }        // 404
public class InsufficientInventoryException extends ECommerceException { ... } // 409
public class PaymentFailedException extends ECommerceException { ... }         // 402
public class InvalidOrderStateException extends ECommerceException { ... }     // 422
```
</details>

**Q6.** What's wrong with this exception handling?
```java
try { processOrder(order); }
catch (Exception e) { log.error(e.getMessage()); }
```
<details><summary>Answer</summary>

**3 bugs**: (1) Washes away the exception type — caller has no idea what failed. (2) `e.getMessage()` may be null for some exceptions. (3) Swallowing the exception — processing continues as if nothing failed. **Fix**: log with `e` (not `e.getMessage()`), either rethrow or handle specifically.
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | Checked vs Unchecked exception | Checked: must catch/declare. Unchecked: RuntimeException subclasses |
| 2 | Error vs Exception | Error: JVM-level (OOM, StackOverflow) — don't catch. Exception: application-level |
| 3 | `finally` runs when? | Always, except System.exit() or JVM crash |
| 4 | Try-with-resources closes in which order? | Reverse order of opening |
| 5 | `throw` vs `throws` | `throw`: throw instance. `throws`: declare method can throw |
| 6 | Can constructors throw exceptions? | ✅ Yes |
| 7 | Multi-catch `catch(A | B e)` — can A and B have parent-child relation? | ❌ No — compile error |
| 8 | Chaining exceptions preserves what? | Original stack trace via `initCause()` or constructor |
| 9 | Exception in static initializer → | ExceptionInInitializerError (then NoClassDefFoundError on next access) |
| 10 | RuntimeException is checked? | ❌ Unchecked |
""",

    "Generics": """
## 🏋️ Practice & Interview Questions — Generics

### Predict / Trace
**Q1.** Does this compile?
```java
List<Integer> ints = new ArrayList<>();
List<Number> nums = ints;  // ?
```
<details><summary>Answer</summary>

**Compile error.** Generics are **invariant** — `List<Integer>` is NOT a subtype of `List<Number>`, even though `Integer extends Number`. Reason: if it compiled, you could do `nums.add(3.14)` and corrupt the Integer list. Use `List<? extends Number>` for read-only access.
</details>

**Q2.** What is type erasure? What does `new T()` fail at compile time?
<details><summary>Answer</summary>

At runtime, all generic type info is erased — `List<String>` becomes `List`. The JVM has no knowledge of T at runtime. `new T()` fails because you can't instantiate an unknown type at runtime — JVM doesn't know T's constructor. Solution: pass `Class<T>` and use `clazz.getDeclaredConstructor().newInstance()`.
</details>

### Coding Problems
**Q3.** Write a generic `Pair<A,B>` class.
<details><summary>Solution</summary>

```java
public class Pair<A,B> {
    private final A first;
    private final B second;
    public Pair(A first, B second){ this.first=first; this.second=second; }
    public A getFirst(){ return first; }
    public B getSecond(){ return second; }
    public static <X,Y> Pair<X,Y> of(X x, Y y){ return new Pair<>(x,y); }
}
```
</details>

**Q4.** Write a generic method to find the maximum of any Comparable type.
<details><summary>Solution</summary>

```java
public static <T extends Comparable<T>> T max(T a, T b){
    return a.compareTo(b) >= 0 ? a : b;
}
// Works for Integer, String, Double, any Comparable
```
</details>

**Q5.** Explain PECS — when to use `? extends` vs `? super`?
<details><summary>Answer</summary>

**P**roducer **E**xtends, **C**onsumer **S**uper.
- `List<? extends Number>`: you can READ `Number` out (producer), can't add (type unknown)
- `List<? super Integer>`: you can ADD `Integer` in (consumer), read only `Object`
```java
void copy(List<? extends T> src, List<? super T> dst){ dst.addAll(src); }
```
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | Generic type info at runtime? | Erased (type erasure) |
| 2 | `List<?>` vs `List<Object>` | List<?>: read-only wildcard; List<Object>: can add Object instances |
| 3 | Can you create generic array? | ❌ `new T[10]` — compile error (workaround: `(T[]) new Object[10]`) |
| 4 | Bounded type parameter `<T extends Comparable<T>>` means | T must implement Comparable |
| 5 | Raw type `List` vs `List<Object>` | Raw type: unsafe, unchecked warnings; List<Object>: explicit |
""",

    "Concurrency": """
## 🏋️ Practice & Interview Questions — Concurrency (Extra)

### Predict / Trace
**Q1.** Is this code thread-safe?
```java
if (!map.containsKey(key)) { map.put(key, compute(key)); }
```
<details><summary>Answer</summary>

**No.** Two threads can both pass `containsKey` check simultaneously → both compute and put → race condition, duplicate computation, possible data loss. **Fix**: `map.computeIfAbsent(key, k -> compute(k))` on ConcurrentHashMap — atomic!
</details>

**Q2.** What's wrong with checking `if(future.isDone())` before `future.get()`?
<details><summary>Answer</summary>

Nothing wrong functionally, but it's redundant. `future.get()` blocks until done anyway. Only use `isDone()` when you want **non-blocking check** (poll pattern). `isDone()` followed immediately by `get()` has a TOCTOU race — another thread could cancel it between your check and get (though `get()` would throw `CancellationException`).
</details>

### Coding Problems
**Q3.** ⭐⭐ Implement a thread-safe bounded blocking queue from scratch with `wait/notify`.
<details><summary>Solution</summary>

```java
class BoundedQueue<T> {
    private final Queue<T> queue = new LinkedList<>();
    private final int capacity;
    BoundedQueue(int cap){ this.capacity=cap; }

    synchronized void put(T item) throws InterruptedException {
        while(queue.size()==capacity) wait(); // Full — wait
        queue.offer(item);
        notifyAll(); // Signal waiting consumers
    }

    synchronized T take() throws InterruptedException {
        while(queue.isEmpty()) wait(); // Empty — wait
        T item=queue.poll();
        notifyAll(); // Signal waiting producers
        return item;
    }
}
```
</details>

**Q4.** ⭐⭐ Implement a simple `Future<T>` from scratch.
<details><summary>Solution</summary>

```java
class SimpleFuture<T> {
    private T value; private Throwable error;
    private boolean done=false;

    synchronized void complete(T val){ value=val; done=true; notifyAll(); }
    synchronized void completeExceptionally(Throwable t){ error=t; done=true; notifyAll(); }

    synchronized T get() throws Exception {
        while(!done) wait();
        if(error!=null) throw new ExecutionException(error);
        return value;
    }
}
```
</details>

**Q5.** ⭐⭐⭐ Design a rate limiter (Token Bucket algorithm).
<details><summary>Solution</summary>

```java
class TokenBucket {
    private final long capacity, refillRate;
    private double tokens;
    private long lastRefill = System.nanoTime();

    TokenBucket(long capacity, long tokensPerSecond){
        this.capacity=capacity; this.refillRate=tokensPerSecond; this.tokens=capacity;
    }

    synchronized boolean tryAcquire(){
        refill();
        if(tokens>=1){ tokens--; return true; }
        return false;
    }

    private void refill(){
        long now = System.nanoTime();
        double added = (now-lastRefill)/1e9 * refillRate;
        tokens = Math.min(capacity, tokens+added);
        lastRefill = now;
    }
}
```
</details>

### Interview Questions
**Q6.** What is a memory barrier / fence and when does Java insert one?
<details><summary>Answer</summary>

A memory barrier is a CPU instruction that prevents reordering across it. Java inserts them:
- **volatile write**: StoreStore + StoreLoad barrier → all prior writes visible before the volatile write
- **volatile read**: LoadLoad + LoadStore barrier → all subsequent reads see up-to-date values
- **synchronized exit**: StoreLoad barrier (like volatile write)
- **synchronized entry**: LoadLoad barrier (like volatile read)
</details>

**Q7.** What is false sharing and how do you prevent it?
<details><summary>Answer</summary>

Two threads modify different variables that happen to be on the **same CPU cache line** (64 bytes). When one thread modifies its variable, it invalidates the entire cache line — the other thread's variable (though unchanged) must be re-fetched. **Fix**: `@Contended` annotation (Java 8+) adds padding to isolate variables to separate cache lines.

```java
@sun.misc.Contended
class PaddedCounter { volatile long value; }
```
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | ExecutorService.shutdown() — does it wait for tasks? | ❌ Initiates shutdown, doesn't wait. Use awaitTermination() |
| 2 | ExecutorService.shutdownNow() — does it stop running tasks? | Tries to interrupt them, returns list of queued tasks |
| 3 | Future.cancel(true) — does it stop the task? | Only if task checks isInterrupted() |
| 4 | CompletableFuture.get() vs join() | get() throws checked exceptions; join() throws unchecked |
| 5 | Which is faster: AtomicLong or LongAdder? | LongAdder under contention (stripes), AtomicLong for single reads |
| 6 | Volatile does not guarantee: | Atomicity of compound operations (check-then-act) |
| 7 | Thread.yield() does what? | Hints scheduler to give up CPU, no guarantee |
| 8 | Daemon threads — example in JDK | GC threads, JIT compiler threads, finalizer thread |
""",

    "JMM": """
## 🏋️ Practice & Interview Questions — JMM & GC

### Predict / Trace
**Q1.** Thread A: `x=42; flag=true;` Thread B: `if(flag) print(x);` — is this safe without volatile?
<details><summary>Answer</summary>

**No.** No happens-before between writes in A and reads in B. CPU may reorder `flag=true` before `x=42`. B may see flag=true but x=0. **Fix**: make `flag` volatile. The volatile write creates happens-before — all prior writes (including x=42) are visible.
</details>

**Q2.** What is the "double-checked locking" pattern and why does it require volatile?
<details><summary>Answer</summary>

Without volatile: `instance = new Singleton()` is 3 steps: allocate memory → run constructor → assign reference. CPU can reorder to: allocate → assign → constructor. Another thread sees non-null instance but reads partially-constructed object. `volatile` forces complete construction before reference is visible.
</details>

### Coding Analysis
**Q3.** Identify if each is safely published:
```java
// A:
static Config config = new Config(); // ← safe?

// B:
Config config; // field, non-volatile, non-final
void init() { config = new Config(); } // ← safe?

// C:
final Config config = new Config(); // ← safe?
```
<details><summary>Answer</summary>

A: ✅ Static initializer — JVM class loading guarantees visibility.
B: ❌ Unsafe! Non-volatile, non-synchronized field — other threads may see stale reference or partially-constructed Config.
C: ✅ `final` fields are safely published after constructor completes per JMM §17.5.
</details>

**Q4.** Calculate: heap 8GB, G1GC, all objects long-lived. What GC problem do you expect?
<details><summary>Answer</summary>

**Full GC storms.** G1 works by collecting highest-garbage regions (mixed GC). If objects are long-lived, few regions are high-garbage — G1 can't free space. Old gen fills up → G1 falls back to Serial Full GC → long pause (seconds) on 8GB heap. **Fix**: tune `G1HeapRegionSize`, `G1MixedGCCountTarget`, or switch to ZGC/Shenandoah for large heap + pause sensitivity.
</details>

### Interview Questions
**Q5.** What are the 7 happens-before rules in JMM?
<details><summary>Answer</summary>

1. Program order (single thread)
2. Monitor unlock → next lock (same monitor)
3. volatile write → volatile read (same variable)
4. Thread.start() → first action in started thread
5. Last action in thread → Thread.join() return
6. Thread interruption → detecting interruption
7. **Transitivity**: if A HB B and B HB C → A HB C
</details>

**Q6.** What is the write barrier in ZGC and why does it eliminate STW?
<details><summary>Answer</summary>

ZGC inserts a **load barrier** (read barrier) in every object reference load. When your code reads a reference, the barrier checks if GC relocated the object — if so, updates your reference (self-healing). This allows GC to relocate objects concurrently with running app code. No phase requires freezing all app threads (pauses < 1ms for safepoints only).
</details>

**Q7.** Your app has high GC overhead (GC takes >20% of time). Diagnostic steps?
<details><summary>Answer</summary>

1. Enable GC logging: `-Xlog:gc*:file=gc.log`
2. Check which GC events dominate (young, mixed, full)
3. If Young GC too frequent: objects dying before tenuring → allocating too much → profile allocation sites (JFR `jdk.ObjectAllocationInNewTLAB`)
4. If Full GC: old gen filling → possible memory leak → heap dump (-XX:+HeapDumpOnOutOfMemoryError), analyze with MAT/VisualVM
5. If GC overhead > 20% consistently: tune heap size, GC type, survivor ratios
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | Young generation collection called | Minor GC |
| 2 | Old generation collection called | Major GC or Full GC |
| 3 | G1 stands for | Garbage First |
| 4 | G1 default pause target | 200ms |
| 5 | ZGC max pause | < 1ms (safepoints only) |
| 6 | Object promoted to old gen when | Survives N minor GCs (default 15) |
| 7 | -Xmx vs -Xms | Xmx=max heap, Xms=initial heap — set equal in production |
| 8 | TLAB stands for | Thread-Local Allocation Buffer |
| 9 | Humongous object in G1 | Object > 50% of region size — goes directly to old gen |
| 10 | finalize() effect on GC | Object survives one extra GC cycle — avoid using |
""",

    "React": """
## 🏋️ Practice & Interview Questions — React

### Predict / Trace
**Q1.** What is the output order of console logs?
```jsx
function App() {
  console.log('render');
  useEffect(() => { console.log('effect'); }, []);
  console.log('render2');
  return <div/>;
}
```
<details><summary>Answer</summary>

`render` → `render2` → `effect`

`useEffect` runs **after** the component renders and the DOM is committed. Both `console.log`s in the function body run first.
</details>

**Q2.** Why does this cause an infinite loop?
```jsx
useEffect(() => {
  setCount(count + 1);
}, [count]);
```
<details><summary>Answer</summary>

`setCount(count+1)` → triggers re-render → `count` changes → effect runs again → infinite loop. **Fix**: remove `count` from deps and use functional update: `setCount(prev => prev + 1)` or change dependency logic.
</details>

### Coding Problems
**Q3.** ⭐ Implement a custom `useDebounce` hook.
<details><summary>Solution</summary>

```jsx
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler); // Cleanup on value/delay change
  }, [value, delay]);
  return debouncedValue;
}
```
</details>

**Q4.** ⭐ Implement `useFetch` — generic data fetching hook with loading/error states.
<details><summary>Solution</summary>

```jsx
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then(r => r.json())
      .then(d => { if(!cancelled) setData(d); })
      .catch(e => { if(!cancelled) setError(e); })
      .finally(() => { if(!cancelled) setLoading(false); });
    return () => { cancelled = true; }; // Cleanup for race conditions
  }, [url]);

  return { data, loading, error };
}
```
</details>

**Q5.** ⭐⭐ When should you use `useCallback` vs `useMemo`?
<details><summary>Answer</summary>

`useMemo`: memoizes a **computed value** — run expensive calculation, cache result.
`useCallback`: memoizes a **function reference** — prevent child re-renders when passing callbacks.
Both only useful when: (1) the child uses `React.memo`, or (2) the value/function is a dep of another hook. Premature optimization without these conditions = needless complexity.
</details>

**Q6.** ⭐⭐ Implement a `useLocalStorage` hook.
<details><summary>Solution</summary>

```jsx
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? initialValue; }
    catch { return initialValue; }
  });

  const setStoredValue = (newValue) => {
    setValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  };

  return [value, setStoredValue];
}
```
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | When does useEffect with [] run? | Once after mount |
| 2 | When does useEffect with no array run? | After every render |
| 3 | Key prop in lists is used for | Reconciliation (identify changed elements) |
| 4 | React.memo prevents re-render when | Props haven't changed (shallow comparison) |
| 5 | useState is synchronous? | ❌ Batched, async in React 18 |
| 6 | Controlled vs uncontrolled component | Controlled=state managed in React; Uncontrolled=DOM manages it (ref) |
| 7 | useRef vs useState | useRef: doesn't trigger re-render; useState: does |
| 8 | StrictMode effect on effects | Runs effects twice (in dev) to detect side effects |
""",

    "JavaScript": """
## 🏋️ Practice & Interview Questions — JavaScript

### Predict / Trace
**Q1.** What prints?
```js
console.log(typeof null);
console.log(null instanceof Object);
```
<details><summary>Answer</summary>

`"object"` (historical JS bug), `false` (null is not an Object instance). This is a well-known JS quirk.
</details>

**Q2.** What is the output?
```js
console.log(1 + "2");
console.log("3" - 1);
console.log(true + false);
```
<details><summary>Answer</summary>

`"12"` (string concat), `2` (- coerces to number), `1` (true=1, false=0)
</details>

**Q3.** What prints and why?
```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
```
<details><summary>Answer</summary>

`3 3 3` — `var` is function-scoped, all closures share same `i`. By the time timeouts run, loop is done, i=3. **Fix**: use `let` (block-scoped) or `setTimeout(() => console.log(i), 0, i)`.
</details>

### Coding Problems
**Q4.** ⭐ Implement `debounce(fn, delay)`.
<details><summary>Solution</summary>

```js
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
```
</details>

**Q5.** ⭐ Implement `Promise.all` from scratch.
<details><summary>Solution</summary>

```js
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = [];
    let count = 0;
    promises.forEach((p, i) => {
      Promise.resolve(p)
        .then(val => { results[i] = val; if(++count === promises.length) resolve(results); })
        .catch(reject);
    });
    if(promises.length === 0) resolve([]);
  });
}
```
</details>

**Q6.** ⭐ Deep clone an object without `JSON.parse(JSON.stringify(...))`.
<details><summary>Solution</summary>

```js
function deepClone(obj) {
  if(obj === null || typeof obj !== 'object') return obj;
  if(obj instanceof Date) return new Date(obj);
  if(obj instanceof Array) return obj.map(deepClone);
  const clone = {};
  for(const key in obj) if(obj.hasOwnProperty(key)) clone[key] = deepClone(obj[key]);
  return clone;
}
// Modern: structuredClone(obj) — built-in, handles more types
```
</details>

**Q7.** ⭐⭐ Implement `curry` function.
<details><summary>Solution</summary>

```js
function curry(fn) {
  return function curried(...args) {
    if(args.length >= fn.length) return fn(...args);
    return function(...more) { return curried(...args, ...more); };
  };
}
const add = curry((a, b, c) => a + b + c);
add(1)(2)(3); // 6
add(1, 2)(3); // 6
```
</details>

**Q8.** ⭐⭐ Implement `memoize(fn)`.
<details><summary>Solution</summary>

```js
function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if(cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}
```
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | == vs === | == coerces types; === strict (no coercion) |
| 2 | `typeof undefined` | "undefined" |
| 3 | `typeof function(){}` | "function" |
| 4 | Prototype chain end | null |
| 5 | Event loop: microtasks vs macrotasks | Microtasks (Promises) run before macrotasks (setTimeout) |
| 6 | `const` prevents | Reassignment, not mutation |
| 7 | `var` vs `let` hoisting | var: hoisted+initialized to undefined; let: hoisted but in TDZ |
| 8 | `this` in arrow function | Lexical (inherited from enclosing scope) |
| 9 | Optional chaining `?.` | Returns undefined instead of throwing on null/undefined |
| 10 | Nullish coalescing `??` | Returns right side only if left is null/undefined (not 0 or '') |
""",

    "TypeScript": """
## 🏋️ Practice & Interview Questions — TypeScript

### Predict / Trace
**Q1.** What is the difference between `type` and `interface` in TypeScript?
<details><summary>Answer</summary>

`interface`: can be extended/implemented, supports declaration merging (multiple declarations merge), better for OOP patterns. `type`: can represent unions, intersections, primitives, tuples — more versatile. Both work for object shapes. Prefer `interface` for public API shapes, `type` for complex compositions.
</details>

**Q2.** Does this compile?
```typescript
type A = { a: string } & { a: number };
const x: A = { a: "hello" }; // ← ?
```
<details><summary>Answer</summary>

**Compile error** — the intersection requires `a` to be both `string` AND `number` simultaneously — impossible (`never` type). The type `A` is effectively `{ a: never }`.
</details>

### Coding Problems
**Q3.** ⭐ Implement `Readonly<T>` from scratch (mapped type).
<details><summary>Solution</summary>

```typescript
type MyReadonly<T> = { readonly [K in keyof T]: T[K] };
```
</details>

**Q4.** ⭐ Implement `Partial<T>` from scratch.
<details><summary>Solution</summary>

```typescript
type MyPartial<T> = { [K in keyof T]?: T[K] };
```
</details>

**Q5.** ⭐⭐ Implement `DeepReadonly<T>` — recursive.
<details><summary>Solution</summary>

```typescript
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};
```
</details>

**Q6.** ⭐⭐ Write a generic `Result<T, E>` type for error handling without exceptions.
<details><summary>Solution</summary>

```typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function divide(a: number, b: number): Result<number, string> {
  if(b === 0) return { ok: false, error: "Division by zero" };
  return { ok: true, value: a / b };
}

const result = divide(10, 2);
if(result.ok) console.log(result.value); // TypeScript knows it's number
else console.log(result.error);           // TypeScript knows it's string
```
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | `unknown` vs `any` | unknown: type-safe (must narrow before use); any: escape hatch (no checks) |
| 2 | `never` type means | Value that never occurs (unreachable code, empty union) |
| 3 | Discriminated union uses | Shared literal property to narrow type |
| 4 | `keyof T` | Union of T's property names |
| 5 | `T[K]` where K extends keyof T | Indexed access type — type of property K in T |
| 6 | `infer` keyword used in | Conditional types to extract nested types |
| 7 | `satisfies` keyword (TS 4.9) | Checks value satisfies type without widening the type |
""",

    "Python": """
## 🏋️ Practice & Interview Questions — Python

### Predict / Trace
**Q1.** What prints?
```python
x = [1,2,3]
y = x
y.append(4)
print(x)
```
<details><summary>Answer</summary>

`[1, 2, 3, 4]` — `y = x` copies the **reference**, not the list. Both point to the same object. Python lists are mutable. **Fix**: `y = x.copy()` or `y = x[:]` for shallow copy.
</details>

**Q2.** What is the GIL and how does it affect threading in Python?
<details><summary>Answer</summary>

**Global Interpreter Lock**: allows only ONE thread to execute Python bytecode at a time per process. CPU-bound threads don't run truly in parallel — only I/O-bound threads benefit (GIL released during I/O). For CPU parallelism: use `multiprocessing` (separate processes, separate GILs) or Go/Java. CPython 3.13 has experimental free-threaded mode (GIL disabled).
</details>

### Coding Problems
**Q3.** ⭐ FizzBuzz in Python — most Pythonic way.
<details><summary>Solution</summary>

```python
for i in range(1, 101):
    print("FizzBuzz" if i%15==0 else "Fizz" if i%3==0 else "Buzz" if i%5==0 else i)
```
</details>

**Q4.** ⭐ Flatten a nested list recursively.
<details><summary>Solution</summary>

```python
def flatten(lst):
    result = []
    for item in lst:
        if isinstance(item, list): result.extend(flatten(item))
        else: result.append(item)
    return result
# or with generator:
# def flatten(lst): yield from (flatten(x) if isinstance(x,list) else [x] for x in lst)
```
</details>

**Q5.** ⭐⭐ Implement LRU Cache using `functools.lru_cache` vs manual implementation.
<details><summary>Solution</summary>

```python
# Built-in:
from functools import lru_cache
@lru_cache(maxsize=128)
def fib(n): return n if n<2 else fib(n-1)+fib(n-2)

# Manual with OrderedDict:
from collections import OrderedDict
class LRUCache:
    def __init__(self, cap): self.cap=cap; self.cache=OrderedDict()
    def get(self, key):
        if key not in self.cache: return -1
        self.cache.move_to_end(key); return self.cache[key]
    def put(self, key, val):
        self.cache[key]=val; self.cache.move_to_end(key)
        if len(self.cache)>self.cap: self.cache.popitem(last=False)
```
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | List vs Tuple | List: mutable; Tuple: immutable, hashable |
| 2 | `is` vs `==` | `is`: identity (same object); `==`: equality (same value) |
| 3 | Python `dict` ordering (3.7+) | Insertion order (guaranteed) |
| 4 | Generator vs list comprehension | Generator: lazy, O(1) memory; list: eager, O(N) memory |
| 5 | `*args` vs `**kwargs` | *args: positional varargs tuple; **kwargs: keyword varargs dict |
| 6 | `__slots__` purpose | Prevents instance `__dict__`, reduces memory per object |
| 7 | `asyncio` is true parallelism? | ❌ Cooperative concurrency (single thread, yields on await) |
""",

    "DevOps": """
## 🏋️ Practice & Interview Questions — DevOps & Networking

### Predict / Trace
**Q1.** What happens when you type `https://google.com` in a browser?
<details><summary>Answer</summary>

1. DNS lookup: resolve `google.com` → IP (recursive resolver → root → TLD → authoritative NS)
2. TCP connection: 3-way handshake (SYN → SYN-ACK → ACK) to port 443
3. TLS handshake: ClientHello → ServerHello → certificate verification → key exchange → session keys
4. HTTP/2 GET request sent
5. Server responds with HTML (GZIP compressed)
6. Browser parses HTML → fetches CSS/JS → CSSOM + DOM → render tree → paint
</details>

**Q2.** `curl -I https://example.com` returns `Connection: keep-alive`. What does this mean?
<details><summary>Answer</summary>

The TCP connection won't be closed after the response — it stays open for reuse. Avoiding TCP+TLS handshake overhead for subsequent requests. HTTP/1.1 default; HTTP/2 always multiplexes on one connection.
</details>

### Coding / Commands
**Q3.** ⭐ Write a Dockerfile for a Java Spring Boot app — multi-stage build.
<details><summary>Solution</summary>

```dockerfile
# Stage 1: Build
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /app
COPY gradlew build.gradle settings.gradle ./
COPY gradle gradle/
RUN ./gradlew dependencies --no-daemon
COPY src src/
RUN ./gradlew bootJar --no-daemon

# Stage 2: Runtime (smaller image)
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
```
</details>

**Q4.** ⭐ Write a Kubernetes deployment with liveness and readiness probes.
<details><summary>Solution</summary>

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: app
        image: myapp:1.0
        resources:
          requests: { memory: "256Mi", cpu: "250m" }
          limits:   { memory: "512Mi", cpu: "500m" }
        livenessProbe:
          httpGet: { path: /actuator/health/liveness, port: 8080 }
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet: { path: /actuator/health/readiness, port: 8080 }
          initialDelaySeconds: 10
          periodSeconds: 5
```
</details>

**Q5.** ⭐⭐ Design a zero-downtime deployment strategy.
<details><summary>Answer</summary>

**Blue-Green**: run two identical envs, switch load balancer. Instant rollback. Double the infra cost.
**Rolling**: replace pods one-by-one. K8s default. Slower, but no extra infra.
**Canary**: route 5% traffic to new version, monitor errors/latency, gradually increase. Most risk-controlled.
**Feature flags**: deploy code but disable feature — decouple deployment from release.
</details>

### Interview Questions
**Q6.** TCP vs UDP — when to use each?
<details><summary>Answer</summary>

**TCP**: reliable (acknowledgments, retransmission), ordered, connection-based. Use for: HTTP, databases, SSH, email — anywhere correctness matters more than speed.
**UDP**: unreliable, unordered, connectionless. Use for: video streaming, gaming, DNS, VoIP — where speed matters more than perfect delivery, or app handles reliability itself.
</details>

**Q7.** What is a memory limit vs memory request in Kubernetes?
<details><summary>Answer</summary>

`request`: guaranteed allocation — K8s won't schedule pod on node with less available. `limit`: maximum usage — if exceeded, pod is OOM-killed. Set requests for scheduling accuracy; set limits to prevent noisy neighbor problems. Best practice: requests=expected P50 usage, limits=expected P99 surge.
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | HTTP status code 429 | Too Many Requests (rate limited) |
| 2 | HTTP status code 503 | Service Unavailable (server down/overloaded) |
| 3 | DNS record type for IP address | A record (IPv4), AAAA record (IPv6) |
| 4 | Load balancer Layer 4 vs 7 | L4: TCP/UDP level; L7: HTTP/application level (content-aware) |
| 5 | TLS/SSL terminates where | At load balancer (termination), or all the way to pod (passthrough) |
| 6 | `docker exec -it container bash` does | Opens interactive shell in running container |
| 7 | Kubernetes etcd stores | Cluster state (all K8s object definitions) |
| 8 | CI/CD — what triggers a pipeline? | Code push, PR, tag, schedule, or manual trigger |
""",

    "OOP": """
## 🏋️ Practice & Interview Questions — OOP & Design Patterns

### Predict / Trace
**Q1.** What design pattern does this code follow?
```java
Logger logger = Logger.getInstance();
```
<details><summary>Answer</summary>

**Singleton** — ensures only one Logger instance exists globally.
</details>

**Q2.** What SOLID principle is violated?
```java
class User {
    void login() { ... }
    void logout() { ... }
    void sendEmail() { ... }  // ← ?
    void generateReport() { ... }  // ← ?
}
```
<details><summary>Answer</summary>

**SRP (Single Responsibility)** — User class has 4 responsibilities: authentication, email, reporting. Should be split into: `AuthService`, `EmailService`, `ReportService`.
</details>

### Design Pattern Problems
**Q3.** ⭐ Implement Strategy pattern for payment processing.
<details><summary>Solution</summary>

```java
interface PaymentStrategy { void pay(int amount); }
class CreditCard implements PaymentStrategy { public void pay(int amount){ /*...*/ } }
class PayPal implements PaymentStrategy { public void pay(int amount){ /*...*/ } }
class UPI implements PaymentStrategy { public void pay(int amount){ /*...*/ } }

class PaymentContext {
    private PaymentStrategy strategy;
    void setStrategy(PaymentStrategy s){ this.strategy=s; }
    void processPayment(int amount){ strategy.pay(amount); }
}
// Switch strategy at runtime — open/closed principle!
```
</details>

**Q4.** ⭐⭐ Implement Observer pattern for event notification.
<details><summary>Solution</summary>

```java
interface Observer { void update(String event); }
interface Observable {
    void subscribe(Observer o); void unsubscribe(Observer o); void notify(String event);
}
class EventBus implements Observable {
    List<Observer> observers = new ArrayList<>();
    public void subscribe(Observer o){ observers.add(o); }
    public void unsubscribe(Observer o){ observers.remove(o); }
    public void notify(String event){ observers.forEach(o -> o.update(event)); }
}
```
</details>

**Q5.** ⭐⭐ Builder pattern for a complex configuration object.
<details><summary>Solution</summary>

```java
class ServerConfig {
    private final String host; private final int port; private final int timeout;
    private ServerConfig(Builder b){ host=b.host; port=b.port; timeout=b.timeout; }

    static class Builder {
        String host="localhost"; int port=8080; int timeout=30;
        Builder host(String h){ host=h; return this; }
        Builder port(int p){ port=p; return this; }
        Builder timeout(int t){ timeout=t; return this; }
        ServerConfig build(){ return new ServerConfig(this); }
    }
}
// ServerConfig config = new ServerConfig.Builder().host("prod.com").port(443).build();
```
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | SOLID: O stands for | Open/Closed Principle |
| 2 | Factory vs Abstract Factory | Factory: one product; Abstract Factory: family of products |
| 3 | Composition over inheritance means | Prefer has-a (field) over is-a (extends) for flexibility |
| 4 | Decorator pattern purpose | Add behavior dynamically without subclassing |
| 5 | Facade pattern purpose | Simplified interface to complex subsystem |
| 6 | Proxy pattern types | Virtual, protective, remote, caching |
| 7 | Command pattern encapsulates | Request as an object (supports undo/redo) |
| 8 | Template Method pattern | Defines algorithm skeleton, subclasses fill in steps |
""",
}

# ─────────────────────────────────────────────────────────────────────────────
# FILE ROUTING — map each file to its question bank key
# ─────────────────────────────────────────────────────────────────────────────

def get_questions_for_file(filepath):
    name = os.path.basename(filepath).lower()
    path = filepath.lower()

    # Already has practice section?
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        if '## 🏋️ Practice' in content or '# 🏋️ PART 11: PRACTICE' in content:
            return None  # Already has questions
    except:
        return None

    # Route by filename/path keywords
    if any(k in name for k in ['array', '01b_arrays', '2d_array', 'matrix']):
        return QUESTION_BANKS["Arrays"]
    if any(k in name for k in ['linked', '01c_linked']):
        return QUESTION_BANKS["LinkedList"]
    if any(k in name for k in ['stack', 'queue', '01d_stack']):
        return QUESTION_BANKS["Stack"]
    if any(k in name for k in ['hash', '01e_hash', 'hashtable']):
        return QUESTION_BANKS["HashTable"]
    if any(k in name for k in ['tree', 'heap', '01f_tree', '16_heap']):
        return QUESTION_BANKS["Trees"]
    if any(k in name for k in ['algorithm', 'sort', 'search', 'dynamic', 'graph', 'dp', 'greedy']):
        return QUESTION_BANKS["Algorithms"]
    if any(k in name for k in ['sql', 'database', 'query']):
        return QUESTION_BANKS["SQL"]
    if any(k in name for k in ['exception', 'error', 'ch04_generic']):
        return QUESTION_BANKS["Exception"]
    if any(k in name for k in ['generic']):
        return QUESTION_BANKS["Generics"]
    if any(k in name for k in ['ch15_concurr', 'ch16_concurr', 'ch17_concurr', 'concurr', 'thread', 'lock', 'sync']):
        return QUESTION_BANKS["Concurrency"]
    if any(k in name for k in ['jmm', 'gc_deep', 'memory_model', 'ch18']):
        return QUESTION_BANKS["JMM"]
    if any(k in name for k in ['react', '15_react']):
        return QUESTION_BANKS["React"]
    if 'javascript' in path or '16_javascript' in path or name.startswith('js_') or 'js_' in name:
        return QUESTION_BANKS["JavaScript"]
    if 'typescript' in path or '17_type' in path:
        return QUESTION_BANKS["TypeScript"]
    if 'python' in path or '21_python' in path:
        return QUESTION_BANKS["Python"]
    if any(k in path for k in ['devops', '22_devops', 'networking', 'docker', 'kubernetes', 'cicd', 'cloud']):
        return QUESTION_BANKS["DevOps"]
    if any(k in name for k in ['oop', 'design_pattern', 'solid', 'design', 'pattern']):
        return QUESTION_BANKS["OOP"]

    # Generic fallback for unmatched content files
    return None


# ─────────────────────────────────────────────────────────────────────────────
# SKIP FILTERS
# ─────────────────────────────────────────────────────────────────────────────

SKIP_NAME_PATTERNS = [
    '00_index', '00_master', '00_textbook', '00_daily',
    'day_0', 'day_1', 'day_2', 'day_3',  # daily logs
    'daily_habits', '15_day_pattern', 'sprint_index',
    'ds_problem_bridges', 'pdf_coverage', 'pdf_topic',
    'diagram-audit', 'diagram-authoring',
    'add_practice', 'replace_ascii', 'expand_array',  # scripts
]

def should_skip(filepath):
    name = os.path.basename(filepath).lower()
    for pat in SKIP_NAME_PATTERNS:
        if pat in name:
            return True
    return False


# ─────────────────────────────────────────────────────────────────────────────
# MAIN RUNNER
# ─────────────────────────────────────────────────────────────────────────────

def main():
    updated = 0
    skipped = 0
    no_match = 0

    for root, dirs, files in os.walk(BASE):
        # Skip hidden and archive dirs
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != '_archive']

        for file in sorted(files):
            if not file.endswith('.md'):
                continue
            filepath = os.path.join(root, file)

            if should_skip(filepath):
                skipped += 1
                continue

            questions = get_questions_for_file(filepath)

            if questions is None:
                no_match += 1
                continue

            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()

                # Append before last navigation line if present, else just append
                nav_patterns = [
                    '\n> **Navigation**',
                    '\n> **Key Takeaway**',
                ]

                appended = False
                for pat in nav_patterns:
                    idx = content.rfind(pat)
                    if idx != -1:
                        new_content = content[:idx] + '\n\n---\n' + questions + '\n' + content[idx:]
                        appended = True
                        break

                if not appended:
                    new_content = content.rstrip() + '\n\n---\n' + questions + '\n'

                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)

                print(f"[OK] Updated: {os.path.relpath(filepath, BASE)}")
                updated += 1

            except Exception as e:
                print(f"[ERR] Error on {filepath}: {e}")

    print(f"\n{'='*60}")
    print(f"  Files updated : {updated}")
    print(f"  Skipped       : {skipped}")
    print(f"  No match      : {no_match}")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
