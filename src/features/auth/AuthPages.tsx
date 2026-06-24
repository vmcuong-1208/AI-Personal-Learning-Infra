import { CheckCircle2, Eye, EyeOff, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Card, IconButton, Input, PageHeader } from "../../components/ui";
import { useAuth } from "./AuthContext";
import { validateLogin, validatePasswordReset, validateRegistration } from "./auth";

function AuthLayout({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="auth-layout" aria-label={`${title}. ${description}`}>
      {children}
    </div>
  );
}

function PasswordInput({ value, onChange, error, label = "Password" }: { value: string; onChange: (value: string) => void; error?: string; label?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="form-field">
      <label htmlFor={label}>{label}</label>
      <div className="password-row">
        <Input id={label} type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoComplete="current-password" />
        <IconButton label={visible ? "Hide password" : "Show password"} type="button" onClick={() => setVisible((current) => !current)}>
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </IconButton>
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("learner@example.com");
  const [password, setPassword] = useState("LearnFlow1");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = validateLogin(email, password);
    setErrors(result.errors);
    if (!result.valid) return;
    auth.loginWithPassword(email, password);
    navigate("/", { replace: true, state: { authMessage: "Đăng nhập thành công" } });
  }

  function googleLogin() {
    const result = auth.startGoogleLogin();
    if (!result.ok) setMessage(result.message);
  }

  return (
    <AuthLayout title="Sign in to LearnFlow" description="Use your account password or continue with Google when OAuth is configured.">
      <Card className="auth-card">
        <PageHeader eyebrow="Welcome back" title="Đăng nhập" description="Choose password login or Google OAuth." />
        <form className="auth-form" onSubmit={submit}>
          <div className="form-field">
            <label htmlFor="login-email">Email</label>
            <Input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>
          <PasswordInput value={password} onChange={setPassword} error={errors.password} />
          <div className="auth-row">
            <Link to="/auth/forgot-password">Quên mật khẩu?</Link>
          </div>
          <Button type="submit">Đăng nhập</Button>
        </form>
        <div className="auth-divider"><span>or</span></div>
        <Button type="button" variant="ghost" className="google-button" onClick={googleLogin}>
          <span className="google-g">G</span>
          Continue with Google
        </Button>
        {message && <p className="auth-message">{message}</p>}
        <p className="auth-footnote">Chưa có tài khoản? <Link to="/auth/register">Đăng ký</Link></p>
      </Card>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("LearnFlow User");
  const [email, setEmail] = useState("learner@example.com");
  const [password, setPassword] = useState("LearnFlow1");
  const [confirmPassword, setConfirmPassword] = useState("LearnFlow1");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = validateRegistration(name, email, password, confirmPassword);
    setErrors(result.errors);
    if (!result.valid) return;
    auth.registerWithPassword(name, email, password);
    navigate("/", { replace: true, state: { authMessage: "Đăng ký và đăng nhập thành công" } });
  }

  return (
    <AuthLayout title="Create your learning account" description="A simple account setup for personal learning history and future sync.">
      <Card className="auth-card">
        <PageHeader eyebrow="New account" title="Đăng ký tài khoản" description="Use a strong password. This MVP keeps only the session profile in browser storage." />
        <form className="auth-form" onSubmit={submit}>
          <div className="form-field">
            <label htmlFor="register-name">Name</label>
            <Input id="register-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>
          <div className="form-field">
            <label htmlFor="register-email">Email</label>
            <Input id="register-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>
          <PasswordInput value={password} onChange={setPassword} error={errors.password} label="Create password" />
          <PasswordInput value={confirmPassword} onChange={setConfirmPassword} error={errors.confirmPassword} label="Confirm password" />
          <Button type="submit">Đăng ký</Button>
        </form>
        <p className="auth-footnote">Đã có tài khoản? <Link to="/auth/login">Đăng nhập</Link></p>
      </Card>
    </AuthLayout>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = validatePasswordReset(email);
    setErrors(result.errors);
    if (!result.valid) return;
    setSent(true);
  }

  return (
    <AuthLayout title="Reset access safely" description="Request a reset link without exposing account details.">
      <Card className="auth-card">
        <PageHeader eyebrow="Account recovery" title="Quên mật khẩu" description="Enter your account email. The production backend should send a short-lived reset link." />
        {sent ? (
          <div className="success-panel">
            <CheckCircle2 size={28} />
            <h2>Reset link requested</h2>
            <p>If an account exists for {email}, a password reset link will be sent shortly.</p>
            <Button to="/auth/login" variant="secondary">Back to login</Button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            <div className="form-field">
              <label htmlFor="reset-email">Email</label>
              <Input id="reset-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>
            <Button type="submit" icon={<Mail size={17} />}>Send reset link</Button>
          </form>
        )}
      </Card>
    </AuthLayout>
  );
}

export function GoogleCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const [message, setMessage] = useState("Verifying Google sign-in...");

  useEffect(() => {
    const code = params.get("code");
    const state = params.get("state");
    if (!code) {
      setMessage("Google did not return an authorization code.");
      return;
    }

    const result = auth.completeGoogleLogin(state);
    setMessage(result.message);
  }, [auth, navigate, params]);

  return (
    <AuthLayout title="Google sign-in" description="Completing OAuth state verification.">
      <Card className="auth-card">
        <PageHeader eyebrow="OAuth" title="Google callback" description={message} />
      </Card>
    </AuthLayout>
  );
}
