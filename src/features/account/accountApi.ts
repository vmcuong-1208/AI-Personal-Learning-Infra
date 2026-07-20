import { apiRequest } from "../../lib/apiClient";

export type BackendMeResponse = {
  userId?: string;
  sub?: string;
  email?: string;
  username?: string;
  claims?: Record<string, unknown>;
  [key: string]: unknown;
};

export function getBackendMe() {
  return apiRequest<BackendMeResponse>("/me");
}
