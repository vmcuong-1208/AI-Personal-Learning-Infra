import { FileBarChart2, Filter, Plus, SearchX, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Chip, Input, PageHeader } from "../../components/ui";
import type { LearningLog } from "./journalData";
import { getJournalLogs } from "./journalApi";

const categories = ["all", "networking", "security", "monitoring", "devops", "ai", "programming"];
const commonTags = ["AWS", "VPC", "NAT Gateway", "CloudWatch", "VPN", "IAM"];
const categoryLabels: Record<string, string> = {
  all: "Tất cả chủ đề",
  networking: "Mạng",
  security: "Bảo mật",
  monitoring: "Giám sát",
  devops: "DevOps",
  ai: "AI",
  programming: "Lập trình"
};
const moodLabels: Record<string, string> = { good: "Tốt", neutral: "Bình thường", tired: "Mệt" };

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toDateInputValue(date);
}

export function JournalListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [range, setRange] = useState<"all" | "today" | "7" | "30">("30");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [category, setCategory] = useState("all");
  const [customCategory, setCustomCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState<LearningLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const pageSize = 6;
  const initialMessage = (location.state as { journalMessage?: string } | null)?.journalMessage ?? "";
  const [flashMessage, setFlashMessage] = useState(initialMessage);
  const [isFlashLeaving, setIsFlashLeaving] = useState(false);

  useEffect(() => {
    if (!flashMessage) return;

    setIsFlashLeaving(false);
    const fadeTimer = window.setTimeout(() => setIsFlashLeaving(true), 2600);
    const clearTimer = window.setTimeout(() => {
      setFlashMessage("");
      setIsFlashLeaving(false);
      navigate(location.pathname, { replace: true, state: null });
    }, 3000);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(clearTimer);
    };
  }, [flashMessage, location.pathname, navigate]);

  useEffect(() => {
    let ignore = false;

    async function loadLogs() {
      setIsLoading(true);
      setLoadError("");
      try {
        const nextLogs = await getJournalLogs();
        if (!ignore) setLogs(nextLogs);
      } catch (error) {
        if (!ignore) setLoadError(error instanceof Error ? error.message : "Chưa tải được danh sách nhật ký.");
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadLogs();
    return () => {
      ignore = true;
    };
  }, []);

  const filteredLogs = useMemo(() => {
    const start = range === "today" ? toDateInputValue(new Date()) : range === "7" ? daysAgo(7) : range === "30" ? daysAgo(30) : "";
    return logs.filter((log) => {
      const matchesRange = !start || log.date >= start;
      const matchesDates = (!dateFrom || log.date >= dateFrom) && (!dateTo || log.date <= dateTo);
      const selectedCategory = category === "custom" ? customCategory.trim().toLowerCase() : category;
      const matchesCategory = selectedCategory === "all" || !selectedCategory || log.category.toLowerCase() === selectedCategory;
      const matchesTags = tags.length === 0 || tags.every((tag) => log.tags.some((item) => item.toLowerCase() === tag.toLowerCase()));
      const matchesDifficulty = difficulty === "all" || log.difficulty === Number(difficulty);
      return matchesRange && matchesDates && matchesCategory && matchesTags && matchesDifficulty;
    });
  }, [category, customCategory, dateFrom, dateTo, difficulty, logs, range, tags]);

  const visibleLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const activeFilterCount = [dateFrom || dateTo, category !== "all" || customCategory, tags.length > 0, difficulty !== "all", range !== "30"].filter(Boolean).length;

  function addTag(tag: string) {
    const value = tag.trim();
    if (!value || tags.some((item) => item.toLowerCase() === value.toLowerCase())) return;
    setTags((current) => [...current, value]);
    setTagInput("");
    setPage(1);
  }

  return (
    <>
      <PageHeader
        title="Danh sách nhật ký học"
        description="Theo dõi các buổi học, ghi chú quan trọng và những điều cần ôn lại."
        action={
          <div className="page-actions">
            <Button variant="secondary" icon={<SlidersHorizontal size={17} />} onClick={() => setIsFilterOpen((current) => !current)}>
              {isFilterOpen ? "Ẩn bộ lọc" : `Bộ lọc${activeFilterCount ? ` (${activeFilterCount})` : ""}`}
            </Button>
            <Button to="/coach" variant="secondary" icon={<FileBarChart2 size={17} />}>Tạo báo cáo</Button>
            <Button to="/journal/new" icon={<Plus size={17} />}>Ghi nhật ký mới</Button>
          </div>
        }
      />
      {flashMessage && <div className={`login-success${isFlashLeaving ? " is-leaving" : ""}`} role="status">{flashMessage}</div>}
      {loadError && <div className="settings-message settings-message-error" role="alert">{loadError}</div>}

      {isFilterOpen && (
        <Card className="journal-filter-card compact-filter-card">
          <div className="section-heading"><h2>Bộ lọc nhật ký</h2><p>Thu hẹp danh sách theo thời gian, chủ đề, thẻ hoặc độ khó.</p></div>
          <div className="quick-filter-row">
            {[
              ["today", "Hôm nay"],
              ["7", "7 ngày"],
              ["30", "30 ngày"],
              ["all", "Tất cả"]
            ].map(([value, label]) => (
              <Button key={value} size="sm" variant={range === value ? "primary" : "ghost"} onClick={() => { setRange(value as typeof range); setPage(1); }}>{label}</Button>
            ))}
          </div>
          <div className="journal-filter-grid aligned-filter-grid">
            <div className="form-field"><label>Từ ngày</label><Input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setRange("all"); setPage(1); }} /></div>
            <div className="form-field"><label>Đến ngày</label><Input type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setRange("all"); setPage(1); }} /></div>
            <div className="form-field">
              <label>Chủ đề / danh mục</label>
              <select className="input" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}>
                {categories.map((item) => <option key={item} value={item}>{categoryLabels[item]}</option>)}
                <option value="custom">Nhập danh mục khác</option>
              </select>
            </div>
            <div className="form-field">
              <label>Độ khó</label>
              <select className="input" value={difficulty} onChange={(event) => { setDifficulty(event.target.value); setPage(1); }}>
                <option value="all">Tất cả</option>
                {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} / 5</option>)}
              </select>
            </div>
            {category === "custom" && (
              <div className="form-field"><label>Danh mục tự nhập</label><Input value={customCategory} onChange={(event) => { setCustomCategory(event.target.value); setPage(1); }} placeholder="Ví dụ: cloud" /></div>
            )}
            <div className="form-field tag-filter-field">
              <label>Thẻ</label>
              <Input value={tagInput} onChange={(event) => setTagInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(tagInput); } }} placeholder="Nhập thẻ rồi nhấn Enter" />
              <div className="tag-suggestions">{commonTags.map((tag) => <button key={tag} type="button" onClick={() => addTag(tag)}>{tag}</button>)}</div>
            </div>
          </div>
          {tags.length > 0 && <div className="page-actions">{tags.map((tag) => <button className="tag-removable" key={tag} onClick={() => { setTags((current) => current.filter((item) => item !== tag)); setPage(1); }}>{tag} ×</button>)}</div>}
        </Card>
      )}

      {isLoading ? (
        <Card className="journal-empty">
          <h2>Đang tải nhật ký...</h2>
          <p>Danh sách của bạn sẽ sẵn sàng trong giây lát.</p>
        </Card>
      ) : visibleLogs.length === 0 ? (
        <Card className="journal-empty">
          <SearchX size={30} />
          <h2>Bạn chưa có nhật ký học nào.</h2>
          <p>Bấm vào “Ghi nhật ký mới” để bắt đầu lưu lại quá trình học.</p>
          <Button to="/journal/new" icon={<Plus size={17} />}>Ghi nhật ký mới</Button>
        </Card>
      ) : (
        <>
          <div className="journal-list-toolbar"><span>{filteredLogs.length} nhật ký, sắp xếp mới nhất trước</span><Filter size={17} /></div>
          <div className="journal-card-grid">
            {visibleLogs.map((log) => (
              <Card className={`journal-log-card${log.errors ? " has-errors" : ""}`} key={log.id}>
                <div className="journal-log-meta"><span>{log.date}</span><span>{log.startTime || "--:--"} - {log.endTime || "--:--"}</span></div>
                <div className="section-heading">
                  <h2>{log.title}</h2>
                  <p>{categoryLabels[log.category] ?? log.category} · Tâm trạng: {moodLabels[log.mood] ?? log.mood} · Độ khó: {log.difficulty}/5</p>
                </div>
                <div className="page-actions">{log.tags.map((tag) => <Chip key={tag} tone={log.errors ? "ai" : "primary"}>{tag}</Chip>)}</div>
                <p className="journal-log-preview">{log.content}</p>
                {log.errors && <div className="error-highlight">Có ghi nhận lỗi: {log.errors}</div>}
                <div className="journal-card-actions">
                  <Link to={`/journal/${log.id}`}>Xem chi tiết</Link>
                  <Link to={`/journal/${log.id}/edit`}>Chỉnh sửa</Link>
                </div>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Trang trước</Button>
              <span>Trang {page} / {totalPages}</span>
              <Button variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}>Trang sau</Button>
            </div>
          )}
        </>
      )}
    </>
  );
}