"""
Fix all broken internal .md links in the SDET module.

Run from repo root:  python tools/fix_links.py
Then verify with:    python tools/check_links.py
"""
import re
import os
from pathlib import Path

ROOT = Path("21_SDET_Playwright_Automation")

# ─────────────────────────────────────────────────────────────────────────────
# STEP 1 — delete Copilot-era orphan files (same chapter numbers as our files
#          but different names; not referenced from any reading path)
# ─────────────────────────────────────────────────────────────────────────────
ORPHAN_FILES = [
    ROOT / "05_Advanced_Topics" / "46_Playwright_Config_Deep_Dive.md",
    ROOT / "05_Advanced_Topics" / "47_File_Uploads_Downloads_Media.md",
    ROOT / "05_Advanced_Topics" / "48_Trace_Viewer_Video_Mastery.md",
    ROOT / "05_Advanced_Topics" / "49_Component_Testing_Playwright_CT.md",
    ROOT / "05_Advanced_Topics" / "50_Real_World_SPA_Tabs_Menuitems_No_IDs.md",
    ROOT / "05_Advanced_Topics" / "51_Login_Fixture_Architecture.md",
    ROOT / "05_Advanced_Topics" / "52_UI_Flow_Fixtures.md",
]

deleted = 0
for f in ORPHAN_FILES:
    if f.exists():
        f.unlink()
        print(f"  DELETED  {f.relative_to(ROOT.parent)}")
        deleted += 1
    else:
        print(f"  SKIP (already gone)  {f}")

print(f"\n-> {deleted} orphan files removed\n")

# ─────────────────────────────────────────────────────────────────────────────
# STEP 2 — fix ../../../ -> ../../ in cross-module links
#          (ch33–36 in 06_SDET_to_SDE_Bridge/, ch37–38 in 07_Specialised_Testing/)
#          These files are 2 levels deep inside the module, but the links use
#          3 levels, which overshoots the repo root.
# ─────────────────────────────────────────────────────────────────────────────
DEPTH_FIX_FILES = [
    ROOT / "06_SDET_to_SDE_Bridge" / "33_SDET_to_SDE_CS_Thinking.md",
    ROOT / "06_SDET_to_SDE_Bridge" / "34_Algorithms_in_Test_Automation.md",
    ROOT / "06_SDET_to_SDE_Bridge" / "35_OOP_Design_Patterns_for_SDETs.md",
    ROOT / "06_SDET_to_SDE_Bridge" / "36_TypeScript_Type_System_Mastery.md",
    ROOT / "07_Specialised_Testing"  / "37_Performance_Testing_Lighthouse_k6.md",
    ROOT / "07_Specialised_Testing"  / "38_Contract_Testing_Pact.md",
]

depth_fixed = 0
for f in DEPTH_FIX_FILES:
    if not f.exists():
        print(f"  MISSING  {f}")
        continue
    original = f.read_text(encoding="utf-8")
    updated = original.replace("../../../", "../../")
    if updated != original:
        f.write_text(updated, encoding="utf-8")
        count = original.count("../../../")
        print(f"  FIXED ×{count}  {f.relative_to(ROOT.parent)}")
        depth_fixed += count
    else:
        print(f"  SKIP (no ../../../)  {f.relative_to(ROOT.parent)}")

print(f"\n-> {depth_fixed} depth-prefix replacements\n")

# ─────────────────────────────────────────────────────────────────────────────
# STEP 3 — specific wrong paths
# ─────────────────────────────────────────────────────────────────────────────
SPECIFIC_FIXES: list[tuple[Path, str, str]] = [
    # ch08: next-chapter nav points at wrong folder + wrong number
    (
        ROOT / "02_Core_Architecture" / "08_Browser_Internals_for_SDETs.md",
        "../09_Dynamics365_CRM_Testing.md",
        "../03_D365_And_Patterns/10_Dynamics365_CRM_Testing.md",
    ),
    # ch44: three links to a chapter that was never written
    #       (45_Complete_Playwright_API_Reference.md doesn't exist;
    #        the actual ch45 is 45_AI_Agents_MCP_And_Playwright.md in same folder)
    (
        ROOT / "05_Advanced_Topics" / "44_Enterprise_API_Client_Library.md",
        "../45_Complete_Playwright_API_Reference.md",
        "./45_AI_Agents_MCP_And_Playwright.md",
    ),
    # ch50: next-chapter nav uses ./ but ch51 is in 07_Specialised_Testing/
    (
        ROOT / "05_Advanced_Topics" / "50_Email_Service_Testing.md",
        "./51_Secrets_Management_For_SDETs.md",
        "../07_Specialised_Testing/51_Secrets_Management_For_SDETs.md",
    ),
]

specific_fixed = 0
for filepath, old, new in SPECIFIC_FIXES:
    if not filepath.exists():
        print(f"  MISSING  {filepath}")
        continue
    original = filepath.read_text(encoding="utf-8")
    if old not in original:
        print(f"  SKIP (not found)  '{old}'  in  {filepath.name}")
        continue
    updated = original.replace(old, new)
    filepath.write_text(updated, encoding="utf-8")
    count = original.count(old)
    print(f"  FIXED ×{count}  {filepath.name}: '{old}' -> '{new}'")
    specific_fixed += count

print(f"\n-> {specific_fixed} specific replacements\n")
print("Done. Run  python tools/check_links.py  to verify.")
