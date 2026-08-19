import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { signIn } from "../lib/api";
import { useSession } from "../lib/session";

export default function SignInScreen() {
  const router = useRouter();
  const { ready, token, setToken } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  if (ready && token) return <Redirect href="/(tabs)/logbook" />;

  async function login() {
    try {
      const data = await signIn(email.trim(), password);
      await setToken(data.token!);
      router.replace("/(tabs)/logbook");
    } catch {
      setStatus("Sign in failed. Use the same account as the web app.");
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.lede}>Same account as the web logbook.</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable style={({ pressed }) => [styles.btn, pressed && styles.pressed]} onPress={() => void login()}>
        <Text style={styles.btnText}>Continue</Text>
      </Pressable>
      {status ? <Text style={styles.status}>{status}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#f5f5f7", padding: 24, gap: 12 },
  lede: { fontSize: 21, color: "#6e6e73", marginBottom: 8, letterSpacing: -0.2 },
  input: { backgroundColor: "#fff", borderRadius: 12, padding: 14, fontSize: 17 },
  btn: { backgroundColor: "#0066cc", borderRadius: 980, padding: 14, alignItems: "center" },
  pressed: { transform: [{ scale: 0.97 }] },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 17 },
  status: { color: "#b3261e", fontSize: 15 },
});
