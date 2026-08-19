import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "ergcalc_token";

type Session = {
  ready: boolean;
  token: string | null;
  setToken: (token: string | null) => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!cancelled) setTokenState(stored);
      } catch {
        if (!cancelled) setTokenState(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<Session>(
    () => ({
      ready,
      token,
      setToken: async (next) => {
        setTokenState(next);
        if (next) await SecureStore.setItemAsync(TOKEN_KEY, next);
        else await SecureStore.deleteItemAsync(TOKEN_KEY);
      },
    }),
    [ready, token],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
