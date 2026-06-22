import { BarChart3, Bot, Home, PenLine, Search, Sparkles, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Button } from "../ui";

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

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isJournalDetail = location.pathname.startsWith("/journal/") && location.pathname !== "/journal/new";

  return (
    <div className="app-shell">
      <aside className="desktop-sidebar" aria-label="Main navigation">
        <NavLink to="/" className="brand-block" aria-label="LearnFlow home">
          <span className="brand-mark"><Sparkles size={20} /></span>
          <span>
            <strong>LearnFlow</strong>
            <small>AI Dashboard</small>
          </span>
        </NavLink>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"} className={navClass}>
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-card">
          <span className="mono-label">WEEKLY FOCUS</span>
          <strong>System design fluency</strong>
          <p>3 review blocks left before Friday.</p>
          <Button to="/journal/new" size="sm">New Entry</Button>
        </div>
      </aside>
      <main className={`app-main${isJournalDetail ? " reading-main" : ""}`}>{children}</main>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {navItems.slice(0, 5).map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === "/"} className={navClass}>
            <item.icon size={19} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
