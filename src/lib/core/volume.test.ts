import { describe, expect, it } from "vitest";
import { classifyIntensity, suggestWeekTemplate } from "./volume";

describe("classifyIntensity", () => {
  it("treats near-2k pace as hard", () => {
    expect(classifyIntensity(105, 103)).toBe("hard");
  });

  it("treats much slower than 2k as easy", () => {
    expect(classifyIntensity(125, 105)).toBe("easy");
  });
});

describe("suggestWeekTemplate", () => {
  it("picks high-intensity when hard pieces outrun volume", () => {
    expect(suggestWeekTemplate(40000, 4).template).toBe("high-intensity");
  });

  it("picks high-volume when meters are high and hard work is limited", () => {
    expect(suggestWeekTemplate(120000, 1).template).toBe("high-volume");
  });
});
