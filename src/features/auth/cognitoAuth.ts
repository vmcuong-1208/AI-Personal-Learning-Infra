import { Amplify } from "aws-amplify";
import type { ResourcesConfig } from "aws-amplify";
import {
  confirmResetPassword,
  confirmSignUp as amplifyConfirmSignUp,
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser as amplifyGetCurrentUser,
  resetPassword,
  signIn,
  signInWithRedirect,
  signOut,
  signUp
} from "aws-amplify/auth";
import type { AuthUser } from "./auth";

type CognitoConfig = {
  region: string;
  userPoolId: string;
  userPoolClientId: string;
  domain: string;
  redirectSignIn: string;
  redirectSignOut: string;
};

type AuthActionResult = {
  ok: boolean;
  message: string;
};

let configured = false;

function isLocalDevOrigin(origin: string) {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function resolveSameOriginRedirect(configuredUrl: string | undefined, fallbackPath: string) {
  const currentOrigin = window.location.origin;
  const fallbackUrl = `${currentOrigin}${fallbackPath}`;
  if (!configuredUrl) return fallbackUrl;

  try {
    const redirectUrl = new URL(configuredUrl);
    if (isLocalDevOrigin(currentOrigin) && redirectUrl.origin !== currentOrigin) {
      if (!fallbackPath && redirectUrl.pathname === "/" && !redirectUrl.search && !redirectUrl.hash) return currentOrigin;
      return `${currentOrigin}${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`;
    }
    return redirectUrl.toString();
  } catch {
    return fallbackUrl;
  }
}

export function getCognitoConfig(): CognitoConfig {
  return {
    region: import.meta.env.VITE_AWS_REGION ?? "",
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID ?? "",
    userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID ?? "",
    domain: import.meta.env.VITE_COGNITO_DOMAIN ?? "",
    redirectSignIn: resolveSameOriginRedirect(import.meta.env.VITE_COGNITO_REDIRECT_SIGN_IN, "/auth/google/callback"),
    redirectSignOut: resolveSameOriginRedirect(import.meta.env.VITE_COGNITO_REDIRECT_SIGN_OUT, "")
  };
}

export function isCognitoConfigured(config = getCognitoConfig()) {
  return Boolean(config.region && config.userPoolId && config.userPoolClientId);
}

export function configureCognitoAuth() {
  if (configured) return true;

  const config = getCognitoConfig();
  if (!isCognitoConfigured(config)) return false;

  const amplifyConfig: ResourcesConfig = {
    Auth: {
      Cognito: {
        userPoolId: config.userPoolId,
        userPoolClientId: config.userPoolClientId,
        loginWith: {
          email: true,
          oauth: config.domain
            ? {
                domain: config.domain,
                scopes: ["openid", "email"],
                redirectSignIn: [config.redirectSignIn],
                redirectSignOut: [config.redirectSignOut],
                responseType: "code",
                providers: ["Google"]
              }
            : undefined
        }
      }
    }
  } as ResourcesConfig;

  Amplify.configure(amplifyConfig);
  configured = true;
  return true;
}

function requireCognitoConfig(): AuthActionResult | null {
  return configureCognitoAuth()
    ? null
    : {
        ok: false,
        message: "Chưa cấu hình Cognito. Hãy thêm VITE_AWS_REGION, VITE_COGNITO_USER_POOL_ID và VITE_COGNITO_CLIENT_ID vào file .env."
      };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function passwordPolicyMessage() {
  return "Mật khẩu chưa đạt chính sách bảo mật. Hãy dùng ít nhất 10 ký tự, gồm chữ hoa, số và ký tự đặc biệt.";
}

function hostedUiDomainMessage() {
  return "Chưa có domain Cognito Hosted UI hợp lệ cho Google. Hãy vào Cognito > App integration > Domain, tạo hoặc kiểm tra domain, rồi cập nhật VITE_COGNITO_DOMAIN trong file .env.";
}

function isKnownBrokenHostedUiDomain(domain: string) {
  return domain.trim().toLowerCase() === "ap-southeast-1-x3v5pdpyb.auth.ap-southeast-1.amazoncognito.com";
}

function describeAuthError(error: unknown) {
  if (!(error instanceof Error)) return "Không thể hoàn tất thao tác xác thực. Vui lòng thử lại.";

  switch (error.name) {
    case "UserNotConfirmedException":
      return "Tài khoản chưa được xác nhận. Vui lòng kiểm tra email để nhập mã xác nhận.";
    case "NotAuthorizedException":
      return "Email hoặc mật khẩu không đúng.";
    case "UsernameExistsException":
      return "Email này đã được đăng ký.";
    case "InvalidPasswordException":
      return passwordPolicyMessage();
    case "CodeMismatchException":
      return "Mã xác nhận không đúng.";
    case "ExpiredCodeException":
      return "Mã xác nhận đã hết hạn. Vui lòng yêu cầu mã mới.";
    case "LimitExceededException":
      return "Bạn thao tác quá nhanh. Vui lòng chờ một lát rồi thử lại.";
    default:
      if (error.message.includes("Password did not conform")) return passwordPolicyMessage();
      return error.message || "Không thể hoàn tất thao tác xác thực. Vui lòng thử lại.";
  }
}

function getStringClaim(payload: Record<string, unknown> | undefined, key: string) {
  const value = payload?.[key];
  return typeof value === "string" ? value : undefined;
}

function inferProvider(payload: Record<string, unknown> | undefined, fallback: AuthUser["provider"]): AuthUser["provider"] {
  const identities = payload?.identities;
  if (typeof identities === "string" && identities.includes("Google")) return "google";
  if (Array.isArray(identities) && identities.some((identity) => JSON.stringify(identity).includes("Google"))) return "google";
  return fallback;
}

async function readCognitoUser(provider: AuthUser["provider"] = "password"): Promise<AuthUser> {
  const [userResult, sessionResult] = await Promise.allSettled([
    amplifyGetCurrentUser(),
    fetchAuthSession()
  ]);

  if (userResult.status === "rejected" && sessionResult.status === "rejected") throw userResult.reason;

  const user = userResult.status === "fulfilled" ? userResult.value : null;
  const idTokenPayload = sessionResult.status === "fulfilled" ? sessionResult.value.tokens?.idToken?.payload : undefined;
  const tokenEmail = getStringClaim(idTokenPayload, "email");
  const tokenName = getStringClaim(idTokenPayload, "name") ?? getStringClaim(idTokenPayload, "cognito:username");

  if (tokenEmail) {
    return {
      name: tokenName ?? tokenEmail.split("@")[0] ?? "Ng??i h?c",
      email: normalizeEmail(tokenEmail),
      provider: inferProvider(idTokenPayload, provider)
    };
  }

  let attributes: Record<string, string | undefined> = {};
  try {
    attributes = await fetchUserAttributes();
  } catch {
    attributes = {};
  }

  const email = attributes.email ?? user?.signInDetails?.loginId ?? user?.username;
  if (!email) throw new Error("No active Cognito session.");

  return {
    name: attributes.name ?? email.split("@")[0] ?? "Ng??i h?c",
    email: normalizeEmail(email),
    provider
  };
}

export async function getCurrentCognitoUser() {
  if (!configureCognitoAuth()) return null;

  try {
    return await readCognitoUser();
  } catch {
    return null;
  }
}

export async function waitForCurrentCognitoUser(retries = 12, delayMs = 500) {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    const user = await getCurrentCognitoUser();
    if (user) return user;
    await new Promise((resolve) => window.setTimeout(resolve, delayMs));
  }

  return null;
}

export async function signUpWithCognito(name: string, email: string, password: string): Promise<AuthActionResult> {
  const configError = requireCognitoConfig();
  if (configError) return configError;

  try {
    await signUp({
      username: normalizeEmail(email),
      password,
      options: {
        userAttributes: {
          email: normalizeEmail(email),
          name: name.trim()
        }
      }
    });

    return { ok: true, message: "Đã gửi mã xác nhận đến email của bạn." };
  } catch (error) {
    return { ok: false, message: describeAuthError(error) };
  }
}

export async function confirmSignUpWithCognito(email: string, code: string): Promise<AuthActionResult> {
  const configError = requireCognitoConfig();
  if (configError) return configError;

  try {
    await amplifyConfirmSignUp({ username: normalizeEmail(email), confirmationCode: code.trim() });
    return { ok: true, message: "Tài khoản đã được xác nhận. Bạn có thể đăng nhập." };
  } catch (error) {
    return { ok: false, message: describeAuthError(error) };
  }
}

export async function signInWithCognito(email: string, password: string) {
  const configError = requireCognitoConfig();
  if (configError) return { ...configError, user: null };

  try {
    await signIn({ username: normalizeEmail(email), password });
    return { ok: true, message: "Đăng nhập thành công.", user: await readCognitoUser("password") };
  } catch (error) {
    return { ok: false, message: describeAuthError(error), user: null };
  }
}

export async function signOutFromCognito(): Promise<AuthActionResult> {
  const configError = requireCognitoConfig();
  if (configError) return configError;

  try {
    await signOut({ global: false });
    return { ok: true, message: "Đã đăng xuất." };
  } catch (error) {
    return { ok: false, message: describeAuthError(error) };
  }
}

export async function requestPasswordResetWithCognito(email: string): Promise<AuthActionResult> {
  const configError = requireCognitoConfig();
  if (configError) return configError;

  try {
    await resetPassword({ username: normalizeEmail(email) });
    return { ok: true, message: "Nếu tài khoản tồn tại, mã đặt lại mật khẩu sẽ được gửi trong ít phút." };
  } catch {
    return { ok: true, message: "Nếu tài khoản tồn tại, mã đặt lại mật khẩu sẽ được gửi trong ít phút." };
  }
}

export async function confirmPasswordResetWithCognito(email: string, code: string, newPassword: string): Promise<AuthActionResult> {
  const configError = requireCognitoConfig();
  if (configError) return configError;

  try {
    await confirmResetPassword({
      username: normalizeEmail(email),
      confirmationCode: code.trim(),
      newPassword
    });
    return { ok: true, message: "Mật khẩu đã được cập nhật. Hãy đăng nhập lại." };
  } catch (error) {
    return { ok: false, message: describeAuthError(error) };
  }
}

export async function startGoogleHostedUiSignIn(): Promise<AuthActionResult> {
  const configError = requireCognitoConfig();
  if (configError) return configError;

  const domain = getCognitoConfig().domain;
  if (!domain || isKnownBrokenHostedUiDomain(domain)) {
    return { ok: false, message: hostedUiDomainMessage() };
  }

  try {
    await signInWithRedirect({ provider: "Google" });
    return { ok: true, message: "Đang chuyển đến Cognito Hosted UI." };
  } catch (error) {
    return { ok: false, message: describeAuthError(error) };
  }
}





