import { CheckCircle2, Eye, EyeOff, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Card, IconButton, Input, PageHeader } from "../../components/ui";
import { useAuth } from "./AuthContext";
import { validateLogin, validatePasswordConfirmation, validatePasswordReset, validateRegistration, validateSignUpConfirmation } from "./auth";

type AuthMessageTone = "success" | "error" | "info";
type AuthMessageState = { text: string; tone: AuthMessageTone } | null;

function AuthLayout({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="auth-layout" aria-label={`${title}. ${description}`}>
      {children}
    </div>
  );
}

function AuthMessage({ message, children }: { message: AuthMessageState; children?: React.ReactNode }) {
  if (!message) return null;

  return (
    <div className={`auth-message auth-message-${message.tone}`} role={message.tone === "error" ? "alert" : "status"}>
      <p>{message.text}</p>
      {children}
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  error,
  label = "Mật khẩu",
  autoComplete = "current-password",
  placeholder = "Nhập mật khẩu"
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="form-field">
      <label htmlFor={label}>{label}</label>
      <div className="password-row">
        <Input id={label} type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} placeholder={placeholder} />
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<AuthMessageState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const result = validateLogin(email, password);
    setErrors(result.errors);
    if (!result.valid) return;

    setIsSubmitting(true);
    const loginResult = await auth.loginWithPassword(email, password);
    setIsSubmitting(false);

    if (!loginResult.ok) {
      setMessage({ text: loginResult.message, tone: "error" });
      return;
    }

    navigate("/", { replace: true, state: { authMessage: loginResult.message } });
  }

  async function googleLogin() {
    setMessage(null);
    const result = await auth.startGoogleLogin();
    if (!result.ok) setMessage({ text: result.message, tone: "error" });
  }

  return (
    <AuthLayout title="Đăng nhập LearnFlow" description="Đăng nhập bằng mật khẩu hoặc tiếp tục với Google qua Cognito Hosted UI.">
      <Card className="auth-card">
        <PageHeader eyebrow="Chào mừng trở lại" title="Đăng nhập" description="Chọn đăng nhập thường hoặc đăng nhập bằng Google." />
        <form className="auth-form" onSubmit={submit}>
          <div className="form-field">
            <label htmlFor="login-email">Email</label>
            <Input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="learner@example.com" />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>
          <PasswordInput value={password} onChange={setPassword} error={errors.password} placeholder="Nhập mật khẩu của bạn" />
          <div className="auth-row">
            <Link to="/auth/forgot-password">Quên mật khẩu?</Link>
          </div>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}</Button>
        </form>
        <div className="auth-divider"><span>hoặc</span></div>
        <Button type="button" variant="ghost" className="google-button" onClick={googleLogin}>
          <span className="google-g">G</span>
          Đăng nhập bằng Google
        </Button>
        <AuthMessage message={message} />
        <p className="auth-footnote">Chưa có tài khoản? <Link to="/auth/register">Đăng ký</Link></p>
      </Card>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<AuthMessageState>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (redirectCountdown === null) return;
    if (redirectCountdown <= 0) {
      navigate("/auth/login", { replace: true, state: { authMessage: "Tài khoản đã được xác nhận. Hãy đăng nhập để tiếp tục." } });
      return;
    }

    const timer = window.setTimeout(() => setRedirectCountdown((current) => (current === null ? null : current - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [navigate, redirectCountdown]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const result = validateRegistration(name, email, password, confirmPassword);
    setErrors(result.errors);
    if (!result.valid) return;

    setIsSubmitting(true);
    const signUpResult = await auth.registerWithPassword(name, email, password);
    setIsSubmitting(false);
    setMessage({ text: signUpResult.message, tone: signUpResult.ok ? "success" : "error" });
    if (signUpResult.ok) setIsConfirming(true);
  }

  async function confirmRegistration(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const result = validateSignUpConfirmation(confirmationCode);
    setErrors(result.errors);
    if (!result.valid) return;

    setIsSubmitting(true);
    const confirmResult = await auth.confirmRegistration(email, confirmationCode);
    setIsSubmitting(false);
    setMessage({ text: confirmResult.message, tone: confirmResult.ok ? "success" : "error" });
    if (confirmResult.ok) setRedirectCountdown(3);
  }

  return (
    <AuthLayout title="Tạo tài khoản học tập" description="Thiết lập tài khoản Cognito để đồng bộ dữ liệu học tập về sau.">
      <Card className="auth-card">
        <PageHeader
          eyebrow="Tài khoản mới"
          title={isConfirming ? "Xác nhận email" : "Đăng ký tài khoản"}
          description={isConfirming ? "Nhập mã xác nhận Cognito đã gửi đến email của bạn." : "Hãy dùng mật khẩu mạnh. Tài khoản production sẽ được quản lý bởi Amazon Cognito."}
        />
        {isConfirming ? (
          <form className="auth-form" onSubmit={confirmRegistration}>
            <div className="form-field">
              <label htmlFor="confirmation-code">Mã xác nhận</label>
              <Input id="confirmation-code" value={confirmationCode} onChange={(event) => setConfirmationCode(event.target.value)} autoComplete="one-time-code" placeholder="Nhập mã 6 số trong email" />
              {errors.code && <p className="field-error">{errors.code}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Đang xác nhận..." : "Xác nhận tài khoản"}</Button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            <div className="form-field">
              <label htmlFor="register-name">Tên hiển thị</label>
              <Input id="register-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Người học LearnFlow" />
              {errors.name && <p className="field-error">{errors.name}</p>}
            </div>
            <div className="form-field">
              <label htmlFor="register-email">Email</label>
              <Input id="register-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="learner@example.com" />
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>
            <PasswordInput value={password} onChange={setPassword} error={errors.password} label="Tạo mật khẩu" autoComplete="new-password" placeholder="Ít nhất 10 ký tự, có chữ hoa, số và ký tự đặc biệt" />
            <PasswordInput value={confirmPassword} onChange={setConfirmPassword} error={errors.confirmPassword} label="Xác nhận mật khẩu" autoComplete="new-password" placeholder="Nhập lại mật khẩu" />
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Đang đăng ký..." : "Đăng ký"}</Button>
          </form>
        )}
        <AuthMessage message={message}>
          {redirectCountdown !== null && message?.tone === "success" && (
            <div className="auth-message-actions">
              <span>Tự chuyển về trang đăng nhập sau {redirectCountdown} giây.</span>
              <Link to="/auth/login">Đăng nhập ngay</Link>
            </div>
          )}
        </AuthMessage>
        <p className="auth-footnote">Đã có tài khoản? <Link to="/auth/login">Đăng nhập</Link></p>
      </Card>
    </AuthLayout>
  );
}

export function ForgotPasswordPage() {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<AuthMessageState>(null);
  const [step, setStep] = useState<"email" | "code" | "password" | "completed">("email");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitEmail(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const result = validatePasswordReset(email);
    setErrors(result.errors);
    if (!result.valid) return;

    setIsSubmitting(true);
    const resetResult = await auth.requestPasswordReset(email);
    setIsSubmitting(false);
    setMessage({ text: resetResult.message, tone: resetResult.ok ? "success" : "error" });
    if (resetResult.ok) setStep("code");
  }

  function submitCode(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const result = validateSignUpConfirmation(code);
    setErrors(result.errors);
    if (!result.valid) return;

    setErrors({});
    setMessage({ text: "Mã xác nhận đã được ghi nhận. Hãy tạo mật khẩu mới.", tone: "success" });
    setStep("password");
  }

  async function confirmReset(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const result = validatePasswordConfirmation(code, password, confirmPassword);
    setErrors(result.errors);
    if (!result.valid) return;

    setIsSubmitting(true);
    const confirmResult = await auth.confirmPasswordReset(email, code, password);
    setIsSubmitting(false);
    setMessage({ text: confirmResult.message, tone: confirmResult.ok ? "success" : "error" });
    if (confirmResult.ok) {
      setStep("completed");
      return;
    }

    if (/mã xác nhận|code/i.test(confirmResult.message)) {
      setStep("code");
      setPassword("");
      setConfirmPassword("");
    }
  }

  return (
    <AuthLayout title="Khôi phục quyền truy cập" description="Yêu cầu liên kết đặt lại mật khẩu mà không làm lộ trạng thái tài khoản.">
      <Card className="auth-card">
        <PageHeader
          eyebrow="Khôi phục tài khoản"
          title={step === "code" ? "Nhập mã xác nhận" : step === "password" ? "Tạo mật khẩu mới" : "Quên mật khẩu"}
          description={
            step === "code"
              ? "Nhập mã Cognito đã gửi đến email của bạn."
              : step === "password"
                ? "Tạo mật khẩu mới cho tài khoản vừa xác nhận."
                : "Cognito sẽ gửi mã đặt lại mật khẩu có thời hạn ngắn đến email tài khoản."
          }
        />
        {step === "completed" ? (
          <div className="success-panel">
            <CheckCircle2 size={28} />
            <h2>Đã cập nhật mật khẩu</h2>
            <p>Bạn có thể đăng nhập lại bằng mật khẩu mới.</p>
            <Button to="/auth/login" variant="secondary">Quay lại đăng nhập</Button>
          </div>
        ) : step === "code" ? (
          <form className="auth-form" onSubmit={submitCode}>
            <div className="form-field">
              <label htmlFor="reset-code">Mã xác nhận</label>
              <Input id="reset-code" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="one-time-code" inputMode="numeric" placeholder="Nhập mã OTP trong email" />
              {errors.code && <p className="field-error">{errors.code}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting}>Tiếp tục</Button>
          </form>
        ) : step === "password" ? (
          <form className="auth-form" onSubmit={confirmReset}>
            <PasswordInput value={password} onChange={setPassword} error={errors.password} label="Mật khẩu mới" autoComplete="new-password" placeholder="Ít nhất 10 ký tự, có chữ hoa, số và ký tự đặc biệt" />
            <PasswordInput value={confirmPassword} onChange={setConfirmPassword} error={errors.confirmPassword} label="Xác nhận mật khẩu mới" autoComplete="new-password" placeholder="Nhập lại mật khẩu mới" />
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}</Button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={submitEmail}>
            <div className="form-field">
              <label htmlFor="reset-email">Email</label>
              <Input id="reset-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="learner@example.com" />
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>
            <Button type="submit" icon={<Mail size={17} />} disabled={isSubmitting}>{isSubmitting ? "Đang gửi..." : "Gửi mã đặt lại"}</Button>
          </form>
        )}
        <AuthMessage message={message} />
      </Card>
    </AuthLayout>
  );
}

export function GoogleCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const [message, setMessage] = useState("Đang hoàn tất đăng nhập Google qua Cognito...");

  useEffect(() => {
    const code = params.get("code");
    const error = params.get("error_description") ?? params.get("error");
    if (error) {
      setMessage(error);
      return;
    }
    if (!code) {
      setMessage("Cognito không trả về mã ủy quyền. Vui lòng thử đăng nhập Google lại.");
      return;
    }

    setMessage("Đang đồng bộ phiên đăng nhập Google...");
    auth.completeGoogleLogin().then((currentUser) => {
      if (!currentUser) {
        setMessage("Chưa đọc được phiên Cognito sau callback. Vui lòng thử lại hoặc kiểm tra OAuth scopes/callback URL trong Cognito.");
        return;
      }

      navigate("/", { replace: true, state: { authMessage: `Đăng nhập Google thành công: ${currentUser.name}` } });
    });
  }, [auth, navigate, params]);

  return (
    <AuthLayout title="Đăng nhập Google" description="Hoàn tất callback từ Cognito Hosted UI.">
      <Card className="auth-card">
        <PageHeader eyebrow="OAuth" title="Callback Google" description={message} />
      </Card>
    </AuthLayout>
  );
}

