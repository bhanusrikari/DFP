"""
Offline training script for the discharge/readmission risk indicator
(Phase 3 stretch feature — see the master plan's "Where ML models are used").

This trains a small, INTERPRETABLE logistic regression (not a black box,
since the output is advisory-only and shown directly to a doctor) on a
SYNTHETIC dataset, because no real labeled outcome data exists for this
project. Run it, and it overwrites
../../apps/api/src/modules/risk-score/model-coefficients.json with the
learned weights, in the same shape risk-score.service.ts (TypeScript)
already knows how to load and score at request time.

Usage:
    pip install -r requirements.txt
    python train.py
"""

import json
import os
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score

FEATURE_NAMES = [
    "ageNorm",
    "lengthOfStayNorm",
    "abnormalFindingsNorm",
    "highSeverityFindingsNorm",
    "caregiverRequired",
    "priorEncountersNorm",
]

RNG = np.random.default_rng(seed=42)
N_SAMPLES = 4000


def generate_synthetic_dataset(n: int):
    """
    Synthetic patient-encounter features + a synthetic "complication/readmission
    within 30 days" label. The label is generated from a hand-designed rule with
    noise, standing in for real historical outcomes this project does not have
    access to. This is why the trained model is explicitly labeled
    "illustrative, not clinically validated" wherever it's shown.
    """
    age_norm = RNG.uniform(0, 1, n)  # age / 100
    los_norm = RNG.beta(2, 5, n)  # length of stay / 30 days, right-skewed
    abnormal_norm = RNG.beta(2, 5, n)  # abnormal findings / 10
    high_sev_norm = abnormal_norm * RNG.uniform(0, 1, n)  # subset of abnormal findings
    caregiver_required = RNG.integers(0, 2, n).astype(float)
    prior_encounters_norm = RNG.beta(1.5, 6, n)  # prior admissions / 5

    X = np.column_stack(
        [age_norm, los_norm, abnormal_norm, high_sev_norm, caregiver_required, prior_encounters_norm]
    )

    # True underlying risk relationship (unknown to the model, used only to
    # generate labels) plus noise, so the trained model has to approximate it.
    true_logit = (
        -1.6
        + 1.1 * age_norm
        + 1.4 * los_norm
        + 1.8 * abnormal_norm
        + 2.3 * high_sev_norm
        + 0.6 * caregiver_required
        + 1.0 * prior_encounters_norm
        + RNG.normal(0, 0.5, n)
    )
    prob = 1 / (1 + np.exp(-true_logit))
    y = RNG.binomial(1, prob)

    return X, y


def main():
    X, y = generate_synthetic_dataset(N_SAMPLES)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    model = LogisticRegression(max_iter=1000)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    accuracy = accuracy_score(y_test, y_pred)
    auroc = roc_auc_score(y_test, y_proba)

    print(f"Held-out accuracy: {accuracy:.3f}")
    print(f"Held-out AUROC:    {auroc:.3f}")
    print("(Synthetic-data metrics — illustrative only, not a clinical validation.)")

    weights = {name: float(w) for name, w in zip(FEATURE_NAMES, model.coef_[0])}
    output = {
        "version": "sklearn-logreg-v1",
        "trainedOn": f"synthetic dataset, n={N_SAMPLES}, held-out accuracy={accuracy:.3f}, AUROC={auroc:.3f}",
        "bias": float(model.intercept_[0]),
        "weights": weights,
    }

    out_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "apps", "api", "src", "modules", "risk-score", "model-coefficients.json"
    )
    out_path = os.path.abspath(out_path)
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
