import { fetchAuthSession } from "aws-amplify/auth";

export type ApiErrorCode =
  | "CONFIG_ERROR"
  | "AUTH_REQUIRED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "SERVER_ERROR"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "HTTP_ERROR"
  | "PARSE_ERROR";

export type ApiClientErrorOptions = {
  code: ApiErrorCode;
  message: string;
  status?: number;
  details?: unknown;
};

export type ApiRequestOptions = RequestInit & {
  timeoutMs?: number;
  skipAuth?: boolean;
};

export class ApiClientError extends Error {
  code: ApiErrorCode;
  status?: number;
  details?: unknown;

  constructor({ code, message, status, details }: ApiClientErrorOptions) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
}

function buildApiUrl(path: string) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new ApiClientError({
      code: "CONFIG_ERROR",
      message: "Missing VITE_API_BASE_URL. Add the API Gateway endpoint to your environment file."
    });
  }

  if (/^https?:\/\//i.test(path)) return path;
  return `${baseUrl}/${path.replace(/^\/+/ , "")}`;
}

async function getAuthToken() {
  const session = await fetchAuthSession();
  const idToken = session.tokens?.idToken?.toString();
  const accessToken = session.tokens?.accessToken?.toString();
  const preferredToken = import.meta.env.VITE_API_AUTH_TOKEN_TYPE === "access" ? accessToken : idToken;
  return preferredToken || accessToken || idToken;
}

function getErrorCode(status: number): ApiErrorCode {
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status >= 500) return "SERVER_ERROR";
  return "HTTP_ERROR";
}

function getDefaultMessage(code: ApiErrorCode, status?: number) {
  switch (code) {
    case "AUTH_REQUIRED":
      return "Authentication is required before calling the API.";
    case "UNAUTHORIZED":
      return "Your session is missing or expired. Please sign in again.";
    case "FORBIDDEN":
      return "You do not have permission to perform this action.";
    case "NOT_FOUND":
      return "The requested resource was not found.";
    case "SERVER_ERROR":
      return "The backend could not complete the request. Please try again later.";
    case "TIMEOUT":
      return "The request timed out. Please try again.";
    case "NETWORK_ERROR":
      return "Cannot reach the backend. Check your connection or API endpoint.";
    case "PARSE_ERROR":
      return "The backend returned an invalid response.";
    default:
      return `API request failed${status ? ` with status ${status}` : ""}.`;
  }
}

async function parseResponseBody(response: Response) {
  if (response.status === 204) return undefined;

  const text = await response.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new ApiClientError({
      code: "PARSE_ERROR",
      message: getDefaultMessage("PARSE_ERROR"),
      status: response.status,
      details: error
    });
  }
}

function getResponseMessage(body: unknown, fallback: string) {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (typeof record.error === "string") return record.error;
  }

  return fallback;
}

function createRequestSignal(timeoutMs: number, externalSignal?: AbortSignal) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort("timeout"), timeoutMs);

  if (externalSignal) {
    if (externalSignal.aborted) controller.abort(externalSignal.reason);
    externalSignal.addEventListener("abort", () => controller.abort(externalSignal.reason), { once: true });
  }

  return { signal: controller.signal, timeoutId };
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { timeoutMs = 15000, skipAuth = false, headers: optionHeaders, signal: optionSignal, ...requestOptions } = options;
  const headers = new Headers(optionHeaders);

  if (!skipAuth) {
    const authToken = await getAuthToken();
    if (!authToken) {
      throw new ApiClientError({ code: "AUTH_REQUIRED", message: getDefaultMessage("AUTH_REQUIRED"), status: 401 });
    }
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  if (requestOptions.body && !(requestOptions.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const { signal, timeoutId } = createRequestSignal(timeoutMs, optionSignal ?? undefined);

  try {
    const response = await fetch(buildApiUrl(path), {
      ...requestOptions,
      headers,
      signal
    });
    const body = await parseResponseBody(response);

    if (!response.ok) {
      const code = getErrorCode(response.status);
      throw new ApiClientError({
        code,
        status: response.status,
        message: getResponseMessage(body, getDefaultMessage(code, response.status)),
        details: body
      });
    }

    return body as T;
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    if (signal.aborted) {
      throw new ApiClientError({ code: "TIMEOUT", message: getDefaultMessage("TIMEOUT"), details: error });
    }
    throw new ApiClientError({ code: "NETWORK_ERROR", message: getDefaultMessage("NETWORK_ERROR"), details: error });
  } finally {
    window.clearTimeout(timeoutId);
  }
}