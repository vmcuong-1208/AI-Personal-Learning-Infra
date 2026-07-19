# Hướng dẫn tích hợp AWS Cognito cho đăng ký và đăng nhập
- **File Frontend áp dụng:** `src/features/auth/AuthPages.tsx`, `src/features/auth/AuthContext.tsx`, `src/features/auth/cognitoAuth.ts`
- **Dịch vụ AWS:** Amazon Cognito User Pool
- **Tính năng:** đăng ký email/password, xác nhận email, đăng nhập, quên mật khẩu, đăng nhập Google qua Hosted UI

### 1. Cấu hình dịch vụ trên AWS Console
1. Vào Amazon Cognito > User pools > Create user pool.
2. Chọn sign-in bằng email. Bật email verification để Cognito gửi mã xác nhận sau đăng ký.
3. Đặt password policy khớp frontend: tối thiểu 10 ký tự, có chữ hoa và số. Có thể bật thêm ký tự đặc biệt nếu muốn bảo mật cao hơn, nhưng khi đó cần cập nhật validation frontend.
4. Tạo App client cho SPA, không tạo client secret.
5. Bật Hosted UI và tạo domain, ví dụ `learnflow-auth.auth.ap-southeast-1.amazoncognito.com`.
6. Trong App client OAuth settings, thêm callback URL:
   - Local: `http://localhost:5173/auth/google/callback`
   - Production: domain thật của LearnFlow sau khi deploy
7. Thêm sign-out URL:
   - Local: `http://localhost:5173`
   - Production: domain thật của LearnFlow
8. Chọn OAuth grant `Authorization code grant` và scopes: `openid`, `email`, `profile`.

### 2. Cấu hình Google Identity Provider
1. Trong Google Cloud Console, tạo OAuth 2.0 Client ID cho web application.
2. Thêm authorized redirect URI do Cognito cung cấp, thường có dạng:
   `https://<cognito-domain>/oauth2/idpresponse`
3. Quay lại Cognito User Pool > Sign-in experience > Federated identity provider > Google.
4. Nhập Google client ID và client secret.
5. Map attributes:
   - `email` -> `email`
   - `name` -> `name`
6. Bật Google provider cho App client dùng bởi frontend.

### 3. Cấu hình bảo mật và biến môi trường
Thêm các biến sau vào `.env` local:

```bash
VITE_AWS_REGION=ap-southeast-1
VITE_COGNITO_USER_POOL_ID=ap-southeast-1_example
VITE_COGNITO_CLIENT_ID=your-cognito-spa-app-client-id
VITE_COGNITO_DOMAIN=your-domain-prefix.auth.ap-southeast-1.amazoncognito.com
VITE_COGNITO_REDIRECT_SIGN_IN=http://localhost:5173/auth/google/callback
VITE_COGNITO_REDIRECT_SIGN_OUT=http://localhost:5173
```

Không đưa Google client secret hoặc Cognito client secret vào frontend. SPA App client phải không có secret.

### 4. Code SDK thay thế cho logic mock
Frontend đã dùng `aws-amplify/auth` trong `src/features/auth/cognitoAuth.ts`.

Các thao tác chính:
- `signUpWithCognito(name, email, password)` gọi Cognito `signUp` và gửi `email`, `name`.
- `confirmSignUpWithCognito(email, code)` xác nhận email bằng mã Cognito.
- `signInWithCognito(email, password)` đăng nhập và map Cognito attributes thành `AuthUser`.
- `requestPasswordResetWithCognito(email)` gọi `resetPassword` và luôn trả thông báo trung tính để không lộ trạng thái tài khoản.
- `confirmPasswordResetWithCognito(email, code, newPassword)` hoàn tất đổi mật khẩu.
- `startGoogleHostedUiSignIn()` chuyển người dùng sang Cognito Hosted UI với Google provider.

Sau này, các API journal, quiz, analytics nên nhận Cognito JWT ở header `Authorization: Bearer <accessToken>` và verify token phía backend.
