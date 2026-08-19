export type IntensityBand = "easy" | "moderate" | "hard";

export type WeekSuggestion = {
  template: "high-volume" | "high-intensity";
  note: string;
};

export function classifyIntensity(avgSplitSeconds: number, reference2kSplit: number | null): IntensityBand {
  if (reference2kSplit === null || reference2kSplit <= 0) return "moderate";
  const delta = avgSplitSeconds - reference2kSplit;
  if (delta <= 4) return "hard";
  if (delta >= 12) return "easy";
  return "moderate";
}

export function suggestWeekTemplate(weeklyMeters: number, hardPieces: number): WeekSuggestion {
  if (hardPieces >= 3 && weeklyMeters < 80000) {
    return {
      template: "high-intensity",
      note: "Several hard pieces on relatively low volume. Keep easy days truly easy.",
    };
  }
  if (weeklyMeters >= 100000 && hardPieces <= 2) {
    return {
      template: "high-volume",
      note: "Aerobic volume is high. Limit additional threshold work this week.",
    };
  }
  if (weeklyMeters >= 80000) {
    return {
      template: "high-volume",
      note: "Volume-first week. Intensity should sit on top of, not replace, the meters.",
    };
  }
  return {
    template: "high-intensity",
    note: "Shorter week: quality pieces carry the load. Protect recovery between them.",
  };
}
