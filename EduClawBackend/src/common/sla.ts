export const TURN_PIPELINE_P95_TARGET_MS = 2500;

export const percentile = (values: number[], percentileRank: number): number => {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const boundedRank = Math.min(1, Math.max(0, percentileRank));
  const index = Math.ceil(sorted.length * boundedRank) - 1;
  return sorted[Math.max(0, index)] ?? 0;
};

export const p95 = (values: number[]): number => percentile(values, 0.95);
