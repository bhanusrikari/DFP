prd

# AI-Assisted Patient Discharge Readiness & Follow-Up Planner

## 1. Product Overview

A healthcare application that helps hospitals manage patient discharge.

The system uses AI to analyze patient reports, generate simple summaries, and highlight possible abnormalities. A doctor reviews the AI analysis and decides the patient's **medical discharge readiness**. Management then verifies non-medical requirements such as caregiver availability, insurance, billing, and other discharge requirements.

After successful approval, the system automatically creates a post-discharge care planner containing medicines, appointments, and timelines.

---

## 2. User Roles

### Doctor

The doctor can:

* View patient information and reports.
* View AI-generated report summaries.
* View AI-highlighted abnormalities.
* View historical patient information.
* Validate the reports and AI analysis.
* Enter medical discharge readiness.
* Specify whether a caregiver is required.
* Enter medicines/prescriptions.
* Enter future appointments.
* Submit the medical discharge decision.

### Management

Management can:

* View patients approved medically by doctors.
* Check caregiver availability if required.
* Check insurance status.
* Check billing/payment status.
* Check other administrative discharge requirements.
* Approve or reject operational discharge.
* View the reason when discharge fails.

---

## 3. Main Workflow

### Step 1 — Patient Reports

Patient reports are uploaded/stored in the system.

Examples:

* Blood reports
* Diagnostic reports
* Clinical notes
* Medication information
* Other discharge-related documents

Each patient must have a unique patient ID.

---

### Step 2 — AI Report Analysis

AI analyzes the available reports.

AI should:

* Generate a simple summary of each report.
* Highlight possible abnormal values/findings.
* Explain important findings in simple language.
* Combine the important findings into an overall summary.

AI does **not** make the final medical decision.

---

### Step 3 — Doctor Dashboard

The doctor sees:

* Patient details
* Original reports
* AI summaries
* AI-highlighted abnormalities
* Patient history

The doctor reviews and validates the information.

The doctor then provides:

**Medical Discharge Readiness**

Possible values:

* `READY`
* `NOT_READY`

The doctor also provides:

* Caregiver required: Yes/No
* Prescription/medicines
* Future appointments
* Doctor notes

---

### Step 4 — Management Dashboard

Only medically approved patients move to management.

Management checks:

* Caregiver availability
* Insurance status
* Billing/payment status
* Required documents
* Other administrative requirements

Management then decides whether the discharge can proceed.

---

## 4. Discharge Status

The system should clearly separate medical and management decisions.

### Medical Status

```text
MEDICAL_READY
MEDICAL_NOT_READY
```

### Management Status

```text
PENDING
APPROVED
FAILED
```

If management fails the discharge, the system must store a specific failure tag.

Example tags:

```text
CAREGIVER_UNAVAILABLE
INSURANCE_PENDING
BILLING_PENDING
DOCUMENTS_INCOMPLETE
OTHER_ADMINISTRATIVE_ISSUE
```

Example:

```text
Overall Status: DISCHARGE_FAILED
Failure Stage: MANAGEMENT
Failure Tag: CAREGIVER_UNAVAILABLE
```

This allows hospital staff to immediately understand why discharge failed.

---

## 5. Successful Discharge

If:

```text
Doctor → MEDICAL_READY
Management → APPROVED
```

then:

```text
DISCHARGE_APPROVED
```

The system generates a patient care planner using the doctor's prescription and appointments.

Example:

```text
19 Aug
Discharge

20 Aug
8:00 AM → Medicine
8:00 PM → Medicine

25 Aug
10:30 AM → Follow-up appointment

26 Aug
Medicine course completed
```

---

## 6. Reminders

The system sends automated reminders for:

* Medicines
* Follow-up appointments
* Important care instructions
* Other scheduled activities

WhatsApp can be used as the reminder channel.

---

## 7. Patient History

The system permanently maintains the patient's historical records.

For every patient, store:

* Patient information
* Previous encounters
* Previous reports
* AI summaries
* Doctor decisions
* Prescriptions
* Appointments
* Discharge history
* Management decisions
* Failure reasons/tags

Every patient must have a unique identifier so that their history can be retrieved across multiple hospital visits.

---

## 8. Core Principle

**AI assists. Doctor decides medically. Management validates operational requirements.**

The system should never automatically make the final medical discharge decision.