# Local Serverless API Preparation

## Mục tiêu

Tài liệu này thay thế hướng backend local kiểu EC2/RDS bằng hướng serverless-first cho LearnFlow. Mục tiêu là chuẩn hóa contract API trước khi triển khai lên AWS API Gateway + Lambda API + DynamoDB, đồng thời giữ frontend có thể phát triển bằng mock/local adapter trong lúc hạ tầng AWS chưa hoàn chỉnh.

## Kiến trúc API mới

Luồng production mục tiêu:

1. Frontend SPA chạy qua CloudFront/WAF.
2. User đăng nhập bằng Cognito và nhận JWT.
3. Frontend gọi API Gateway với `Authorization: Bearer <accessToken>`.
4. API Gateway dùng Cognito Authorizer để xác thực JWT.
5. API Gateway invoke Lambda API.
6. Lambda API đọc/ghi DynamoDB, sinh presigned URL cho S3 Journal Images, hoặc đẩy job vào SQS.
7. Các job AI report/quiz được Lambda AI Worker xử lý bất đồng bộ và cập nhật kết quả vào DynamoDB.

## API cần có

- `GET /health`: health check cho API Gateway/Lambda API.
- `GET /me`: trả user hiện tại từ Cognito claims hoặc DynamoDB profile.
- `GET /logs`: list journal logs theo user hiện tại.
- `POST /logs`: tạo journal log.
- `GET /logs/:id`: xem chi tiết journal log.
- `PUT /logs/:id`: cập nhật journal log.
- `DELETE /logs/:id`: xóa journal log.
- `POST /logs/:id/images/presigned-url`: tạo presigned URL để upload ảnh lên S3 Journal Images.
- `POST /ai/reports`: tạo AI report job bất đồng bộ.
- `GET /ai/reports`: list AI reports.
- `GET /ai/reports/:id`: xem trạng thái/kết quả report.
- `GET /search`: search journal logs theo query, tags, topic, date range.
- `POST /quiz`: tạo quiz generation job bất đồng bộ.
- `GET /quiz/:id`: xem trạng thái/kết quả quiz.
- `POST /quiz/:id/attempts`: nộp bài và lưu kết quả.
- `GET /analytics/summary`: trả dữ liệu tổng hợp cho dashboard/analytics.

## Local development

Trong local, có 2 hướng phát triển an toàn:

1. Dùng AWS dev thật: frontend gọi API Gateway dev stage, Cognito dev User Pool, DynamoDB dev tables.
2. Dùng local adapter: code Lambda API chạy local với mock repository hoặc DynamoDB Local, nhưng contract request/response vẫn giống production.

Không nên quay lại mô hình sessionStorage làm source of truth cho production path. Mock chỉ nên nằm trong adapter tạm thời, dễ thay bằng API thật.

## Auth local

- Frontend hiện đã dùng Cognito config trong `.env.example`.
- API production không dùng `POST /auth/login` nội bộ nữa nếu đã chọn Cognito.
- Lambda API phải lấy identity từ JWT claims.
- Tất cả endpoint dữ liệu phải scope theo `user_id` hoặc `sub` từ token, không nhận `user_id` từ body.

## Environment variables đề xuất

Frontend:

```bash
VITE_API_BASE_URL=https://<api-id>.execute-api.<region>.amazonaws.com/<stage>
VITE_AWS_REGION=ap-southeast-1
VITE_COGNITO_USER_POOL_ID=ap-southeast-1_example
VITE_COGNITO_CLIENT_ID=your-cognito-spa-app-client-id
VITE_COGNITO_DOMAIN=your-domain-prefix.auth.ap-southeast-1.amazoncognito.com
VITE_COGNITO_REDIRECT_SIGN_IN=http://localhost:5173/auth/google/callback
VITE_COGNITO_REDIRECT_SIGN_OUT=http://localhost:5173
```

Lambda API:

```bash
AWS_REGION=ap-southeast-1
JOURNAL_TABLE=LearnFlowJournalLogs
AI_REPORT_TABLE=LearnFlowAiReports
QUIZ_TABLE=LearnFlowQuizzes
QUIZ_ATTEMPT_TABLE=LearnFlowQuizAttempts
JOURNAL_IMAGES_BUCKET=learnflow-journal-images
AI_REPORT_QUEUE_URL=https://sqs.<region>.amazonaws.com/<account>/ai-report-jobs
QUIZ_QUEUE_URL=https://sqs.<region>.amazonaws.com/<account>/quiz-jobs
```

## Request/response contract lưu ý

- `POST /ai/reports` chỉ trả `{ report_id, status: "pending" }`.
- `POST /quiz` chỉ trả `{ quiz_id, status: "pending" }`.
- Frontend phải polling `GET /ai/reports/:id` hoặc `GET /quiz/:id` cho tới `completed` hoặc `failed`.
- Presigned upload là 2 bước: xin URL từ API, upload trực tiếp lên S3, sau đó lưu metadata ảnh vào journal nếu cần.

## FRONTEND REVIEW CHECKLIST

- Tạo API client dùng chung với `VITE_API_BASE_URL`.
- Gắn Cognito access token vào mọi API request cần auth.
- Journal/search/quiz/coach không gọi mock trực tiếp khi chạy production mode.
- `/coach` cần polling/backoff thay cho timer mock.
- `/quiz` cần màn hình pending generation trước màn hình làm bài.
- Journal editor cần hỗ trợ upload ảnh bằng presigned URL.
- UI cần xử lý loading, empty, failed, retry cho API Gateway/Lambda/SQS async states.
