import { beforeEach, describe, expect, it, vi } from "vitest";

const configureMock = vi.fn();
const signUpMock = vi.fn();
const signInMock = vi.fn();
const signOutMock = vi.fn();
const resetPasswordMock = vi.fn();
const confirmResetPasswordMock = vi.fn();
const confirmSignUpMock = vi.fn();
const getCurrentUserMock = vi.fn();
const fetchUserAttributesMock = vi.fn();
const fetchAuthSessionMock = vi.fn();
const signInWithRedirectMock = vi.fn();

vi.mock("aws-amplify", () => ({
  Amplify: {
    configure: configureMock
  }
}));

vi.mock("aws-amplify/auth", () => ({
  confirmResetPassword: confirmResetPasswordMock,
  confirmSignUp: confirmSignUpMock,
  fetchAuthSession: fetchAuthSessionMock,
  fetchUserAttributes: fetchUserAttributesMock,
  getCurrentUser: getCurrentUserMock,
  resetPassword: resetPasswordMock,
  signIn: signInMock,
  signInWithRedirect: signInWithRedirectMock,
  signOut: signOutMock,
  signUp: signUpMock
}));

describe("cognito auth adapter", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("VITE_AWS_REGION", "ap-southeast-1");
    vi.stubEnv("VITE_COGNITO_USER_POOL_ID", "ap-southeast-1_pool");
    vi.stubEnv("VITE_COGNITO_CLIENT_ID", "client-id");
    vi.stubEnv("VITE_COGNITO_DOMAIN", "learnflow.auth.ap-southeast-1.amazoncognito.com");
    vi.stubEnv("VITE_COGNITO_REDIRECT_SIGN_IN", "http://localhost:5173/auth/google/callback");
    vi.stubEnv("VITE_COGNITO_REDIRECT_SIGN_OUT", "http://localhost:5173");
    fetchAuthSessionMock.mockResolvedValue({ tokens: { idToken: { payload: {} } } });
  });

  it("signs up users with email and display name attributes", async () => {
    const { signUpWithCognito } = await import("../../src/features/auth/cognitoAuth");

    const result = await signUpWithCognito("Learner", "LEARNER@example.com", "LearnFlow1!");

    expect(result.ok).toBe(true);
    expect(signUpMock).toHaveBeenCalledWith({
      username: "learner@example.com",
      password: "LearnFlow1!",
      options: {
        userAttributes: {
          email: "learner@example.com",
          name: "Learner"
        }
      }
    });
  });

  it("signs in and maps the Cognito user into app auth state", async () => {
    signInMock.mockResolvedValue({});
    getCurrentUserMock.mockResolvedValue({ username: "learner@example.com", signInDetails: { loginId: "learner@example.com" } });
    fetchUserAttributesMock.mockResolvedValue({ email: "learner@example.com", name: "Learner" });
    const { signInWithCognito } = await import("../../src/features/auth/cognitoAuth");

    const result = await signInWithCognito("learner@example.com", "LearnFlow1!");

    expect(result.ok).toBe(true);
    expect(result.user).toEqual({ email: "learner@example.com", name: "Learner", provider: "password" });
  });

  it("maps hosted UI users from the ID token when user attributes are unavailable", async () => {
    getCurrentUserMock.mockResolvedValue({ username: "google-user" });
    fetchUserAttributesMock.mockRejectedValue(new Error("GetUser failed"));
    fetchAuthSessionMock.mockResolvedValue({ tokens: { idToken: { payload: { email: "google@example.com", name: "Google Learner", identities: [{ providerName: "Google" }] } } } });
    const { getCurrentCognitoUser } = await import("../../src/features/auth/cognitoAuth");

    const result = await getCurrentCognitoUser();

    expect(result).toEqual({ email: "google@example.com", name: "Google Learner", provider: "google" });
  });


  it("returns null instead of a demo user when no Cognito session exists", async () => {
    getCurrentUserMock.mockRejectedValue(new Error("No current user"));
    fetchAuthSessionMock.mockResolvedValue({ tokens: undefined });
    fetchUserAttributesMock.mockRejectedValue(new Error("No session"));
    const { getCurrentCognitoUser } = await import("../../src/features/auth/cognitoAuth");

    const result = await getCurrentCognitoUser();

    expect(result).toBeNull();
  });

  it("does not reveal whether an account exists during forgot password", async () => {
    resetPasswordMock.mockRejectedValue(new Error("User not found"));
    const { requestPasswordResetWithCognito } = await import("../../src/features/auth/cognitoAuth");

    const result = await requestPasswordResetWithCognito("missing@example.com");

    expect(result.ok).toBe(true);
    expect(result.message).toContain("Nếu tài khoản tồn tại");
  });

  it("signs out through Cognito", async () => {
    const { signOutFromCognito } = await import("../../src/features/auth/cognitoAuth");

    const result = await signOutFromCognito();

    expect(result.ok).toBe(true);
    expect(signOutMock).toHaveBeenCalled();
  });
});
