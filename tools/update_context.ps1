[CmdletBinding()]
param(
    [ValidateSet("update", "check")]
    [string]$Mode = "check",

    [switch]$StrictFences
)

$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ContextDir = Join-Path $RepoRoot "00_CONTEXT"
$RegistryPath = Join-Path $ContextDir "FILE_REGISTRY.md"
$ManifestPath = Join-Path $ContextDir "CONTEXT_MANIFEST.json"

function Get-RelativePath {
    param([string]$FullName)
    return $FullName.Substring($RepoRoot.Length + 1).Replace("\", "/")
}

function Get-TopLevelName {
    param([string]$RelativePath)

    if ($RelativePath -like "*/*") {
        return (($RelativePath -split "/")[0])
    }

    return "(root)"
}

function Test-SkippedPath {
    param([string]$RelativePath)

    return (
        $RelativePath -like "_archive/*" -or
        $RelativePath -like "00_CONTEXT/*" -or
        $RelativePath -like ".git/*" -or
        $RelativePath -like ".venv/*" -or
        $RelativePath -like ".vscode/*" -or
        $RelativePath -like ".claude/*"
    )
}

function Escape-MarkdownCell {
    param([string]$Value)
    if ($null -eq $Value -or $Value.Trim().Length -eq 0) {
        return "-"
    }

    return ($Value -replace "\|", "\|" -replace "`r?`n", " ").Trim()
}

function Get-Title {
    param(
        [string[]]$Lines,
        [string]$RelativePath
    )

    foreach ($line in ($Lines | Select-Object -First 120)) {
        if ($line -match "^\s{0,3}#{1,3}\s+(.+?)\s*$") {
            return (($Matches[1] -replace "\s+", " ").Trim())
        }
    }

    $name = [System.IO.Path]::GetFileNameWithoutExtension($RelativePath)
    return (($name -replace "_", " ") -replace "-", " ").Trim()
}

function Get-FolderRole {
    param([string]$RelativePath)

    $first = Get-TopLevelName -RelativePath $RelativePath

    $roles = @{
        ".github" = "Repository agent instructions and GitHub metadata"
        "01_Getting_Started" = "Onboarding, study planning, and repo usage guidance"
        "02_Data_Structures" = "Data structure concepts, internals, variants, and production use"
        "03_Algorithms" = "Algorithm thinking, patterns, complexity, and advanced algorithm design"
        "04_Patterns_Templates" = "Reusable coding patterns, templates, triggers, and constraint selection"
        "05_Problem_Solving" = "Practice problem families and applied coding drills"
        "06_OOP_Design" = "OOP, SOLID, design patterns, LLD, and design reasoning"
        "07_Modern_Java" = "Java, JVM, Spring Boot, JPA, security, testing, and distributed Java services"
        "08_SQL" = "SQL, database querying, analytics, transactions, indexes, and internals"
        "09_Career_Reference" = "Career, project, interview, and DSA reference synthesis"
        "10_Enterprise_Systems" = "ERP, DDD, finance/order/inventory workflows, and enterprise systems"
        "12_Daily_Practice" = "Daily drills, practice plans, and repetition workflows"
        "13_Developer_Essentials" = "Developer tooling, Git, Docker, CI/CD, networking, servers, and concurrency"
        "14_Mental_Models" = "Thinking frameworks, pattern triggers, and reasoning guides"
        "15_React_Frontend" = "React components, hooks, state, architecture, and frontend reasoning"
        "16_JavaScript" = "JavaScript language, runtime, async, DOM, browser APIs, and debugging"
        "17_TypeScript" = "TypeScript type system, generics, narrowing, and practical typing"
        "18_CSS_Complete" = "CSS layout, styling architecture, responsive UI, and visual systems"
        "19_Frontend_Integration" = "Frontend tooling, debugging, performance, accessibility, and integration"
        "20_Interview_Mastery" = "Interview synthesis, final prep, scenarios, and problem explanation"
        "25_Python_ML_DL_NLP" = "Python, ML, deep learning, NLP, LLM/RAG, and MLOps"
        "22_DevOps" = "DevOps, Linux, networking, containers, Kubernetes, CI/CD, SRE, and deployment"
    }

    if ($RelativePath -eq "AGENTS.md") { return "Agent operating manual and required workflow" }
    if ($RelativePath -eq "AGENT_HANDOFF.md") { return "Historical handoff snapshot; useful but not authoritative" }
    if ($RelativePath -eq "00_MASTER_INDEX.md") { return "Root navigation and master learning index" }
    if ($RelativePath -eq "00_TEXTBOOK_PREFACE.md") { return "Textbook preface, reading order, and prerequisites" }
    if ($RelativePath -like "*.prompt.md") { return "Prompt or knowledge extraction instruction file" }
    if ($RelativePath -like "*/CONTEXT.md") { return "Folder-level agent context and writing boundaries" }
    if ($RelativePath -like "*/00_INDEX.md") { return "Module index and local navigation" }

    if ($roles.ContainsKey($first)) {
        return $roles[$first]
    }

    return "Active repository Markdown content"
}

function Get-StyleSignals {
    param(
        [string]$Text,
        [int]$CodeFenceCount
    )

    $signals = New-Object System.Collections.Generic.List[string]

    if ($Text -match "Section Challenge|Challenge 1|Challenge 2") { $signals.Add("challenges") }
    if ($Text -match "<details>") { $signals.Add("details") }
    if ($Text -match "Constraint Lens|Constraint-Based|Given Constraints|constraints") { $signals.Add("constraints") }
    if ($Text -match "\bWHY\b|\bWHAT\b|\bWHERE\b|\bWHEN\b|\bWHO\b|\bHOW\b") { $signals.Add("5W1H") }
    if ($CodeFenceCount -ge 10) { $signals.Add("code-heavy") }
    if ($Text -match "```java|public class|@Service|@Transactional|Spring") { $signals.Add("java/spring") }
    if ($Text -match "```sql|\bSELECT\b|\bJOIN\b|\bCTE\b|\bWINDOW\b") { $signals.Add("sql") }
    if ($Text -match "```js|```javascript|Promise|async|await|DOM") { $signals.Add("javascript") }
    if ($Text -match "```ts|TypeScript|interface |type ") { $signals.Add("typescript") }
    if ($Text -match "React|useState|useEffect|useContext|JSX") { $signals.Add("react") }
    if ($Text -match "CSS|flexbox|grid|selector|responsive") { $signals.Add("css") }
    if ($Text -match "BFS|DFS|DP|sliding window|two pointers|prefix sum|Dijkstra|greedy") { $signals.Add("dsa/algo") }
    if ($Text -match "Docker|Kubernetes|CI/CD|deployment|Linux") { $signals.Add("devops") }
    if ($Text -match "ERP|invoice|order|inventory|ledger|payment") { $signals.Add("enterprise") }

    if ($signals.Count -eq 0) {
        return @("general")
    }

    return @($signals | Select-Object -Unique)
}

function Get-Inventory {
    $files = Get-ChildItem -LiteralPath $RepoRoot -Recurse -File -Filter "*.md" |
        ForEach-Object {
            $relative = Get-RelativePath $_.FullName
            if (Test-SkippedPath $relative) {
                return
            }

            $text = Get-Content -LiteralPath $_.FullName -Raw
            $lines = $text -split "\r?\n"
            $codeFenceCount = ([regex]::Matches($text, '(?m)^```')).Count
            $challengeCount = ([regex]::Matches($text, 'Section Challenge|Challenge\s+\d+')).Count
            $headingCount = ([regex]::Matches($text, '(?m)^\s{0,3}#{1,6}\s+')).Count
            $sha = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()

            [pscustomobject]@{
                path = $relative
                folder = (Get-TopLevelName -RelativePath $relative)
                title = Get-Title -Lines $lines -RelativePath $relative
                role = Get-FolderRole -RelativePath $relative
                sha256 = $sha
                shortHash = $sha.Substring(0, 12)
                bytes = $_.Length
                headings = $headingCount
                codeFences = $codeFenceCount
                codeFencesBalanced = (($codeFenceCount % 2) -eq 0)
                challengeCount = $challengeCount
                styleSignals = @(Get-StyleSignals -Text $text -CodeFenceCount $codeFenceCount)
            }
        }

    return @($files | Sort-Object path)
}

function Write-Registry {
    param([object[]]$Inventory)

    if (-not (Test-Path -LiteralPath $ContextDir)) {
        New-Item -ItemType Directory -Path $ContextDir | Out-Null
    }

    $generatedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss zzz")
    $folderGroups = $Inventory | Group-Object folder | Sort-Object Name

    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add("# File Registry")
    $lines.Add("")
    $lines.Add("> Generated by ``tools/update_context.ps1 -Mode update`` on $generatedAt.")
    $lines.Add("> Do not hand-edit the generated inventory table during normal work.")
    $lines.Add("")
    $lines.Add("## How To Use")
    $lines.Add("")
    $lines.Add("1. Find the file path before editing.")
    $lines.Add("2. Read the title, role, and style signals.")
    $lines.Add("3. Read the nearest folder ``CONTEXT.md`` for local rules.")
    $lines.Add("4. After edits, regenerate this registry and run the freshness check.")
    $lines.Add("")
    $lines.Add("## Folder Counts")
    $lines.Add("")
    $lines.Add("| Folder | Files |")
    $lines.Add("|---|---:|")

    foreach ($group in $folderGroups) {
        $lines.Add("| $(Escape-MarkdownCell $group.Name) | $($group.Count) |")
    }

    $lines.Add("")
    $lines.Add("## Active File Inventory")
    $lines.Add("")
    $lines.Add("| Path | Title | Role | Signals | Hash |")
    $lines.Add("|---|---|---|---|---|")

    foreach ($item in $Inventory) {
        $signals = ($item.styleSignals -join ", ")
        $hashCell = "``$($item.shortHash)``"
        $lines.Add("| $(Escape-MarkdownCell $item.path) | $(Escape-MarkdownCell $item.title) | $(Escape-MarkdownCell $item.role) | $(Escape-MarkdownCell $signals) | $hashCell |")
    }

    Set-Content -LiteralPath $RegistryPath -Value $lines -Encoding UTF8
}

function Write-Manifest {
    param([object[]]$Inventory)

    $manifest = [pscustomobject]@{
        schemaVersion = 1
        generatedAt = (Get-Date).ToString("o")
        repoRoot = $RepoRoot
        activeFileCount = $Inventory.Count
        files = $Inventory
    }

    $manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $ManifestPath -Encoding UTF8
}

function Test-ContextFreshness {
    param([object[]]$Current)

    if (-not (Test-Path -LiteralPath $ManifestPath)) {
        Write-Host "Context manifest missing: $ManifestPath"
        Write-Host "Run: powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode update"
        return 2
    }

    $manifest = Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json
    $previousByPath = @{}
    foreach ($file in $manifest.files) {
        $previousByPath[$file.path] = $file
    }

    $currentByPath = @{}
    foreach ($file in $Current) {
        $currentByPath[$file.path] = $file
    }

    $newFiles = @($Current | Where-Object { -not $previousByPath.ContainsKey($_.path) })
    $deletedFiles = @($manifest.files | Where-Object { -not $currentByPath.ContainsKey($_.path) })
    $changedFiles = @($Current | Where-Object {
        $previousByPath.ContainsKey($_.path) -and $previousByPath[$_.path].sha256 -ne $_.sha256
    })
    $unbalancedFences = @($Current | Where-Object { -not $_.codeFencesBalanced })

    $hasStaleFiles = ($newFiles.Count -gt 0 -or $deletedFiles.Count -gt 0 -or $changedFiles.Count -gt 0)
    $hasFenceWarnings = ($unbalancedFences.Count -gt 0)

    if (-not $hasStaleFiles -and -not $hasFenceWarnings) {
        Write-Host "Context fresh: $($Current.Count) active Markdown files match the manifest."
        return 0
    }

    if (-not $hasStaleFiles -and $hasFenceWarnings) {
        Write-Host "Context fresh: $($Current.Count) active Markdown files match the manifest."
        Write-Host "Structural warning: $($unbalancedFences.Count) files have unbalanced Markdown code-fence counts."
        Write-Host "Use -StrictFences to make these warnings fail the check."
        Write-Host ""
        $unbalancedFences | Select-Object -First 50 | ForEach-Object { Write-Host "  ! $($_.path) ($($_.codeFences) fences)" }

        if ($StrictFences) {
            return 1
        }

        return 0
    }

    Write-Host "Context stale."
    Write-Host ""

    if ($newFiles.Count -gt 0) {
        Write-Host "New files:"
        $newFiles | Select-Object -First 30 | ForEach-Object { Write-Host "  + $($_.path)" }
    }

    if ($deletedFiles.Count -gt 0) {
        Write-Host "Deleted files:"
        $deletedFiles | Select-Object -First 30 | ForEach-Object { Write-Host "  - $($_.path)" }
    }

    if ($changedFiles.Count -gt 0) {
        Write-Host "Changed files:"
        $changedFiles | Select-Object -First 50 | ForEach-Object { Write-Host "  * $($_.path)" }
    }

    if ($unbalancedFences.Count -gt 0) {
        Write-Host "Structural warnings: files with unbalanced Markdown code-fence counts:"
        $unbalancedFences | Select-Object -First 50 | ForEach-Object { Write-Host "  ! $($_.path) ($($_.codeFences) fences)" }
    }

    Write-Host ""
    Write-Host "After reviewing and updating human context, run:"
    Write-Host "  powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode update"

    return 1
}

$inventory = Get-Inventory

if ($Mode -eq "update") {
    Write-Registry -Inventory $inventory
    Write-Manifest -Inventory $inventory
    Write-Host "Updated context registry and manifest for $($inventory.Count) active Markdown files."
    Write-Host "Registry: $RegistryPath"
    Write-Host "Manifest: $ManifestPath"
    exit 0
}

$result = Test-ContextFreshness -Current $inventory
exit $result
