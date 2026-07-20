import { beforeEach, describe, expect, it, vi } from "vitest";

const apiRequestMock = vi.fn();

vi.mock("../../src/lib/apiClient", () => ({
  ApiClientError: class ApiClientError extends Error {
    code: string;
    status?: number;

    constructor(options: { code: string; message: string; status?: number }) {
      super(options.message);
      this.name = "ApiClientError";
      this.code = options.code;
      this.status = options.status;
    }
  },
  apiRequest: apiRequestMock
}));

describe("journal API", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("normalizes list responses into the frontend journal contract", async () => {
    apiRequestMock.mockResolvedValue({
      items: [
        {
          entryId: "entry-1",
          title: "AWS VPC lab",
          created_at: "2026-07-20T03:00:00.000Z",
          start_time: "09:00",
          end_time: "09:45",
          category: "networking",
          tags: ["AWS", 123, "VPC"],
          content: "Built a VPC lab.",
          mood: "good",
          difficulty: "4",
          images: [
            {
              image_id: "img-1",
              object_key: "users/u1/journal/entry-1/img-1.png",
              file_name: "diagram.png",
              content_type: "image/png",
              size: 2048,
              download_url: "https://cdn.example.com/diagram.png"
            }
          ]
        }
      ]
    });
    const { getJournalLogs } = await import("../../src/features/journal/journalApi");

    await expect(getJournalLogs()).resolves.toEqual([
      expect.objectContaining({
        id: "entry-1",
        title: "AWS VPC lab",
        date: "2026-07-20",
        startTime: "09:00",
        endTime: "09:45",
        category: "networking",
        tags: ["AWS", "VPC"],
        mood: "good",
        difficulty: 4,
        images: [
          expect.objectContaining({
            id: "img-1",
            imageKey: "users/u1/journal/entry-1/img-1.png",
            fileName: "diagram.png",
            contentType: "image/png",
            size: 2048,
            url: "https://cdn.example.com/diagram.png"
          })
        ]
      })
    ]);
    expect(apiRequestMock).toHaveBeenCalledWith("/logs");
  });

  it("calls the create, update, detail, and delete log endpoints", async () => {
    apiRequestMock.mockResolvedValue({ id: "entry-1", title: "Saved" });
    const { createJournalLog, deleteJournalLog, getJournalLogById, updateJournalLog } = await import("../../src/features/journal/journalApi");
    const payload = {
      title: "Saved",
      date: "2026-07-20",
      startTime: "",
      endTime: "",
      category: "devops",
      tags: [],
      content: "Notes",
      commands: "",
      errors: "",
      solutions: "",
      mood: "neutral" as const,
      difficulty: 3,
      images: [
        {
          id: "img-1",
          imageKey: "users/u1/journal/entry-1/img-1.png",
          fileName: "diagram.png",
          contentType: "image/png",
          size: 2048,
          uploadedAt: "2026-07-20T03:00:00.000Z"
        }
      ]
    };
    const backendPayload = {
      ...payload,
      images: [
        {
          id: "img-1",
          image_id: "img-1",
          image_key: "users/u1/journal/entry-1/img-1.png",
          file_name: "diagram.png",
          content_type: "image/png",
          size: 2048,
          image_url: undefined,
          download_url: undefined,
          uploaded_at: "2026-07-20T03:00:00.000Z"
        }
      ]
    };

    await createJournalLog(payload);
    await updateJournalLog("entry-1", payload);
    await getJournalLogById("entry-1");
    await deleteJournalLog("entry-1");

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/logs", {
      method: "POST",
      body: JSON.stringify(backendPayload)
    });
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/logs/entry-1", {
      method: "PUT",
      body: JSON.stringify(backendPayload)
    });
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, "/logs/entry-1");
    expect(apiRequestMock).toHaveBeenNthCalledWith(4, "/logs/entry-1", {
      method: "DELETE"
    });
  });

  it("requests a presigned S3 URL and uploads the image with PUT", async () => {
    apiRequestMock.mockResolvedValue({
      upload_url: "https://s3.example.com/upload",
      image_key: "users/u1/journal/entry-1/img-1.png",
      image_id: "img-1",
      image_url: "https://cdn.example.com/img-1.png",
      expires_in: 900
    });
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));
    const { getJournalImageUploadUrl, uploadJournalImageToS3 } = await import("../../src/features/journal/journalApi");
    const file = new File(["image-bytes"], "diagram.png", { type: "image/png" });

    const target = await getJournalImageUploadUrl("entry-1", file);
    await uploadJournalImageToS3(target.uploadUrl, file);

    expect(target).toEqual({
      uploadUrl: "https://s3.example.com/upload",
      imageKey: "users/u1/journal/entry-1/img-1.png",
      imageId: "img-1",
      imageUrl: "https://cdn.example.com/img-1.png",
      expiresIn: 900
    });
    expect(apiRequestMock).toHaveBeenCalledWith("/logs/entry-1/images/presigned-url", {
      method: "POST",
      body: JSON.stringify({
        file_name: "diagram.png",
        content_type: "image/png",
        size: file.size
      })
    });
    expect(fetch).toHaveBeenCalledWith("https://s3.example.com/upload", {
      method: "PUT",
      headers: { "Content-Type": "image/png" },
      body: file
    });
  });
});

