export type AuthUser = {
  name: string;
  email: string;
  provider: "password" | "google";
};

export type AuthValidationResult = {
  valid: boolean;
  errors: Record<string, string>;
};

export function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validateLogin(email: string, password: string): AuthValidationResult {
  const errors: Record<string, string> = {};
  if (!validateEmail(email)) errors.email = "Vui lòng nhập địa chỉ email hợp lệ.";
  if (password.length < 8) errors.password = "Mật khẩu cần có ít nhất 8 ký tự.";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateRegistration(name: string, email: string, password: string, confirmPassword: string): AuthValidationResult {
  const errors: Record<string, string> = {};
  if (name.trim().length < 2) errors.name = "Tên hiển thị cần có ít nhất 2 ký tự.";
  if (!validateEmail(email)) errors.email = "Vui lòng nhập địa chỉ email hợp lệ.";
  if (password.length < 10 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    errors.password = "Mật khẩu cần có ít nhất 10 ký tự, gồm chữ hoa, số và ký tự đặc biệt.";
  }
  if (password !== confirmPassword) errors.confirmPassword = "Mật khẩu xác nhận không khớp.";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validatePasswordReset(email: string): AuthValidationResult {
  const errors: Record<string, string> = {};
  if (!validateEmail(email)) errors.email = "Vui lòng nhập email gắn với tài khoản.";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validatePasswordConfirmation(code: string, password: string, confirmPassword: string): AuthValidationResult {
  const errors: Record<string, string> = {};
  if (code.trim().length < 4) errors.code = "Vui lòng nhập mã xác nhận từ email.";
  if (password.length < 10 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    errors.password = "Mật khẩu cần có ít nhất 10 ký tự, gồm chữ hoa, số và ký tự đặc biệt.";
  }
  if (password !== confirmPassword) errors.confirmPassword = "Mật khẩu xác nhận không khớp.";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateSignUpConfirmation(code: string): AuthValidationResult {
  const errors: Record<string, string> = {};
  if (code.trim().length < 4) errors.code = "Vui lòng nhập mã xác nhận từ email.";
  return { valid: Object.keys(errors).length === 0, errors };
}

