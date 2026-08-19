import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { fetchWorkouts } from "../../lib/api";
import { useSession } from "../../lib/session";

const WEB = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:3000";

function splitLabel(seconds: number) {
  const tenths = Math.round(seconds * 10);
  const minutes = Math.floor(tenths / 600);
  const remainder = tenths % 600;
  const secs = Math.floor(remainder / 10);
  const tenth = remainder % 10;
  return `${minutes}:${secs.toString().padStart(2, "0")}.${tenth}`;
}

type Row = {
  id: string;
  sport: string;
  performedAt: string;
  totalMeters: number;
  avgSplitSeconds: number;
};

export default function LogbookScreen() {
  const { setToken } = useSession();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchWorkouts();
      setRows(data.workouts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load logbook");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  if (loading && rows.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentInsetAdjustmentBehavior="automatic"
      data={rows}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Pressable style={({ pressed }) => [styles.linkBtn, pressed && styles.pressed]} onPress={() => void Linking.openURL(WEB)}>
            <Text style={styles.linkText}>Plan on web</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.linkBtn, pressed && styles.pressed]} onPress={() => void setToken(null)}>
            <Text style={styles.linkText}>Sign out</Text>
          </Pressable>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>{error ?? "Nothing logged yet. Plan a piece on the web."}</Text>}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View>
            <Text style={styles.title}>{item.sport}</Text>
            <Text style={styles.caption}>{new Date(item.performedAt).toLocaleDateString()}</Text>
          </View>
          <View style={styles.metrics}>
            <Text style={styles.split}>{splitLabel(item.avgSplitSeconds)}</Text>
            <Text style={styles.caption}>{Math.round(item.totalMeters).toLocaleString()} m</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: "#f5f5f7" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f5f5f7" },
  header: { flexDirection: "row", gap: 16, paddingHorizontal: 16, paddingBottom: 8 },
  linkBtn: { paddingVertical: 8 },
  pressed: { transform: [{ scale: 0.97 }] },
  linkText: { color: "#0066cc", fontSize: 17 },
  empty: { padding: 24, color: "#6e6e73", fontSize: 17 },
  row: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 17, fontWeight: "600", textTransform: "capitalize" },
  caption: { color: "#6e6e73", fontSize: 13, marginTop: 2 },
  metrics: { alignItems: "flex-end" },
  split: { fontSize: 17, fontVariant: ["tabular-nums"], fontWeight: "600" },
});
