import { distance as levenshteinDistance } from "fastest-levenshtein";
import { TextMapHash } from '../../../../shared/types/lang-types.ts';

export type TmSupersedeMatch = {
  removedHash: TextMapHash;
  supersedeCandidate: TextMapHash;
  score: number;
  confidence: number;
  reason?: string;
};

export type TmSupersession = {
  enText?: string,
  removedHashes: TextMapHash[];
  supersedeCandidates: TextMapHash[];

  supersedeMatches?: TmSupersedeMatch[];
  unresolvedRemovedHashes?: TextMapHash[];
  unusedSupersedeCandidates?: TextMapHash[];
};

type MatchOptions = {
  maxScore?: number;
  minConfidenceGap?: number;
  allowSinglePlausibleGreedyMatch?: boolean
};

const DEFAULT_OPTIONS: Required<MatchOptions> = {
  maxScore: 0.38,
  minConfidenceGap: 0.08,
  allowSinglePlausibleGreedyMatch: true
};

export function matchSupersedesInPlace(
  record: TmSupersession,
  options: MatchOptions = {},
): TmSupersession {
  const opts: MatchOptions = { ...DEFAULT_OPTIONS, ...options };

  record.supersedeMatches = [];
  record.unresolvedRemovedHashes = [];
  record.unusedSupersedeCandidates = [];

  const removed = record.removedHashes;
  const candidates = record.supersedeCandidates;

  if (removed.length === 0) {
    record.unusedSupersedeCandidates.push(...candidates);
    return record;
  }

  if (candidates.length === 0) {
    record.unresolvedRemovedHashes.push(...removed);
    return record;
  }

  if (removed.length === 1 && candidates.length === 1) {
    record.supersedeMatches.push({
      removedHash: removed[0],
      supersedeCandidate: candidates[0],
      score: 0,
      confidence: 1,
      reason: "single removed hash and single supersede candidate",
    });

    return record;
  }

  const deltaFrequencies = getDeltaFrequencies(removed, candidates);
  const usedCandidates = new Set<number>();
  const matchedRemoved = new Set<number>();

  const rankedRemoved = removed
    .map((removedHash, removedIndex) => {
      const rankedCandidates = candidates
        .map((candidate, candidateIndex) => {
          const scored = scorePair(removedHash, candidate, deltaFrequencies);

          return {
            removedIndex,
            candidateIndex,
            removedHash,
            candidate,
            score: scored.score,
            reason: scored.reason,
          };
        })
        .sort((a, b) => a.score - b.score);

      const best = rankedCandidates[0];
      const second = rankedCandidates[1];

      return {
        removedIndex,
        rankedCandidates,
        bestScore: best?.score ?? Number.POSITIVE_INFINITY,
        confidenceGap: second
          ? second.score - best.score
          : Number.POSITIVE_INFINITY,
        plausibleCount: rankedCandidates.filter(c => c.score <= opts.maxScore)
          .length,
      };
    })
    .sort((a, b) => {
      // Process the clearest matches first.
      if (a.plausibleCount !== b.plausibleCount) {
        return a.plausibleCount - b.plausibleCount;
      }

      if (a.bestScore !== b.bestScore) {
        return a.bestScore - b.bestScore;
      }

      return b.confidenceGap - a.confidenceGap;
    });

  for (const removedRanking of rankedRemoved) {
    const availableCandidates = removedRanking.rankedCandidates.filter(
      c => !usedCandidates.has(c.candidateIndex),
    );

    const best = availableCandidates[0];
    const second = availableCandidates[1];

    if (!best) continue;

    const confidenceGap = second
      ? second.score - best.score
      : Number.POSITIVE_INFINITY;

    const plausibleAvailableCount = availableCandidates.filter(
      c => c.score <= opts.maxScore,
    ).length;

    const bestIsCloseEnough = best.score <= opts.maxScore;

    const isUnambiguous =
      confidenceGap >= opts.minConfidenceGap ||
      (opts.allowSinglePlausibleGreedyMatch && plausibleAvailableCount === 1);

    if (!bestIsCloseEnough || !isUnambiguous) {
      continue;
    }

    matchedRemoved.add(best.removedIndex);
    usedCandidates.add(best.candidateIndex);

    record.supersedeMatches.push({
      removedHash: best.removedHash,
      supersedeCandidate: best.candidate,
      score: roundScore(best.score),
      confidence:
        confidenceGap === Number.POSITIVE_INFINITY
          ? 1
          : roundScore(Math.min(1, confidenceGap)),
      reason:
        plausibleAvailableCount === 1
          ? `${best.reason}; only plausible candidate`
          : `${best.reason}; confidence gap ${roundScore(confidenceGap)}`,
    });
  }

  for (let i = 0; i < removed.length; i++) {
    if (!matchedRemoved.has(i)) {
      record.unresolvedRemovedHashes.push(removed[i]);
    }
  }

  for (let i = 0; i < candidates.length; i++) {
    if (!usedCandidates.has(i)) {
      record.unusedSupersedeCandidates.push(candidates[i]);
    }
  }

  return record;
}

function scorePair(
  removedHash: TextMapHash,
  candidate: TextMapHash,
  deltaFrequencies: Map<string, number>,
): { score: number; reason: string } {
  const a = String(removedHash);
  const b = String(candidate);

  if (a === b) {
    return {
      score: 0,
      reason: "exact match",
    };
  }

  const maxLen = Math.max(a.length, b.length);

  const editScore = levenshteinDistance(a, b) / maxLen;
  const prefixScore = 1 - commonPrefixLength(a, b) / maxLen;
  const suffixScore = 1 - commonSuffixLength(a, b) / maxLen;
  const lengthScore = Math.abs(a.length - b.length) / maxLen;

  let score =
    0.45 * editScore +
    0.30 * prefixScore +
    0.10 * suffixScore +
    0.15 * lengthScore;

  let reason = "string similarity";

  const delta = getNumericDelta(removedHash, candidate);

  if (delta !== null) {
    const numericScore = numericRelativeDistanceScore(removedHash, candidate);
    const deltaFrequency = deltaFrequencies.get(delta.toString()) ?? 0;

    score =
      0.65 * score +
      0.35 * numericScore;

    if (deltaFrequency >= 2) {
      // Repeated deltas inside the same record are strong evidence,
      // but this does not assume the delta is always 512.
      score *= 0.65;
      reason = `numeric/string similarity; repeated delta ${formatSignedBigInt(delta)}`;
    } else {
      reason = `numeric/string similarity; delta ${formatSignedBigInt(delta)}`;
    }
  }

  return {
    score: clamp01(score),
    reason,
  };
}

function getDeltaFrequencies(
  removed: TextMapHash[],
  candidates: TextMapHash[],
): Map<string, number> {
  const frequencies = new Map<string, number>();

  for (const r of removed) {
    for (const c of candidates) {
      const delta = getNumericDelta(r, c);
      if (delta === null) continue;

      const key = delta.toString();
      frequencies.set(key, (frequencies.get(key) ?? 0) + 1);
    }
  }

  return frequencies;
}

function getNumericDelta(a: TextMapHash, b: TextMapHash): bigint | null {
  const aStr = String(a);
  const bStr = String(b);

  if (!/^-?\d+$/.test(aStr) || !/^-?\d+$/.test(bStr)) {
    return null;
  }

  return BigInt(bStr) - BigInt(aStr);
}

function numericRelativeDistanceScore(
  a: TextMapHash,
  b: TextMapHash,
): number {
  const aBig = BigInt(String(a));
  const bBig = BigInt(String(b));

  const delta = absBigInt(bBig - aBig);
  const baseline = maxBigInt(absBigInt(aBig), absBigInt(bBig), 1n);

  /**
   * This is the important fix.
   *
   * 454700 -> 455212:
   * delta = 512
   * baseline = 455212
   * relative distance ≈ 0.0011, not 0.5.
   */
  return bigintRatioToNumber(delta, baseline);
}

function bigintRatioToNumber(numerator: bigint, denominator: bigint): number {
  if (denominator === 0n) return 1;
  if (numerator === 0n) return 0;
  if (numerator >= denominator) return 1;

  /**
   * Preserve precision without requiring values to fit Number safely.
   * Six decimal places is enough for scoring.
   */
  const scale = 1_000_000n;
  const scaled = (numerator * scale) / denominator;

  return Number(scaled) / Number(scale);
}

function commonPrefixLength(a: string, b: string): number {
  let i = 0;

  while (i < a.length && i < b.length && a[i] === b[i]) {
    i++;
  }

  return i;
}

function commonSuffixLength(a: string, b: string): number {
  let i = 0;

  while (
    i < a.length &&
    i < b.length &&
    a[a.length - 1 - i] === b[b.length - 1 - i]
    ) {
    i++;
  }

  return i;
}

function absBigInt(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function maxBigInt(...values: bigint[]): bigint {
  return values.reduce((max, value) => (value > max ? value : max));
}

function formatSignedBigInt(value: bigint): string {
  return value >= 0n ? `+${value.toString()}` : value.toString();
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function roundScore(value: number): number {
  return Math.round(value * 1000) / 1000;
}
