# Product Requirements Document — AI-Assisted Patient Discharge Readiness & Follow-Up Planner

**Version:** 2.0
**Date:** 2026-08-19
**Status:** Draft
**Changelog:**
- v2.0 (2026-08-19): Formal PRD rewrite superseding the original problem-statement-style `PRD.md`. Incorporates four newly-scoped capabilities — Discharge Blocker Intelligence, Historical Change Detection, Caregiver Matching, and Patient-Friendly AI Summary — into v1 scope, per stakeholder direction.
- v1.0: Original informal PRD (`PRD.md`), derived from a healthcare hackathon problem statement (Domain: Healthcare, Problem Statement 9).

**Input sources for this document:** the original problem statement, `PRD.md`, and the four-capability specification provided directly by the stakeholder in this session.

---

## 1. Summary

Hospitals coordinate patient discharge across clinical and administrative teams who each hold only part of the picture: doctors assess medical readiness, while separate staff verify caregiver availability, insurance, billing, and paperwork. Today this coordination happens by manually reviewing reports across systems, with no single place that explains *why* a discharge is delayed or *what* changed since a patient's last visit. This creates delayed discharges (which reduce bed availability and increase cost), and preventable post-discharge risk (missed follow-ups, medication errors, readmissions) when instructions aren't clearly understood.

This product gives hospital care teams one workflow to move a patient from "reports in" to "discharged with a follow-up plan," with AI assisting at defined points (summarizing reports, flagging abnormal values, explaining findings in plain language, comparing against the patient's history, and recommending a caregiver) while a doctor and a management reviewer remain the only parties who can make the medical and operational decisions, respectively.

**Who is affected:** doctors reviewing discharge readiness, hospital management/discharge-coordination staff verifying operational requirements, and patients/caregivers who receive post-discharge instructions and reminders.

**Evidence:** qualitative, from the originating problem statement and stakeholder specification. [OPEN — needs input: quantitative evidence such as average discharge delay, readmission rate, or staff time spent on manual coordination.]

---

## 2. Goals

- Give a doctor everything needed to decide medical discharge readiness — reports, AI-generated summaries and flagged findings, and how the patient's condition compares to their last visit — in one place.
- Give management staff a clear, specific answer to "why can't this patient be discharged, and what has to happen next," instead of an opaque failed/pending status.
- Reduce time lost to a specific, common operational gap — caregiver unavailability — by recommending a suitable caregiver at the moment the need is identified.
- Ensure the patient and their caregiver receive an understandable, non-technical explanation of their reports and post-discharge instructions, distinct from the technical version doctors see.
- Preserve a complete, permanent, auditable record of every clinical and operational decision made for a patient, across visits.
- Keep AI strictly assistive: every discharge-relevant decision is made and attributable to a named human role (doctor or management), never inferred or auto-applied by the system.

## 3. Non-Goals

- The system does not make, auto-approve, or auto-reject a medical discharge decision.
- The system is not a diagnostic tool; it does not produce a diagnosis or an independent treatment recommendation.
- The system is not a replacement for a hospital's core EHR/EMR system of record in v1.
- The system does not manage caregiver staffing operations (shift scheduling, payroll, contracts) — it recommends a match for a single discharge from an existing directory.
- The system does not perform insurance claim adjudication or billing/payment processing — it only records status as entered by management.
- The system does not provide real-time clinical monitoring or bedside alerting outside the discharge workflow.
- v1 does not integrate with external hospital systems (lab systems, PACS, insurance clearinghouses, staffing systems); data enters the system via manual upload/entry.

## 4. Success Metrics

| Metric | Baseline | Target |
|---|---|---|
| Time from a patient becoming medically ready to discharge approval | [OPEN — needs input] | [OPEN — needs input] |
| Rate of discharges that fail at the management stage, broken down by blocker tag | [OPEN — needs input] | [OPEN — needs input] |
| Rate of discharges blocked specifically by caregiver unavailability | [OPEN — needs input] | [OPEN — needs input] |
| Doctor-reported clarity/usefulness of the AI-generated summary (survey or equivalent) | [OPEN — needs input] | [OPEN — needs input] |
| Patient/caregiver-reported understanding of discharge instructions (survey or equivalent) | [OPEN — needs input] | [OPEN — needs input] |
| Reminder delivery success rate | [OPEN — needs input] | [OPEN — needs input] |
| 30-day readmission rate for patients discharged through the system | [OPEN — needs input] | [OPEN — needs input] |

No baseline or target values were provided; all are marked open pending real measurement.

## 5. Personas

**Doctor.** Reviews multiple patients per shift under time pressure. Needs to quickly see what's new or abnormal without re-reading every raw report line by line, and needs to trust that nothing is hidden or auto-decided on their behalf. Ultimately accountable for the medical readiness call.

**Management / Discharge Coordinator.** Only becomes involved once a doctor has cleared a patient medically. Works through a checklist of non-clinical requirements (caregiver, insurance, billing, documents) and is frequently the one who has to explain to a patient's family why a discharge is delayed. Needs a specific, actionable reason when something is blocking, not a generic failure.

**Patient / Caregiver.** Not a clinician. Receives instructions about medication, follow-up appointments, and what their reports mean, and needs this explained without technical language, while trusting that a doctor has actually reviewed it — not just an algorithm.

**Hospital Administrator (secondary persona).** Not a primary user of daily workflows, but relies on the permanent audit trail and patient history for oversight, quality review, and answering "why did this discharge fail" after the fact. [OPEN — needs input: is this persona in scope for v1 UI, or audit-trail access only?]

## 6. User Flows

### 6.1 Happy path — successful discharge
1. Hospital staff create a patient record (if new) and upload the patient's reports for the current visit.
2. The system analyzes each report and produces a summary and any flagged abnormal findings.
3. The doctor reviews the reports, the AI summary, flagged findings, and how this visit compares to the patient's previous visit (if any). The doctor marks medical status as ready, states whether a caregiver is required, and enters prescriptions and follow-up appointments.
4. Once marked medically ready, the encounter appears in management's queue. If a caregiver is required, management sees a ranked caregiver recommendation.
5. Management verifies caregiver, insurance, billing, and documents, and approves the discharge.
6. The system generates a dated care plan (medicines, appointments, milestones) and schedules reminders.
7. The patient/caregiver receives reminders and can access a plain-language summary of their reports and instructions.

### 6.2 Unhappy path — doctor determines patient is not ready
1–2. Same as above.
3. The doctor marks medical status as not ready and records notes.
4. The encounter remains with the doctor; it does not enter management's queue. The doctor can revisit and resubmit the decision once the patient's status changes.

### 6.3 Unhappy path — operational blocker at management stage
1–5 as in 6.1, except one or more of caregiver/insurance/billing/documents is not clear.
6. Management submits the review as failed. The system records which specific requirement(s) blocked discharge, which of the others were already satisfied, and what action is required, rather than only a failed status.
7. Staff can act on the stated required action and resubmit once resolved.

### 6.4 Unhappy path — caregiver required but none suitable available
1. The doctor marks a caregiver as required.
2. Management opens the encounter and sees the system's caregiver recommendation.
3. No available caregiver meets the patient's requirements. The system states which requirement could not be met and records this as a caregiver-unavailable blocker rather than silently doing nothing.

### 6.5 Patient/caregiver views their summary
1. At any point after a report has been analyzed, the patient or caregiver (via whatever channel is provided — [OPEN, see §13]) can view a plain-language version of the AI summary.
2. If the doctor has not yet reviewed the report, this is stated. If the doctor has reviewed it, this is stated as well, and the summary never asserts a diagnosis or a treatment recommendation on its own.

## 7. Functional Requirements

### 7.1 Report Ingestion & AI Analysis

**REQ-7.1.1 (P0) — MUST**: The system MUST allow hospital staff to associate one or more reports (e.g., blood report, diagnostic report, clinical note, medication information) with a specific patient visit.
Acceptance: After uploading a report of type `BLOOD` to a visit, the report appears in that visit's report list with status `UPLOADED`, then transitions to `ANALYZED` once analysis completes.

**REQ-7.1.2 (P0) — MUST**: The system MUST generate, for each report, a summary, a plain-language explanation, and a list of flagged findings with a severity level.
Acceptance: For a report containing a lab value outside its reference range, the resulting analysis includes at least one finding with a non-empty severity value (`LOW`, `MODERATE`, or `HIGH`).

**REQ-7.1.3 (P0) — MUST**: The system MUST also produce one combined summary across all of a visit's reports, once all individual report analyses are complete.
Acceptance: Once every report on a visit reaches `ANALYZED`, a single combined summary becomes available for that visit.

**REQ-7.1.4 (P0) — MUST**: The system MUST NOT allow AI-generated analysis to set a medical or operational discharge status. AI output is a read-only input to a human decision.
Acceptance: No system action exists by which an AI-generated finding, by itself and without a submission from an authenticated doctor or management user, changes `medical_status`, `management_status`, or `overall_status`.

### 7.2 Doctor Medical Review

**REQ-7.2.1 (P0) — MUST**: Only an authenticated user in the doctor role MAY submit a medical discharge decision for a visit.
Acceptance: A submission attempt from a non-doctor role is rejected and no decision is recorded.

**REQ-7.2.2 (P0) — MUST**: The doctor MUST be able to set medical status to `MEDICAL_READY` or `MEDICAL_NOT_READY`, state whether a caregiver is required, enter prescriptions, enter follow-up appointments, and enter free-text notes.
Acceptance: A submission with `medicalStatus = MEDICAL_READY`, at least one prescription, and at least one appointment is accepted and recorded against the visit.

**REQ-7.2.3 (P0) — MUST**: A visit MUST only become visible to management once medical status is `MEDICAL_READY`.
Acceptance: A visit with no medical decision, or with `MEDICAL_NOT_READY`, does not appear in management's queue.

### 7.3 Historical Change Detection

**REQ-7.3.1 (P1) — SHOULD**: When a patient has a previous visit, the system SHOULD compare the current visit's lab values, medications, and overall finding volume against the previous visit and surface changes that cross a meaningful threshold (a value moving into or out of its reference range, or a substantial magnitude change), not every numerically different value.
Acceptance: Given a lab value that changed by less than 5% and stayed within its reference range across two visits, it does NOT appear in the comparison. Given a value that crossed from within-range to out-of-range, it DOES appear, labeled as worsened.

**REQ-7.3.2 (P1) — SHOULD**: The comparison SHOULD identify newly added or removed medications between the previous and current visit.
Acceptance: A medication present in the current visit's prescriptions but absent from the previous visit's is labeled "added."

**REQ-7.3.3 (P1) — SHOULD**: The comparison MUST be visible to the doctor on the same screen used to make the medical decision.
Acceptance: Opening a visit with a previous visit on record shows a history-comparison section before or alongside the medical decision form.

**REQ-7.3.4 (P2) — MAY**: If no previous visit exists, the system MAY omit the comparison section entirely rather than showing an empty one.

### 7.4 Management Operational Review

**REQ-7.4.1 (P0) — MUST**: Only an authenticated user in the management role MAY submit an operational discharge review.
Acceptance: A submission attempt from a non-management role is rejected and no review is recorded.

**REQ-7.4.2 (P0) — MUST**: Management MUST record status for caregiver availability (if required), insurance, billing, and documents, and an overall management status of `PENDING`, `APPROVED`, or `FAILED`.
Acceptance: A review can be saved with `managementStatus = PENDING` before a final decision, and later updated to `APPROVED` or `FAILED`.

**REQ-7.4.3 (P0) — MUST**: A `FAILED` management status MUST include at least one specific blocker tag from a defined set (at minimum: `CAREGIVER_UNAVAILABLE`, `INSURANCE_PENDING`, `BILLING_PENDING`, `DOCUMENTS_INCOMPLETE`, `APPOINTMENT_NOT_SCHEDULED`, `OTHER_ADMINISTRATIVE_ISSUE`).
Acceptance: A submission with `managementStatus = FAILED` and no tag is rejected.

**REQ-7.4.4 (P0) — MUST**: Discharge MUST be considered approved only when both medical status is `MEDICAL_READY` and management status is `APPROVED`.
Acceptance: No combination other than (`MEDICAL_READY`, `APPROVED`) results in an overall approved status.

### 7.5 Discharge Blocker Intelligence

**REQ-7.5.1 (P0) — MUST**: When a discharge is not yet approved, the system MUST state, in specific terms: the primary blocker, every other outstanding blocker, which requirements are already satisfied, and the action required to resolve the primary blocker.
Acceptance: For a visit blocked only by an unavailable caregiver, the system states caregiver unavailability as the primary blocker, lists medical approval/insurance/billing/documents as satisfied, and states that a caregiver must be assigned — rather than only showing a failed status.

**REQ-7.5.2 (P0) — MUST**: The system MUST support more than one simultaneous blocker and clearly distinguish the primary blocker from the full list.
Acceptance: A visit with both an unresolved insurance status and an unresolved documents status shows both in the blocker list, with one clearly marked primary.

**REQ-7.5.3 (P1) — SHOULD**: The blocker explanation SHOULD be visible to management before they submit a final failed decision, not only after.
Acceptance: While a review is saved as `PENDING`, the currently-known blockers are already visible.

### 7.6 Caregiver Matching

**REQ-7.6.1 (P0) — MUST**: When the doctor indicates a caregiver is required, the system MUST determine the patient's caregiver-support requirements (from a defined set including at minimum medication assistance, mobility assistance, elderly care, post-surgery support, and home monitoring) and compare them against available caregivers.
Acceptance: A patient whose visit indicates medication and mobility needs produces a requirement list that includes both.

**REQ-7.6.2 (P0) — MUST**: The system MUST present a ranked list of candidate caregivers, each showing which required skills they match and which they are missing, and MUST recommend the best available match.
Acceptance: Given two available caregivers where one matches all required skills and the other matches only some, the fully-matching caregiver is the one recommended.

**REQ-7.6.3 (P0) — MUST**: If no available caregiver satisfies the patient's requirements, the system MUST state that no suitable caregiver is available, state which requirement could not be met, and record `CAREGIVER_UNAVAILABLE` as a discharge blocker.
Acceptance: When every candidate caregiver is either unavailable or missing a required skill, the response contains no recommended caregiver, a stated reason naming the unmet requirement, and the `CAREGIVER_UNAVAILABLE` tag.

**REQ-7.6.4 (P1) — SHOULD**: The recommendation SHOULD include a stated reason a human reviewer can read and evaluate, not only a score.
Acceptance: The recommended caregiver's entry includes a sentence explaining why they were chosen (e.g., which requirements they meet and their availability).

### 7.7 Patient-Friendly AI Summary

**REQ-7.7.1 (P0) — MUST**: The system MUST produce two distinct readable versions of each AI analysis: one technical, concise version for clinical staff, and one plain-language version free of unnecessary medical terminology for the patient/caregiver.
Acceptance: For the same underlying report analysis, the doctor-facing text and the patient-facing text differ, and the patient-facing text does not include the reference-range/severity vocabulary shown in the doctor-facing text.

**REQ-7.7.2 (P0) — MUST**: The patient-facing summary MUST NOT state a diagnosis and MUST NOT independently recommend a treatment.
Acceptance: A manual review of generated patient-facing summaries contains no diagnostic statement ("you have X") or independent treatment instruction not already entered by a doctor.

**REQ-7.7.3 (P0) — MUST**: The patient-facing summary MUST clearly state whether a doctor has reviewed the underlying finding yet.
Acceptance: Before a medical decision exists for the visit, the patient-facing summary states the doctor has not yet reviewed it; after, it states that the doctor has reviewed it.

**REQ-7.7.4 (P1) — SHOULD**: Both the doctor-facing and patient-facing summaries SHOULD be visible from the same underlying analysis without requiring a separate request/regeneration.
Acceptance: A single screen allows switching between the two versions of the same analysis.

### 7.8 Care Plan, Reminders & Patient History

**REQ-7.8.1 (P0) — MUST**: On discharge approval, the system MUST generate a dated care plan derived from the doctor's prescriptions and appointments, including medicine doses, follow-up appointments, and a course-completion milestone.
Acceptance: A prescription with a multi-day duration produces one care plan entry per dose per day for that duration, plus one entry marking course completion.

**REQ-7.8.2 (P0) — MUST**: The system MUST schedule reminders for care plan items and record delivery status for each.
Acceptance: Every care plan item has an associated reminder with a status of scheduled, sent, failed, or acknowledged.

**REQ-7.8.3 (P0) — MUST**: The system MUST permanently retain each patient's history — prior visits, reports, AI analyses, decisions, and outcomes — retrievable by the patient's identity across visits.
Acceptance: Given a patient with two visits, querying that patient's history returns both visits and their associated records.

**REQ-7.8.4 (P0) — MUST**: The system MUST record an audit entry for every clinical or operational decision, capturing who made it and when.
Acceptance: Submitting a medical decision or a management review produces a corresponding audit record identifying the acting user's role and the time of the action.

## 8. Non-Functional Requirements

**NFR-1 (P0) — MUST — Access control.** Only the doctor role may submit a medical decision; only the management role may submit an operational review. Acceptance: role-mismatched submissions are rejected (see REQ-7.2.1, REQ-7.4.1).

**NFR-2 (P1) — SHOULD — Minimum necessary access.** The management role SHOULD NOT require access to the full content of clinical reports to perform its review; it needs the medical-readiness outcome and caregiver requirement, not the underlying clinical detail. Acceptance: [OPEN — needs input: confirm this is a genuine business requirement and not merely today's implementation choice.]

**NFR-3 (P0) — MUST — Non-blocking analysis.** Report upload MUST NOT be blocked or delayed by AI analysis completing. Acceptance: A report can be uploaded and appears in the report list immediately, independent of how long analysis takes.

**NFR-4 (P1) — SHOULD — Human-legible AI provenance.** Every AI-generated summary/finding SHOULD be clearly distinguishable from human-entered content wherever displayed. Acceptance: A visual/textual label identifies AI-generated content in every screen it appears on.

**NFR-5 (P0) — MUST — Data retention.** Patient history MUST be retained permanently unless explicitly deleted by an authorized process. Acceptance: no automatic purge of patient history occurs. [OPEN — needs input: the actual legally-required retention period, which may differ from "permanent."]

**NFR-6 — Privacy/compliance.** [OPEN — needs input: applicable regulatory regime (e.g., HIPAA or a non-US equivalent) and its specific mandated controls — encryption, access logging, breach notification, data residency, minimum-necessary rules beyond NFR-2.]

**NFR-7 — Performance.** [OPEN — needs input: target latency for AI analysis completion, acceptable queue depth, expected concurrent user/patient volume.]

**NFR-8 — Availability.** [OPEN — needs input: required uptime, since a discharge workflow that is down can directly delay real hospital discharges.]

## 9. Edge Cases & Failure States

- **AI analysis fails or times out for a report.** The report's status must reflect this distinctly from "analyzed" or "pending," and staff must be able to see that analysis did not complete, rather than the report silently appearing to have no findings.
- **Doctor attempts to change a medical decision after management has already approved discharge.** The system must reject this change rather than silently allowing a decision to change after the fact.
- **Management attempts to submit a review before a doctor has marked the patient medically ready.** The system must reject this.
- **A required blocker tag is missing on a failed management review.** The submission must be rejected (see REQ-7.4.3).
- **No caregiver in the directory can meet the patient's requirements.** The system must state this and record the blocker rather than returning an empty or misleading recommendation (see REQ-7.6.3).
- **Patient has no previous visit on record.** Historical comparison is omitted rather than shown empty or in error (see REQ-7.3.4).
- **A reminder fails to deliver.** The failure must be recorded and visible, distinct from "sent" (see REQ-7.8.2). [OPEN — needs input: is a retry or escalation required, and after how many failures?]
- **Two staff members attempt to act on the same visit concurrently.** [OPEN — needs input: expected conflict-resolution behavior.]

## 10. Data Requirements

**Captured:** patient identity and demographics; uploaded reports and their type; AI-generated summaries, plain-language explanations, and findings (per report and combined); the doctor's medical decision, caregiver-required flag, prescriptions, appointments, and notes; the management review's per-requirement statuses, overall decision, and blocker tag(s); the caregiver requirement list and match outcome; the generated care plan and its reminders' delivery status; an audit record of every decision with actor and timestamp.

**Retained:** permanently, per REQ-7.8.3 / NFR-5, pending confirmation of the actual legally required period.

**Not addressed here:** where data is stored, in what format, or under what technical access-control mechanism — those are implementation decisions outside this document's scope.

## 11. Assumptions

- Hospital staff authenticate as an individual user with exactly one role (doctor or management) per action; a person who performs both roles does so under two separate accounts. *(Inferred from the strict role separation in the source material; not explicitly stated.)*
- Reports are entered/uploaded by hospital staff in v1; the system does not assume automatic ingestion from lab or imaging systems.
- The caregiver directory used for matching is assumed accurate and current as entered; the system does not independently verify caregiver credentials or real-time availability.
- "Meaningful" historical change (REQ-7.3.1) is assumed to mean a reference-range crossing or a magnitude change large enough to matter clinically, rather than any numeric difference — the precise threshold is an implementation detail, but the requirement that *some* significance filter exists is assumed necessary based on the stakeholder's explicit instruction not to "blindly compare every field."

## 12. Dependencies

- A messaging channel capable of reaching patients/caregivers (the source material names WhatsApp specifically) must be available for reminder delivery.
- A maintained, reasonably current caregiver directory (names, skills, availability) must exist for Caregiver Matching to function.
- A maintained set of clinical reference ranges must exist and be kept current for abnormal-value flagging to remain clinically meaningful.
- An AI/language-processing capability must be available to produce report summaries and plain-language explanations.

## 13. Open Questions

| # | Question | Owner | Needed by |
|---|---|---|---|
| 1 | What are the real baseline/target values for each Success Metric (§4)? | [OPEN — needs input] | [OPEN — needs input] |
| 2 | What compliance/regulatory regime applies, and what specific controls does it mandate (NFR-6)? | [OPEN — needs input] | [OPEN — needs input] |
| 3 | Through what channel does the patient/caregiver access the Patient-Friendly Summary (app, portal, WhatsApp message, printed handout)? | [OPEN — needs input] | [OPEN — needs input] |
| 4 | Is the caregiver directory sourced from a real staffing/agency system, or hospital-maintained manually? | [OPEN — needs input] | [OPEN — needs input] |
| 5 | What is the legally required data retention period, if different from "permanent" (NFR-5)? | [OPEN — needs input] | [OPEN — needs input] |
| 6 | Is concurrent editing of the same visit by two staff members possible in practice, and if so, how should conflicts resolve? | [OPEN — needs input] | [OPEN — needs input] |
| 7 | Is multi-hospital / multi-tenant support required, or is v1 single-hospital? | [OPEN — needs input] | [OPEN — needs input] |
| 8 | Target performance/availability figures (NFR-7, NFR-8)? | [OPEN — needs input] | [OPEN — needs input] |

## 14. Risks & Mitigations

- **Risk:** An AI-generated summary or finding is wrong or misleading. **Mitigation:** human review is mandatory before any decision (REQ-7.1.4); AI content is always labeled (NFR-4); raw reports remain accessible alongside the summary.
- **Risk:** Automation bias — doctors begin trusting the AI summary without reading underlying reports. **Mitigation:** raw reports remain the primary artifact, AI content is visually distinguished, not pre-filled into decision fields.
- **Risk:** Historical Change Detection produces noisy, non-actionable alerts, causing doctors to ignore it. **Mitigation:** significance threshold required by REQ-7.3.1; needs real-world tuning [OPEN].
- **Risk:** Caregiver recommendation is based on stale directory data, leading to a bad real-world match. **Mitigation:** recommendation is advisory only, management must confirm; directory freshness process is an open dependency (§12, §13.4).
- **Risk:** A patient-facing summary is misread as a diagnosis despite REQ-7.7.2. **Mitigation:** explicit doctor-reviewed-or-not statement (REQ-7.7.3); language review process needed [OPEN].
- **Risk:** A discharge remains blocked indefinitely with no escalation path. **Mitigation:** none defined yet — needs an SLA/escalation policy [OPEN].
- **Risk:** Regulatory exposure from handling patient health data without a confirmed compliance regime. **Mitigation:** none defined yet — blocked on §13.2.

## 15. Release Phasing

**v1 scope** (per stakeholder direction — everything specified and already prototyped):
- Core workflow: report upload; AI report analysis (summary, plain-language explanation, flagged findings); doctor medical decision with prescriptions/appointments; management operational review with structured blocker tags; discharge approval/failure computation; generated care plan; reminder scheduling and delivery status; permanent patient history; full audit trail.
- Discharge Blocker Intelligence (§7.5).
- Historical Change Detection (§7.3).
- Caregiver Matching (§7.6).
- Patient-Friendly AI Summary (§7.7).

**Explicitly deferred (post-v1):**
- Automated extraction (e.g., OCR) from scanned or PDF reports — v1 assumes structured/text entry.
- Formal de-identification pipeline for any external AI processing.
- Integration with external EHR, lab, imaging, insurance, or billing systems.
- Integration with a real caregiver staffing/scheduling system (v1 uses a maintained directory, not live scheduling).
- A dedicated patient-facing self-service portal or app (delivery channel remains open — §13.3).
- Multi-hospital / multi-tenant support.
- Formal regulatory compliance certification program.

---

### Self-check
- Every REQ above states an acceptance test with concrete, checkable values. ✅
- Non-Goals (§3) is populated with seven explicit exclusions. ✅
- No metric, baseline, cost, or timeline was invented — all unknowns are marked `[OPEN — needs input]`. ✅
- Sections 1–15 give a team with no further access to the stakeholder enough WHAT/WHY to build a first version; remaining gaps are enumerated in §13 rather than guessed. ✅
