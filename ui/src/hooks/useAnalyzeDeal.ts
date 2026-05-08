import { useState } from "react";
import type { Deal, DealAnalysis } from "@/types";

export function useAnalyzeDeal(
  deal: Deal | undefined,
  onSuccess: (analysis: DealAnalysis) => void,
) {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (!deal) return;
    setAnalyzing(true);
    setError(null);

    const { analysis: _analysis, ...dealRest } = deal;

    try {
      const resp = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dealRest),
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
