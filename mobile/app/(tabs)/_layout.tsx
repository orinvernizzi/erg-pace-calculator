import { Redirect, Tabs } from "expo-router";
import { useSession } from "../../lib/session";

export default function TabsLayout() {
  const { ready, token } = useSession();
  if (ready && !token) return <Redirect href="/signin" />;

  return (
    <Tabs
      screenOptions={{
        headerLargeTitleEnabled: true,
        headerShadowVisible: false,
        animation: "none",
        tabBarActiveTintColor: "#0066cc",
        tabBarInactiveTintColor: "#6e6e73",
      }}
    >
      <Tabs.Screen name="logbook" options={{ title: "Logbook" }} />
      <Tabs.Screen name="connect" options={{ title: "Connect" }} />
    </Tabs>
  );
}
