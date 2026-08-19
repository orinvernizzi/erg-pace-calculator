"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { planDistance, planTime, secondsToSplit, segmentLengths, type TimePiece } from "@/lib/core";
import { usePlannerStore } from "@/lib/planner-store";

const DISTANCES = [
  { label: "2k", value: 2000 },
  { label: "5k", value: 5000 },
  { label: "6k", value: 6000 },
  { label: "10k", value: 10000 },
  { label: "Half", value: 21097 },
];

function defaultDistanceSplits(count: number) {
  return Array.from({ length: count }, (_, i) => {
    if (i === 0) return "1:47.0";
    if (i === count - 1) return "1:43.0";
    return "1:45.0";
  });
}

export default function PlanPage() {
  const router = useRouter();
  const setResult = usePlannerStore((s) => s.setResult);
  const [mode, setMode] = useState<"distance" | "time">("distance");
  const [totalMeters, setTotalMeters] = useState(2000);
  const [customMeters, setCustomMeters] = useState("");
  const [segmentLength, setSegmentLength] = useState(500);
  const [splits, setSplits] = useState<string[]>(["1:47.0", "1:45.0", "1:44.0", "1:43.0"]);
  const [error, setError] = useState<string | null>(null);

  const [timeKind, setTimeKind] = useState<"single" | "equal" | "custom">("single");
  const [singleMin, setSingleMin] = useState(20);
  const [singleSec, setSingleSec] = useState(0);
  const [singleSplit, setSingleSplit] = useState("2:00.0");
  const [eqMin, setEqMin] = useState(8);
  const [eqCount, setEqCount] = useState(4);
  const [eqRest, setEqRest] = useState(2);
  const [eqSplit, setEqSplit] = useState("1:50.0");
  const [custom, setCustom] = useState<TimePiece[]>([
    { workSeconds: 600, restSeconds: 120, split: "2:00.0" },
  ]);

  const meters = customMeters ? Number(customMeters) || totalMeters : totalMeters;
  const lengths = useMemo(() => segmentLengths(meters, segmentLength), [meters, segmentLength]);

  useEffect(() => {
    setSplits((current) => {
      if (current.length === lengths.length) return current;
      return lengths.map((_, i) => current[i] ?? defaultDistanceSplits(lengths.length)[i] ?? "1:45.0");
    });
  }, [lengths]);

  function quickFill() {
    setSplits(defaultDistanceSplits(lengths.length));
  }

  function applyTemplate(name: string) {
    setMode("time");
    setTimeKind("custom");
    if (name === "30r20") {
      setCustom([{ workSeconds: 1800, restSeconds: 0, split: "2:05.0" }]);
    } else if (name === "4x8") {
      setCustom(Array.from({ length: 4 }, () => ({ workSeconds: 480, restSeconds: 120, split: "1:50.0" })));
    } else if (name === "pyramid") {
      setCustom(
        [1, 2, 3, 4, 3, 2, 1].map((min, i) => ({
          workSeconds: min * 60,
          restSeconds: 60,
          split: secondsToSplit(105 - i),
        })),
      );
    } else if (name === "10x5") {
      setCustom(Array.from({ length: 10 }, () => ({ workSeconds: 300, restSeconds: 120, split: "1:55.0" })));
    }
  }

  function calculate() {
    setError(null);
    if (mode === "distance") {
      const plan = planDistance({ totalMeters: meters, segmentLength, splits });
      if (!plan.ok) {
        setError(plan.error);
        return;
      }
      setResult(plan, { mode: "distance", totalMeters: meters, segmentLength, splits });
      router.push("/results");
      return;
    }
    let pieces: TimePiece[] = [];
    if (timeKind === "single") {
      pieces = [{ workSeconds: singleMin * 60 + singleSec, split: singleSplit }];
    } else if (timeKind === "equal") {
      pieces = Array.from({ length: eqCount }, () => ({
        workSeconds: eqMin * 60,
        restSeconds: eqRest * 60,
        split: eqSplit,
      }));
    } else {
      pieces = custom;
    }
    const plan = planTime(pieces);
    if (!plan.ok) {
      setError(plan.error);
      return;
    }
    setResult(plan, { mode: "time", pieces });
    router.push("/results");
  }

  return (
    <div className="stack">
      <div>
        <h1>Plan.</h1>
        <p className="lede">Splits, watts, and every fragment of the piece.</p>
      </div>

      <div className="tiles">
        <motion.button
          type="button"
          className="tile"
          data-active={mode === "distance"}
          onClick={() => setMode("distance")}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
        >
          <h3>Distance</h3>
          <p>2k, 5k, 6k, half. Different split on every segment.</p>
        </motion.button>
        <motion.button
          type="button"
          className="tile"
          data-active={mode === "time"}
          onClick={() => setMode("time")}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
        >
          <h3>Time</h3>
          <p>Steady state and intervals, with rest between pieces.</p>
        </motion.button>
      </div>

      {mode === "distance" ? (
        <>
          <section className="group">
            <div className="field">
              <label htmlFor="distance">Distance</label>
              <select
                id="distance"
                value={customMeters ? "custom" : String(totalMeters)}
                onChange={(e) => {
                  if (e.target.value === "custom") setCustomMeters(String(totalMeters));
                  else {
                    setCustomMeters("");
                    setTotalMeters(Number(e.target.value));
                  }
                }}
              >
                {DISTANCES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label} · {d.value.toLocaleString()} m
                  </option>
                ))}
                <option value="custom">Custom</option>
              </select>
            </div>
            {customMeters ? (
              <div className="field">
                <label htmlFor="custom-m">Meters</label>
                <input id="custom-m" inputMode="numeric" value={customMeters} onChange={(e) => setCustomMeters(e.target.value)} />
              </div>
            ) : null}
            <div className="field">
              <label htmlFor="seg">Fragment length</label>
              <select id="seg" value={segmentLength} onChange={(e) => setSegmentLength(Number(e.target.value))}>
                <option value={250}>250 m</option>
                <option value={400}>400 m</option>
                <option value={500}>500 m</option>
                <option value={1000}>1000 m</option>
              </select>
            </div>
          </section>
          <p className="hint">
            {lengths.length} fragments
            {lengths.at(-1) !== segmentLength ? ` · last piece ${lengths.at(-1)} m so the total still adds up` : ""}.
          </p>
          <div className="split-grid">
            {lengths.map((len, i) => (
              <div className="split-card" key={`${len}-${i}`}>
                <div className="caption">
                  {i + 1}/{lengths.length} · {len} m
                </div>
                <input
                  value={splits[i] ?? ""}
                  onChange={(e) => {
                    const next = [...splits];
                    next[i] = e.target.value;
                    setSplits(next);
                  }}
                  placeholder="1:45.0"
                  aria-label={`Split ${i + 1}`}
                />
                <div className="caption">/500 m</div>
              </div>
            ))}
          </div>
          <div className="actions">
            <button className="btn btn-secondary" type="button" onClick={quickFill}>
              Quick Fill
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="actions">
            <button className="btn btn-secondary" type="button" onClick={() => applyTemplate("30r20")}>
              30′
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => applyTemplate("4x8")}>
              4 × 8′
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => applyTemplate("pyramid")}>
              Pyramid
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => applyTemplate("10x5")}>
              10 × 5′
            </button>
          </div>
          <section className="group">
            <div className="field">
              <label htmlFor="time-kind">Structure</label>
              <select id="time-kind" value={timeKind} onChange={(e) => setTimeKind(e.target.value as typeof timeKind)}>
                <option value="single">Single piece</option>
                <option value="equal">Equal intervals</option>
                <option value="custom">Custom intervals</option>
              </select>
            </div>
          </section>
          {timeKind === "single" ? (
            <section className="group">
              <div className="field">
                <label>Minutes</label>
                <input type="number" min={0} value={singleMin} onChange={(e) => setSingleMin(Number(e.target.value))} />
              </div>
              <div className="field">
                <label>Seconds</label>
                <input type="number" min={0} max={59} value={singleSec} onChange={(e) => setSingleSec(Number(e.target.value))} />
              </div>
              <div className="field">
                <label>Split /500 m</label>
                <input value={singleSplit} onChange={(e) => setSingleSplit(e.target.value)} />
              </div>
            </section>
          ) : null}
          {timeKind === "equal" ? (
            <section className="group">
              <div className="field">
                <label>Work minutes</label>
                <input type="number" min={1} value={eqMin} onChange={(e) => setEqMin(Number(e.target.value))} />
              </div>
              <div className="field">
                <label>Repeats</label>
                <input type="number" min={1} value={eqCount} onChange={(e) => setEqCount(Number(e.target.value))} />
              </div>
              <div className="field">
                <label>Rest minutes</label>
                <input type="number" min={0} value={eqRest} onChange={(e) => setEqRest(Number(e.target.value))} />
              </div>
              <div className="field">
                <label>Split /500 m</label>
                <input value={eqSplit} onChange={(e) => setEqSplit(e.target.value)} />
              </div>
            </section>
          ) : null}
          {timeKind === "custom" ? (
            <section className="group">
              {custom.map((piece, i) => (
                <div className="field" key={i}>
                  <label>Segment {i + 1}</label>
                  <div className="piece-row">
                    <input
                      type="number"
                      min={1}
                      value={Math.round(piece.workSeconds / 60)}
                      onChange={(e) => {
                        const next = [...custom];
                        next[i] = { ...piece, workSeconds: Number(e.target.value) * 60 };
                        setCustom(next);
                      }}
                      aria-label={`Segment ${i + 1} work minutes`}
                    />
                    <input
                      type="number"
                      min={0}
                      value={Math.round((piece.restSeconds ?? 0) / 60)}
                      onChange={(e) => {
                        const next = [...custom];
                        next[i] = { ...piece, restSeconds: Number(e.target.value) * 60 };
                        setCustom(next);
                      }}
                      aria-label={`Segment ${i + 1} rest minutes`}
                    />
                    <input
                      value={piece.split}
                      onChange={(e) => {
                        const next = [...custom];
                        next[i] = { ...piece, split: e.target.value };
                        setCustom(next);
                      }}
                      aria-label={`Segment ${i + 1} split`}
                    />
                  </div>
                  <div className="caption">work min · rest min · split</div>
                </div>
              ))}
              <div className="row">
                <button className="btn-ghost btn" type="button" onClick={() => setCustom([...custom, { workSeconds: 300, restSeconds: 120, split: "2:00.0" }])}>
                  Add segment
                </button>
                {custom.length > 1 ? (
                  <button className="btn-ghost btn" type="button" onClick={() => setCustom(custom.slice(0, -1))}>
                    Remove last
                  </button>
                ) : null}
              </div>
            </section>
          ) : null}
        </>
      )}

      {error ? <p className="error">{error}</p> : null}

      <button className="btn" type="button" onClick={calculate}>
        Calculate
      </button>
    </div>
  );
}
