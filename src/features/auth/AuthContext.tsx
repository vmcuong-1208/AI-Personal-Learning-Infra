import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AuthUser } from "./auth";
import {
  confirmPasswordResetWithCognito,
  confirmSignUpWithCognito,
  getCurrentCognitoUser,
  requestPasswordResetWithCognito,
  signInWithCognito,
  signOutFromCognito,
  signUpWithCognito,
  startGoogleHostedUiSignIn,
  waitForCurrentCognitoUser
} from "./cognitoAuth";

type AuthActionResult = { ok: true; message: string } | { ok: false; message: string };

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshCurrentUser: () => Promise<AuthUser | null>;
  completeGoogleLogin: () => Promise<AuthUser | null>;
  loginWithPassword: (email: string, password: string) => Promise<AuthActionResult>;
  registerWithPassword: (name: string, email: string, password: string) => Promise<AuthActionResult>;
  confirmRegistration: (email: string, code: string) => Promise<AuthActionResult>;
  requestPasswordReset: (email: string) => Promise<AuthActionResult>;
  confirmPasswordReset: (email: string, code: string, newPassword: string) => Promise<AuthActionResult>;
  logout: () => Promise<AuthActionResult>;
  startGoogleLogin: () => Promise<AuthActionResult>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCurrentUser = useCallback(async () => {
    const currentUser = await getCurrentCognitoUser();
    setUser(currentUser);
    return currentUser;
  }, []);

  useEffect(() => {
    refreshCurrentUser().finally(() => setIsLoading(false));
  }, [refreshCurrentUser]);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      refreshCurrentUser,
      completeGoogleLogin: async () => {
        const currentUser = await waitForCurrentCognitoUser();
        setUser(currentUser);
        return currentUser;
      },
      loginWithPassword: async (email, password) => {
        const result = await signInWithCognito(email, password);
        if (result.ok) setUser(result.user);
        return { ok: result.ok, message: result.message };
      },
      registerWithPassword: (name, email, password) => signUpWithCognito(name, email, password),
      confirmRegistration: (email, code) => confirmSignUpWithCognito(email, code),
      requestPasswordReset: (email) => requestPasswordResetWithCognito(email),
      confirmPasswordReset: (email, code, newPassword) => confirmPasswordResetWithCognito(email, code, newPassword),
      logout: async () => {
        const result = await signOutFromCognito();
        if (result.ok) setUser(null);
        return result;
      },
      startGoogleLogin: () => startGoogleHostedUiSignIn()
    };
  }, [isLoading, refreshCurrentUser, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth phải được dùng bên trong AuthProvider");
  return context;
}
