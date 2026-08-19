/** Concept2 watts: W = 2.80 / (splitSeconds / 500)^3 */
export const WATTS_CONSTANT = 2.8;

export type PaceError = { ok: false; error: string };
export type PaceOk<T> = { ok: true } & T;
export type PaceResult<T> = PaceOk<T> | PaceError;

export type WorkoutSegment = {
  index: number;
  meters: number;
  workSeconds: number;
  restSeconds: number;
  splitSeconds: number;
  splitLabel: string;
  watts: number;
};

export type WorkoutPlan = {
  kind: "distance" | "time";
  totalMeters: number;
  totalWorkSeconds: number;
  totalRestSeconds: number;
  avgSplitSeconds: number;
  avgSplitLabel: string;
  avgWatts: number;
  segments: WorkoutSegment[];
};

const KNOWN_FADE_DISTANCES = [500, 1000, 2000, 5000, 6000, 10000] as const;

const FADE_SECONDS: Record<number, { to2k: number; to5k: number; to6k: number }> = {
  500: { to2k: -6, to5k: -1, to6k: 1 },
  1000: { to2k: -4, to5k: 1, to6k: 3 },
  2000: { to2k: 0, to5k: 5.5, to6k: 8 },
  5000: { to2k: -5.5, to5k: 0, to6k: 2.5 },
  6000: { to2k: -8, to5k: -2.5, to6k: 0 },
  10000: { to2k: -10, to5k: -4.5, to6k: -2 },
};

export function parseSplit(input: string): number | null {
  const trimmed = input.trim();
  const withDecimal = /^(\d+):([0-5]\d)(?:\.(\d+))?$/.exec(trimmed);
  if (!withDecimal) return null;
  const minutes = Number(withDecimal[1]);
  const seconds = Number(withDecimal[2]);
  const frac = withDecimal[3] ? Number(`0.${withDecimal[3]}`) : 0;
  const total = minutes * 60 + seconds + frac;
  if (!Number.isFinite(total) || total <= 0) return null;
  return total;
}

export function secondsToSplit(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return "0:00.0";
  }
  const tenths = Math.round(totalSeconds * 10);
  const minutes = Math.floor(tenths / 600);
  const remainder = tenths % 600;
  const secs = Math.floor(remainder / 10);
  const tenth = remainder % 10;
  return `${minutes}:${secs.toString().padStart(2, "0")}.${tenth}`;
}

export function secondsToClock(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return "0:00";
  }
  const rounded = Math.round(totalSeconds);
  const minutes = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function wattsFromPace(splitSeconds: number): number {
  if (!Number.isFinite(splitSeconds) || splitSeconds <= 0) return 0;
  const pace = splitSeconds / 500;
  return WATTS_CONSTANT / pace ** 3;
}

export function distanceFromTime(workSeconds: number, splitSeconds: number): number {
  if (splitSeconds <= 0) return 0;
  return (workSeconds / splitSeconds) * 500;
}

export function timeFromDistance(meters: number, splitSeconds: number): number {
  return splitSeconds * (meters / 500);
}

/** Split a distance into nominal segments, last piece keeps the remainder. */
export function segmentLengths(totalMeters: number, nominalLength: number): number[] {
  if (totalMeters <= 0 || nominalLength <= 0) return [];
  const full = Math.floor(totalMeters / nominalLength);
  const remainder = totalMeters % nominalLength;
  const lengths = Array.from({ length: full }, () => nominalLength);
  if (remainder > 0) lengths.push(remainder);
  return lengths;
}

export function weightedAverageSplit(
  weights: number[],
  splitSeconds: number[],
): number {
  if (weights.length !== splitSeconds.length || weights.length === 0) return 0;
  let weightSum = 0;
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i];
    if (w <= 0) continue;
    weightSum += w;
    acc += w * splitSeconds[i];
  }
  return weightSum === 0 ? 0 : acc / weightSum;
}

export type DistanceInput = {
  totalMeters: number;
  segmentLength: number;
  splits: string[];
};

export function planDistance(input: DistanceInput): PaceResult<WorkoutPlan> {
  const { totalMeters, segmentLength, splits } = input;
  if (totalMeters <= 0) return { ok: false, error: "Distance must be positive." };
  if (segmentLength <= 0) return { ok: false, error: "Segment length must be positive." };

  const meters = segmentLengths(totalMeters, segmentLength);
  if (splits.length !== meters.length) {
    return {
      ok: false,
      error: `Expected ${meters.length} splits for ${totalMeters}m in ~${segmentLength}m pieces.`,
    };
  }

  const parsed: number[] = [];
  for (let i = 0; i < splits.length; i++) {
    const value = parseSplit(splits[i]);
    if (value === null) {
      return { ok: false, error: `Invalid split in segment ${i + 1}. Use m:ss or m:ss.s` };
    }
    parsed.push(value);
  }

  const segments: WorkoutSegment[] = meters.map((m, i) => {
    const workSeconds = timeFromDistance(m, parsed[i]);
    return {
      index: i + 1,
      meters: m,
      workSeconds,
      restSeconds: 0,
      splitSeconds: parsed[i],
      splitLabel: secondsToSplit(parsed[i]),
      watts: wattsFromPace(parsed[i]),
    };
  });

  return summarize("distance", segments);
}

export type TimePiece = {
  workSeconds: number;
  restSeconds?: number;
  split: string;
};

export function planTime(pieces: TimePiece[]): PaceResult<WorkoutPlan> {
  if (pieces.length === 0) {
    return { ok: false, error: "Add at least one segment." };
  }

  const segments: WorkoutSegment[] = [];
  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i];
    const splitSeconds = parseSplit(piece.split);
    if (splitSeconds === null) {
      return { ok: false, error: `Invalid split in segment ${i + 1}. Use m:ss or m:ss.s` };
    }
    if (piece.workSeconds <= 0) {
      return { ok: false, error: `Segment ${i + 1} needs a duration.` };
    }
    const meters = distanceFromTime(piece.workSeconds, splitSeconds);
    segments.push({
      index: i + 1,
      meters,
      workSeconds: piece.workSeconds,
      restSeconds: piece.restSeconds ?? 0,
      splitSeconds,
      splitLabel: secondsToSplit(splitSeconds),
      watts: wattsFromPace(splitSeconds),
    });
  }

  return summarize("time", segments);
}

function summarize(kind: WorkoutPlan["kind"], segments: WorkoutSegment[]): PaceOk<WorkoutPlan> {
  const totalMeters = segments.reduce((sum, s) => sum + s.meters, 0);
  const totalWorkSeconds = segments.reduce((sum, s) => sum + s.workSeconds, 0);
  const totalRestSeconds = segments.reduce((sum, s) => sum + s.restSeconds, 0);
  const weights = kind === "distance" ? segments.map((s) => s.meters) : segments.map((s) => s.workSeconds);
  const avgSplitSeconds = weightedAverageSplit(
    weights,
    segments.map((s) => s.splitSeconds),
  );
  return {
    ok: true,
    kind,
    totalMeters,
    totalWorkSeconds,
    totalRestSeconds,
    avgSplitSeconds,
    avgSplitLabel: secondsToSplit(avgSplitSeconds),
    avgWatts: wattsFromPace(avgSplitSeconds),
    segments,
  };
}

export type DistanceEstimate = {
  label: "2k" | "5k" | "6k";
  meters: number;
  splitSeconds: number;
  splitLabel: string;
  timeSeconds: number;
  timeLabel: string;
  isActual: boolean;
};

export function estimateRaceTimes(avgSplitSeconds: number, workoutMeters: number): DistanceEstimate[] {
  const closest = KNOWN_FADE_DISTANCES.reduce((prev, curr) =>
    Math.abs(curr - workoutMeters) < Math.abs(prev - workoutMeters) ? curr : prev,
  );
  const fades = FADE_SECONDS[closest] ?? FADE_SECONDS[2000];
  const defs: Array<{ label: DistanceEstimate["label"]; meters: number; fade: number }> = [
    { label: "2k", meters: 2000, fade: fades.to2k },
    { label: "5k", meters: 5000, fade: fades.to5k },
    { label: "6k", meters: 6000, fade: fades.to6k },
  ];
  return defs.map((d) => {
    const isActual = Math.abs(workoutMeters - d.meters) < 1;
    const splitSeconds = isActual ? avgSplitSeconds : avgSplitSeconds + d.fade;
    const timeSeconds = splitSeconds * (d.meters / 500);
    return {
      label: d.label,
      meters: d.meters,
      splitSeconds,
      splitLabel: secondsToSplit(splitSeconds),
      timeSeconds,
      timeLabel: secondsToSplit(timeSeconds),
      isActual,
    };
  });
}
