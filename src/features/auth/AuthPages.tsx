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

function PasswordInput({ value, onChange, error, label = "Mật khẩu" }: { value: string; onChange: (value: string) => void; error?: string; label?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="form-field">
      <label htmlFor={label}>{label}</label>
      <div className="password-row">
        <Input id={label} type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoComplete="current-password" />
        <IconButton label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"} type="button" onClick={() => setVisible((current) => !current)}>
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
    <AuthLayout title="Đăng nhập LearnFlow" description="Đăng nhập bằng mật khẩu hoặc tiếp tục với Google khi OAuth đã được cấu hình.">
      <Card className="auth-card">
        <PageHeader eyebrow="Chào mừng trở lại" title="Đăng nhập" description="Chọn đăng nhập thường hoặc đăng nhập bằng Google." />
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
        <div className="auth-divider"><span>hoặc</span></div>
        <Button type="button" variant="ghost" className="google-button" onClick={googleLogin}>
          <span className="google-g">G</span>
          Đăng nhập bằng Google
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
  const [name, setName] = useState("Người học LearnFlow");
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
    <AuthLayout title="Tạo tài khoản học tập" description="Thiết lập tài khoản để lưu lịch sử học tập và đồng bộ dữ liệu về sau.">
      <Card className="auth-card">
        <PageHeader eyebrow="Tài khoản mới" title="Đăng ký tài khoản" description="Hãy dùng mật khẩu mạnh. MVP hiện chỉ lưu hồ sơ phiên tối thiểu trong trình duyệt." />
        <form className="auth-form" onSubmit={submit}>
          <div className="form-field">
            <label htmlFor="register-name">Tên hiển thị</label>
            <Input id="register-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>
          <div className="form-field">
            <label htmlFor="register-email">Email</label>
            <Input id="register-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>
          <PasswordInput value={password} onChange={setPassword} error={errors.password} label="Tạo mật khẩu" />
          <PasswordInput value={confirmPassword} onChange={setConfirmPassword} error={errors.confirmPassword} label="Xác nhận mật khẩu" />
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
    <AuthLayout title="Khôi phục quyền truy cập" description="Yêu cầu liên kết đặt lại mật khẩu mà không làm lộ trạng thái tài khoản.">
      <Card className="auth-card">
        <PageHeader eyebrow="Khôi phục tài khoản" title="Quên mật khẩu" description="Nhập email tài khoản. Backend production sẽ gửi liên kết đặt lại mật khẩu có thời hạn ngắn." />
        {sent ? (
          <div className="success-panel">
            <CheckCircle2 size={28} />
            <h2>Đã yêu cầu liên kết đặt lại</h2>
            <p>Nếu tồn tại tài khoản với email {email}, liên kết đặt lại mật khẩu sẽ được gửi trong ít phút.</p>
            <Button to="/auth/login" variant="secondary">Quay lại đăng nhập</Button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            <div className="form-field">
              <label htmlFor="reset-email">Email</label>
              <Input id="reset-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>
            <Button type="submit" icon={<Mail size={17} />}>Gửi liên kết đặt lại</Button>
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
  const [message, setMessage] = useState("Đang xác minh đăng nhập Google...");

  useEffect(() => {
    const code = params.get("code");
    const state = params.get("state");
    if (!code) {
      setMessage("Google không trả về mã ủy quyền.");
      return;
    }

    const result = auth.completeGoogleLogin(state);
    setMessage(result.message);
  }, [auth, navigate, params]);

  return (
    <AuthLayout title="Đăng nhập Google" description="Hoàn tất bước xác minh trạng thái OAuth.">
      <Card className="auth-card">
        <PageHeader eyebrow="OAuth" title="Callback Google" description={message} />
      </Card>
    </AuthLayout>
  );
}
