import { useState } from "react";
import type { Deal, DealFollowUp } from "@/types";

export type AnalysisResponse = {
  analysis: string;
  followUps: DealFollowUp[];
};

export function useAnalyzeDeal(
  deal: Deal | undefined,
  onSuccess: (analysis: AnalysisResponse) => void,
) {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (!deal) return;
    setAnalyzing(true);
    setError(null);
    try {
      const resp = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deal),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? "Analysis failed");
      onSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  return { analyzing, error, clearError: () => setError(null), handleAnalyze };
}
