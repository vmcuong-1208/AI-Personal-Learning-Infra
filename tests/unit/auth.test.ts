import { describe, expect, it } from "vitest";
import { buildGoogleOAuthUrl, validateLogin, validatePasswordReset, validateRegistration } from "../../src/features/auth/auth";

describe("auth validation", () => {
  it("requires valid login credentials", () => {
    expect(validateLogin("bad-email", "short").valid).toBe(false);
    expect(validateLogin("learner@example.com", "LearnFlow1").valid).toBe(true);
  });

  it("requires strong registration passwords and matching confirmation", () => {
    expect(validateRegistration("A", "bad", "weak", "nope").valid).toBe(false);
    expect(validateRegistration("Learner", "learner@example.com", "LearnFlow1", "LearnFlow1").valid).toBe(true);
  });

  it("validates reset email", () => {
    expect(validatePasswordReset("learner@example.com").valid).toBe(true);
    expect(validatePasswordReset("learner").valid).toBe(false);
  });

  it("builds a Google OAuth authorization URL without secrets", () => {
    const url = buildGoogleOAuthUrl("client-id", "http://localhost/auth/google/callback", "state-123");

    expect(url).toContain("https://accounts.google.com/o/oauth2/v2/auth?");
    expect(url).toContain("client_id=client-id");
    expect(url).toContain("scope=openid+email+profile");
    expect(url).toContain("state=state-123");
  });
});
