import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { Link } from "react-router-dom";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  icon?: ReactNode;
  to?: string;
  variant?: "primary" | "secondary" | "ghost" | "ai" | "success";
  size?: "sm" | "md";
};

export function Button({ children, icon, to, variant = "primary", size = "md", className = "", ...props }: ButtonProps) {
  const classes = `button button-${variant} button-${size} ${className}`.trim();
  const content = (
    <>
      {icon}
      <span>{children}</span>
    </>
  );

  if (to) {
    return <Link to={to} className={classes}>{content}</Link>;
  }

  return <button className={classes} {...props}>{content}</button>;
}

export function IconButton({ label, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return <button className="icon-button" aria-label={label} title={label} {...props}>{children}</button>;
}

export function Card({ children, className = "", ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return <section className={`card ${className}`.trim()} {...props}>{children}</section>;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="textarea" {...props} />;
}

export function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "ai" | "success" | "primary" }) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="progress-wrap" aria-label={label}>
      <div className="progress-bar" style={{ width: `${clamped}%` }} />
    </div>
  );
}

export function MetricCard({ label, value, detail, tone = "primary" }: { label: string; value: string; detail: string; tone?: "primary" | "ai" | "success" }) {
  return (
    <Card className={`metric-card metric-${tone}`}>
      <span className="mono-label">{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </Card>
  );
}

export function PageHeader({ title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="page-actions">{action}</div>}
    </header>
  );
}

export function AiPanel({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <Card className="ai-panel">
      <div className="section-heading">
        <span className="mono-label">AI</span>
        <h2>{title}</h2>
      </div>
      {children}
      {action}
    </Card>
  );
}

export function ChartCard({ title, children, detail }: { title: string; children: ReactNode; detail?: string }) {
  return (
    <Card className="chart-card">
      <div className="section-heading">
        <h2>{title}</h2>
        {detail && <p>{detail}</p>}
      </div>
      {children}
    </Card>
  );
}
