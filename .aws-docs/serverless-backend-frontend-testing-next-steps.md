# Hướng Dẫn Các Bước Tiếp Theo: Kết Nối Backend Serverless AWS Với Frontend LearnFlow

## Trạng Thái Hiện Tại

Bạn đã hoàn thành và test được các chức năng xác thực bằng Amazon Cognito + JWT:

- Đăng ký tài khoản.
- Đăng nhập email/password.
- Quên mật khẩu.
- Đăng nhập bằng Google qua Cognito Hosted UI.
- Frontend đã có thể nhận và dùng JWT từ Cognito session.

Tài liệu này hướng dẫn các bước tiếp theo để nối backend với các dịch vụ AWS trong kiến trúc serverless mới, sau đó kết nối frontend để test end-to-end.

Kiến trúc mục tiêu:

```text
User
-> CloudFront + WAF
-> API Gateway + Cognito Authorizer
-> Lambda API
-> DynamoDB

Upload ảnh:
Frontend -> Lambda API xin Presigned URL -> Frontend upload trực tiếp lên S3 Journal Images

AI Report / Quiz:
Lambda API -> SQS -> Lambda AI Worker -> Amazon Bedrock -> DynamoDB
```

## 1. Chuẩn Hóa Biến Môi Trường Frontend

### Mục tiêu

Frontend cần biết API Gateway endpoint để gọi backend thật thay vì mock/local state.

### Việc cần làm

Thêm biến này vào `.env.example` và `.env` local:

```bash
VITE_API_BASE_URL=https://<api-id>.execute-api.<region>.amazonaws.com/<stage>
```

Giữ các biến Cognito hiện có:

```bash
VITE_AWS_REGION=ap-southeast-1
VITE_COGNITO_USER_POOL_ID=ap-southeast-1_example
VITE_COGNITO_CLIENT_ID=your-cognito-spa-app-client-id
VITE_COGNITO_DOMAIN=your-domain-prefix.auth.ap-southeast-1.amazoncognito.com
VITE_COGNITO_REDIRECT_SIGN_IN=http://localhost:5173/auth/google/callback
VITE_COGNITO_REDIRECT_SIGN_OUT=http://localhost:5173
```

### Frontend cần có API client chung

Tạo một API client dùng chung, ví dụ `src/lib/apiClient.ts`, để:

- Lấy Cognito access token từ Auth layer.
- Gắn header `Authorization: Bearer <accessToken>`.
- Dùng `VITE_API_BASE_URL`.
- Parse JSON response.
- Chuẩn hóa lỗi `401`, `403`, `500`, timeout, và network error.

Ví dụ contract mong muốn:

```ts
export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  // Lấy access token từ Cognito/AuthContext.
  // Gọi `${import.meta.env.VITE_API_BASE_URL}${path}`.
  // Attach Authorization header.
  // Parse JSON hoặc throw lỗi đã chuẩn hóa.
}
```

## 2. Tạo API Gateway Với Cognito Authorizer

### Mục tiêu

API Gateway là cửa vào backend thay cho ALB/EC2. Tất cả route nghiệp vụ cần Cognito Authorizer để xác thực JWT.

### Bước cấu hình trên AWS Console

1. Vào Amazon API Gateway.
2. Chọn tạo HTTP API nếu backend chỉ cần route đơn giản và JWT Authorizer.
3. Tạo integration tới Lambda API.
4. Tạo JWT Authorizer:
   - Identity source: `$request.header.Authorization`
   - Issuer URL: `https://cognito-idp.<region>.amazonaws.com/<user-pool-id>`
   - Audience: Cognito App Client ID của frontend.
5. Gắn Authorizer vào các route nghiệp vụ.
6. Tạo stage, ví dụ `dev`.
7. Bật CORS:
   - Allow origin local: `http://localhost:5173`
   - Allow origin production sau này: CloudFront/custom domain
   - Allow headers: `Authorization`, `Content-Type`
   - Allow methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`

### Route tối thiểu nên tạo trước

```text
GET /health
GET /me
GET /logs
POST /logs
GET /logs/{id}
PUT /logs/{id}
DELETE /logs/{id}
```

Sau khi journal chạy ổn, thêm tiếp:

```text
POST /logs/{id}/images/presigned-url
POST /ai/reports
GET /ai/reports
GET /ai/reports/{id}
GET /search
POST /quiz
GET /quiz/{id}
POST /quiz/{id}/attempts
GET /analytics/summary
```

## 3. Tạo Lambda API

### Mục tiêu

Lambda API xử lý request đồng bộ: journal CRUD, search, analytics, tạo presigned URL, tạo job AI report, tạo job quiz.

### Biến môi trường Lambda API

```bash
AWS_REGION=ap-southeast-1
USERS_TABLE=LearnFlowUsers
JOURNAL_TABLE=LearnFlowJournalLogs
AI_REPORT_TABLE=LearnFlowAiReports
QUIZ_TABLE=LearnFlowQuizzes
QUIZ_ATTEMPT_TABLE=LearnFlowQuizAttempts
JOURNAL_IMAGES_BUCKET=learnflow-journal-images
AI_REPORT_QUEUE_URL=https://sqs.<region>.amazonaws.com/<account-id>/ai-report-jobs
QUIZ_QUEUE_URL=https://sqs.<region>.amazonaws.com/<account-id>/quiz-jobs
```

### IAM role cho Lambda API

Lambda API cần quyền tối thiểu:

```text
logs:CreateLogGroup
logs:CreateLogStream
logs:PutLogEvents

dynamodb:GetItem
dynamodb:PutItem
dynamodb:UpdateItem
dynamodb:DeleteItem
dynamodb:Query

sqs:SendMessage

s3:PutObject
s3:GetObject
```

Giới hạn resource theo ARN thật của DynamoDB tables, SQS queues, và S3 bucket. Không dùng `Resource: "*"` cho production.

### Logic bắt buộc

- Không nhận `user_id` từ body.
- Lấy user identity từ JWT claims do API Gateway truyền xuống Lambda.
- Mọi DynamoDB query phải scope theo `userId`.
- Trả lỗi rõ ràng:
  - `401`: thiếu/không hợp lệ token.
  - `403`: user không sở hữu resource.
  - `400`: input sai.
  - `404`: không tìm thấy.
  - `500`: lỗi backend.

## 4. Tạo DynamoDB Tables

### Mục tiêu

DynamoDB thay thế RDS PostgreSQL để lưu dữ liệu ứng dụng.

### Bảng đề xuất cho MVP

```text
LearnFlowUsers
PK: userId

LearnFlowJournalLogs
PK: userId
SK: entryId
GSI: userId-createdAt-index
GSI: userId-topic-index

LearnFlowAiReports
PK: userId
SK: reportId
GSI: userId-createdAt-index

LearnFlowQuizzes
PK: userId
SK: quizId
GSI: userId-createdAt-index

LearnFlowQuizAttempts
PK: userId
SK: attemptId
GSI: quizId-submittedAt-index
```

### Cấu hình khuyến nghị

- Billing mode: On-demand cho MVP.
- Encryption: AWS owned key hoặc AWS managed key.
- Point-in-time recovery: bật nếu muốn an toàn dữ liệu.
- TTL: chỉ dùng cho dữ liệu tạm/job debug nếu có.

### Test DynamoDB trước khi nối frontend

Test theo thứ tự:

1. `GET /health` trả `{ "ok": true }`.
2. `GET /me` trả user từ Cognito claims.
3. `POST /logs` tạo item trong `LearnFlowJournalLogs`.
4. `GET /logs` list đúng log của user hiện tại.
5. `GET /logs/{id}` trả đúng chi tiết log.
6. `PUT /logs/{id}` cập nhật item.
7. `DELETE /logs/{id}` xóa hoặc soft-delete item.

## 5. Kết Nối Journal CRUD Với Frontend

### Mục tiêu

Thay mock/sessionStorage bằng API thật cho journal.

### Frontend cần đổi

- New Journal Entry gọi `POST /logs`.
- Entry Detail gọi `GET /logs/{id}`.
- Journal list/search gọi `GET /logs` hoặc `GET /search`.
- Update entry gọi `PUT /logs/{id}`.
- Delete entry gọi `DELETE /logs/{id}` nếu UI có hành động xóa.

### Payload mẫu: POST /logs

```json
{
  "title": "Ôn lại Cognito JWT Authorizer",
  "date": "2026-07-19",
  "category": "AWS",
  "tags": ["cognito", "jwt", "api-gateway"],
  "content": "Hôm nay test đăng nhập và gọi API có token.",
  "commands": "",
  "errors": "",
  "solutions": "",
  "mood": 4,
  "difficulty": 3
}
```

### Response mẫu

```json
{
  "id": "entry_123",
  "title": "Ôn lại Cognito JWT Authorizer",
  "created_at": "2026-07-19T10:00:00.000Z"
}
```

## 6. Thêm Upload Ảnh Journal Qua S3 Presigned URL

### Mục tiêu

Không upload ảnh qua Lambda body. Lambda API chỉ sinh presigned URL, frontend upload trực tiếp lên S3.

### Tạo S3 bucket

Tên đề xuất:

```text
learnflow-journal-images
```

Cấu hình:

- Block all public access: bật.
- CORS cho local frontend:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedOrigins": ["http://localhost:5173"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### Route cần thêm

```text
POST /logs/{id}/images/presigned-url
```

### Request mẫu

```json
{
  "file_name": "diagram.png",
  "content_type": "image/png",
  "size": 524288
}
```

### Lambda API cần làm

1. Xác thực user từ JWT.
2. Kiểm tra journal entry thuộc user hiện tại.
3. Validate content type: chỉ cho `image/png`, `image/jpeg`, `image/webp`.
4. Validate size, ví dụ tối đa 5MB.
5. Tạo object key:

```text
users/{userId}/journal/{entryId}/{imageId}.png
```

6. Sinh presigned URL TTL 5-15 phút.
7. Trả URL về frontend.

### Response mẫu

```json
{
  "upload_url": "https://...",
  "image_key": "users/u_123/journal/entry_123/img_456.png",
  "expires_in": 900
}
```

### Frontend flow

1. User chọn ảnh.
2. Frontend gọi `POST /logs/{id}/images/presigned-url`.
3. Frontend `PUT` file trực tiếp lên `upload_url`.
4. Frontend lưu `image_key` vào state hoặc gọi API cập nhật metadata ảnh cho journal.

## 7. Thêm SQS Cho AI Report

### Mục tiêu

AI report chạy bất đồng bộ để frontend không phải chờ Bedrock trong request tạo report.

### Tạo queues

```text
ai-report-jobs
ai-report-dlq
```

Cấu hình:

- `ai-report-jobs` gắn DLQ `ai-report-dlq`.
- `maxReceiveCount`: 3 hoặc 5.
- Visibility timeout lớn hơn timeout Lambda AI Worker.

### Route cần nối

```text
POST /ai/reports
GET /ai/reports
GET /ai/reports/{id}
```

### POST /ai/reports flow

1. Lambda API validate `type`, `start_date`, `end_date`.
2. Ghi report item vào DynamoDB với `status = "pending"`.
3. Gửi message vào `ai-report-jobs`.
4. Trả ngay `{ "report_id": "...", "status": "pending" }`.

### Message mẫu

```json
{
  "reportId": "rep_123",
  "userId": "u_123",
  "type": "weekly",
  "startDate": "2026-07-13",
  "endDate": "2026-07-19"
}
```

## 8. Thêm SQS Cho Quiz Generation

### Mục tiêu

Quiz generation cũng chạy bất đồng bộ, cùng pattern với AI report.

### Tạo queues

```text
quiz-jobs
quiz-dlq
```

### Route cần nối

```text
POST /quiz
GET /quiz/{id}
POST /quiz/{id}/attempts
```

### POST /quiz flow

1. Lambda API validate `source_type`, `topic`, `date_range`, `question_count`, `difficulty`.
2. Chuẩn hóa difficulty về `easy`, `medium`, `hard`.
3. Ghi quiz item vào DynamoDB với `status = "pending"`.
4. Gửi message vào `quiz-jobs`.
5. Trả ngay `{ "quiz_id": "...", "status": "pending" }`.

### POST /quiz/{id}/attempts flow

1. Lambda API đọc quiz từ DynamoDB.
2. Kiểm tra quiz thuộc user hiện tại.
3. Chấm điểm bằng `answer_index`.
4. Ghi attempt vào `LearnFlowQuizAttempts`.
5. Trả score và explanations.

## 9. Tạo Lambda AI Worker Và Kết Nối Bedrock

### Mục tiêu

Lambda AI Worker nhận job từ SQS, gọi Bedrock, validate output, rồi cập nhật DynamoDB.

### Biến môi trường Worker

```bash
AWS_REGION=ap-southeast-1
JOURNAL_TABLE=LearnFlowJournalLogs
AI_REPORT_TABLE=LearnFlowAiReports
QUIZ_TABLE=LearnFlowQuizzes
BEDROCK_MODEL_ID=<model-id>
```

### IAM role cho Worker

```text
logs:CreateLogGroup
logs:CreateLogStream
logs:PutLogEvents

sqs:ReceiveMessage
sqs:DeleteMessage
sqs:GetQueueAttributes

dynamodb:GetItem
dynamodb:Query
dynamodb:UpdateItem

bedrock:InvokeModel
```

### AI report worker logic

1. Nhận message từ `ai-report-jobs`.
2. Kiểm tra report hiện tại trong DynamoDB.
3. Nếu đã `completed`, bỏ qua để đảm bảo idempotency.
4. Query journal logs theo user và date range.
5. Build prompt yêu cầu JSON strict:

```json
{
  "summary": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommendations": ["string"]
}
```

6. Gọi Bedrock.
7. Validate JSON output.
8. Cập nhật report thành `completed` hoặc `failed`.

### Quiz worker logic

1. Nhận message từ `quiz-jobs`.
2. Kiểm tra quiz hiện tại trong DynamoDB.
3. Query journal logs theo topic/date range.
4. Build prompt yêu cầu JSON strict:

```json
{
  "questions": [
    {
      "topic": "string",
      "prompt": "string",
      "options": ["A", "B", "C", "D"],
      "answer_index": 0,
      "explanation": "string"
    }
  ]
}
```

5. Validate đủ 4 options và `answer_index` hợp lệ.
6. Cập nhật quiz thành `completed` hoặc `failed`.

## 10. Kết Nối AI Coach Và Quiz Với Frontend

### AI Coach

Frontend `/coach` cần flow:

1. User bấm tạo report.
2. Gọi `POST /ai/reports`.
3. Nhận `report_id`.
4. Hiển thị trạng thái pending.
5. Polling `GET /ai/reports/{id}` mỗi 2-5 giây.
6. Khi `completed`, render summary/recommendations.
7. Khi `failed`, hiển thị lỗi và nút thử lại nếu backend cho phép.

### Quiz

Frontend `/quiz` cần flow:

1. User chọn source/topic/difficulty.
2. Gọi `POST /quiz`.
3. Nhận `quiz_id`.
4. Hiển thị màn hình đang tạo quiz.
5. Polling `GET /quiz/{id}`.
6. Khi `completed`, chuyển sang màn hình làm bài.
7. Submit qua `POST /quiz/{id}/attempts`.

## 11. Search Và Analytics

### Search MVP

Route:

```text
GET /search?q=&topic=&tags=&from=&to=
```

Lambda API nên:

1. Scope theo `userId`.
2. Query DynamoDB bằng `userId` và date/topic GSI nếu có.
3. Filter keyword/tags trong Lambda cho MVP.
4. Trả result list có snippet.

Không cần OpenSearch ngay nếu dữ liệu còn nhỏ.

### Analytics MVP

Route:

```text
GET /analytics/summary
```

Lambda API tổng hợp:

- Số entry trong tuần.
- Tổng phút học.
- Streak.
- Accuracy từ quiz attempts.
- Topic distribution.
- Weak areas.

Frontend cần loading/empty/error states vì analytics có thể rỗng khi user mới.

## 12. Thứ Tự Test End-To-End Đề Xuất

Làm theo thứ tự này để dễ debug:

1. Test Cognito login và lấy access token.
2. Test `GET /health` không cần auth hoặc cần auth tùy bạn chọn.
3. Test `GET /me` có auth.
4. Test journal CRUD với DynamoDB.
5. Nối frontend New Entry và Entry Detail với API thật.
6. Test presigned URL upload ảnh lên S3.
7. Test `POST /ai/reports` tạo pending job.
8. Test SQS trigger Lambda AI Worker.
9. Test Bedrock trả report và cập nhật DynamoDB.
10. Nối `/coach` frontend với polling thật.
11. Test `POST /quiz` tạo pending quiz.
12. Test quiz worker sinh questions.
13. Nối `/quiz` frontend với polling và submit attempt.
14. Test `/search`.
15. Test `/analytics`.

## 13. Checklist Trước Khi Gọi Là “Frontend Test Được”

- Frontend có `VITE_API_BASE_URL`.
- API client attach Cognito JWT.
- API Gateway CORS cho `http://localhost:5173`.
- API Gateway Cognito Authorizer validate đúng access token.
- Lambda API lấy user từ claims, không lấy từ body.
- DynamoDB tables đã tạo và Lambda có quyền đúng.
- Journal CRUD chạy từ frontend tới DynamoDB.
- S3 bucket không public và upload qua presigned URL chạy được.
- SQS queues và DLQ đã tạo.
- Lambda AI Worker trigger được từ SQS.
- Bedrock model đã enable trong region.
- AI report và quiz cập nhật kết quả vào DynamoDB.
- Frontend xử lý `pending`, `completed`, `failed`.
- CloudWatch Logs đủ để debug request id, route, user id, status, latency.
- AWS Budgets và CloudWatch Alarms đã bật để tránh vượt chi phí.

## 14. Cost Guardrails Bắt Buộc

- AWS Budgets:
  - Tạo monthly budget.
  - Alert ở 50%, 80%, 100%.
- API Gateway:
  - Bật throttling theo stage.
- Lambda:
  - Đặt timeout hợp lý.
  - Đặt reserved concurrency cho worker AI nếu cần.
- DynamoDB:
  - Dùng on-demand cho MVP.
  - Tránh scan toàn bảng.
- SQS:
  - Bật DLQ.
  - Alarm khi DLQ > 0.
- Bedrock:
  - Giới hạn date range report.
  - Giới hạn `question_count`.
  - Cắt bớt journal content quá dài.
  - Không log prompt đầy đủ nếu có dữ liệu riêng tư.
- S3:
  - Giới hạn file size.
  - Chỉ cho image content types.
  - Presigned URL TTL ngắn.

## 15. Milestone Triển Khai Gọn

### Milestone 1: API nền

- API Gateway.
- Cognito Authorizer.
- Lambda API.
- `GET /health`.
- `GET /me`.

### Milestone 2: Journal thật

- DynamoDB journal table.
- `POST /logs`.
- `GET /logs`.
- `GET /logs/{id}`.
- Frontend New Entry/Entry Detail gọi API thật.

### Milestone 3: Ảnh journal

- S3 Journal Images.
- Presigned URL endpoint.
- Frontend upload ảnh trực tiếp lên S3.

### Milestone 4: AI report

- SQS ai-report queue + DLQ.
- Lambda AI Worker.
- Bedrock invoke.
- `/coach` polling thật.

### Milestone 5: Quiz

- SQS quiz queue + DLQ.
- Worker sinh quiz.
- Submit attempt.
- `/quiz` flow thật.

### Milestone 6: Search + Analytics

- `GET /search`.
- `GET /analytics/summary`.
- Frontend dashboard/search/analytics dùng API thật.
