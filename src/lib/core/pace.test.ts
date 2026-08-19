import { describe, expect, it } from "vitest";
import {
  estimateRaceTimes,
  parseSplit,
  planDistance,
  planTime,
  secondsToSplit,
  segmentLengths,
  wattsFromPace,
  weightedAverageSplit,
} from "./pace";

describe("parseSplit", () => {
  it("accepts 1:45 and 1:45.0", () => {
    expect(parseSplit("1:45")).toBe(105);
    expect(parseSplit("1:45.0")).toBe(105);
    expect(parseSplit("1:45.3")).toBeCloseTo(105.3);
  });

  it("rejects empty and out-of-range seconds", () => {
    expect(parseSplit("")).toBeNull();
    expect(parseSplit("1:60.0")).toBeNull();
    expect(parseSplit("1:99")).toBeNull();
  });
});

describe("secondsToSplit", () => {
  it("does not emit 1:60.0", () => {
    expect(secondsToSplit(119.96)).toBe("2:00.0");
    expect(secondsToSplit(59.96)).toBe("1:00.0");
    expect(secondsToSplit(105)).toBe("1:45.0");
  });
});

describe("wattsFromPace", () => {
  it("matches Concept2 at 1:40 and 2:00", () => {
    expect(wattsFromPace(100)).toBeCloseTo(350, 5);
    expect(wattsFromPace(120)).toBeCloseTo(2.8 / (120 / 500) ** 3, 8);
  });
});

describe("segmentLengths", () => {
  it("keeps a remainder for half marathon at 500m", () => {
    const lengths = segmentLengths(21097, 500);
    expect(lengths.reduce((a, b) => a + b, 0)).toBe(21097);
    expect(lengths.at(-1)).toBe(97);
    expect(lengths.filter((n) => n === 500)).toHaveLength(42);
  });
});

describe("planDistance", () => {
  it("sums 2k 4x500 from per-piece splits", () => {
    const plan = planDistance({
      totalMeters: 2000,
      segmentLength: 500,
      splits: ["1:47.0", "1:45.0", "1:44.0", "1:43.0"],
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.totalWorkSeconds).toBeCloseTo(107 + 105 + 104 + 103);
    expect(plan.avgWatts).toBeCloseTo(wattsFromPace(plan.avgSplitSeconds));
  });

  it("does not die on half marathon + 500m", () => {
    const lengths = segmentLengths(21097, 500);
    const splits = lengths.map(() => "2:00.0");
    const plan = planDistance({
      totalMeters: 21097,
      segmentLength: 500,
      splits,
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(Math.round(plan.totalMeters)).toBe(21097);
  });

  it("aborts when a split is invalid and does not return a partial plan", () => {
    const plan = planDistance({
      totalMeters: 2000,
      segmentLength: 500,
      splits: ["1:45.0", "nope", "1:45.0", "1:45.0"],
    });
    expect(plan).toEqual({
      ok: false,
      error: "Invalid split in segment 2. Use m:ss or m:ss.s",
    });
  });
});

describe("planTime", () => {
  it("weights average split by work time, not by segment count", () => {
    const plan = planTime([
      { workSeconds: 60, split: "1:40.0" },
      { workSeconds: 1800, split: "2:00.0" },
    ]);
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.avgSplitSeconds).toBeCloseTo((60 * 100 + 1800 * 120) / 1860, 6);
    expect(plan.avgSplitSeconds).toBeGreaterThan(119);
    expect(plan.avgWatts).toBeCloseTo(wattsFromPace(plan.avgSplitSeconds));
  });

  it("aborts custom pieces on the first invalid split", () => {
    const plan = planTime([
      { workSeconds: 480, restSeconds: 120, split: "1:50.0" },
      { workSeconds: 480, restSeconds: 120, split: "bad" },
    ]);
    expect(plan.ok).toBe(false);
    if (plan.ok) return;
    expect(plan.error).toMatch(/segment 2/i);
  });
});

describe("weightedAverageSplit", () => {
  it("equals the arithmetic mean when weights are equal", () => {
    expect(weightedAverageSplit([500, 500], [100, 120])).toBe(110);
  });
});

describe("estimateRaceTimes", () => {
  it("marks 2k as actual when the piece is 2000m", () => {
    const estimates = estimateRaceTimes(105, 2000);
    const twoK = estimates.find((e) => e.label === "2k");
    expect(twoK?.isActual).toBe(true);
    const fiveK = estimates.find((e) => e.label === "5k");
    expect(fiveK?.isActual).toBe(false);
    expect(fiveK?.splitSeconds).toBeCloseTo(110.5);
  });
});
