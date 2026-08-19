import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { savePm5Workout } from "../../lib/api";
import { scanPm5 } from "../../lib/ble";
import { PM5_DISCOVERY_SERVICE, wattsFromPace, type FinishedWorkout } from "../../lib/pm5";

export default function ConnectScreen() {
  const [status, setStatus] = useState("Idle");
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [showDev, setShowDev] = useState(false);

  function lookForPm5() {
    setStatus("Looking for a PM5… stay on this screen.");
    try {
      const stop = scanPm5((device) => {
        setDeviceName(device.name ?? "PM5");
        setStatus("Found a monitor. Live splits need a development build.");
        stop();
      });
    } catch {
      setStatus("Bluetooth scan needs a development build, not Expo Go.");
    }
  }

  async function saveDemo() {
    const split = 120;
    const workout: FinishedWorkout = {
      totalMeters: 500,
      totalWorkSeconds: split,
      avgSplitSeconds: split,
      avgWatts: wattsFromPace(split),
      dragFactor: 120,
      splits: [
        {
          index: 1,
          meters: 500,
          workSeconds: split,
          splitSeconds: split,
          watts: wattsFromPace(split),
          spm: 20,
          hr: 148,
          lengthMeters: 1.47,
          forceNewtons: null,
        },
      ],
    };
    try {
      await savePm5Workout(workout);
      setStatus("Saved a 500 m test piece to the same logbook.");
    } catch {
      setStatus("Could not save. Sign in again.");
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.lede}>Turn on the PM5. Stay on this screen.</Text>
      <Pressable style={({ pressed }) => [styles.btn, pressed && styles.pressed]} onPress={lookForPm5}>
        <Text style={styles.btnText}>Look for a PM5</Text>
      </Pressable>
      {deviceName ? <Text style={styles.body}>Connected name: {deviceName}</Text> : null}
      <Text style={styles.body}>{status}</Text>
      <Text style={styles.uuid}>{PM5_DISCOVERY_SERVICE}</Text>
      <Pressable onPress={() => setShowDev((v) => !v)}>
        <Text style={styles.devToggle}>Developer</Text>
      </Pressable>
      {showDev ? (
        <Pressable style={({ pressed }) => [styles.secondary, pressed && styles.pressed]} onPress={() => void saveDemo()}>
          <Text style={styles.secondaryText}>Save 500 m (dev)</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#f5f5f7", padding: 24, gap: 16 },
  lede: { fontSize: 21, color: "#6e6e73", letterSpacing: -0.2 },
  body: { fontSize: 17, color: "#1d1d1f" },
  uuid: { fontSize: 11, color: "#a1a1a6", fontVariant: ["tabular-nums"] },
  btn: { backgroundColor: "#0066cc", borderRadius: 980, padding: 14, alignItems: "center" },
  pressed: { transform: [{ scale: 0.97 }] },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 17 },
  devToggle: { color: "#6e6e73", fontSize: 13 },
  secondary: { backgroundColor: "#fff", borderRadius: 980, padding: 14, alignItems: "center" },
  secondaryText: { color: "#0066cc", fontWeight: "600", fontSize: 17 },
});
