import { beforeEach, describe, expect, it, vi } from "vitest";

const apiRequestMock = vi.fn();

vi.mock("../../src/lib/apiClient", () => ({
  apiRequest: apiRequestMock
}));

describe("analytics API", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("loads and normalizes analytics summary", async () => {
    apiRequestMock.mockResolvedValue({
      weeklyEntries: 3,
      totalMinutes: 120,
      streak: 4,
      accuracyPercentage: 80,
      topicDistribution: {
        AWS: 2,
        CloudWatch: 1
      },
      weakAreas: ["CloudWatch"],
      totalLogs: 6
    });
    const { getAnalyticsSummary } = await import("../../src/features/analytics/analyticsApi");

    await expect(getAnalyticsSummary()).resolves.toEqual({
      weeklyEntries: 3,
      totalMinutes: 120,
      streak: 4,
      accuracyPercentage: 80,
      topicDistribution: [
        { id: "aws", name: "AWS", count: 2, share: 67 },
        { id: "cloudwatch", name: "CloudWatch", count: 1, share: 33 }
      ],
      weakAreas: ["CloudWatch"],
      totalLogs: 6
    });
    expect(apiRequestMock).toHaveBeenCalledWith("/analytics/summary");
  });

  it("accepts snake_case response fields", async () => {
    apiRequestMock.mockResolvedValue({
      weekly_entries: 1,
      total_minutes: 30,
      accuracy_percentage: 50,
      topic_distribution: { DevOps: 1 },
      weak_areas: [],
      total_logs: 1
    });
    const { getAnalyticsSummary } = await import("../../src/features/analytics/analyticsApi");

    await expect(getAnalyticsSummary()).resolves.toMatchObject({
      weeklyEntries: 1,
      totalMinutes: 30,
      accuracyPercentage: 50,
      totalLogs: 1
    });
  });
});