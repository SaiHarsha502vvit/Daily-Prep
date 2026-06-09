#!/usr/bin/env python3
"""
Generate redirect stubs for the old chapter files.
Each stub is a tiny markdown pointing to the new location.
"""
import os
from pathlib import Path

# Map: relative_path -> (target_relative_path, brief_description)
STUBS = {
    # ── Root onboarding files ──
    "00_Start_Here.md": ("../README.md", "Master index now lives in README.md."),
    "00_INDEX.md": ("../README.md", "Master index now lives in README.md."),

    # ── 01_Foundations ──
    "01_Foundations/00_SDET_Foundations_Mindset.md": ("../learn/01_mindset.md", "The SDET mindset chapter moved to learn/."),
    "01_Foundations/01_Playwright_TS_Basics.md": ("../reference/01_quickstart.md", "Install + first test consolidated into the quickstart."),
    "01_Foundations/02_Enterprise_Locators_XPath.md": ("../reference/03_locators.md", "Locator strategy is now the locators reference doc."),
    "01_Foundations/03_Browser_Console_Scripting.md": ("../deep_dives/security.md", "Console scripts for security testing moved to security deep dive."),
    "01_Foundations/04_JS_TS_For_Automation.md": ("../learn/02_typescript_for_tests.md", "TS for tests is now learn/02."),

    # ── 02_Core_Architecture ──
    "02_Core_Architecture/05_POM_Architecture_Deep_Dive.md": ("../learn/03_pom.md", "POM thinking moved to learn/03."),
    "02_Core_Architecture/06_Custom_Fixtures_Architecture.md": ("../reference/04_fixtures.md", "Fixture architecture is now the reference doc."),
    "02_Core_Architecture/07_test_step_E2E_Architecture.md": ("../learn/04_architecture_walkthrough.md", "The 15-step E2E walkthrough moved to learn/04."),
    "02_Core_Architecture/08_Browser_Internals_for_SDETs.md": ("../learn/05_browser_internals.md", "Browser internals moved to learn/05."),
    "02_Core_Architecture/09_Parallel_Execution_Workers.md": ("../reference/07_parallelism.md", "Workers + parallelism is now the parallelism reference."),
    "02_Core_Architecture/55_Inspector_TraceViewer_UIMode_Walkthrough.md": ("../reference/11_reporting.md", "Inspector / Trace / UI Mode moved into the reporting reference."),
    "02_Core_Architecture/56_Playwright_Config_Deep_Dive.md": ("../reference/02_config.md", "Config deep dive is now the config reference."),

    # ── 03_D365_And_Patterns ──
    "03_D365_And_Patterns/10_Dynamics365_CRM_Testing.md": ("../deep_dives/d365.md", "D365 testing is now the D365 deep dive."),
    "03_D365_And_Patterns/11_CrossSite_Pattern1_Sequential_Flow.md": ("../deep_dives/cross_site_patterns.md#3-pattern-1--sequential-flow", "Pattern 1 is in the cross-site patterns deep dive."),
    "03_D365_And_Patterns/12_CrossSite_Pattern2_NewTab_SharedContext.md": ("../deep_dives/cross_site_patterns.md#4-pattern-2--new-tab--shared-context", "Pattern 2 is in the cross-site patterns deep dive."),
    "03_D365_And_Patterns/13_CrossSite_Pattern3_Dual_BrowserContext.md": ("../deep_dives/cross_site_patterns.md#5-pattern-3--dual-browser-contexts", "Pattern 3 is in the cross-site patterns deep dive."),
    "03_D365_And_Patterns/14_CrossSite_Pattern4_Token_Magic_Link.md": ("../deep_dives/cross_site_patterns.md#6-pattern-4--token--magic-link", "Pattern 4 is in the cross-site patterns deep dive."),
    "03_D365_And_Patterns/15_CrossSite_Pattern5_UI_API_Side_Effects.md": ("../deep_dives/cross_site_patterns.md#7-pattern-5--ui--api-side-effects", "Pattern 5 is in the cross-site patterns deep dive."),
    "03_D365_And_Patterns/16_CrossSite_Pattern6_StorageState_Chaining.md": ("../deep_dives/cross_site_patterns.md#8-pattern-6--storagestate-chaining", "Pattern 6 is in the cross-site patterns deep dive."),
    "03_D365_And_Patterns/17_D365_Advanced_Timing_Patterns.md": ("../deep_dives/d365.md#3-the-two-phase-render", "D365 timing patterns moved into the D365 deep dive."),

    # ── 04_Enterprise_Architecture ──
    "04_Enterprise_Architecture/18_Mega_POM_Architecture.md": ("../learn/03_pom.md#the-mega-pom", "Mega POM coverage moved to learn/03."),
    "04_Enterprise_Architecture/21_Enterprise_Project_Structure.md": ("../learn/06_enterprise_structure.md", "Project structure is now learn/06."),
    "04_Enterprise_Architecture/22_Headers_Payloads_Endpoints_Factory.md": ("../reference/06_api_testing.md#8-headers--factory-pattern", "Factories are now in the API testing reference."),
    "04_Enterprise_Architecture/23_APIUtils_HTTP_Library.md": ("../reference/06_api_testing.md#11-the-apiutils-wrapper", "APIUtils is now in the API testing reference."),
    "04_Enterprise_Architecture/24_Test_Script_Architecture.md": ("../learn/04_architecture_walkthrough.md", "Test script architecture is now learn/04."),

    # ── 05_Advanced_Topics ──
    "05_Advanced_Topics/19_Advanced_Console_Scripts_Security.md": ("../deep_dives/security.md", "Console scripts for security testing moved to the security deep dive."),
    "05_Advanced_Topics/25_CICD_Integration_GitHub_Azure.md": ("../reference/10_ci_docker.md", "CI integration is now the CI + Docker reference."),
    "05_Advanced_Topics/26_Flakiness_Diagnosis_and_Fixing.md": ("../reference/08_reliability.md", "Flakiness is now the reliability reference."),
    "05_Advanced_Topics/27_Advanced_TypeScript_for_SDETs.md": ("../learn/02_typescript_for_tests.md", "TS patterns moved to learn/02."),
    "05_Advanced_Topics/28_Test_Data_Lifecycle_and_Cleanup.md": ("../reference/12_data.md", "Data lifecycle is now the data reference."),
    "05_Advanced_Topics/29_Visual_Regression_Testing.md": ("../deep_dives/visual_regression.md", "Visual regression is now a deep dive."),
    "05_Advanced_Topics/30_Database_Verification_Direct_SQL.md": ("../reference/12_data.md#10-direct-sql", "DB verification is in the data reference."),
    "05_Advanced_Topics/31_API_Mocking_page_route.md": ("../reference/13_mocking.md", "API mocking is now the mocking reference."),
    "05_Advanced_Topics/42_Polling_Async_Data_Patterns.md": ("../reference/08_reliability.md#5-expectpoll", "Polling patterns are in the reliability reference."),
    "05_Advanced_Topics/43_Real_World_SDET_War_Stories.md": ("../reference/08_reliability.md#15-war-stories", "War stories are in the reliability reference."),
    "05_Advanced_Topics/44_Enterprise_API_Client_Library.md": ("../learn/06_enterprise_structure.md", "The 5-layer API library is in learn/06 + reference/06_api_testing.md."),
    "05_Advanced_Topics/45_AI_Agents_MCP_And_Playwright.md": ("../deep_dives/ai_mcp.md", "AI + MCP is now a deep dive."),
    "05_Advanced_Topics/46_BDD_With_Cucumber.md": ("../deep_dives/bdd_cucumber.md", "BDD with Cucumber is now a deep dive."),
    "05_Advanced_Topics/47_Allure_ReportPortal.md": ("../reference/11_reporting.md#11-allure-integration", "Reporting integrations are in the reporting reference."),
    "05_Advanced_Topics/48_Sharding_And_Test_Selection.md": ("../reference/07_parallelism.md#6-sharding", "Sharding is in the parallelism reference."),
    "05_Advanced_Topics/49_Feature_Flag_Testing.md": ("../deep_dives/feature_flags.md", "Feature flags is now a deep dive."),
    "05_Advanced_Topics/50_Email_Service_Testing.md": ("../deep_dives/email_testing.md", "Email testing is now a deep dive."),
    "05_Advanced_Topics/52_Component_Testing_With_Playwright_CT.md": ("../deep_dives/component_testing.md", "Component testing is now a deep dive."),
    "05_Advanced_Topics/54_Synthetic_Monitoring.md": ("../deep_dives/synthetic_monitoring.md", "Synthetic monitoring is now a deep dive."),
    "05_Advanced_Topics/57_Login_Taxonomy_OAuth_OIDC_SAML_MFA_mTLS.md": ("../reference/05_auth.md", "Login taxonomy is now the auth reference."),
    "05_Advanced_Topics/58_File_Uploads_Downloads.md": ("../reference/09_file_io.md", "File I/O is now the file I/O reference."),
    "05_Advanced_Topics/59_Docker_For_Playwright.md": ("../reference/10_ci_docker.md", "Docker is now the CI + Docker reference."),

    # ── 06_SDET_to_SDE_Bridge ──
    "06_SDET_to_SDE_Bridge/32_SDET_Interview_Prep.md": ("../learn/07_interview_prep.md", "Interview prep is now learn/07."),
    "06_SDET_to_SDE_Bridge/33_SDET_to_SDE_CS_Thinking.md": ("../learn/07_interview_prep.md", "CS thinking for interviews is in learn/07."),
    "06_SDET_to_SDE_Bridge/34_Algorithms_in_Test_Automation.md": ("../learn/07_interview_prep.md", "Algorithms for SDETs is in learn/07."),
    "06_SDET_to_SDE_Bridge/35_OOP_Design_Patterns_for_SDETs.md": ("../learn/03_pom.md", "OOP patterns in tests now live in learn/03."),
    "06_SDET_to_SDE_Bridge/36_TypeScript_Type_System_Mastery.md": ("../learn/02_typescript_for_tests.md", "TS type system mastery is in learn/02."),
    "06_SDET_to_SDE_Bridge/60_Tool_Comparison_Cypress_Selenium_WDIO.md": ("../reference/14_tool_comparison.md", "Tool comparison is now the tool comparison reference."),

    # ── 07_Specialised_Testing ──
    "07_Specialised_Testing/37_Performance_Testing_Lighthouse_k6.md": ("../deep_dives/performance.md", "Performance testing is now a deep dive."),
    "07_Specialised_Testing/38_Contract_Testing_Pact.md": ("../deep_dives/contract_testing.md", "Contract testing is now a deep dive."),
    "07_Specialised_Testing/39_Accessibility_Testing_axe_core.md": ("../deep_dives/accessibility.md", "Accessibility testing is now a deep dive."),
    "07_Specialised_Testing/40_Security_Testing_OWASP.md": ("../deep_dives/security.md", "Security testing is now a deep dive."),
    "07_Specialised_Testing/41_GraphQL_WebSocket_Testing.md": ("../reference/13_mocking.md#10-mocking-graphql", "GraphQL/WebSocket mocking is in the mocking reference."),
    "07_Specialised_Testing/51_Secrets_Management_For_SDETs.md": ("../reference/05_auth.md#anti-pattern-catalog", "Secrets management is in the auth reference."),
    "07_Specialised_Testing/53_Mutation_Testing_With_Stryker.md": ("../deep_dives/mutation_testing.md", "Mutation testing is now a deep dive."),
}


def make_stub(target: str, description: str, original_filename: str) -> str:
    """Generate a redirect stub."""
    return f"""# Moved

> This content has been restructured. {description}

**→ See [{target}]({target}).**

---

This file is preserved as a redirect to keep external links working. The original chapter has been consolidated into the new reference / deep_dives / learn layer system.

To navigate the new structure: start at [`../README.md`](../README.md) (or [`README.md`](./README.md) if you're at the root).
"""


def main():
    root = Path(__file__).resolve().parent.parent
    written = 0
    skipped = 0

    for rel_path, (target, description) in STUBS.items():
        full_path = root / rel_path
        if not full_path.exists():
            print(f"  SKIP (not found): {rel_path}")
            skipped += 1
            continue

        # Adjust target for root-level stubs
        if rel_path.count("/") == 0:
            # File is at root; target should not have leading ../
            adjusted_target = target.replace("../", "./", 1) if target.startswith("../") else target
        else:
            adjusted_target = target

        content = make_stub(adjusted_target, description, rel_path)
        full_path.write_text(content, encoding="utf-8")
        written += 1
        print(f"  STUB: {rel_path} -> {adjusted_target}")

    print(f"\nWrote {written} stubs. Skipped {skipped}.")


if __name__ == "__main__":
    main()
