import { ImagePlus, RotateCcw, Save, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AiPanel, Button, Card, Input, PageHeader, ProgressBar, Textarea } from "../../components/ui";
import { LEARNING_DRAFT_KEY } from "./journalData";
import type { JournalImage, LearningLog } from "./journalData";
import { createJournalLog, getJournalImageUploadUrl, getJournalLogById, updateJournalLog, uploadJournalImageToS3 } from "./journalApi";

const defaultTags = ["AWS", "VPC", "NAT Gateway", "CloudWatch", "VPN", "IAM"];
const allowedImageTypes = ["image/png", "image/jpeg", "image/webp"];
const maxImageSize = 5 * 1024 * 1024;

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

type LogForm = {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  category: string;
  customCategory: string;
  tags: string[];
  tagInput: string;
  content: string;
  commands: string;
  errors: string;
  solutions: string;
  mood: "good" | "neutral" | "tired";
  difficulty: number;
  images: JournalImage[];
};

type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
};

function createEmptyForm(): LogForm {
  return {
    title: "",
    date: todayInputValue(),
    startTime: "",
    endTime: "",
    category: "devops",
    customCategory: "",
    tags: [],
    tagInput: "",
    content: "",
    commands: "",
    errors: "",
    solutions: "",
    mood: "neutral",
    difficulty: 3,
    images: []
  };
}

function draftForm() {
  try {
    const raw = sessionStorage.getItem(LEARNING_DRAFT_KEY);
    return raw ? { ...createEmptyForm(), ...(JSON.parse(raw) as Partial<LogForm>) } : createEmptyForm();
  } catch {
    return createEmptyForm();
  }
}

function formFromLog(log: LearningLog): LogForm {
  return {
    title: log.title,
    date: log.date || todayInputValue(),
    startTime: log.startTime ?? "",
    endTime: log.endTime ?? "",    category: ["networking", "security", "monitoring", "devops", "ai", "programming"].includes(log.category) ? log.category : "custom",
    customCategory: ["networking", "security", "monitoring", "devops", "ai", "programming"].includes(log.category) ? "" : log.category,
    tags: log.tags,
    tagInput: "",
    content: log.content,
    commands: log.commands,
    errors: log.errors,
    solutions: log.solutions,
    mood: log.mood,
    difficulty: log.difficulty,
    images: log.images ?? []
  };
}

function payloadFromForm(form: LogForm) {
  return {
    title: form.title.trim(),
    date: form.date,
    startTime: form.startTime,
    endTime: form.endTime,    category: form.category === "custom" ? form.customCategory.trim() || "other" : form.category,
    tags: form.tags,
    content: form.content.trim(),
    commands: form.commands.trim(),
    errors: form.errors.trim(),
    solutions: form.solutions.trim(),
    mood: form.mood,
    difficulty: form.difficulty,
    images: form.images
  };
}

function createPendingImage(file: File): PendingImage {
  return {
    id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
    file,
    previewUrl: URL.createObjectURL(file)
  };
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function NewJournalEntryPage() {
  const navigate = useNavigate();
  const { entryId } = useParams();
  const isEditing = Boolean(entryId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingImagesRef = useRef<PendingImage[]>([]);
  const [form, setForm] = useState<LogForm>(() => isEditing ? createEmptyForm() : draftForm());
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftStatus, setDraftStatus] = useState("");
  const [isLoadingEntry, setIsLoadingEntry] = useState(isEditing);
  const [loadError, setLoadError] = useState("");
  const [imageMessage, setImageMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pairedTextareaHeight, setPairedTextareaHeight] = useState(188);

  useEffect(() => {
    pendingImagesRef.current = pendingImages;
  }, [pendingImages]);

  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  useEffect(() => {
    if (!entryId) return;
    const currentEntryId = entryId;
    let ignore = false;

    async function loadEntry() {
      setIsLoadingEntry(true);
      setLoadError("");
      try {
        const entry = await getJournalLogById(currentEntryId);
        if (!ignore) setForm(formFromLog(entry));
      } catch (error) {
        if (!ignore) setLoadError(error instanceof Error ? error.message : "Chưa tải được nhật ký cần chỉnh sửa.");
      } finally {
        if (!ignore) setIsLoadingEntry(false);
      }
    }

    loadEntry();
    return () => {
      ignore = true;
    };
  }, [entryId]);

  useEffect(() => {
    if (isEditing) return;
    const timer = window.setTimeout(() => {
      sessionStorage.setItem(LEARNING_DRAFT_KEY, JSON.stringify(form));
      setDraftStatus("Bản nháp đã tự động lưu");
    }, 500);
    return () => window.clearTimeout(timer);
  }, [form, isEditing]);

  async function uploadPendingImages(logId: string) {
    const uploadedImages: JournalImage[] = [];

    for (const pendingImage of pendingImages) {
      setImageMessage(`Đang tải ảnh ${pendingImage.file.name}...`);
      const target = await getJournalImageUploadUrl(logId, pendingImage.file);
      await uploadJournalImageToS3(target.uploadUrl, pendingImage.file);
      uploadedImages.push({
        id: target.imageId,
        imageKey: target.imageKey,
        fileName: pendingImage.file.name,
        contentType: pendingImage.file.type,
        size: pendingImage.file.size,
        url: target.imageUrl,
        uploadedAt: new Date().toISOString()
      });
    }

    return uploadedImages;
  }

  const save = useCallback(async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.title.trim()) nextErrors.title = "Tiêu đề buổi học là bắt buộc.";
    if (!form.content.trim()) nextErrors.content = "Nhật ký chi tiết là bắt buộc.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    setLoadError("");
    setImageMessage("");
    try {
      const basePayload = payloadFromForm(form);
      const savedLog = entryId ? await updateJournalLog(entryId, basePayload) : await createJournalLog(basePayload);
      const logId = savedLog.id || entryId;

      if (!logId) throw new Error("Backend chưa trả về entryId để upload ảnh.");

      if (pendingImages.length > 0) {
        const uploadedImages = await uploadPendingImages(logId);
        const nextImages = [...form.images, ...uploadedImages];
        await updateJournalLog(logId, { ...basePayload, images: nextImages });
        pendingImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
        setPendingImages([]);
      }

      sessionStorage.removeItem(LEARNING_DRAFT_KEY);
      navigate("/journal", { replace: true, state: { journalMessage: "Đã lưu buổi học thành công." } });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Chưa lưu được nhật ký. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
      setImageMessage("");
    }
  }, [entryId, form, navigate, pendingImages]);

  useEffect(() => {
    function saveShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        save();
      }
    }
    window.addEventListener("keydown", saveShortcut);
    return () => window.removeEventListener("keydown", saveShortcut);
  }, [save]);

  function update<K extends keyof LogForm>(key: K, value: LogForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function syncPairedTextareaHeight(event: React.PointerEvent<HTMLTextAreaElement> | React.MouseEvent<HTMLTextAreaElement>) {
    const textarea = event.currentTarget;
    window.requestAnimationFrame(() => setPairedTextareaHeight(Math.max(150, textarea.offsetHeight)));
  }
  function addTag(value: string) {
    const tag = value.trim();
    if (!tag || form.tags.some((item) => item.toLowerCase() === tag.toLowerCase())) return;
    update("tags", [...form.tags, tag]);
    update("tagInput", "");
  }

  function chooseImages() {
    fileInputRef.current?.click();
  }

  function selectImages(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const validImages: PendingImage[] = [];
    const invalidNames: string[] = [];

    files.forEach((file) => {
      if (!allowedImageTypes.includes(file.type) || file.size > maxImageSize) {
        invalidNames.push(file.name);
        return;
      }
      validImages.push(createPendingImage(file));
    });

    if (validImages.length > 0) setPendingImages((current) => [...current, ...validImages]);
    setImageMessage(invalidNames.length > 0 ? `Một số ảnh không hợp lệ hoặc lớn hơn 5MB: ${invalidNames.join(", ")}` : "");
  }

  function removePendingImage(id: string) {
    setPendingImages((current) => {
      const removed = current.find((image) => image.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((image) => image.id !== id);
    });
  }

  function removeSavedImage(imageKey: string) {
    update("images", form.images.filter((image) => image.imageKey !== imageKey));
  }

  function reset() {
    pendingImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setPendingImages([]);
    setForm(isEditing ? form : createEmptyForm());
    setErrors({});
    setDraftStatus("");
    setImageMessage("");
    if (!isEditing) sessionStorage.removeItem(LEARNING_DRAFT_KEY);
  }

  return (
    <>
      <PageHeader
        eyebrow="Nhật ký học tập"
        title={isEditing ? "Chỉnh sửa buổi học" : "Ghi chép buổi học mới"}
        description="Lưu lại những điều đã học, lỗi đã gặp và cách xử lý để lần sau ôn lại dễ hơn."
        action={<Button icon={<Save size={17} />} onClick={save} disabled={isSaving || isLoadingEntry}>{isSaving ? "Đang lưu..." : "Lưu"}</Button>}
      />
      {loadError && <div className="settings-message settings-message-error" role="alert">{loadError}</div>}
      {isLoadingEntry ? (
        <Card className="journal-empty">
          <h2>Đang tải nhật ký...</h2>
          <p>Đang mở lại nội dung nhật ký của bạn.</p>
        </Card>
      ) : (
        <div className="journal-editor-grid">
          <div className="stack">
            <Card className="editor-card">
              <div className="section-heading"><h2>A. Thông tin cơ bản</h2></div>
              <div className="form-field">
                <label htmlFor="learning-title">Tiêu đề buổi học *</label>
                <Input id="learning-title" value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Ví dụ: Lab định tuyến AWS VPC" />
                {errors.title && <p className="field-error">{errors.title}</p>}
              </div>
              <div className="journal-form-grid">
                <div className="form-field"><label>Ngày học</label><Input type="date" value={form.date} onChange={(event) => update("date", event.target.value)} /></div>
                <div className="form-field"><label>Giờ bắt đầu</label><Input type="time" value={form.startTime} onChange={(event) => update("startTime", event.target.value)} /></div>
                <div className="form-field"><label>Giờ kết thúc</label><Input type="time" value={form.endTime} onChange={(event) => update("endTime", event.target.value)} /></div>
                <div className="form-field">
                  <label>Chủ đề / danh mục</label>
                  <select className="input" value={form.category} onChange={(event) => update("category", event.target.value)}>
                    <option value="networking">Mạng</option>
                    <option value="security">Bảo mật</option>
                    <option value="monitoring">Giám sát</option>
                    <option value="devops">DevOps</option>
                    <option value="ai">AI</option>
                    <option value="programming">Lập trình</option>
                    <option value="custom">Nhập chủ đề khác</option>
                  </select>
                </div>
                {form.category === "custom" && (
                  <div className="form-field">
                    <label>Chủ đề tự nhập</label>
                    <Input value={form.customCategory} onChange={(event) => update("customCategory", event.target.value)} placeholder="Ví dụ: Serverless, CloudWatch..." />
                  </div>
                )}
              </div>
              <div className="form-field">
                <label>Thẻ</label>
                <Input value={form.tagInput} onChange={(event) => update("tagInput", event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(form.tagInput); } }} placeholder="Nhập thẻ rồi nhấn Enter" />
                <div className="tag-suggestions">{defaultTags.map((tag) => <button type="button" key={tag} onClick={() => addTag(tag)}>{tag}</button>)}</div>
                <div className="page-actions">{form.tags.map((tag) => <button type="button" className="tag-removable" key={tag} onClick={() => update("tags", form.tags.filter((item) => item !== tag))}>{tag} ×</button>)}</div>
              </div>
            </Card>

            <Card className="editor-card">
              <div className="section-heading"><h2>B. Nội dung chi tiết</h2></div>
              <div className="form-field">
                <label htmlFor="learning-content">Nhật ký chi tiết & tài liệu tham khảo *</label>
                <Textarea id="learning-content" value={form.content} onChange={(event) => update("content", event.target.value)} placeholder="Ghi lại điều bạn học được, tài liệu đã đọc và ghi chú quan trọng..." />
                {errors.content && <p className="field-error">{errors.content}</p>}
              </div>
              <div className="form-field"><label>Lệnh / hành động đã thực hiện</label><Textarea className="code-textarea" value={form.commands} onChange={(event) => update("commands", event.target.value)} placeholder="aws ec2 describe-instances&#10;terraform plan" /></div>
              <div className="journal-form-grid two-col paired-textarea-grid">
                <div className="form-field"><label>Lỗi gặp phải</label><Textarea className="paired-textarea" style={{ height: pairedTextareaHeight }} value={form.errors} onChange={(event) => update("errors", event.target.value)} onPointerUp={syncPairedTextareaHeight} onMouseUp={syncPairedTextareaHeight} placeholder="Mô tả lỗi, message, stack trace..." /></div>
                <div className="form-field"><label>Cách xử lý / sửa lỗi</label><Textarea className="paired-textarea" style={{ height: pairedTextareaHeight }} value={form.solutions} onChange={(event) => update("solutions", event.target.value)} onPointerUp={syncPairedTextareaHeight} onMouseUp={syncPairedTextareaHeight} placeholder="Cách phân tích và cách sửa..." /></div>
              </div>
            </Card>

            <Card className="editor-card">
              <div className="section-heading"><h2>C. Ảnh đính kèm</h2></div>
              <div className="journal-image-upload-row">
                <input ref={fileInputRef} className="journal-image-input" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={selectImages} />
                <Button type="button" variant="secondary" icon={<ImagePlus size={17} />} onClick={chooseImages} disabled={isSaving}>Chọn ảnh</Button>
                <span>PNG, JPG hoặc WebP, tối đa 5MB mỗi ảnh.</span>
              </div>
              {imageMessage && <div className="settings-message settings-message-info" role="status">{imageMessage}</div>}
              {(form.images.length > 0 || pendingImages.length > 0) && (
                <div className="journal-image-grid">
                  {form.images.map((image) => (
                    <div className="journal-image-item" key={image.imageKey}>
                      {image.url ? <img src={image.url} alt={image.fileName} /> : <div className="journal-image-placeholder"><ImagePlus size={22} /></div>}
                      <div>
                        <strong>{image.fileName}</strong>
                        <span>{formatFileSize(image.size)} · đã lưu</span>
                      </div>
                      <button type="button" aria-label="Gỡ ảnh" onClick={() => removeSavedImage(image.imageKey)}><X size={15} /></button>
                    </div>
                  ))}
                  {pendingImages.map((image) => (
                    <div className="journal-image-item" key={image.id}>
                      <img src={image.previewUrl} alt={image.file.name} />
                      <div>
                        <strong>{image.file.name}</strong>
                        <span>{formatFileSize(image.file.size)} · chờ lưu</span>
                      </div>
                      <button type="button" aria-label="Gỡ ảnh" onClick={() => removePendingImage(image.id)}><X size={15} /></button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <aside className="stack">
            <Card className="editor-card">
              <div className="section-heading"><h2>D. Tâm trạng / độ khó</h2></div>
              <div className="form-field">
                <label>Tâm trạng</label>
                <div className="radio-row">
                  {[
                    ["good", "Tốt"],
                    ["neutral", "Bình thường"],
                    ["tired", "Mệt"]
                  ].map(([value, label]) => (
                    <label key={value}><input type="radio" name="mood" checked={form.mood === value} onChange={() => update("mood", value as LogForm["mood"])} /> {label}</label>
                  ))}
                </div>
              </div>
              <div className="form-field">
                <label>Độ khó: {form.difficulty}/5</label>
                <input className="difficulty-slider" type="range" min="1" max="5" value={form.difficulty} onChange={(event) => update("difficulty", Number(event.target.value))} />
                <ProgressBar value={form.difficulty * 20} />
              </div>
            </Card>
            <AiPanel title="Gợi ý ghi chép">
              <p>Hãy ghi rõ bối cảnh, lệnh đã chạy, lỗi nhận được và cách sửa. Những chi tiết này sẽ giúp bạn ôn lại và theo dõi tiến bộ tốt hơn.</p>
            </AiPanel>
            <Card>
              <div className="section-heading"><h2>Trạng thái bản nháp</h2></div>
              <p>{imageMessage || draftStatus || "Bản nháp sẽ tự động lưu sau khi bạn nhập."}</p>
              <p><strong>Ctrl + Enter</strong> để lưu nhanh.</p>
            </Card>
            <div className="page-actions">
              <Button variant="ghost" icon={<RotateCcw size={16} />} onClick={reset} disabled={isSaving}>Đặt lại</Button>
              <Button variant="secondary" onClick={() => navigate("/journal")} disabled={isSaving}>Hủy</Button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}


