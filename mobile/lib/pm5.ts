/** Concept2 PM5 BLE — public UUIDs from the Bluetooth Smart Interface spec. */

export const PM5_DISCOVERY_SERVICE = "CE060000-43E5-11E4-916C-0800200C9A66";
export const PM5_INFO_SERVICE = "CE060010-43E5-11E4-916C-0800200C9A66";
export const PM5_CONTROL_SERVICE = "CE060020-43E5-11E4-916C-0800200C9A66";
export const PM5_ROWING_SERVICE = "CE060030-43E5-11E4-916C-0800200C9A66";

/** Rowing Service general status characteristic (live split / distance / SPM). */
export const ROWING_GENERAL_STATUS = "CE060031-43E5-11E4-916C-0800200C9A66";
export const ROWING_ADDITIONAL_STATUS = "CE060032-43E5-11E4-916C-0800200C9A66";
export const ROWING_ADDITIONAL_STATUS_2 = "CE060033-43E5-11E4-916C-0800200C9A66";
export const ROWING_SAMPLE_RATE = "CE060034-43E5-11E4-916C-0800200C9A66";
export const ROWING_STROKE_DATA = "CE060035-43E5-11E4-916C-0800200C9A66";
export const ROWING_END_WORKOUT_SUMMARY = "CE060039-43E5-11E4-916C-0800200C9A66";

export type LiveStroke = {
  splitSeconds: number;
  distanceMeters: number;
  spm: number | null;
  hr: number | null;
  elapsedSeconds: number;
};

export type FinishedWorkout = {
  totalMeters: number;
  totalWorkSeconds: number;
  avgSplitSeconds: number;
  avgWatts: number;
  dragFactor: number | null;
  splits: Array<{
    index: number;
    meters: number;
    workSeconds: number;
    splitSeconds: number;
    watts: number;
    spm: number | null;
    hr: number | null;
    lengthMeters: number | null;
    forceNewtons: number | null;
  }>;
};

export function parseUInt24(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

export function wattsFromPace(splitSeconds: number): number {
  if (splitSeconds <= 0) return 0;
  return 2.8 / (splitSeconds / 500) ** 3;
}
