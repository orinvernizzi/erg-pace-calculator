# ErgCalc iOS

Sign in first (same account as the web app). Tabs: **Logbook** | **Connect**.

The logbook is the same `Workout` table as the web app. Set `EXPO_PUBLIC_API_URL` to the Vercel URL (or your LAN IP while developing).

```powershell
cd mobile
npx expo start
```

1. Sign in with the web email/password.
2. Logbook lists sessions already saved on the web.
3. Connect: turn on the PM5 and stay on that screen. Scan needs a **dev build** (`react-native-ble-plx`). Expo Go cannot talk Bluetooth.
4. **Save 500 m (dev)** is under Developer on Connect — it posts a fake PM5 piece to prove the logbook path.

Discovery UUID (small print on Connect): `CE060000-43E5-11E4-916C-0800200C9A66`
