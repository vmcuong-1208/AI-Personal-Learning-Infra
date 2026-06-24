export type AuthUser = {
  name: string;
  email: string;
  provider: "password" | "google";
};

export type AuthValidationResult = {
  valid: boolean;
  errors: Record<string, string>;
};

export const AUTH_SESSION_KEY = "learnflow.auth.user";
export const GOOGLE_OAUTH_STATE_KEY = "learnflow.google.oauth.state";

export function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validateLogin(email: string, password: string): AuthValidationResult {
  const errors: Record<string, string> = {};
  if (!validateEmail(email)) errors.email = "Enter a valid email address.";
  if (password.length < 8) errors.password = "Password must be at least 8 characters.";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateRegistration(name: string, email: string, password: string, confirmPassword: string): AuthValidationResult {
  const errors: Record<string, string> = {};
  if (name.trim().length < 2) errors.name = "Name must be at least 2 characters.";
  if (!validateEmail(email)) errors.email = "Enter a valid email address.";
  if (password.length < 10) errors.password = "Use at least 10 characters.";
  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) errors.password = "Use at least 10 characters with a number and uppercase letter.";
  if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match.";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validatePasswordReset(email: string): AuthValidationResult {
  const errors: Record<string, string> = {};
  if (!validateEmail(email)) errors.email = "Enter the email linked to your account.";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function buildGoogleOAuthUrl(clientId: string, redirectUri: string, state: string) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
    access_type: "online"
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function createSessionUser(name: string, email: string, provider: AuthUser["provider"]): AuthUser {
  return {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    provider
  };
}
