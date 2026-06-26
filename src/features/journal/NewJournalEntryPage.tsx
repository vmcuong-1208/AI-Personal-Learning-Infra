import { RotateCcw, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AiPanel, Button, Card, Input, PageHeader, ProgressBar, Textarea } from "../../components/ui";
import { LEARNING_DRAFT_KEY, getLearningLog, saveLearningLog } from "./journalData";

const defaultTags = ["AWS", "VPC", "NAT Gateway", "CloudWatch", "VPN", "IAM"];
const today = "2026-06-26";

type LogForm = {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  category: string;
  tags: string[];
  tagInput: string;
  content: string;
  commands: string;
  errors: string;
  solutions: string;
  mood: "good" | "neutral" | "tired";
  difficulty: number;
};

const emptyForm: LogForm = {
  title: "",
  date: today,
  startTime: "",
  endTime: "",
  category: "devops",
  tags: [],
  tagInput: "",
  content: "",
  commands: "",
  errors: "",
  solutions: "",
  mood: "neutral",
  difficulty: 3
};

function draftForm() {
  try {
    const raw = sessionStorage.getItem(LEARNING_DRAFT_KEY);
    return raw ? { ...emptyForm, ...(JSON.parse(raw) as Partial<LogForm>) } : emptyForm;
  } catch {
    return emptyForm;
  }
}

function formFromLog(log: ReturnType<typeof getLearningLog>): LogForm {
  if (!log) return emptyForm;
  return {
    title: log.title,
    date: log.date,
    startTime: log.startTime ?? "",
    endTime: log.endTime ?? "",
    category: log.category,
    tags: log.tags,
    tagInput: "",
    content: log.content,
    commands: log.commands,
    errors: log.errors,
    solutions: log.solutions,
    mood: log.mood,
    difficulty: log.difficulty
  };
}

export function NewJournalEntryPage() {
  const navigate = useNavigate();
  const { entryId } = useParams();
  const existing = useMemo(() => entryId ? getLearningLog(entryId) : undefined, [entryId]);
  const [form, setForm] = useState<LogForm>(() => existing ? formFromLog(existing) : draftForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftStatus, setDraftStatus] = useState("");

  useEffect(() => {
    if (existing) return;
    const timer = window.setTimeout(() => {
      sessionStorage.setItem(LEARNING_DRAFT_KEY, JSON.stringify(form));
      setDraftStatus("Bản nháp đã tự động lưu");
    }, 500);
    return () => window.clearTimeout(timer);
  }, [existing, form]);

  useEffect(() => {
    function saveShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        save();
      }
    }
    window.addEventListener("keydown", saveShortcut);
    return () => window.removeEventListener("keydown", saveShortcut);
  });

  function update<K extends keyof LogForm>(key: K, value: LogForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function addTag(value: string) {
    const tag = value.trim();
    if (!tag || form.tags.some((item) => item.toLowerCase() === tag.toLowerCase())) return;
    update("tags", [...form.tags, tag]);
    update("tagInput", "");
  }

  function reset() {
    setForm(existing ? formFromLog(existing) : emptyForm);
    setErrors({});
    setDraftStatus("");
    if (!existing) sessionStorage.removeItem(LEARNING_DRAFT_KEY);
  }

  function save() {
    const nextErrors: Record<string, string> = {};
    if (!form.title.trim()) nextErrors.title = "Tiêu đề buổi học là bắt buộc.";
    if (!form.content.trim()) nextErrors.content = "Nhật ký chi tiết là bắt buộc.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const id = existing?.id ?? `log-${Date.now()}`;
    saveLearningLog({
      id,
      title: form.title.trim(),
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      category: form.category,
      tags: form.tags,
      content: form.content.trim(),
      commands: form.commands.trim(),
      errors: form.errors.trim(),
      solutions: form.solutions.trim(),
      mood: form.mood,
      difficulty: form.difficulty
    });
    sessionStorage.removeItem(LEARNING_DRAFT_KEY);
    navigate("/journal", { replace: true, state: { journalMessage: "Đã lưu buổi học thành công." } });
  }

  return (
    <>
      <PageHeader
        eyebrow="Nhật ký học tập"
        title={existing ? "Chỉnh sửa buổi học" : "Ghi chép buổi học mới"}
        description="Lưu lại lab, lệnh đã chạy, lỗi gặp phải và cách khắc phục để Huấn luyện AI, Phân tích và Tìm kiếm có dữ liệu hữu ích."
        action={<Button icon={<Save size={17} />} onClick={save}>Lưu</Button>}
      />
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
                </select>
              </div>
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
            <div className="journal-form-grid two-col">
              <div className="form-field"><label>Lỗi gặp phải</label><Textarea value={form.errors} onChange={(event) => update("errors", event.target.value)} placeholder="Mô tả lỗi, message, stack trace..." /></div>
              <div className="form-field"><label>Cách xử lý / sửa lỗi</label><Textarea value={form.solutions} onChange={(event) => update("solutions", event.target.value)} placeholder="Cách phân tích và cách sửa..." /></div>
            </div>
          </Card>
        </div>

        <aside className="stack">
          <Card className="editor-card">
            <div className="section-heading"><h2>C. Tâm trạng / độ khó</h2></div>
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
            <p>Hãy ghi rõ bối cảnh, lệnh đã chạy, lỗi nhận được và cách sửa. Đây là nguyên liệu tốt nhất cho tóm tắt AI và báo cáo tuần.</p>
          </AiPanel>
          <Card>
            <div className="section-heading"><h2>Trạng thái bản nháp</h2></div>
            <p>{draftStatus || "Bản nháp sẽ tự động lưu sau khi bạn nhập."}</p>
            <p><strong>Ctrl + Enter</strong> để lưu nhanh.</p>
          </Card>
          <div className="page-actions">
            <Button variant="ghost" icon={<RotateCcw size={16} />} onClick={reset}>Đặt lại</Button>
            <Button variant="secondary" onClick={() => navigate("/journal")}>Hủy</Button>
          </div>
        </aside>
      </div>
    </>
  );
}
