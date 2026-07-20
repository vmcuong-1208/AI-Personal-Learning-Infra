import { Bot, ImageOff, ImagePlus, Pencil, RotateCcw, Trash2, Trophy, X, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AiPanel, Button, Card, Chip, IconButton, PageHeader, ProgressBar } from "../../components/ui";
import { aiInsights } from "../../data/mock/mockData";
import type { JournalImage, LearningLog } from "./journalData";
import { deleteJournalLog, getJournalLogById, getJournalLogs } from "./journalApi";

const moodLabels: Record<string, string> = { good: "Tốt", neutral: "Bình thường", tired: "Mệt" };
const minImageZoom = 0.5;
const maxImageZoom = 4;
const zoomStep = 0.2;

function clampZoom(value: number) {
  return Math.max(minImageZoom, Math.min(maxImageZoom, value));
}

export function EntryDetailsPage() {
  const { entryId } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<LearningLog | null>(null);
  const [related, setRelated] = useState<LearningLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeImage, setActiveImage] = useState<JournalImage | null>(null);
  const [imageZoom, setImageZoom] = useState(1);

  useEffect(() => {
    if (!entryId) {
      setIsLoading(false);
      setLoadError("Không tìm thấy mã nhật ký.");
      return;
    }

    const currentEntryId = entryId;
    let ignore = false;

    async function loadEntry() {
      setIsLoading(true);
      setLoadError("");
      try {
        const [nextEntry, logs] = await Promise.all([
          getJournalLogById(currentEntryId),
          getJournalLogs()
        ]);
        if (!ignore) {
          setEntry(nextEntry);
          setRelated(logs.filter((item) => item.id !== nextEntry.id).slice(0, 2));
        }
      } catch (error) {
        if (!ignore) setLoadError(error instanceof Error ? error.message : "Chưa tải được chi tiết nhật ký.");
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadEntry();
    return () => {
      ignore = true;
    };
  }, [entryId]);

  useEffect(() => {
    if (!activeImage) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeImageViewer();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [activeImage]);

  async function deleteEntry() {
    if (!entry || !window.confirm("Bạn chắc chắn muốn xóa nhật ký này?")) return;

    setIsDeleting(true);
    setLoadError("");
    try {
      await deleteJournalLog(entry.id);
      navigate("/journal", { replace: true, state: { journalMessage: "Đã xóa nhật ký học." } });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Chưa xóa được nhật ký. Vui lòng thử lại.");
    } finally {
      setIsDeleting(false);
    }
  }

  function openImageViewer(image: JournalImage) {
    if (!image.url) return;
    setActiveImage(image);
    setImageZoom(1);
  }

  function closeImageViewer() {
    setActiveImage(null);
    setImageZoom(1);
  }

  function zoomImage(delta: number) {
    setImageZoom((current) => clampZoom(current + delta));
  }

  if (isLoading) {
    return (
      <Card className="journal-empty">
        <h2>Đang tải nhật ký...</h2>
        <p>LearnFlow đang lấy chi tiết mới nhất từ backend.</p>
      </Card>
    );
  }

  if (!entry) {
    return (
      <Card className="journal-empty">
        <h2>Không tìm thấy nhật ký.</h2>
        <p>{loadError || "Nhật ký này không tồn tại hoặc bạn không có quyền truy cập."}</p>
        <Button to="/journal" variant="secondary">Quay lại danh sách</Button>
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={`${entry.date} · ${entry.startTime || "--:--"} - ${entry.endTime || "--:--"}`}
        title={entry.title}
        description={`${entry.category} · Tâm trạng: ${moodLabels[entry.mood] ?? entry.mood} · Độ khó: ${entry.difficulty}/5`}
        action={
          <div className="page-actions">
            <Button to={`/journal/${entry.id}/edit`} variant="ghost" icon={<Pencil size={17} />}>Chỉnh sửa</Button>
            <Button variant="ghost" icon={<Trash2 size={17} />} onClick={deleteEntry} disabled={isDeleting}>{isDeleting ? "Đang xóa..." : "Xóa"}</Button>
            <Button to="/coach" variant="ai" icon={<Bot size={17} />}>Hỏi AI</Button>
          </div>
        }
      />
      {loadError && <div className="settings-message settings-message-error" role="alert">{loadError}</div>}
      <div className="detail-grid">
        <Card>
          <div className="page-actions" style={{ marginBottom: 14 }}>
            {entry.tags.map((tag) => <Chip key={tag} tone="primary">{tag}</Chip>)}
            {entry.images.length > 0 && <Chip tone="ai"><ImagePlus size={14} /> {entry.images.length} ảnh</Chip>}
            <Chip tone="success">{moodLabels[entry.mood] ?? entry.mood}</Chip>
          </div>
          <article className="article-body">
            <h2>Nhật ký chi tiết</h2>
            <p>{entry.content}</p>
            {entry.images.length > 0 && (
              <>
                <h2>Ảnh đính kèm</h2>
                <div className="journal-detail-image-grid">
                  {entry.images.map((image) => (
                    <button className="journal-detail-image" key={image.imageKey} type="button" onClick={() => openImageViewer(image)} disabled={!image.url} aria-label={`Xem ảnh ${image.fileName}`}>
                      {image.url ? <img src={image.url} alt={image.fileName} /> : <div className="journal-image-placeholder journal-image-missing"><ImageOff size={26} /><span>Chưa có URL xem ảnh</span></div>}
                    </button>
                  ))}
                </div>
              </>
            )}
            {entry.commands && <><h2>Lệnh / hành động</h2><pre className="detail-code">{entry.commands}</pre></>}
            {entry.errors && <><h2>Lỗi gặp phải</h2><div className="error-highlight rich-text-block">{entry.errors}</div></>}
            {entry.solutions && <><h2>Cách xử lý / sửa lỗi</h2><div className="rich-text-block">{entry.solutions}</div></>}
          </article>
        </Card>
        <aside className="stack">
          <AiPanel title="Tổng hợp bằng AI" action={<Button to="/quiz" variant="secondary" size="sm" icon={<Trophy size={16} />}>Tạo quiz</Button>}>
            <p>{aiInsights[0].body}</p>
          </AiPanel>
          <Card>
            <div className="section-heading">
              <h2>Độ khó</h2>
              <p>Mức độ phức tạp do bạn tự đánh giá cho buổi học này.</p>
            </div>
            <ProgressBar value={entry.difficulty * 20} />
            <p><strong>{entry.difficulty}/5</strong> tín hiệu độ khó</p>
          </Card>
          <Card>
            <div className="section-heading"><h2>Ghi chú liên quan</h2></div>
            <div className="entry-list">
              {related.length === 0 ? <p>Chưa có ghi chú liên quan.</p> : related.map((item) => (
                <Link className="entry-item" to={`/journal/${item.id}`} key={item.id}>
                  <div><h3>{item.title}</h3><p>{item.content.slice(0, 120)}...</p></div>
                </Link>
              ))}
            </div>
          </Card>
        </aside>
      </div>
      {activeImage && (
        <div className="image-viewer-overlay" role="dialog" aria-modal="true" aria-label="Xem ảnh đính kèm" onClick={closeImageViewer}>
          <div className="image-viewer-panel" onClick={(event) => event.stopPropagation()} onWheel={(event) => { event.preventDefault(); zoomImage(event.deltaY < 0 ? zoomStep : -zoomStep); }}>
            <div className="image-viewer-toolbar">
              <span>{Math.round(imageZoom * 100)}%</span>
              <IconButton label="Thu nhỏ ảnh" type="button" onClick={() => zoomImage(-zoomStep)}><ZoomOut size={17} /></IconButton>
              <IconButton label="Đặt lại zoom" type="button" onClick={() => setImageZoom(1)}><RotateCcw size={17} /></IconButton>
              <IconButton label="Phóng to ảnh" type="button" onClick={() => zoomImage(zoomStep)}><ZoomIn size={17} /></IconButton>
              <IconButton label="Đóng" type="button" onClick={closeImageViewer}><X size={18} /></IconButton>
            </div>
            <div className="image-viewer-canvas">
              <img src={activeImage.url} alt={activeImage.fileName} style={{ transform: `scale(${imageZoom})` }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

