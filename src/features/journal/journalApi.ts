import { ApiClientError, apiRequest } from "../../lib/apiClient";
import type { JournalImage, LearningLog } from "./journalData";

export type JournalLogPayload = Omit<LearningLog, "id">;

type BackendJournalImage = Partial<JournalImage> & {
  imageId?: string;
  image_id?: string;
  imageKey?: string;
  image_key?: string;
  key?: string;
  objectKey?: string;
  object_key?: string;
  s3Key?: string;
  s3_key?: string;
  fileName?: string;
  file_name?: string;
  contentType?: string;
  content_type?: string;
  imageUrl?: string;
  image_url?: string;
  downloadUrl?: string;
  download_url?: string;
  signedUrl?: string;
  signed_url?: string;
  viewUrl?: string;
  view_url?: string;
  presignedGetUrl?: string;
  presigned_get_url?: string;
  src?: string;
  href?: string;
  uploadedAt?: string;
  uploaded_at?: string;
};

type BackendJournalLog = Partial<Omit<LearningLog, "images">> & {
  entryId?: string;
  logId?: string;
  createdAt?: string;
  created_at?: string;
  start_time?: string;
  end_time?: string;
  images?: BackendJournalImage[];
  imageKeys?: string[];
  image_keys?: string[];
};

type BackendListResponse = BackendJournalLog[] | {
  items?: BackendJournalLog[];
  logs?: BackendJournalLog[];
  data?: BackendJournalLog[];
};

type PresignedImageResponse = {
  uploadUrl?: string;
  upload_url?: string;
  imageKey?: string;
  image_key?: string;
  imageId?: string;
  image_id?: string;
  imageUrl?: string;
  image_url?: string;
  expiresIn?: number;
  expires_in?: number;
};

export type JournalImageUploadTarget = {
  uploadUrl: string;
  imageKey: string;
  imageId: string;
  imageUrl?: string;
  expiresIn?: number;
};

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function readNumber(value: unknown, fallback = 0) {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function readTags(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function readMood(value: unknown): LearningLog["mood"] {
  return value === "good" || value === "neutral" || value === "tired" ? value : "neutral";
}

function readDifficulty(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? Math.max(1, Math.min(5, numberValue)) : 3;
}

function normalizeJournalImage(image: BackendJournalImage): JournalImage | null {
  const imageKey = readString(image.imageKey ?? image.image_key ?? image.key ?? image.objectKey ?? image.object_key ?? image.s3Key ?? image.s3_key);
  if (!imageKey) return null;

  return {
    id: readString(image.id ?? image.imageId ?? image.image_id, imageKey),
    imageKey,
    fileName: readString(image.fileName ?? image.file_name, imageKey.split("/").pop() || "journal-image"),
    contentType: readString(image.contentType ?? image.content_type, "image/*"),
    size: readNumber(image.size),
    url: readString(image.url ?? image.imageUrl ?? image.image_url ?? image.downloadUrl ?? image.download_url ?? image.signedUrl ?? image.signed_url ?? image.viewUrl ?? image.view_url ?? image.presignedGetUrl ?? image.presigned_get_url ?? image.src ?? image.href) || (/^https?:\/\//i.test(imageKey) ? imageKey : undefined),
    uploadedAt: readString(image.uploadedAt ?? image.uploaded_at) || undefined
  };
}

function readImages(log: BackendJournalLog) {
  if (Array.isArray(log.images)) {
    return log.images.map(normalizeJournalImage).filter((image): image is JournalImage => Boolean(image));
  }

  const keys = readTags(log.imageKeys ?? log.image_keys);
  return keys.map((imageKey) => ({
    id: imageKey,
    imageKey,
    fileName: imageKey.split("/").pop() || "journal-image",
    contentType: "image/*",
    size: 0
  }));
}

function normalizeJournalLog(log: BackendJournalLog): LearningLog {
  const id = readString(log.id ?? log.entryId ?? log.logId);
  const createdDate = readString(log.createdAt ?? log.created_at).slice(0, 10);

  return {
    id,
    title: readString(log.title, "Untitled journal log"),
    date: readString(log.date, createdDate || new Date().toISOString().slice(0, 10)),
    startTime: readString(log.startTime ?? log.start_time),
    endTime: readString(log.endTime ?? log.end_time),
    category: readString(log.category, "devops"),
    tags: readTags(log.tags),
    content: readString(log.content),
    commands: readString(log.commands),
    errors: readString(log.errors),
    solutions: readString(log.solutions),
    mood: readMood(log.mood),
    difficulty: readDifficulty(log.difficulty),
    images: readImages(log)
  };
}

function readList(response: BackendListResponse) {
  if (Array.isArray(response)) return response;
  return response.items ?? response.logs ?? response.data ?? [];
}

function normalizeUploadTarget(response: PresignedImageResponse): JournalImageUploadTarget {
  const uploadUrl = readString(response.uploadUrl ?? response.upload_url);
  const imageKey = readString(response.imageKey ?? response.image_key);

  if (!uploadUrl || !imageKey) {
    throw new ApiClientError({
      code: "PARSE_ERROR",
      message: "The backend did not return a valid S3 upload URL."
    });
  }

  return {
    uploadUrl,
    imageKey,
    imageId: readString(response.imageId ?? response.image_id, imageKey),
    imageUrl: readString(response.imageUrl ?? response.image_url) || undefined,
    expiresIn: response.expiresIn ?? response.expires_in
  };
}

function serializeJournalImage(image: JournalImage): BackendJournalImage {
  return {
    id: image.id,
    image_id: image.id,
    image_key: image.imageKey,
    file_name: image.fileName,
    content_type: image.contentType,
    size: image.size,
    image_url: image.url,
    download_url: image.url,
    uploaded_at: image.uploadedAt
  };
}

function serializeJournalPayload(payload: JournalLogPayload) {
  return {
    ...payload,
    images: payload.images.map(serializeJournalImage)
  };
}
export async function getJournalLogs() {
  const response = await apiRequest<BackendListResponse>("/logs");
  return readList(response)
    .map(normalizeJournalLog)
    .filter((log) => log.id)
    .sort((a, b) => `${b.date}${b.startTime ?? ""}`.localeCompare(`${a.date}${a.startTime ?? ""}`));
}

export async function getJournalLogById(id: string) {
  const response = await apiRequest<BackendJournalLog>(`/logs/${encodeURIComponent(id)}`);
  return normalizeJournalLog(response);
}

export function createJournalLog(payload: JournalLogPayload) {
  return apiRequest<BackendJournalLog>("/logs", {
    method: "POST",
    body: JSON.stringify(serializeJournalPayload(payload))
  }).then(normalizeJournalLog);
}

export function updateJournalLog(id: string, payload: JournalLogPayload) {
  return apiRequest<BackendJournalLog>(`/logs/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(serializeJournalPayload(payload))
  }).then(normalizeJournalLog);
}

export function deleteJournalLog(id: string) {
  return apiRequest<void>(`/logs/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}

export function getJournalImageUploadUrl(logId: string, file: File) {
  return apiRequest<PresignedImageResponse>(`/logs/${encodeURIComponent(logId)}/images/presigned-url`, {
    method: "POST",
    body: JSON.stringify({
      file_name: file.name,
      content_type: file.type,
      size: file.size
    })
  }).then(normalizeUploadTarget);
}

export async function uploadJournalImageToS3(uploadUrl: string, file: File) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type
    },
    body: file
  });

  if (!response.ok) {
    throw new ApiClientError({
      code: "HTTP_ERROR",
      status: response.status,
      message: `S3 upload failed with status ${response.status}.`
    });
  }
}



