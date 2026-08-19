import { useState } from "react";
import type { AIFinding } from "@dfp/shared";
import { StatusBadge } from "./StatusBadge";

interface AIAnalysisLike {
  summaryText: string;
  findingsJson: string;
  plainLanguageExplanation: string;
  modelUsed: string;
}

// Feature: Patient-Friendly AI Summary. One analysis, two read modes — Doctor
// (technical, findings + severities + reference ranges) and Patient (plain
// language, no clinical jargon, never a diagnosis/treatment recommendation,
// and explicit about whether the doctor has reviewed it yet). Every field
// stays labeled AI-generated and nothing here can pre-fill a decision control
// — see ARCHITECTURE.md section 2.3 / the master plan's guardrails table.
export function AISummaryPanel({
  analysis,
  title,
  doctorReviewed,
}: {
  analysis: AIAnalysisLike | undefined;
  title: string;
  doctorReviewed?: boolean;
}) {
  const [mode, setMode] = useState<"doctor" | "patient">("doctor");

  if (!analysis) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
        <span className="font-mono text-xs uppercase tracking-wide text-gray-400">{title}</span>
        <p className="mt-1">AI analyzing… this report hasn't finished processing yet.</p>
      </div>
    );
  }

  const findings: AIFinding[] = JSON.parse(analysis.findingsJson);

  return (
    <div className="rounded-2xl border border-accent-soft bg-white shadow-card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs uppercase tracking-wide text-accent-dark">{title}</span>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-full border border-gray-200 text-[11px] font-medium">
            <button
              type="button"
              onClick={() => setMode("doctor")}
              className={`px-2.5 py-1 ${mode === "doctor" ? "bg-accent text-white" : "bg-white text-gray-500"}`}
            >
              Doctor summary
            </button>
            <button
              type="button"
              onClick={() => setMode("patient")}
              className={`px-2.5 py-1 ${mode === "patient" ? "bg-accent text-white" : "bg-white text-gray-500"}`}
            >
              Patient summary
            </button>
          </div>
          <span className="rounded-full bg-gold/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-gold">
            AI-generated — verify
          </span>
        </div>
      </div>

      {mode === "doctor" ? (
        <>
          <p className="mt-3 text-sm text-ink">{analysis.summaryText}</p>
          {findings.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {findings.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <StatusBadge status={f.severity} />
                  <span>
                    {f.finding}
                    {f.referenceRange ? <span className="text-gray-400"> (range: {f.referenceRange})</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 border-t border-gray-100 pt-2 text-xs text-gray-500">Doctor review required before any decision.</p>
          <p className="mt-2 font-mono text-[10px] text-gray-400">model: {analysis.modelUsed}</p>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm text-ink">{analysis.plainLanguageExplanation}</p>
          {findings.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-ink">
              {findings.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{f.finding}</span>
                </li>
              ))}
            </ul>
          )}
          <div className={`mt-3 flex items-center gap-1.5 border-t border-gray-100 pt-2 text-xs ${doctorReviewed ? "text-success" : "text-gray-500"}`}>
            {doctorReviewed ? "✓ Your doctor has reviewed this and will explain next steps." : "Your doctor has not reviewed this yet."}
          </div>
        </>
      )}
    </div>
  );
}
