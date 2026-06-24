import { BarChart3, Bot, Home, Menu, PenLine, Search, Sparkles, Trophy, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Button, IconButton } from "../ui";

const navItems = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/journal/new", label: "Journal", icon: PenLine },
  { to: "/coach", label: "Coach", icon: Bot },
  { to: "/search", label: "Search", icon: Search },
  { to: "/quiz", label: "Quiz", icon: Trophy },
  { to: "/analytics", label: "Analytics", icon: BarChart3 }
];

function navClass({ isActive }: { isActive: boolean }) {
  return `nav-link${isActive ? " is-active" : ""}`;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <NavLink to="/" className="brand-block" aria-label="LearnFlow home" onClick={onNavigate}>
        <span className="brand-mark"><Sparkles size={20} /></span>
        <span>
          <strong>LearnFlow</strong>
          <small>AI Dashboard</small>
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
      <div className="sidebar-card" onClick={onNavigate}>
        <span className="mono-label">WEEKLY FOCUS</span>
        <strong>System design fluency</strong>
        <p>3 review blocks left before Friday.</p>
        <Button to="/journal/new" size="sm">New Entry</Button>
      </div>
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isJournalDetail = location.pathname.startsWith("/journal/") && location.pathname !== "/journal/new";

  return (
    <div className="app-shell">
      <aside className="desktop-sidebar" aria-label="Main navigation">
        <SidebarContent />
      </aside>
      <header className="mobile-topbar">
        <IconButton label="Open navigation menu" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu size={20} />
        </IconButton>
        <NavLink to="/" className="mobile-brand" aria-label="LearnFlow home">
          <span className="brand-mark small"><Sparkles size={16} /></span>
          <span>LearnFlow</span>
        </NavLink>
      </header>
      {isMobileMenuOpen && (
        <div className="mobile-sidebar-layer" role="presentation">
          <button className="mobile-sidebar-backdrop" aria-label="Close navigation menu" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="mobile-sidebar" aria-label="Main navigation">
            <div className="mobile-sidebar-head">
              <span className="mono-label">Navigation</span>
              <IconButton label="Close navigation menu" onClick={() => setIsMobileMenuOpen(false)}>
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
