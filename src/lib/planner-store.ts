import { create } from "zustand";
import type { TimePiece, WorkoutPlan } from "@/lib/core";

export type Draft =
  | { mode: "distance"; totalMeters: number; segmentLength: number; splits: string[] }
  | { mode: "time"; pieces: TimePiece[] };

type PlannerState = {
  plan: WorkoutPlan | null;
  draft: Draft | null;
  setResult: (plan: WorkoutPlan, draft: Draft) => void;
  clear: () => void;
};

export const usePlannerStore = create<PlannerState>((set) => ({
  plan: null,
  draft: null,
  setResult: (plan, draft) => set({ plan, draft }),
  clear: () => set({ plan: null, draft: null }),
}));
