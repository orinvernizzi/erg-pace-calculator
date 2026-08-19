import { secondsToClock, secondsToSplit } from "@/lib/core";

export function formatMeters(meters: number) {
  return `${Math.round(meters).toLocaleString()} m`;
}

export function formatSport(sport: string) {
  const names: Record<string, string> = {
    erg: "Erg",
    water: "Water",
    bike: "Bike",
    ski: "Ski",
    other: "Other",
  };
  return names[sport] ?? sport;
}

export function formatSource(source: string) {
  if (source === "pm5") return "PM5";
  if (source === "manual") return "Manual";
  return "Planned";
}

export { secondsToClock, secondsToSplit };
