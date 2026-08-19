import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useSession } from "../lib/session";

export default function Index() {
  const { ready, token } = useSession();
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f5f5f7" }}>
        <ActivityIndicator />
      </View>
    );
  }
  if (!token) return <Redirect href="/signin" />;
  return <Redirect href="/(tabs)/logbook" />;
}
