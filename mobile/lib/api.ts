import { getItemAsync } from "expo-secure-store";
import type { FinishedWorkout } from "./pm5";

const API = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:3000";
const TOKEN_KEY = "ergcalc_token";

export async function apiUrl() {
  return API.replace(/\/$/, "");
}

async function authHeaders() {
  const token = await getItemAsync(TOKEN_KEY);
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function signIn(email: string, password: string) {
  const res = await fetch(`${await apiUrl()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json()) as { token?: string; error?: string; user?: { email: string } };
  if (!res.ok || !data.token) throw new Error(data.error ?? "Sign in failed");
  return data;
}

export async function fetchWorkouts() {
  const res = await fetch(`${await apiUrl()}/api/workouts`, {
    headers: await authHeaders(),
  });
  if (res.status === 401) throw new Error("Sign in required.");
  if (!res.ok) throw new Error("Could not load logbook");
  return res.json() as Promise<{
    workouts: Array<{
      id: string;
      sport: string;
      source: string;
      performedAt: string;
      totalMeters: number;
      totalWorkSeconds: number;
      avgSplitSeconds: number;
    }>;
  }>;
}

export async function savePm5Workout(workout: FinishedWorkout) {
  const res = await fetch(`${await apiUrl()}/api/workouts`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({
      sport: "erg",
      source: "pm5",
      manual: {
        kind: "distance",
        totalMeters: workout.totalMeters,
        totalWorkSeconds: workout.totalWorkSeconds,
        avgSplitSeconds: workout.avgSplitSeconds,
        avgWatts: workout.avgWatts,
        dragFactor: workout.dragFactor,
        splits: workout.splits,
      },
    }),
  });
  if (!res.ok) throw new Error("Could not save workout");
  return res.json();
}
