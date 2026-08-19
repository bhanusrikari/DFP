import { StatusBadge } from "./StatusBadge";
import { AISummaryPanel } from "./AISummaryPanel";

interface ReportLike {
  id: string;
  type: string;
  originalFilename: string;
  status: string;
  createdAt: string;
}
interface AIAnalysisLike {
  reportId: string | null;
  summaryText: string;
  findingsJson: string;
  plainLanguageExplanation: string;
  modelUsed: string;
}

export function ReportCard({ report, analysis }: { report: ReportLike; analysis?: AIAnalysisLike }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-xs uppercase tracking-wide text-gray-500">{report.type.replaceAll("_", " ")}</span>
          <p className="text-sm text-ink">{report.originalFilename}</p>
        </div>
        <StatusBadge status={report.status} />
      </div>
      <div className="mt-3">
        <AISummaryPanel analysis={analysis} title="AI report analysis" />
      </div>
    </div>
  );
}
