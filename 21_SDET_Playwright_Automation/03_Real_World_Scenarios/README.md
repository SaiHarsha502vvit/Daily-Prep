# Stage 3 — Real-World Scenarios

**Navigation**: [← Stage 2 — Test Architecture](../02_Test_Architecture/README.md) | [Module front door](../README.md) | [Stage 4 — Cross-Site Patterns & a Dynamics 365 Case Study →](../04_Cross_Site_Patterns_And_D365/README.md)

The flows real products have and tutorials skip: mocked and slow APIs, test data, database checks, every kind of login (OAuth, SAML, MFA/TOTP, email/SMS OTP, passkeys), email, files, fake time and networks, camera/mic and push, WebSockets, feature flags, payment gateways and wallets, cookie consent, overlays and CAPTCHA.

**After this stage you can:** Test the hard 20% of a real application — the parts that actually break in production.

## Read in this order

| Order | ID | Chapter |
| --- | --- | --- |
| 1 | Ch31 | [31. API Mocking with `page.route()` — Isolating Frontend Behaviour](./31_API_Mocking_page_route.md) |
| 2 | Ch42 | [42. Polling & Async Data Patterns — The Right Way to Wait for Slow APIs](./42_Polling_Async_Data_Patterns.md) |
| 3 | Ch28 | [28. Test Data Lifecycle — Seeding, Isolation & Guaranteed Cleanup](./28_Test_Data_Lifecycle_and_Cleanup.md) |
| 4 | Ch30 | [30. Database Verification — Direct SQL Assertions in Tests](./30_Database_Verification_Direct_SQL.md) |
| 5 | Ch57 | [57. Login Taxonomy — OAuth2 / OIDC / SAML / MFA / mTLS](./57_Login_Taxonomy_OAuth_OIDC_SAML_MFA_mTLS.md) |
| 6 | Ch50 | [50. Email Service Testing — Magic Links, OTPs, and Notifications Without `setTimeout(60000)`](./50_Email_Service_Testing.md) |
| 7 | Ch58 | [58. File Uploads & Downloads — The Sharp Edges](./58_File_Uploads_Downloads.md) |
| 8 | Ch61 | [61. Emulation & Environment Simulation — Devices, Clock, Network, Locale, Permissions](./61_Emulation_Clock_Network_And_Devices.md) |
| 9 | Ch41 | [41. GraphQL & WebSocket Testing with Playwright](./41_GraphQL_WebSocket_Testing.md) |
| 10 | Ch49 | [49. Feature Flag Testing — When the App Has Two Behaviours and the Flag Decides](./49_Feature_Flag_Testing.md) |
| 11 | Ch67 | [67. Payment Gateway Testing — Hosted Fields, 3-D Secure, Idempotency, Webhooks & Money](./67_Payment_Gateway_Testing.md) |
| 12 | Ch68 | [68. Consent Banners, Overlays & CAPTCHA — The Things Standing Between Your Test and the App](./68_Consent_Overlays_And_CAPTCHA.md) |

> Chapter numbers are permanent IDs used in cross-references ("see Ch42"), not reading order — follow the **Order** column. The full catalogue with reading times is in [`00_INDEX.md`](../00_INDEX.md).
