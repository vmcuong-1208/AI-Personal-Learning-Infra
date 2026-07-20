import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchAuthSessionMock = vi.fn();

vi.mock("aws-amplify/auth", () => ({
  fetchAuthSession: fetchAuthSessionMock
}));

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init
  });
}

describe("api client", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com/dev");
    fetchAuthSessionMock.mockResolvedValue({ tokens: { accessToken: { toString: () => "access-token" } } });
    vi.stubGlobal("fetch", vi.fn());
  });

  it("attaches the Cognito access token and parses JSON responses", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ ok: true }));
    const { apiRequest } = await import("../../src/lib/apiClient");

    const result = await apiRequest<{ ok: boolean }>("/me");

    expect(result).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith("https://api.example.com/dev/me", expect.objectContaining({
      headers: expect.any(Headers)
    }));
    const headers = vi.mocked(fetch).mock.calls[0][1]?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer access-token");
  });

  it("supports public requests without auth", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ ok: true }));
    const { apiRequest } = await import("../../src/lib/apiClient");

    await apiRequest("/health", { skipAuth: true });

    expect(fetchAuthSessionMock).not.toHaveBeenCalled();
    const headers = vi.mocked(fetch).mock.calls[0][1]?.headers as Headers;
    expect(headers.has("Authorization")).toBe(false);
  });

  it("throws a config error when the API base URL is missing", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    const { apiRequest, ApiClientError } = await import("../../src/lib/apiClient");

    await expect(apiRequest("/me", { skipAuth: true })).rejects.toMatchObject({ code: "CONFIG_ERROR" });
    await expect(apiRequest("/me", { skipAuth: true })).rejects.toBeInstanceOf(ApiClientError);
  });

  it("normalizes HTTP errors", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ message: "Token expired" }, { status: 401 }));
    const { apiRequest } = await import("../../src/lib/apiClient");

    await expect(apiRequest("/me")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      status: 401,
      message: "Token expired"
    });
  });

  it("throws AUTH_REQUIRED when Cognito has no access token", async () => {
    fetchAuthSessionMock.mockResolvedValue({ tokens: undefined });
    const { apiRequest } = await import("../../src/lib/apiClient");

    await expect(apiRequest("/me")).rejects.toMatchObject({ code: "AUTH_REQUIRED", status: 401 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("normalizes network errors", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));
    const { apiRequest } = await import("../../src/lib/apiClient");

    await expect(apiRequest("/me")).rejects.toMatchObject({ code: "NETWORK_ERROR" });
  });
});
