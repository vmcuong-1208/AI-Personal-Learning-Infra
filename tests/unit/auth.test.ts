import { describe, expect, it } from "vitest";
import { validateLogin, validatePasswordConfirmation, validatePasswordReset, validateRegistration, validateSignUpConfirmation } from "../../src/features/auth/auth";

describe("auth validation", () => {
  it("requires valid login credentials", () => {
    expect(validateLogin("bad-email", "short").valid).toBe(false);
    expect(validateLogin("learner@example.com", "LearnFlow1!").valid).toBe(true);
  });

  it("requires strong registration passwords and matching confirmation", () => {
    expect(validateRegistration("A", "bad", "weak", "nope").valid).toBe(false);
    expect(validateRegistration("Learner", "learner@example.com", "LearnFlow1!", "LearnFlow1!").valid).toBe(true);
  });

  it("validates reset email", () => {
    expect(validatePasswordReset("learner@example.com").valid).toBe(true);
    expect(validatePasswordReset("learner").valid).toBe(false);
  });

  it("validates email confirmation codes", () => {
    expect(validateSignUpConfirmation("123456").valid).toBe(true);
    expect(validateSignUpConfirmation("").valid).toBe(false);
  });

  it("validates password reset confirmation", () => {
    expect(validatePasswordConfirmation("123456", "NewLearnFlow1!", "NewLearnFlow1!").valid).toBe(true);
    expect(validatePasswordConfirmation("", "weak", "different").valid).toBe(false);
  });
});

