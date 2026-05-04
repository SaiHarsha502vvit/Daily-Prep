# Cleanup script: Remove all garbage **Flow:** + mermaid blocks from .md files
# These auto-generated blocks add zero value and just repeat truncated ASCII content

$folders = @(
    "e:\Dev_World\04_Practice\Daily-Prep\16_JavaScript",
    "e:\Dev_World\04_Practice\Daily-Prep\15_React_Frontend",
    "e:\Dev_World\04_Practice\Daily-Prep\17_TypeScript",
    "e:\Dev_World\04_Practice\Daily-Prep\18_CSS_Complete"
)

$totalRemoved = 0
$filesModified = 0

foreach ($folder in $folders) {
    $files = Get-ChildItem -Path $folder -Filter "*.md" -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw -Encoding UTF8
        
        # Pattern: **Flow:** followed by numbered list, then ```mermaid block ending with ```
        # The regex captures from **Flow:** through the closing ``` of the mermaid block
        # plus any trailing blank lines
        $pattern = '(?m)\r?\n\*\*Flow:\*\*\r?\n(?:.*\r?\n)*?```mermaid\r?\n(?:.*\r?\n)*?```\r?\n'
        
        $matches = [regex]::Matches($content, $pattern)
        $count = $matches.Count
        
        if ($count -gt 0) {
            $newContent = [regex]::Replace($content, $pattern, "`n")
            Set-Content -Path $file.FullName -Value $newContent -NoNewline -Encoding UTF8
            Write-Output "  CLEANED: $($file.Name) - removed $count block(s)"
            $totalRemoved += $count
            $filesModified++
        }
    }
}

Write-Output ""
Write-Output "TOTAL: Removed $totalRemoved garbage blocks from $filesModified files"
