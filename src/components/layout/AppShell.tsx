import { BarChart3, Bell, Bot, CircleHelp, Home, LogOut, Menu, PenLine, Search, Settings, Sparkles, Trophy, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { searchLearningLogs, type SearchResultItem } from "../../features/search/searchApi";
import { Button, IconButton } from "../ui";

const navItems = [
  { to: "/", label: "Tổng quan", icon: Home },
  { to: "/journal", label: "Nhật ký", icon: PenLine },
  { to: "/coach", label: "Huấn luyện AI", icon: Bot },
  { to: "/search", label: "Tìm kiếm", icon: Search },
  { to: "/quiz", label: "Ôn tập", icon: Trophy },
  { to: "/analytics", label: "Phân tích", icon: BarChart3 }
];

function navClass({ isActive }: { isActive: boolean }) {
  return `nav-link${isActive ? " is-active" : ""}`;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <NavLink to="/" className="brand-block" aria-label="Trang chủ AI Personal Learning" onClick={onNavigate}>
        <span className="brand-mark"><Sparkles size={20} /></span>
        <span>
          <strong>AI Personal Learning</strong>
          <small>Không gian học tập cá nhân</small>
        </span>
      </NavLink>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === "/"} className={navClass} onClick={onNavigate}>
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [showLoginToast, setShowLoginToast] = useState(false);
  const [query, setQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<SearchResultItem[]>([]);
  const authMessage = (location.state as { authMessage?: string } | null)?.authMessage;
  const isJournalDetail = location.pathname.startsWith("/journal/") && location.pathname !== "/journal/new";
  const isJournalList = false;
  useEffect(() => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      setSearchSuggestions([]);
      return;
    }

    let ignore = false;
    const timeout = window.setTimeout(() => {
      searchLearningLogs({ q: normalizedQuery })
        .then((results) => {
          if (!ignore) setSearchSuggestions(results.slice(0, 4));
        })
        .catch(() => {
          if (!ignore) setSearchSuggestions([]);
        });
    }, 250);

    return () => {
      ignore = true;
      window.clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    if (!auth.isAuthenticated || !auth.user || !authMessage) return;
    setShowLoginToast(true);
    const timeout = window.setTimeout(() => setShowLoginToast(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [auth.isAuthenticated, auth.user, authMessage]);

  function closeMenus() {
    setIsNotificationsOpen(false);
    setIsAccountOpen(false);
  }

  async function handleLogout() {
    closeMenus();
    await auth.logout();
    navigate("/", { replace: true });
  }

  return (
    <div className={`app-shell${isJournalList ? " journal-list-shell" : ""}`}>
      <aside className="desktop-sidebar" aria-label="Điều hướng chính">
        <SidebarContent />
      </aside>
      <header className="app-navbar">
        <IconButton label="Mở menu điều hướng" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu size={20} />
        </IconButton>
        <NavLink to="/" className="navbar-brand" aria-label="Trang chủ AI Personal Learning" onClick={closeMenus}>
          <span className="brand-mark small"><Sparkles size={16} /></span>
          <span>AI Personal Learning</span>
        </NavLink>
        <div className="navbar-search">
          <Search size={18} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm kiếm các khái niệm, ghi chú hoặc thông tin chi tiết từ AI"
            aria-label="Tìm kiếm các khái niệm, ghi chú hoặc thông tin chi tiết từ AI"
          />
          {query.trim() && (
            <div className="search-suggestions" role="listbox" aria-label="Gợi ý tìm kiếm">
              {searchSuggestions.length > 0 ? (
                searchSuggestions.map((entry) => (
                  <Link key={entry.id} to={`/journal/${entry.id}`} role="option" onClick={() => setQuery("")}>
                    <strong>{entry.title}</strong>
                    <span>{entry.snippet}</span>
                  </Link>
                ))
              ) : (
                <div className="empty-suggestion">Không tìm thấy gợi ý phù hợp.</div>
              )}
            </div>
          )}
        </div>
        <div className="navbar-actions">
          <div className="dropdown-wrap">
            <IconButton label="Mở thông báo" onClick={() => { setIsNotificationsOpen((current) => !current); setIsAccountOpen(false); }}>
              <Bell size={18} />
            </IconButton>
            <span className="notification-dot" aria-hidden="true" />
            {isNotificationsOpen && (
              <div className="dropdown-panel notification-panel">
                <span className="mono-label">THÔNG BÁO</span>
                <strong>Nhắc nhở học tập</strong>
                <p>Hôm nay nên ôn lại Kubernetes probes.</p>
                <p>Đã có 2 câu hỏi Redis sẵn sàng để luyện tập.</p>
                <p>Mục tiêu tuần đã hoàn thành 72%.</p>
              </div>
            )}
          </div>
          {auth.isAuthenticated && auth.user ? (
            <div className="dropdown-wrap">
              <button className="account-trigger" aria-label={`Menu tài khoản của ${auth.user.name}`} onClick={() => { setIsAccountOpen((current) => !current); setIsNotificationsOpen(false); }}>
                <span className="avatar">{auth.user.name.slice(0, 1).toUpperCase()}</span>
                <span className="account-trigger-text">
                  <strong>{auth.user.name}</strong>
                  <small>{auth.user.email}</small>
                </span>
              </button>
              {showLoginToast && (
                <div className="auth-success-toast" role="status">
                  <Sparkles size={16} />
                  <span>{authMessage ?? `Đăng nhập thành công: ${auth.user.name}`}</span>
                </div>
              )}
              {isAccountOpen && (
                <div className="dropdown-panel account-menu">
                  <Link to="/account/settings" onClick={closeMenus}><Settings size={16} /> Cài đặt tài khoản</Link>
                  <Link to="/help" onClick={closeMenus}><CircleHelp size={16} /> Trung tâm trợ giúp</Link>
                  <button onClick={handleLogout}><LogOut size={16} /> Đăng xuất</button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-nav-actions">
              <Button to="/auth/register" variant="secondary" size="sm">Đăng ký</Button>
              <Button to="/auth/login" size="sm">Đăng nhập</Button>
            </div>
          )}
        </div>
      </header>
      {isMobileMenuOpen && (
        <div className="mobile-sidebar-layer" role="presentation">
          <button className="mobile-sidebar-backdrop" aria-label="Đóng menu điều hướng" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="mobile-sidebar" aria-label="Điều hướng chính">
            <div className="mobile-sidebar-head">
              <span className="mono-label">ĐIỀU HƯỚNG</span>
              <IconButton label="Đóng menu điều hướng" onClick={() => setIsMobileMenuOpen(false)}>
                <X size={18} />
              </IconButton>
            </div>
            <SidebarContent onNavigate={() => setIsMobileMenuOpen(false)} />
          </aside>
        </div>
      )}
      <main className={`app-main${isJournalDetail ? " reading-main" : ""}`}>{children}</main>
    </div>
  );
}
