# Chapter 3 — AI Ethics: Bias, Fairness, and Explainability

> "Is the model biased?" sounds like a question with a measurement as its answer. This chapter computes the measurements on a real criminal-justice dataset and shows that several equally reasonable ones cannot all be zero at the same time — so the question is really "which kind of unfairness are you choosing to accept, and who bears it?"

---

## The Problem

You have shipped a model that scores people — for a loan, a job screen, a bail hearing. A journalist, an auditor or a regulator now asks whether it discriminates. You run the obvious checks: race and gender are not input features; overall accuracy is fine; the score means the same thing for everyone (a "7" corresponds to the same recidivism rate in every group). Then someone computes the error rates *by group* and finds that one group's innocent members are flagged almost twice as often as another's.

Both statements are true at once, they were true of a real system, and a pair of 2016 papers proved they could not have been otherwise. That is the derivation this chapter builds: fairness criteria are defined from the confusion matrix (see [`25_Python_ML_DL_NLP/05_ML_Fundamentals.md`](../../../25_Python_ML_DL_NLP/05_ML_Fundamentals.md) for TP/FP/FN/TN and precision/recall, which are not re-taught here); when groups' base rates differ they cannot all hold together; therefore choosing a metric is a decision about whose mistakes count more, which makes it an ethical decision that an engineer must surface rather than a technical default to be hidden inside a library call. Around that core: where bias enters, how to explain a decision (and the limits of explanations), and what the law requires as of October 2026.

## 3.1 Where Bias Enters — Seven Doors, Not One

"Biased data" is a diagnosis too vague to act on. Suresh and Guttag (2019, "A Framework for Understanding Sources of Harm throughout the Machine Learning Life Cycle") name seven distinct sources, which matters because each has a different fix:

```mermaid
flowchart LR
    W["World / history"] -->|"1 historical"| D["Data collection"]
    D -->|"2 representation\n3 measurement"| T["Training"]
    T -->|"4 aggregation\n5 learning"| M["Model"]
    M -->|"6 evaluation"| B["Benchmark / sign-off"]
    B -->|"7 deployment"| U["Real use"]
```

**How to read this diagram.** Read left to right through the life of a model: World / history, Data collection, Training, Model, Benchmark / sign-off, Real use. The numbers on the arrows (1 to 7) mark the seven places where bias can enter, named in the paragraph below. Notice that bias is not one event at the data stage: the last two doors, evaluation and deployment, come after the model is built.

Historical (the world itself is skewed, so even a perfect sample reproduces it), representation (the sample under-covers a group), measurement (the label or feature is a proxy that works differently across groups), aggregation (one model for groups that behave differently), learning (modelling choices — optimising overall accuracy — trade one group's performance for another's), evaluation (the benchmark is unrepresentative) and deployment (used for something other than what it was validated for). Two real cases, mapped onto the taxonomy:

**Gender Shades (Buolamwini & Gebru, PMLR 81, 2018).** The authors built the Pilot Parliaments Benchmark — 1,270 parliamentarians from three African countries (Rwanda, Senegal, South Africa) and three Nordic ones (Iceland, Finland, Sweden) — labelled by Fitzpatrick skin type, and tested the binary gender classifiers of Microsoft, Face++ and IBM. They first audited the *existing* benchmarks: IJB-A is 79.6% and Adience 86.2% lighter-skinned, and darker-skinned women are 4.4% of IJB-A. That is an **evaluation bias** — a vendor could report excellent benchmark numbers while failing a group the benchmark barely contained. Error rates from the paper's Table 4:

| Classifier | Overall error | Darker-skinned female | Lighter-skinned male |
|---|---|---|---|
| Microsoft | 6.3% | 20.8% | 0.0% |
| Face++ | 10.0% | 34.5% | 0.8% |
| IBM | 12.1% | 34.7% | 0.3% |

The abstract's "up to 34.7%" and "0.8%" are the IBM and Face++ cells. A single aggregate number conceals a ~35-point spread, which is why §3.6's documentation standards insist on *disaggregated* evaluation.

**Amazon's recruiting tool (Reuters, Jeffrey Dastin, 10 October 2018).** Reuters reported that a machine-learning team had been building a resume-ranking model since 2014, trained on roughly ten years of submitted resumes — predominantly from men. The model penalised resumes containing the word "women's" (as in a women's chess club) and downgraded graduates of two all-women's colleges. Engineers edited the model to neutralise those particular terms, but, per the report, there was no guarantee it would not find other proxies; the team was disbanded by early 2017, and Amazon said recruiters never relied on the tool alone. The mechanism is **historical bias plus a measurement problem**: the label was "who got hired in the past", which encodes past hiring decisions, not future job performance. A model fitted to a biased label recovers the signal from any correlated proxy, which is why removing the protected attribute ("fairness through unawareness") is not a mitigation. (I read this report through its Irish Times syndication; Reuters' own page was not retrievable.)

## 3.2 Fairness Metrics — Defined From One Table

Every criterion below is a statement about the confusion matrix, conditioned differently. Let A be the group, Y the true outcome, Ŷ the decision, and write p = P(Y=1 | group) for the group's **base rate** (prevalence).

| Criterion | Requires equal across groups | Intuition |
|---|---|---|
| Demographic parity | P(Ŷ=1 \| A) — selection rate | Outcomes distribute alike, regardless of merit |
| Equal opportunity | TPR = P(Ŷ=1 \| Y=1, A) (so FNR) | The qualified are found at the same rate |
| Equalized odds | TPR **and** FPR | Both kinds of error fall equally |
| Predictive parity | PPV = P(Y=1 \| Ŷ=1, A) | A positive means the same thing in every group |
| Calibration within groups | P(Y=1 \| score = s, A) = s | A score of 0.7 means 70% everywhere |

The first group of criteria condition on the *outcome* (what happens to people who really are positive or negative) and the last two condition on the *prediction* (what a decision-maker looking at the output can infer). Hold that distinction; it is the whole COMPAS dispute.

**The four-fifths rule is demographic parity with a tolerance.** The Uniform Guidelines on Employee Selection Procedures (1978; adopted jointly by the EEOC, Civil Service Commission, Department of Labor and Department of Justice; 29 CFR §1607.4(D)) say a selection rate below four-fifths (80%) of the highest group's rate is generally regarded as evidence of adverse impact — and add caveats: smaller differences can still matter, and larger ones may not when based on small numbers. Computed: if 150 of 500 group-A applicants advance (30%) and 54 of 300 group-B applicants do (18%), the impact ratio is 0.18 / 0.30 = **0.60** — below 0.8 (Fisher exact test on these counts: p ≈ 0.0002, so not noise). Contrast 3/10 vs 2/10: ratio 0.67, yet Fisher p = 1.0, a gap indistinguishable from chance — the rule is a screening heuristic, not a statistical test, and the guideline text itself says so. It also says nothing about *why*: an employer can still defend a disparity as job-related, which is why the Amazon problem was not "a ratio below 0.8" but "the label is the past".

## 3.3 COMPAS — Computing the Published Numbers Ourselves

COMPAS is a risk-assessment product by Northpointe (now equivant) that scores defendants 1–10. On 23 May 2016 ProPublica published "Machine Bias" (Angwin, Larson, Mattu, Kirchner), analysing Broward County, Florida defendants scored in 2013–14 and followed for two years. Their method: label scores 5–10 (Medium and High) as "higher risk", compare with whether the person was rearrested within two years, and report error rates by race. Published: false positive rate 44.85% for Black vs 23.45% for white defendants; false negative rate 27.99% vs 47.72% — on 7,214 defendants in the two-year file (after limiting to those with at least two years of follow-up).

Download ProPublica's public `compas-scores-two-years.csv` (github.com/propublica/compas-analysis) and recompute:

```python
import pandas as pd
df = pd.read_csv("compas-scores-two-years.csv")           # 7,214 rows
y = "two_year_recid"
def cm(d, thr=5):                                         # 'higher risk' = decile >= 5
    pred = d.decile_score >= thr
    tp=(pred&(d[y]==1)).sum(); fp=(pred&(d[y]==0)).sum()
    fn=(~pred&(d[y]==1)).sum(); tn=(~pred&(d[y]==0)).sum()
    n=len(d); p=(tp+fn)/n
    return dict(p=p, flag=(tp+fp)/n, fpr=fp/(fp+tn), fnr=fn/(fn+tp), ppv=tp/(tp+fp))
for race in ["African-American", "Caucasian"]:
    print(race, cm(df[df.race == race]))
```

Real output:

| Group | n | Base rate p | Flagged | **FPR** | **FNR** | **PPV** |
|---|---|---|---|---|---|---|
| African-American | 3,696 | 51.4% | 58.8% | **44.85%** | **27.99%** | 62.97% |
| Caucasian | 2,454 | 39.4% | 34.8% | **23.45%** | **47.72%** | 59.13% |

The FPR and FNR match ProPublica's published figures to the digit. One trap: ProPublica's notebook also applies a stricter cleaning filter (screening within ±30 days of arrest, drop `is_recid == −1`, drop degree "O", drop missing scores) leaving 6,172 rows; there I get FPR 42.3% vs 22.0% — same story, different digits. The published table uses the 7,214; when reproducing a contested number, the subset *is* part of the claim. (I also did not reproduce the "61 percent" headline accuracy — I get 65.4% — and did not trace its source.)

**What Northpointe answered.** Dieterich, Mendoza and Brennan's 2016 report ("COMPAS Risk Scales: Demonstrating Accuracy Equity and Predictive Parity") argued that the tool is fair under a different criterion: a given score implies a similar recidivism likelihood regardless of race, ProPublica had ignored differing base rates, and grouping Medium with High inflated the "higher risk" error rates. Flores, Bechtel and Lowenkamp's *Federal Probation* rejoinder (September 2016) went further, concluding ProPublica's analysis rested on faulty statistics. Check Northpointe's side against the data:

| Score decile | 1 | 4 | 7 | 10 |
|---|---|---|---|---|
| Rearrest rate, Black | 22.9% | 46.0% | 59.2% | 79.4% |
| Rearrest rate, white | 20.9% | 39.6% | 61.5% | 70.3% (n=64) |

The scores are close to calibrated across race (not perfectly: the decile-10 gap rests on only 64 white defendants), and PPV is 63.0% vs 59.1%. **Both sides' numbers are correct.** They disagree about which criterion constitutes fairness. Why can't both hold?

## 3.4 Derivation: Why Fairness Metrics Collide

Start from the definitions, with N people in a group, base rate p:
- positives = pN, negatives = (1−p)N
- TP = (1−FNR)·pN
- PPV = TP/(TP+FP) ⇒ FP = TP·(1−PPV)/PPV = pN·(1−FNR)·(1−PPV)/PPV
- FPR = FP / ((1−p)N)

Substituting gives Chouldechova's identity (2017, *Big Data*, arXiv 2016):

**FPR = p/(1−p) · (1−PPV)/PPV · (1−FNR)**

Verify on the real data (using the counts, p/(1−p) · (1−PPV)/PPV · (1−FNR)): Black → 0.448468 = measured FPR 0.448468; white → 0.234543 = measured FPR 0.234543. It is an accounting identity, so the match is exact; what it *buys* is the next step. Suppose two groups have equal PPV (Northpointe's criterion) and equal FNR. Then the last two factors are the same, and FPR scales with p/(1−p) — the odds of the base rate. With p = 0.514 vs 0.394 the odds are 1.06 vs 0.65, so FPRs *must* differ, by about 1.6×; the real ratio was 1.9× (PPV is not exactly equal). Read it the other way, which is ProPublica's criterion: force equal FPR **and** FNR across groups and the identity forces PPV to differ. Numerically, with both groups at FPR = FNR = 0.30: PPV = p·0.7 / (p·0.7 + (1−p)·0.3) gives **71.2%** for Black and **60.2%** for white defendants. With PPV fixed at 0.62 and FNR at 0.30 instead, FPR comes out 45.4% vs 27.9%. No tuning escapes it; the only escapes are equal base rates or a perfect predictor (FPR = FNR = 0).

Kleinberg, Mullainathan and Raghavan (2016, "Inherent Trade-Offs in the Fair Determination of Risk Scores") proved the general version for probabilistic scores: calibration within groups plus balance for the positive class plus balance for the negative class cannot hold simultaneously except in those two degenerate cases. Chouldechova gave the binary-classifier version.

**Why this is an ethical decision.** The mathematics does not say which criterion to pick; it says you must pick. Equal FPR protects the people who did *not* reoffend from being treated as dangerous — the right priority if the decision is detention, where a false positive costs liberty. Equal PPV protects the decision-maker's ability to read a score at face value and avoids treating identical scores differently by race — arguably the right priority when the score is one input to an individual judge. Nothing in the confusion matrix tells you which harm is worse; that is a value judgment about who absorbs the unavoidable error. Underneath sits a second layer: the label is an *arrest* within two years, not an offence, so if policing intensity differs between neighbourhoods, p itself carries measurement bias (§3.1) that no threshold can detect. Whether the base-rate gap reflects behaviour, enforcement, or both is not answerable from the CSV.

**What mitigation costs — computed.** Mitigations come in three stages: *pre-processing* (reweigh or repair the training data), *in-processing* (add a fairness constraint to the loss) and *post-processing* (change the decision rule). The simplest post-processing fix is a group-specific threshold. Raise the Black defendants' cutoff from decile 5 to 7 and recompute:

| | Black, cut ≥5 | Black, cut ≥7 | White, cut ≥5 |
|---|---|---|---|
| FPR | 44.9% | 24.9% | 23.5% |
| FNR | 28.0% | 48.6% | 47.7% |
| PPV | 63.0% | 68.6% | 59.1% |
| Flagged | 58.8% | 38.6% | 34.8% |

FPR and FNR now nearly equalise (approximately equalized odds), but PPV diverges by 9.5 points — predictive parity is gone, exactly as the identity predicts. In counts among the 3,696 Black defendants, false positives drop from 805 to 447 (−358) while false negatives rise from 532 to 923 (+391): the rule *trades* one error for the other at roughly one-for-one. And the rule itself uses race explicitly — two people with the same score of 6 get different decisions by race — which raises its own legal and ethical problem (disparate treatment to cure disparate impact). Mitigation moves the cost; it does not remove it. Finally, whether these tools help at all is contested: Dressel and Farid (*Science Advances*, 2018) found untrained crowdworkers matched COMPAS's accuracy (about 67% vs 65.2%), and a two-variable logistic regression on age and prior convictions did as well (66.8%) as a tool using 137 features.

## 3.5 Explainability — What an Explanation Actually Computes

A fairness metric tells you the model's errors are unequal; an *explanation* tells one affected person why the model said what it said. Two methods dominate.

**LIME** (Ribeiro, Singh & Guestrin, KDD 2016) explains one prediction by perturbing the input, querying the black box on the perturbations, weighting them by closeness to the original, and fitting a small interpretable (sparse linear) model to those weighted samples. **SHAP** (Lundberg & Lee, NeurIPS 2017) assigns each feature a **Shapley value** from cooperative game theory: the feature's marginal contribution to the prediction, averaged over all orders in which features could be "added". Lundberg & Lee show it is the unique additive attribution satisfying local accuracy, missingness and consistency.

Rather than assert that, compute it by brute force for a toy credit model with an interaction term. Features income (I), debt (D), tenure (T); the applicant is x = (3, 2, 4); the baseline ("missing") is (1, 1, 0). f = 300 + 40·I − 30·D + 10·T + 20·I·T.

```python
import itertools, math
f = lambda I,D,T: 300 + 40*I - 30*D + 10*T + 20*I*T
x, b, names = dict(I=3,D=2,T=4), dict(I=1,D=1,T=0), ["I","D","T"]
v = lambda S: f(**{k:(x[k] if k in S else b[k]) for k in names})   # coalition value
phi = {i: sum(math.factorial(len(S))*math.factorial(2-len(S))/6 *
              (v(list(S)+[i]) - v(list(S)))
              for r in range(3) for S in itertools.combinations([k for k in names if k!=i], r))
       for i in names}
```

Output: φ_income = **160**, φ_debt = **−30**, φ_tenure = **200**. **Efficiency check:** f(x) = 640, f(baseline) = 310, difference 330 = 160 − 30 + 200. Attributions sum exactly to prediction minus baseline — that is "local accuracy". The mechanism is visible in the six orderings: tenure's marginal contribution is 280 if it joins after income, but only 120 if it joins first (before income has "switched on" the I·T interaction), and its Shapley value is the average of the six, 200. The 240-point interaction term is split between income and tenure by the averaging; no ordering is privileged. (An equivalent route: a weighted least-squares fit over all 2³ coalitions with the "Shapley kernel" weights recovers 160 / −30 / 200 exactly — SHAP's link to LIME. A LIME-style fit with an exponential proximity kernel on the same eight coalitions, width 0.5, gives 204.6 / −32.0 / 244.6, which sum to 417 rather than 330 — no efficiency guarantee. That kernel is my toy construction, not the `lime` library's defaults.)

**Failure boundaries.**
- *The baseline defines the answer.* Change "missing = (1,1,0)" and every φ changes. An explanation is relative to a reference chosen by whoever ran it.
- *Cost and correlation.* Exact computation is 2ⁿ coalitions; implementations sample or exploit model structure, and with correlated features, "missing = baseline" creates inputs the model never saw.
- *Attribution is not causation and not fairness.* A faithful explanation of a biased model faithfully explains the bias.
- *Explanations can be gamed.* Slack et al. (2019/2020, "Fooling LIME and SHAP") built classifiers that stay biased while LIME and SHAP report innocuous features, using COMPAS among their datasets, because perturbation-based methods query the model on off-distribution inputs the attacker can detect.
- *LIME's output moves* with sampling and kernel width, and is only faithful near x.

**The legal side — GDPR Article 22.** (The rest of GDPR is in [Chapter 2](02_Data_Privacy_GDPR_CCPA_And_Surveillance.md).) Article 22(1) gives a right not to be subject to a decision "based solely on automated processing, including profiling" that produces legal or similarly significant effects. Its limits are in the text: the decision must be *solely* automated; there are exceptions for contract necessity, authorisation by law, and explicit consent (22(2)); for the contract and consent cases the controller must at least provide the right to human intervention, to express a view, and to contest (22(3)); and special-category data is further restricted (22(4)). Notice what is absent: nothing in the article's operative text says "explanation". Goodman and Flaxman (2016) argued the regulation would effectively create a "right to explanation"; Wachter, Mittelstadt and Floridi (*International Data Privacy Law*, 7(2), 2017) answered that it does not — the GDPR gives a "right to be informed" of meaningful information about the logic involved, the significance and the envisaged consequences, but not a right to an explanation of a specific decision. Case law has since sharpened this: the CJEU held in *SCHUFA* (C-634/21, 7 December 2023) that producing a credit score is itself an automated decision under Article 22 when a third party draws strongly on it, and in *Dun & Bradstreet Austria* (C-203/22, 27 February 2025) that "meaningful information about the logic involved" covers the procedure and principles by which personal data is used to reach the result, balanced against trade secrets by the competent authority. I confirmed these through secondary summaries rather than the judgments. Practical consequence: a SHAP chart is evidence, not compliance; the *procedure and principles* must be documentable, and a counterfactual ("approved if debt were X lower", Wachter, Mittelstadt & Russell) is often more actionable than an attribution.

## 3.6 Governance as of October 2026

**EU AI Act (Regulation (EU) 2024/1689).** In force 1 August 2024, applied in phases. Prohibitions (social-scoring-style practices among them) and AI-literacy duties applied from 2 February 2025; general-purpose-AI model obligations from 2 August 2025. The Act sorts systems by risk: prohibited; *high-risk* (the Annex III list covers biometrics, critical infrastructure, education, employment and worker management, access to essential services, law enforcement, migration and border control, and administration of justice — so a recruiting screener sits in category 4 and a COMPAS-style tool in law enforcement/justice); transparency-only; and minimal. Fines run up to €35M or 7% of worldwide turnover for prohibited practices, €15M or 3% for most other obligations, and €7.5M or 1% for supplying incorrect information (Art. 99; lower-of for SMEs).

The state of the high-risk dates is exactly this, as best I could establish: the **Digital Omnibus on AI was adopted** — the Parliament voted 16 June 2026, the Council gave final approval 29 June 2026, and it was published as Regulation (EU) 2026/1744 (dated 8 July), in the Official Journal on 24 July 2026, in force 27 July 2026. It moves the stand-alone Annex III high-risk obligations from 2 August 2026 to **2 December 2027** and the Annex I (product-embedded) ones from 2 August 2027 to **2 August 2028**, adds a prohibition on non-consensual intimate-content/CSAM-generation systems from 2 December 2026, and leaves most Article 50 transparency duties at 2 August 2026 (machine-readable marking for systems already on the market gets until 2 December 2026). Caveats: I could not open the EUR-Lex text or the Council's own page; these dates come from several law-firm and tracker summaries that agree with each other, and a separate timeline page still shows 2 August 2027 for Annex III, which conflicts and looks stale. Verify against the Official Journal before relying on a date.

**NIST AI Risk Management Framework 1.0** (26 January 2023) is voluntary and organises work into four functions: **Govern** (accountability, policy, culture), **Map** (context and risks of the specific use), **Measure** (the testing — the confusion-matrix work of §3.2–3.4 lives here) and **Manage** (prioritise, respond, monitor). A Generative AI Profile (NIST-AI-600-1) followed on 26 July 2024; NIST's page states the framework is being revised under the White House AI Action Plan, so treat 1.0 as current-but-moving.

**Documentation.** *Model cards* (Mitchell et al., FAT\* 2019) require reporting performance disaggregated by group and context, with intended-use limits — Gender Shades' Table 4 is the template. *Datasheets for Datasets* (Gebru et al., arXiv 2018; *Communications of the ACM*, December 2021) document a dataset's motivation, composition, collection process and recommended uses, targeting representation and historical bias at the source. Both turn §3.1's seven doors into questions answered before deployment; deployment-time drift monitoring is in [`25_Python_ML_DL_NLP/13_MLOps_Production.md`](../../../25_Python_ML_DL_NLP/13_MLOps_Production.md) (Part 4, data drift). The feedback-loop version of this problem — a model whose outputs become its next training data — is in [`25_Python_ML_DL_NLP/12_Recommender_Systems.md`](../../../25_Python_ML_DL_NLP/12_Recommender_Systems.md); and when an AI agent acts on your behalf, the "who verifies, who is accountable" question reappears in [`21_SDET_Playwright_Automation/07_Specialised_Testing/45_AI_Agents_MCP_And_Playwright.md`](../../../21_SDET_Playwright_Automation/07_Specialised_Testing/45_AI_Agents_MCP_And_Playwright.md) (§8, when to use AI and when not).

## Section Challenge

<details>
<summary><strong>Q1.</strong> A resume screener advances 150 of 500 applicants from group A and 54 of 300 from group B. The vendor says "gender and race are not model inputs, so it cannot discriminate." Compute the four-fifths ratio and assess the vendor's claim using the Amazon case.</summary>

Selection rates: A = 150/500 = 30%, B = 54/300 = 18%. Ratio = 0.18/0.30 = **0.60**, below the 0.8 threshold in the Uniform Guidelines (29 CFR §1607.4(D)), so adverse impact is presumed unless the employer justifies it. The vendor's claim fails on mechanism: "unawareness" removes the protected column, not the information. Amazon's model never saw a gender field either; it recovered the signal from the word "women's" and two women's colleges because it was fitted to historical hiring decisions (historical + measurement bias). Patching those tokens left the cause, a biased label, intact — Reuters reported the engineers could not guarantee other proxies would not emerge. Two limits: the ratio is a heuristic (3/10 vs 2/10 also gives 0.67 but Fisher p = 1.0), so confirm with a statistical test; and a ratio below 0.8 opens an inquiry into job-relatedness, not a verdict. Next steps: audit selection rates by group on held-out data, trace which features carry the proxy signal, and question the label itself.

</details>

<details>
<summary><strong>Q2.</strong> A model has PPV = 0.80 and FNR = 0.20 in both groups. Group A's base rate is 50%, group B's is 20%. Compute each group's FPR and say what a regulator must decide.</summary>

Use FPR = p/(1−p) · (1−PPV)/PPV · (1−FNR) with (1−PPV)/PPV = 0.25 and (1−FNR) = 0.80, so the last two factors multiply to 0.20. Group A: (0.5/0.5)·0.20 = **0.20**. Group B: (0.2/0.8)·0.20 = **0.05**. Group A's non-positives are wrongly flagged four times as often, although the score means the same thing in both groups (predictive parity holds, FNR is equal). This is not a modelling flaw to be tuned away — the identity shows that with unequal base rates, equal PPV and FNR *force* unequal FPR. A regulator or product owner must therefore decide which property to guarantee: error-rate balance (equal FPR, which will make PPV unequal) or score meaning (equal PPV, which leaves FPR unequal). The answer depends on the decision's cost structure — where a false positive is the severe harm (detention, benefit denial), refuse the FPR gap; for triage where a clinician looks further, PPV parity may matter more. Either way, write the choice down (a model card), because the other metric will visibly fail.

</details>

<details>
<summary><strong>Q3.</strong> A bank's loan model denies an applicant. Its SHAP output shows postcode contributing −40 points. The applicant invokes GDPR Article 22. Does Article 22 apply, is the SHAP chart enough, and what would make the explanation untrustworthy?</summary>

Whether Article 22 applies turns on its text: the decision must be based **solely** on automated processing and have legal or similarly significant effects. A loan denial plausibly has a significant effect; if a human merely rubber-stamps the model, the "solely" question is contested and depends on whether the human review is meaningful, so the bank should not assume a nominal reviewer takes it outside the Article. If it does apply, the bank needs an Article 22(2) basis (contract necessity, law, or explicit consent) and, for contract or consent, the 22(3) safeguards: human intervention, the chance to state a view, the right to contest. On explanation: the Wachter et al. reading (and the CJEU's *Dun & Bradstreet* ruling) gives a right to meaningful information about the *logic involved*, which means the procedure and principles — not necessarily a per-decision attribution. A SHAP chart is therefore supporting evidence, not automatic compliance, and −40 is only meaningful relative to the chosen baseline (change the reference applicant and the number changes). It can mislead because Shapley values can be gamed (Slack et al.), because correlated features make "postcode removed" an unrealistic input, and because −40 on postcode may be a proxy for a protected characteristic — a fairness question, not an explanation question. A counterfactual plus a model card and a disaggregated test for postcode-linked disparities answers both applicant and regulator.

</details>

---

## Chapter Summary

| Concept | What it establishes | Concrete anchor from this chapter |
|---|---|---|
| Seven sources of bias (Suresh & Guttag) | Each stage of the pipeline has its own failure and its own fix | Historical, representation, measurement, aggregation, learning, evaluation, deployment |
| Gender Shades (2018) | Aggregate accuracy hides subgroup failure; benchmark composition is itself a bias | Darker-skinned female error 20.8–34.7% vs lighter-skinned male 0.0–0.8% |
| Amazon recruiting tool (Reuters, 2018) | Removing the protected attribute does not remove the signal; the label can encode the past | Penalised "women's" and two all-women's colleges; patch gave no guarantee; team disbanded by early 2017 |
| Fairness metrics | Each criterion is a conditioning of the confusion matrix; four-fifths is parity with tolerance | Ratio 0.60 in the worked example; 3/10 vs 2/10 shows the heuristic's limit |
| COMPAS replication | Both ProPublica and Northpointe computed true numbers under different criteria | FPR 44.85% vs 23.45%, FNR 27.99% vs 47.72%, PPV 62.97% vs 59.13% (7,214 rows) |
| Chouldechova identity / Kleinberg et al. | With unequal base rates, equal PPV and FNR force unequal FPR; fairness criteria cannot all hold | FPR = p/(1−p)·(1−PPV)/PPV·(1−FNR) matches measured FPR to six decimals |
| Mitigation cost | Group thresholds trade one error for another and break predictive parity | Cutoff 5→7: FP −358, FN +391, PPV gap 9.5 points |
| LIME / SHAP | SHAP satisfies efficiency; both depend on baseline and sampling and can be attacked | φ = 160 / −30 / 200, summing to 330 = f(x) − f(baseline) |
| GDPR Art. 22 | Limited to solely-automated, significant decisions; "right to explanation" is a contested reading | Wachter et al. 2017; SCHUFA 2023; Dun & Bradstreet 2025 |
| Governance (Oct 2026) | Risk-tiered regulation with moving dates; voluntary risk framework | AI Act Annex III high-risk to 2 Dec 2027 via Reg. 2026/1744; NIST AI RMF Govern/Map/Measure/Manage |

## Where We Go Next

This chapter treated the training data as a given and asked what its biases do to people. But a model's training data is somebody's work, and when a coding assistant emits a function it may be reproducing licensed code it was trained on. Who owns a model, its training corpus and its output, and what the licence on the corpus allows, are the questions of the next chapter.

*Next: [04_Intellectual_Property_And_Open_Source_Licensing.md](04_Intellectual_Property_And_Open_Source_Licensing.md)*
