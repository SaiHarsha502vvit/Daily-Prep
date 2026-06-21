$c = Get-Content '07_Modern_Java/Ch50_SB_DSA_Applications.md' -Raw
$c = [regex]::Replace($c, '(?s)</details>\s*<details><summary>Answer</summary>\s*Algorithmic complexity\. A SQL `LIKE ''prefix%''` query \(even if indexed\) requires B-Tree range scans that degrade severely as the dataset grows into millions of strings\. A Trie stores characters hierarchically\. Finding all words that start with "app" takes `O\(L \+ R\)` time, where `L` is the length of the prefix \(3\) and `R` is the number of matching results\. It is essentially an instant `O\(1\)` pointer traversal in memory, perfectly suited for real-time keystroke matching\.\s*</details>\s*', '</details>

')
Set-Content '07_Modern_Java/Ch50_SB_DSA_Applications.md' $c -NoNewline
