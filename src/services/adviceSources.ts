// Nombres visibles de quien redacto cada consejo del coach.
export const ADVICE_SOURCE_LABELS: Record<string, string> = {
  rules: 'Lectura en vivo',
  groq: 'Groq',
  gemini: 'Gemini',
  heuristic: 'Motor local',
};

/** Order of the sources in the totals; Gemini only shows up for old tips. */
export const ADVICE_SOURCE_ORDER = ['rules', 'groq', 'heuristic', 'gemini'] as const;

export function adviceSourceLabel(source: string): string {
  return ADVICE_SOURCE_LABELS[source] ?? ADVICE_SOURCE_LABELS.heuristic;
}

/** Totals to show: every current source, and Gemini only when it has old tips. */
export function visibleSourceTotals(bySource: Record<string, number> | undefined): { source: string; label: string; count: number }[] {
  return ADVICE_SOURCE_ORDER
    .map((source) => ({ source, label: ADVICE_SOURCE_LABELS[source], count: bySource?.[source] ?? 0 }))
    .filter((row) => row.source !== 'gemini' || row.count > 0);
}
