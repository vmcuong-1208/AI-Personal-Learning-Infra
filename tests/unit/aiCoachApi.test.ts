import { beforeEach, describe, expect, it, vi } from "vitest";

const apiRequestMock = vi.fn();

vi.mock("../../src/lib/apiClient", () => ({
  apiRequest: apiRequestMock
}));

describe("AI coach API", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("normalizes report list responses", async () => {
    apiRequestMock.mockResolvedValue({
      items: [
        {
          report_id: "rep-1",
          type: "monthly",
          start_date: "2026-07-01",
          end_date: "2026-07-31",
          created_at: "2026-07-20T10:00:00.000Z",
          status: "completed",
          summary: "Good progress",
          strengths: ["Consistent notes"],
          weaknesses: ["Missing outputs"],
          recommendations: ["Create short quizzes"]
        }
      ]
    });
    const { getAiReports } = await import("../../src/features/ai-coach/aiCoachApi");

    await expect(getAiReports()).resolves.toEqual([
      expect.objectContaining({
        id: "rep-1",
        type: "monthly",
        startDate: "2026-07-01",
        endDate: "2026-07-31",
        status: "completed",
        strengths: ["Consistent notes"]
      })
    ]);
    expect(apiRequestMock).toHaveBeenCalledWith("/ai/reports");
  });

  it("creates reports with both snake_case and camelCase date fields", async () => {
    apiRequestMock.mockResolvedValue({ reportId: "rep-2", status: "pending" });
    const { createAiReport } = await import("../../src/features/ai-coach/aiCoachApi");

    await createAiReport({ type: "weekly", startDate: "2026-07-20", endDate: "2026-07-26" });

    expect(apiRequestMock).toHaveBeenCalledWith("/ai/reports", {
      method: "POST",
      body: JSON.stringify({
        type: "weekly",
        start_date: "2026-07-20",
        startDate: "2026-07-20",
        end_date: "2026-07-26",
        endDate: "2026-07-26"
      })
    });
  });
});
