import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AUTH_SESSION_KEY, GOOGLE_OAUTH_STATE_KEY, buildGoogleOAuthUrl, createSessionUser } from "./auth";
import type { AuthUser } from "./auth";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loginWithPassword: (email: string, password: string) => AuthUser;
  registerWithPassword: (name: string, email: string, password: string) => AuthUser;
  logout: () => void;
  startGoogleLogin: () => { ok: true } | { ok: false; message: string };
  completeGoogleLogin: (state: string | null) => { ok: true; message: string } | { ok: false; message: string };
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readSessionUser() {
  try {
    const raw = sessionStorage.getItem(AUTH_SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function persistSessionUser(user: AuthUser | null) {
  if (user) {
    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
  }
}

function randomState() {
  const bytes = new Uint32Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (item) => item.toString(16)).join("");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(readSessionUser());
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    function commit(nextUser: AuthUser) {
      setUser(nextUser);
      persistSessionUser(nextUser);
      return nextUser;
    }

    return {
      user,
      isAuthenticated: Boolean(user),
      loginWithPassword: (email) => commit(createSessionUser(email.split("@")[0] || "Learner", email, "password")),
      registerWithPassword: (name, email) => commit(createSessionUser(name, email, "password")),
      logout: () => {
        setUser(null);
        persistSessionUser(null);
      },
      startGoogleLogin: () => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
        if (!clientId || clientId.includes("your-google-oauth-client-id")) {
          return { ok: false, message: "Google OAuth client ID is not configured. Add VITE_GOOGLE_CLIENT_ID to .env." };
        }

        const state = randomState();
        sessionStorage.setItem(GOOGLE_OAUTH_STATE_KEY, state);
        const redirectUri = `${window.location.origin}/auth/google/callback`;
        window.location.assign(buildGoogleOAuthUrl(clientId, redirectUri, state));
        return { ok: true };
      },
      completeGoogleLogin: (state) => {
        const expectedState = sessionStorage.getItem(GOOGLE_OAUTH_STATE_KEY);
        sessionStorage.removeItem(GOOGLE_OAUTH_STATE_KEY);
        if (!state || !expectedState || state !== expectedState) {
          return { ok: false, message: "Google OAuth state could not be verified. Please try again." };
        }

        return { ok: true, message: "Google authorization code received. Complete token exchange and ID-token verification on the backend before creating a session." };
      }
    };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
