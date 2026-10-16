# Chapter 5 — Case Studies and Ethical Decision-Making: Four Procedures, One Disagreement

> "It's within the rules" is a deontological claim. "The expected loss is small" is a utilitarian one. "I'd want to be able to explain this to the pilots" is a virtue claim. Engineers switch between these constantly without noticing, and the switch is where bad decisions hide. This chapter makes the switch explicit, then runs the resulting procedure on two real cases.

---

## The Problem

A design review, 2014 in spirit if not in date. A flight-control function will be triggered by one sensor. A reviewer asks about redundancy. The answers you might hear: *"The regulator's rules allow it."* *"Sensor failures are rare and the aircraft is still flyable if the crew reacts."* *"Adding a second sensor means simulator training, and that costs the customer."* *"I'd rather not be the one who signed off on this."*

Each answer is a different style of moral argument, and each can be defended. Ch01 gave you the *codes* — what a professional is obligated to weigh. It did not say how to weigh when the weights conflict, and Principle 4 of the SE Code says engineers must keep "integrity and independence" of judgment without telling you what that judgment consists of. This chapter derives it. The approach: treat each classical ethical framework as a **procedure** — an algorithm with inputs and a failure mode — run all of them on the same action, and observe that **where they disagree is exactly where engineering judgment and written documentation are needed.** Agreement is cheap; the disagreements are the job.

Two cases anchor it: the Boeing 737 MAX (Week 7) and Cambridge Analytica (Week 7). Therac-25 (Ch01) and COMPAS ([Ch03](03_AI_Ethics_Bias_Fairness_And_Explainability.md)) appear only as comparison points.

## 5.1 Four Frameworks as Four Procedures

**Utilitarianism — sum the consequences.** Bentham (1789) and Mill (1861) are the classical authors. Procedure: list everyone affected, estimate the welfare change for each under each option, add, choose the maximum. Mill's refinement was that pleasures differ in *quality*, not just quantity, which already concedes that the arithmetic needs a judgment call. *Failure modes:* (1) **aggregation** — a sum treats one person's severe loss as offsettable by many people's small gains, so it can endorse sacrificing a minority; (2) **whose utility counts** — the ledger includes whoever the analyst puts in it, and people outside the contract (a passenger, a friend of an app user) are easy to omit; (3) **estimation** — the output is only as good as probabilities and weights that are often unknowable. Section 5.2 shows (2) and (3) in numbers.

**Kantian deontology — test the maxim.** Kant's *Groundwork of the Metaphysics of Morals* (1785) gives several formulations of one supreme principle. Two matter for engineers. The **Formula of Universal Law**: act only on a maxim you could at the same time will to be a universal law. Procedure: write the rule your action embodies ("I withhold a material risk from the people who depend on the system when disclosure costs me money"), imagine everyone following it, and ask whether it is even coherent (contradiction in conception) or whether you could rationally will the world it produces (contradiction in will). The **Formula of Humanity**: never treat humanity merely as a means, always also as an end — operationally, *could the affected person have consented had they known?* *Failure modes:* the verdict depends on how narrowly you describe the maxim (the "maxim description" problem), and strict duties can collide with no tiebreaker (honesty versus protecting someone).

**Virtue ethics — ask what a good practitioner would do.** Aristotle's *Nicomachean Ethics* grounds right action in character: virtues are settled traits (honesty, courage, justice) and **phronesis**, practical wisdom, is the trained ability to see which features of *this* situation matter. There is no formula by design. The SE Code's own preamble contains this procedure: engineers are asked to consider "whether their acts would be judged worthy of the ideal professional." *Failure modes:* the **action-guidance** objection (it says *be* wise, not *do* X) and **circularity** ("what would the virtuous person do?" presupposes you can recognise one) — and in a firm whose culture rewards concealment, "what would my colleagues do" is a corrupt proxy for the question.

**Rawls's veil of ignorance — choose the rule blind to your role.** In *A Theory of Justice* (Harvard University Press, 1971), Rawls asks what principles free and equal people would choose if they did not know their class, talents or place in society. The veil removes self-interest from the choice. Rawls defended his two principles using a maximin argument (rank options by their worst outcome), and Harsanyi objected that equal-probability reasoning behind the veil favours average utility instead. *Scope warning:* Rawls built this for the *basic structure of society*, not for product decisions. Using it on an engineering choice is a **borrowed heuristic**: *would I accept this rule if I might be the passenger, the pilot, the user whose friend clicked "allow"?* *Failure mode:* maximin can be paralysingly conservative — nearly any innovation has some bad worst case.

| Framework | Question it asks | What it needs as input | Where it breaks |
|---|---|---|---|
| Utilitarian | Which option maximises total welfare? | Probabilities, weights, who is in the ledger | Weights are contestable; minorities can be outvoted |
| Kantian | Could everyone adopt my rule? Could the affected consent? | An honest statement of the maxim | Maxim wording; unresolved duty conflicts |
| Virtue | What would a practically wise, honest practitioner do? | A trustworthy sense of who that is | Not action-guiding; culture-dependent |
| Rawlsian | Would I choose this rule not knowing my role? | A list of roles the rule creates | Maximin over-caution; borrowed from a different domain |

## 5.2 A Utilitarian Ledger Whose Verdict Flips on a Weight

The abstract claim — "the verdict depends on contestable weights" — is checkable. Here is a deliberately simple ledger for the decision in the opening scene. **All numbers are illustrative inventions to expose mechanics; they are not Boeing's or anyone's real estimates**, except two anchors: 173 deaths per loss (the mean of 189 and 157, the two MAX crashes), and \$1.0M per aircraft as the order of magnitude of the training-related price concession described in 5.4.

Option A: one-sensor design. Option B: two sensors plus training, costing \$1.05M more per aircraft (\$1.0M training concession plus \$0.05M hardware). Fleet: 4,000.

```python
FLEET, DEATHS, COST_B = 4000, 173, 1.05e6

def net_benefit_of_A(p, vsl, w_pass):
    saved = FLEET * COST_B                          # money A saves vs B
    harm  = FLEET * p * DEATHS * vsl * w_pass       # expected statistical-life cost of A
    return saved - harm                             # > 0 => utilitarian ledger picks A

def breakeven_p(vsl, w_pass):                       # A wins iff true p is below this
    return COST_B / (DEATHS * vsl * w_pass)
```

`p` is the per-aircraft-lifetime probability that the one-sensor design causes a loss; `vsl` is the dollar value assigned to a statistical life; `w_pass` is how much passenger welfare counts relative to the financial parties. Running it (script in the scratchpad, output verbatim):

```
Break-even p (A wins iff true p is BELOW this):
  VSL= $2M  w_pass=1.0  -> p* = 3.03e-03
  VSL=$10M  w_pass=1.0  -> p* = 6.07e-04
  VSL=$30M  w_pass=1.0  -> p* = 2.02e-04
  (any VSL, w_pass=0.0) -> A wins at any p

Fix p = 3e-04; expected deaths over fleet = 208
  VSL $10M, passengers weight 1.0   net benefit of A = +2.12B  -> choose A
  VSL $10M, passengers weight 0.5   net benefit of A = +3.16B  -> choose A
  VSL $30M, passengers weight 1.0   net benefit of A = -2.03B  -> choose B
```

Three things to read off this. **First, the ledger endorses the dangerous option over a wide, plausible region**: at \$10M per life and p = 3×10⁻⁴, the ledger accepts about 208 expected deaths to save \$4.2B. Utilitarian reasoning is not a "soft" framework that always sides with safety; it sides with whatever the inputs say. **Second, one weight flips the verdict**: holding everything else fixed, moving the value of a life from \$10M to \$30M reverses the answer (+\$2.12B to −\$2.03B). Whether passengers count at 1.0, 0.5 or 0 is not an empirical question — it is an *ethical premise* wearing a decimal point. **Third, p itself spans orders of magnitude** between teams with different incentives; a number nobody can test is a lever.

What the toy omits makes the case worse for it: failures are **correlated** (one design flaw is present in every aircraft, so losses cluster and trigger fleet-wide groundings), and deaths are **non-consenting third-party costs** while the savings accrue to the decider. This is why safety engineering added a *non-utilitarian* rule on top of the arithmetic. The House committee report quotes FAA guidance to the effect that no catastrophic failure condition should result from the failure of a single component. That is a **constraint** (it removes options from the menu before any weighing happens), and it exists precisely because estimating tail probabilities is unreliable and the harms are irreversible. The Therac-25 pattern from [Ch01](01_Professional_Ethics_Frameworks_And_Safety_Critical_Systems.md) — a safety net removed and replaced by confidence in one component — is the same structure; the incident mechanics are in [Incident 8](../../../10_Enterprise_Systems/08_RealWorld_Incidents_DSA.md).

## 5.3 Deriving a Repeatable Decision Procedure

If every framework is a function from a described situation to a verdict, then the engineering move is: build the description once, evaluate all four, and treat **disagreement as the output of interest.** Derived steps:

1. **Stakeholders.** Everyone who bears risk or benefit — including people with no contract with you (passengers, friends-of-users, future maintainers, regulators relying on your disclosures). This directly fixes the "whose utility counts" failure. The SE Code preamble asks for exactly this: consider "how the least empowered will be affected."
2. **Options.** At least three, always including *delay*, *disclose-and-let-them-decide*, and *don't build it*. Most bad decisions are two-option decisions.
3. **Evaluate under each framework**, and for each write *the one fact that would flip the verdict* (for the ledger: the break-even p from 5.2; for the Kantian test: "could they have consented if told?").
4. **Locate disagreements.** If all four agree, record it and move on. If not, the disagreement is the finding.
5. **Decide, using explicit tiebreakers.** Derived from the failure modes above (this is a heuristic, not canon): prefer the constraint-respecting option when harm is **irreversible**, falls on **non-consenting parties**, and rests on a probability **nobody can test**; otherwise prefer the reversible option and set a checkpoint. Also decide *who has authority* — an engineer can usually refuse or escalate, rarely decide alone.
6. **Document reasoning and dissent.** Write what was decided, which framework(s) dissented, who accepted the residual risk, and what would trigger revisiting. This is not bureaucracy: SE Code 3.01 requires that significant tradeoffs be "clear to and accepted by the employer and the client" and available to users and the public; 2.06 requires identifying, documenting and collecting evidence of a likely-problematic project; 3.11 requires documenting significant problems discovered.

```yaml
decision: ship v1 with single-sensor trigger?     # one line
stakeholders: [pilots, passengers, airline ops, regulator, employer, ...]
options: [A single-sensor, B dual-sensor+alert, C B + simulator training, D delay]
verdicts:
  utilitarian: {pick: A, flips_if: "p > 6e-4 or VSL > 10M"}   # numbers from a stated model
  kantian:     {pick: B, reason: "crew cannot consent to an undisclosed function"}
  virtue:      {pick: C, reason: "honest disclosure; would defend it to the crew"}
  rawlsian:    {pick: B, reason: "rule must hold if I might be the passenger"}
disagreement: "ledger accepts risk only because p is assumed small and untested"
decision_made: D→B   decided_by: <name>   accepted_residual_risk_by: <name>
dissent: [{who, what, date}]   revisit_when: "field data, sensor-failure rate > X"
```

## 5.4 Case 1 — Boeing 737 MAX: The Procedure Run End to End

**Facts first** (each checked against the FAA, the House committee report, Boeing's SEC filings, or a federal appellate opinion):

| Date | Event | Source type |
|---|---|---|
| Dec 2011 | Southwest contract: price cut of at least \$1M per MAX if the FAA required simulator training for NG-to-MAX pilots; 200 firm + 191 optional aircraft, so \$200M to nearly \$400M at stake | House T&I report (Sept 2020, majority staff) |
| 2015 | A Boeing representative asks whether MCAS is "vulnerable to single AOA sensor failures"; aircraft delivered with it dependent on one sensor | House report |
| Mar 2016 | MCAS authority expanded at low speed to meet stall-characteristics requirements; MCAS references then removed from the crew manual | House report |
| 29 Oct 2018 | Lion Air 610 crashes; 189 killed | FAA; Fifth Circuit opinion |
| 10 Mar 2019 | Ethiopian 302 crashes; 157 killed (346 total) | FAA; Fifth Circuit opinion |
| 13 Mar 2019 | FAA Emergency Order of Prohibition grounds the MAX | FAA return-to-service summary |
| Sept 2020 | House T&I final report | House committee |
| 18 Nov 2020 | FAA rescinds the grounding order after design changes (MCAS now uses both AOA sensors) and adds MCAS training requirements | FAA |
| 6–7 Jan 2021 | Deferred prosecution agreement (DPA) with the DOJ | Boeing 8-K |

**The mechanism, as a decision, not a bug.** The single-sensor dependence was not an unhandled edge case; the House report states that Boeing "permitted" MCAS to act on one angle-of-attack sensor and that a Boeing representative raised the vulnerability in 2015. It also reports that Boeing's own test pilot took over ten seconds to respond to uncommanded MCAS activation in a 2012 simulator test and called it "catastrophic," that the AOA Disagree alert was inoperable on most of the fleet, and that Boeing's hazard assessment did not rate pilot reaction to uncommanded MCAS as hazardous enough to demand redundancy. (The repo's other 737 mentions — [OOP production notes](../../../06_OOP_Design/08_Design_Patterns_Java.md), [CSE301 LSP framing](../../S03/CSE301_OOP_And_Design_Patterns/README.md), [edge-case notes](../../../05_Problem_Solving/23_Edge_Cases.md) — treat MCAS as a code-structure or boundary-condition analogy; the record shows a classification and disclosure *decision*, which is why it belongs in an ethics course.)

**The commercial motive and the delegation.** The majority staff report concludes Boeing had "tremendous financial incentive" to avoid any simulator requirement. Note the attribution: it is a majority-staff finding, not a court finding. The same report documents that the FAA's 2005 Organization Designation Authorization (ODA) program let Boeing-employed Authorized Representatives perform certification functions on the FAA's behalf, and found these representatives were impaired from acting independently of the company. That is a conflict of interest built into the oversight structure (SE Code 4.05 on undisclosed conflicts and 4.03 on objectivity are the individual-level versions).

**Run the procedure** (stakeholders: pilots, passengers, airlines, the FAA relying on Boeing's disclosures, Boeing and its employees, Southwest as launch customer; options: A single sensor with minimal training, B two sensors plus the disagree alert standard, C B plus simulator training, D delay):

| Framework | Verdict | Why |
|---|---|---|
| Utilitarian | Depends (A wins in 5.2's region) | Savings are certain and concentrated; harm is a small probability times a large loss. Verdict flips with p and with whether passengers count fully |
| Kantian | Rejects the *concealment* firmly; sensor choice is less clear | Pilots who are not told MCAS exists cannot consent to what it does; treating them as means to a training-cost saving fails the humanity formula |
| Virtue | Rejects | The conduct pattern the committee names — withholding information from regulators, customers and pilots — is a failure of honesty and of courage, whatever the engineering argument |
| Rawlsian | Rejects A | Choose the disclosure and redundancy rule not knowing whether you will be a Boeing executive or crew on the flight; no one picks "undisclosed single point of failure" |

**Where they disagree is the finding.** Three frameworks converge against the concealment. The *ex ante* sensor decision is where the ledger genuinely diverges — and that is the dangerous place, because a plausible-looking ledger could "justify" A. The decision procedure's tiebreaker (irreversible, non-consenting third parties, untestable probability) selects the constraint-respecting option, and the FAA's own single-failure principle encodes the same conclusion. The practical lesson is not "utilitarianism is wrong" but "never let one framework's inputs be the only audited artefact."

**SE Code mapping (clause numbers from the IEEE-CS/ACM text).** 1.03: approve software only with a well-founded belief it is safe — the 2012 simulator finding and the 2015 single-sensor question were evidence against such a belief. 1.04: disclose actual or potential danger to appropriate persons or authorities. 3.01: tradeoffs must be available to users and the public — here, the no-simulator tradeoff and MCAS's existence were not. 3.10: adequate testing and review. 6.07: accuracy about system characteristics. The Therac-25 comparison point from Ch01: both are single points of failure justified by assumed downstream mitigation (a software-only safety case; a crew that was not told).

**Accountability, and what each track actually did.** The DPA (6 Jan 2021) resolved a DOJ investigation into the FAA evaluation: one count of conspiracy to defraud the United States, based on the conduct of two former Boeing employees who failed to inform the FAA's Aircraft Evaluation Group (which decides pilot-training requirements) about MCAS's expanded range; the agreement also states other employees did inform other FAA officials. Payments totalled \$2.51B: \$243.6M penalty, \$500M for crash victims' heirs and beneficiaries, \$1.77B to airline customers. Boeing's own 8-K recorded a **\$743.6M charge** (the penalty plus the \$500M); the \$1.77B was described as part of ongoing compensation of customers for grounding losses. Compute it: 243.6 + 500 + 1,770 = 2,513.6, but only 743.6 (29.6%) was new money to victims and the government, so "\$2.5 billion" is a headline, not an apples-to-apples penalty.

Later developments, as of October 2026:

- **May 2024:** the DOJ told the court Boeing had breached the DPA (failure to design, implement and enforce a compliance and ethics program).
- **24 Jul 2024:** a plea agreement was filed; **5 Dec 2024:** Judge Reed O'Connor rejected it (reasons included the diversity-and-inclusion provision in monitor selection, and the monitor provisions marginalising the court).
- **29 May 2025:** a non-prosecution agreement (NPA): \$487.2M overall penalty (\$243.6M already paid under the DPA), \$444.5M additional victim compensation, \$455.0M investment in compliance, safety and quality, and an independent compliance consultant. (The headline is \$1.1B: 243.6 + 444.5 + 455.0 = 1,143.1.)
- **6 Nov 2025:** the same judge dismissed the prosecution on the DOJ's motion, holding the DOJ had not acted in bad faith. Reporting says he expressed reservations but felt he lacked authority to refuse.
- **31 Mar 2026:** the Fifth Circuit denied the families' mandamus petitions: the challenge to the 2021 DPA was moot, the DOJ had not violated their Crime Victims' Rights Act rights concerning the NPA, and dismissal stood. A later docket entry dated 22 May 2026 appears in a case-law database for the companion appeal number; I could not open it, so check the docket for anything after March.
- **Individuals:** the one person criminally charged, former chief technical pilot Mark Forkner, was acquitted of all wire-fraud counts by a jury on 23 March 2022.

Map to Ch01's three tracks: the professional track had no body able to sanction anyone with authority; civil litigation continued separately; the criminal track yielded a corporate DPA, then an NPA, then dismissal, and an acquittal for the one individual. As in Therac-25, "no conviction" is a statement about which standard was met, not about whether the Code was violated. Note also how the charge was framed: *deceiving a regulator* about MCAS, not causing the deaths.

## 5.5 Case 2 — Cambridge Analytica: API Permission Design Is an Ethical Decision

**Facts** (primary sources: the FTC's complaint against Kogan and Nix, the UK Information Commissioner's reports, Facebook's April 2018 announcement):

- **The app.** Aleksandr Kogan built a personality-quiz app, the "thisisyourdigitallife" app (the FTC calls it the GSRApp), after the CPW Lab app he developed in 2013 was repurposed. The FTC complaint alleges the harvesting covered approximately **250,000–270,000** U.S. app users and approximately **50–65 million** of their Facebook "friends," including at least 30 million identifiable U.S. consumers.
- **The mechanism.** Under Graph API v1.0, an app that a user authorised could also read profile data of that user's friends, who never opened the app and never saw a consent screen. Facebook announced in April 2014 that API v2 would remove this for friends who had not themselves used the app; new apps were limited immediately, and **existing apps got a one-year grace period** (to about May 2015). The FTC says Kogan's app was "grandfathered" into v1.0 behaviour; the ICO reports that most of the app's data was accessed during that grace period and that a pre-emptive migration request by Kogan was rejected on 7 May 2014 while v1 use continued.
- **The number.** Facebook's 4 April 2018 statement said information of "up to 87 million people — mostly in the US" may have been improperly shared; the post gave no methodology. The ICO describes it as Facebook's estimate for app users plus friends, and notes earlier reporting said 50 million. The FTC's 50–65 million friends is a different quantity from Facebook's 87 million; the sources are not in conflict so much as counting different populations by different methods. For the UK, the ICO says about 1 million.
- **Penalties.** The FTC imposed **\$5 billion** on Facebook on 24 July 2019 (vote 3–2) for violating its 2012 order about users' control over data shared with third-party apps. The ICO issued a **£500,000** penalty on 25 October 2018. Why that figure: it was the **statutory maximum** under the Data Protection Act 1998 (set by the Data Protection (Monetary Penalties) (Maximum Penalty and Notices) Regulations 2010); the ICO said the fine would have been significantly higher under GDPR and DPA 2018, which had replaced the old regime by May 2018 — after the conduct. Facebook appealed, then withdrew the appeal under a settlement and paid on 4 November 2019.

**The engineering insight, as arithmetic.** One consent click released the data of many non-consenting people. With 270,000 installers and Facebook's 87 million: 87,000,000 / 270,000 ≈ **322**. Whatever the true figure, the **amplification factor** of a permission is a design parameter, and a factor in the hundreds means the consent screen is legitimate for roughly 1 in 300 of the people affected. In the ICO's words, the app's consent was not sufficiently informed, especially for friends' data.

**Run the procedure on the platform-design decision "let apps read friends' data, with a grace period":**

| Framework | Verdict | Why |
|---|---|---|
| Utilitarian | Defensible at design time, wrong once harms are counted | Visible benefit: growth of an app ecosystem. Harms are diffuse, hard to price (political profiling, loss of control) — the same measurement problem as COMPAS's statistical harm in Ch03 |
| Kantian | Rejects | Friends cannot consent; their data is a means to the installer's and developer's ends — the humanity formula applied to third parties |
| Virtue | Rejects the *grandfathering* | Knowing the permission was unsafe enough to remove, yet leaving it running for a year, fails the honesty and care a practically wise engineer would show |
| Rawlsian | Rejects | A rule where "a friend's click releases my profile" would not be chosen by someone who might be the friend |

The disagreement here is *timing*, not the permission model: a ledger can accept the permission initially; the other three make the grace period itself the ethical problem. The deprecation policy was an ethical decision disguised as a compatibility policy.

**SE Code mapping.** 3.12: respect the privacy of those affected by the software. 3.13: use only data derived by ethical and lawful means, and only in ways properly authorised. 1.03: do not approve software that diminishes privacy. 3.03: identify and address ethical and legal issues in the project. For the legal layer (purpose limitation, consent, the regimes that now apply) see [Ch02](02_Data_Privacy_GDPR_CCPA_And_Surveillance.md).

```text
Permission design review (derived from the case, 4 questions):
1. Whose data does this scope return? (Only the consenting user's, or others'?)
2. Amplification factor = people affected per consent. Is it ~1, or >>1?
3. Can the data be used for a purpose the data subject never saw?
4. If we tighten this later, who is exempted ("grandfathered"), for how long, and why?
```

## 5.6 Speaking Up: Escalation and Whistleblowing

The SE Code does not say "blow the whistle." It builds a ladder, and each rung's justification is that the one below failed:

- **2.06 / 2.07:** identify, document, collect evidence and *report to the client or employer* if a project is likely to be problematic or a significant social-concern issue exists.
- **6.12:** express concerns to the people involved when significant Code violations are detected, *unless this is impossible, counter-productive, or dangerous.*
- **2.09:** promote no interest adverse to the employer *unless a higher ethical concern is being compromised* — then inform the employer or another appropriate authority.
- **1.04:** disclose actual or potential danger to "appropriate persons or authorities."
- **6.13:** report significant violations *to appropriate authorities* when consultation with those involved is impossible, counter-productive or dangerous.

The ACM Code (2018), guideline 1.2, is the only one of the two that uses the word: if leaders do not act to curtail risks, it "may be necessary to 'blow the whistle,'" but "capricious or misguided reporting of risks can itself be harmful," so assess before reporting. The Code thus gives you *permission and sequence* — and says nothing about **legal protection**, which depends on jurisdiction and on which statute your disclosure happens to trigger.

**Case: Roger Boisjoly and Challenger.** On 31 July 1985 Boisjoly, a Morton Thiokol engineer, wrote a memo warning that unless the booster seal problem was fixed, the result could be "a catastrophe of the highest order" involving loss of life. On the night of 27 January 1986, a teleconference with NASA considered the next morning's launch at a forecast of about 36°F. Thiokol engineers presented data that the O-rings performed worse when cold; Thiokol's vice president recommended against launching below 53°F, the coldest prior flight. After a roughly 30-minute caucus in which a manager asked him to "take off his engineering hat and put on his management hat," Thiokol management reversed and recommended launch. The Rogers Commission concluded the decision process was flawed and that, had the decision-makers known all the facts, launch was highly unlikely. (Mapped to the procedure: this is a ledger in which the *engineering dissent was the data* and was overridden by a role switch — a textbook case for step 6, documentation of dissent.)

What protections existed? Boisjoly testified before the Commission and in 1988 received the AAAS Award for Scientific Freedom and Responsibility. He reported being shunned and left Thiokol later in 1986. His two suits against Thiokol, seeking \$3 billion, were dismissed on 2 September 1988 by Judge David Winder, who held Boisjoly lacked standing and found some claims inadequately pleaded; reporting at the time quotes the court as treating workplace pressure as "not desirable" but below the tort threshold. In other words, no legal mechanism rewarded or shielded the engineer who had written the warning down; the documentation protected the *truth*, not the person.

**Case: Frances Haugen and Facebook (2021).** Haugen left Facebook in May 2021, provided internal documents to journalists and regulators, and testified to the U.S. Senate on 5 October 2021. She filed eight complaints with the SEC alleging material misrepresentations. Legal commentary at the time noted that she was covered by the Sarbanes-Oxley and Dodd-Frank anti-retaliation provisions *because her disclosures were framed as securities-law violations*, that courts had not tested whether leaks to the media were protected, and that Facebook could in theory pursue her confidentiality agreement. The contrast with Boisjoly is the lesson: protection arrived through a **channel** (investor-disclosure law) rather than through the nature of the harm. For an engineer, "does my concern fit a statute that protects reporting it?" is a legal question to ask a lawyer *before* the disclosure, not after — and the SE Code's 2.05 confidentiality duty is explicitly bounded by "consistent with the public interest and consistent with the law."

## Section Challenge

<details>
<summary><strong>Q1.</strong> A manager defends a one-sensor design by pointing to the ledger in 5.2 with VSL = \$20M, passengers weighted 1.0, and the other parameters unchanged. Compute the break-even p. Then give two responses that do not simply say "your probability is wrong."</summary>

p* = COST_B / (DEATHS × VSL × w) = 1,050,000 / (173 × 20,000,000 × 1.0) = 1.05×10⁶ / 3.46×10⁹ ≈ **3.03×10⁻⁴**. So at \$20M the ledger endorses A only if the true per-aircraft-lifetime loss probability is below roughly 3 in 10,000 — between the \$10M (6.07×10⁻⁴) and \$30M (2.02×10⁻⁴) rows.

Response 1, **challenge the ledger's membership and structure**: the model treats losses as independent, but a one-sensor design is a common-cause flaw present in every aircraft, so one failure mode produces clustered losses and a fleet grounding; adding that term (the cost of grounding, the correlation) moves the break-even down. Response 2, **argue the constraint, not the number**: the FAA's single-failure principle exists because tail probabilities cannot be tested before deployment; the Kantian and Rawlsian tests also ask whether the crew can consent and whether you would choose the rule as a passenger. Also invoke decision-procedure step 5: irreversible harm, non-consenting third parties, untestable p — the tiebreaker selects B regardless of where p* lands. Either response is a legitimate *engineering* argument; "your VSL is wrong" is weaker because VSL is itself the contested weight.

</details>

<details>
<summary><strong>Q2.</strong> You are designing an OAuth-style permission scope, "read my friends' interests." Apply the four questions in 5.5 and propose a design change. What does the 322× figure tell you?</summary>

Q1: the scope returns data about people other than the consenting user. Q2: the amplification factor is the average friend count of installers — hundreds, as in the Kogan case (87M/270K ≈ 322), so about 99.7% of the data subjects never saw a consent screen. Q3: nothing in the scope's contract prevents use for a purpose (commercial voter profiling) the data subjects never contemplated; the ICO said the consent was not sufficiently informed for friends' data and the use went beyond what the platform permitted. Q4: any later tightening that exempts existing apps lets the unsafe behaviour continue for exactly the period the grace window lasts — the Kogan app took most of its data in that window.

Design changes, each tied to the derivation: return only friends who *themselves* authorised the same app (amplification factor 1, so a consent covers its own subject); bind each scope to a declared purpose that is shown at consent and enforced server-side; make privacy-reducing deprecations **non-grandfathered** or short, with a separate review for apps already holding the data. The 322× figure says the consent screen is a valid mechanism for about 1/322 of the affected people, so the design cannot rely on the consent UI to carry the ethical load — the *scope definition* does.

</details>

<details>
<summary><strong>Q3.</strong> You find that a feature exports patients' diagnosis codes to an analytics vendor without a clear legal basis. Your team lead says "legal approved it verbally; ship." Using only the SE Code clause numbers in 5.6, what is your sequence of actions, what must you document, and what does the Code not tell you?</summary>

**Sequence.** Start at **2.06/2.07**: write down the issue and evidence (what data, to whom, on what basis, who said what and when) and report it to the employer in writing — verbal approval is not evidence, and the written record is also your protection. Under **6.12**, express the concern directly to the people involved (the lead, the legal contact) unless that is impossible, counter-productive or dangerous; ask for the approval in writing. If that fails and the issue is a real danger or significant violation, **2.09** (higher ethical concern: inform the employer or another appropriate authority) and **1.04** (disclose potential danger to appropriate persons or authorities) apply; **6.13** allows reporting outward only when consultation is impossible, counter-productive or dangerous. ACM 1.2 adds: assess the situation first — a capricious report can itself harm.

**Document** per 5.3 step 6: options, which framework dissents (the Kantian and Rawlsian tests flag patients who did not consent; the ledger might not), who accepted the risk, and the date. **The Code does not tell you** whether disclosing outside the company is legally protected. That depends on jurisdiction and statute; Haugen's protection came through securities law, Boisjoly had none. The step before any outward report is to ask a lawyer which statute, if any, your disclosure engages, and to preserve (not copy beyond what you are entitled to) the evidence. Also note 2.05: confidentiality holds only where "consistent with the public interest and consistent with the law."

</details>

---

## Chapter Summary

| Concept | What it establishes | Concrete anchor from this chapter |
|---|---|---|
| Framework = procedure | Each theory is an algorithm with inputs and a known failure mode; same case, different verdicts | Utilitarian sum, Kant's universal-law and humanity tests, Aristotle's phronesis, Rawls 1971 |
| Weights are premises | A utilitarian verdict flips when a contestable weight changes | At p = 3×10⁻⁴: \$10M per life picks A (+\$2.12B), \$30M picks B (−\$2.03B) |
| Decision procedure | Stakeholders, options, four evaluations, locate disagreement, decide, document dissent | The YAML decision record; SE Code 3.01, 2.06, 3.11 |
| Boeing 737 MAX | A single-sensor and disclosure decision, not an edge-case bug; accountability fragmented | 189 + 157 = 346 deaths; \$2.51B headline vs \$743.6M charge; NPA; dismissal 6 Nov 2025; Fifth Circuit 31 Mar 2026 |
| Cambridge Analytica | Permission design and deprecation policy are ethical decisions | 250–270K installers to 50–65M friends (FTC); up to 87M (Facebook); ≈322× amplification; \$5B FTC; £500K ICO maximum |
| Escalation ladder | The Code gives permission and sequence, not legal protection | 2.06/2.07, 6.12, 2.09, 1.04, 6.13; Boisjoly (suits dismissed 1988) vs Haugen (SEC channel, 2021) |

## Where We Go Next

You now have a way to *evaluate* a decision and to record its disagreements. The capstone asks you to run the whole machine on a product that does not exist yet: a fictional launch with stakeholders, framework verdicts, a risk register, and a mitigation plan written the way a decision record should be — with the dissent preserved.

*Next: [06_Capstone_Ethical_Risk_Assessment.md](06_Capstone_Ethical_Risk_Assessment.md)*
