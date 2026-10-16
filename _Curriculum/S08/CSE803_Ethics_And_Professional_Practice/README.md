# CSE803 — Ethics & Professional Practice

**Estimated time:** ~10h  
**Prerequisite:** S06 (working in production systems with real data)

## Description

A structured exploration of ethical issues in computing and software engineering. Covers professional responsibility, data privacy (GDPR, CCPA), AI ethics (bias, fairness, transparency), intellectual property, software licensing, and the societal impact of technology decisions. Uses the ACM Code of Ethics and IEEE Software Engineering Code of Ethics as frameworks. Case study format with structured discussion.

## Learning Outcomes

1. Apply the ACM and IEEE codes of ethics to realistic software engineering scenarios
2. Analyze data privacy regulations (GDPR, CCPA) and implement compliant data handling practices
3. Identify and mitigate AI/ML bias: dataset bias, algorithmic fairness, transparency, and explainability
4. Navigate intellectual property: open-source licensing (MIT, GPL, Apache), copyright, patents, and attribution
5. Make and justify ethical decisions in ambiguous situations using structured ethical reasoning frameworks

## Syllabus Outline

| Week | Topic                                                                                                  |
| ---- | ------------------------------------------------------------------------------------------------------ |
| 1    | Professional ethics frameworks: ACM Code of Ethics, IEEE Software Engineering Code                     |
| 2    | Software reliability and responsibility: safety-critical systems, liability, and the role of testing   |
| 3    | Data privacy: GDPR, CCPA, data minimization, consent mechanisms, right to erasure                      |
| 4    | AI ethics: bias in training data, algorithmic discrimination, fairness metrics, explainability         |
| 5    | Intellectual property: copyright, software patents, open-source licenses, attribution obligations      |
| 6    | Surveillance and privacy: tracking, behavioral data, ad tech, and user consent                         |
| 7    | Case studies: Therac-25, Boeing 737 MAX, COMPAS recidivism, Cambridge Analytica                        |
| 8    | Ethical decision-making: utilitarian, deontological, and virtue ethics applied to technology decisions |
| 9    | Capstone: ethical risk assessment for a fictional product launch with structured mitigation plan       |

## Linked Existing Content

- [`10_Enterprise_Systems/08_RealWorld_Incidents_DSA.md`](../../../10_Enterprise_Systems/08_RealWorld_Incidents_DSA.md) — Incident 8 covers Therac-25's race-condition mechanics in full; Ch01 here bridges to it rather than re-deriving, and adds the ethics-specific layer (which numbered ACM/IEEE principles the incident violates, and why)

## Chapters

1. [Professional Ethics Frameworks & Safety-Critical Systems](01_Professional_Ethics_Frameworks_And_Safety_Critical_Systems.md) — Weeks 1–2. ACM Code + IEEE/ACM SE Code, enforcement (COPE), Therac-25 mapped to specific principles, the three consequence tracks
2. [Data Privacy, GDPR/CCPA & Surveillance](02_Data_Privacy_GDPR_CCPA_And_Surveillance.md) — Weeks 3 and 6. Lawful bases, consent, erasure as an engineering problem, CCPA/CPRA, ad-tech tracking and fingerprinting entropy, k-anonymity
3. [AI Ethics: Bias, Fairness & Explainability](03_AI_Ethics_Bias_Fairness_And_Explainability.md) — Week 4. Fairness metrics from the confusion matrix, the impossibility result, COMPAS recomputed from ProPublica's data, Shapley/SHAP, GDPR Art. 22, EU AI Act, NIST AI RMF
4. [Intellectual Property & Open-Source Licensing](04_Intellectual_Property_And_Open_Source_Licensing.md) — Week 5. IP regimes, copyleft triggers, compatibility, licence-change era, a real `node_modules` licence audit, AI and IP
5. [Case Studies & Ethical Decision-Making](05_Case_Studies_And_Ethical_Decision_Making.md) — Weeks 7–8. Frameworks as procedures, Boeing 737 MAX, Cambridge Analytica, whistleblowing, a repeatable decision procedure
6. [Capstone: Ethical Risk Assessment](06_Capstone_Ethical_Risk_Assessment.md) — Week 9. A complete worked assessment, risk-matrix pitfalls, template and grading rubric

## Assessment

- Weekly ethics case study analyses (structured memos)
- Group debate on a contested technology ethics topic
- Capstone ethical risk assessment report for a product scenario
