# Kiến Trúc Serverless LearnFlow AI Dashboard

## 1. Tóm Tắt Chuyển Đổi

LearnFlow AI Dashboard được chuyển từ mô hình truyền thống `CloudFront -> ALB -> EC2 Backend -> RDS PostgreSQL` sang mô hình serverless tối ưu chi phí:

- User truy cập frontend qua CloudFront và AWS WAF.
- API đi qua Amazon API Gateway, dùng Cognito User Pool làm JWT Authorizer.
- Lambda API xử lý các request đồng bộ như journal CRUD, search, analytics, tạo presigned URL, tạo AI report job, tạo quiz job, và nộp quiz attempt.
- DynamoDB thay thế RDS PostgreSQL để lưu dữ liệu ứng dụng.
- S3 Journal Images lưu ảnh người dùng tải lên bằng presigned URL.
- SQS tách các tác vụ AI report và quiz generation khỏi request đồng bộ.
- Lambda AI Worker gọi Amazon Bedrock, sau đó cập nhật kết quả vào DynamoDB.
- CloudWatch, SNS, AWS Budgets, IAM roles/policies đảm bảo monitoring, cảnh báo và kiểm soát chi phí.

Mục tiêu của bản kiến trúc này là giữ nguyên nghiệp vụ LearnFlow, nhưng loại bỏ các thành phần phải duy trì liên tục như ALB, EC2, và RDS.

## 2. Component Mapping

### Client / Frontend

- React + TypeScript SPA được build thành static assets.
- S3 Static Website Bucket lưu bundle frontend.
- CloudFront phân phối frontend với cache policy phù hợp cho SPA.
- AWS WAF bảo vệ CloudFront trước request bất thường, bot cơ bản, và rate abuse.
- Frontend gọi API bằng `VITE_API_BASE_URL`, trỏ tới API Gateway stage/domain.
- Frontend dùng Cognito session để lấy access token và gắn vào header `Authorization: Bearer <accessToken>`.

### Entry & Security

- Amazon CloudFront + AWS WAF là lớp edge.
- Amazon Cognito User Pool quản lý đăng ký, đăng nhập, xác nhận email, quên mật khẩu, Google Hosted UI, và JWT.
- Amazon API Gateway thay thế ALB.
- API Gateway dùng Cognito JWT Authorizer để bảo vệ các route nghiệp vụ.
- IAM roles/policies giới hạn quyền:
  - Lambda API chỉ được đọc/ghi các bảng DynamoDB cần thiết.
  - Lambda API chỉ được tạo presigned URL cho bucket `S3 - Journal Images`.
  - Lambda API chỉ được gửi message vào SQS queues được chỉ định.
  - Lambda AI Worker chỉ được đọc message từ SQS, gọi Bedrock, ghi kết quả vào DynamoDB, và ghi logs.

### Compute / Application Tier

- Bỏ EC2 Backend API.
- Lambda API xử lý logic đồng bộ:
  - `GET /health`
  - `GET /me`
  - `GET /logs`
  - `POST /logs`
  - `GET /logs/:id`
  - `PUT /logs/:id`
  - `DELETE /logs/:id`
  - `POST /logs/:id/images/presigned-url`
  - `POST /ai/reports`
  - `GET /ai/reports`
  - `GET /ai/reports/:id`
  - `GET /search`
  - `POST /quiz`
  - `GET /quiz/:id`
  - `POST /quiz/:id/attempts`
  - `GET /analytics/summary`
- Lambda AI Worker xử lý async jobs:
  - AI report generation.
  - Quiz generation.
  - Cập nhật trạng thái `completed` hoặc `failed` vào DynamoDB.

### Data & Storage Tier

- Amazon DynamoDB thay thế RDS PostgreSQL.
- Có thể dùng single-table design để tối ưu query theo `user_id`, hoặc multi-table nếu muốn dễ học/dễ debug hơn trong giai đoạn đầu.
- Đề xuất multi-table cho MVP:
  - `LearnFlowUsers`
  - `LearnFlowJournalLogs`
  - `LearnFlowAiReports`
  - `LearnFlowQuizzes`
  - `LearnFlowQuizAttempts`
- GSI cần cân nhắc:
  - `userId-createdAt-index` cho list journal/report/quiz theo thời gian.
  - `userId-topic-index` cho search/filter theo topic.
  - `status-createdAt-index` cho worker hoặc admin/debug job state nếu cần.
- S3 bucket `learnflow-journal-images` lưu ảnh journal.
- Object key nên có dạng `users/{userId}/journal/{entryId}/{imageId}.{ext}` để tách dữ liệu theo user.

### Async & AI Tier

- SQS main queue nhận job từ Lambda API:
  - `ai-report-jobs`
  - `quiz-jobs`
- SQS DLQ nhận message lỗi sau số lần retry giới hạn:
  - `ai-report-dlq`
  - `quiz-dlq`
- Lambda AI Worker nhận SQS event, đọc dữ liệu từ DynamoDB, gọi Amazon Bedrock, validate JSON output, rồi ghi kết quả vào DynamoDB.
- CloudWatch Logs/Metrics theo dõi Lambda duration, errors, throttles, SQS age, DLQ count, Bedrock failures.
- SNS gửi cảnh báo khi vượt ngưỡng lỗi hoặc chi phí.
- AWS Budgets đặt trần chi phí để tránh vượt quá mức dự kiến.

## 3. Sơ Đồ Kiến Trúc Mermaid

```mermaid
flowchart LR
  user["User"] -->|1. HTTPS Request| edge["CloudFront + WAF"]
  edge -->|2. Fetch UI| spa["S3 SPA Static"]
  user -->|3. Sign-in / JWT| cognito["Amazon Cognito User Pool"]

  edge -->|4. API request + JWT| apigw["API Gateway"]
  cognito -->|JWT Authorizer| apigw
  apigw -->|5. Invoke| lambdaApi["Lambda API"]

  lambdaApi -->|6. CRUD| dynamodb["DynamoDB"]
  lambdaApi -->|Presigned URL| imageBucket["S3 Journal Images"]
  user -->|7. Image upload with presigned URL| imageBucket

  lambdaApi -->|8. Send AI/Quiz job| sqs["SQS Jobs"]
  sqs -. 9. Failed messages .-> dlq["SQS DLQ"]
  sqs -->|10. Trigger| aiWorker["Lambda AI Worker"]
  aiWorker -->|11. Prompt / Completion| bedrock["Amazon Bedrock"]
  aiWorker -->|12. Save AI summary / quiz| dynamodb

  lambdaApi --> cloudwatch["CloudWatch Logs / Metrics"]
  aiWorker -->|13. Logs / Metrics| cloudwatch
  sqs --> cloudwatch
  dlq --> cloudwatch
  cloudwatch --> sns["SNS Alerts"]
  budgets["AWS Budgets"] --> sns
  iam["IAM Roles & Policies"] -. least privilege .-> lambdaApi
  iam -. least privilege .-> aiWorker
```

## 4. Luồng Dữ Liệu Theo Serverless

### 4.1 Xác Thực Và Gọi API

1. User mở LearnFlow qua CloudFront.
2. CloudFront phục vụ SPA từ S3 Static bucket.
3. User đăng nhập qua Cognito bằng email/password hoặc Google Hosted UI.
4. Cognito trả JWT về frontend.
5. Frontend gọi API Gateway với header `Authorization: Bearer <accessToken>`.
6. API Gateway dùng Cognito Authorizer để validate JWT.
7. Nếu token hợp lệ, API Gateway invoke Lambda API.
8. Lambda API lấy `user_id` từ JWT claims, không nhận `user_id` từ request body.
9. Lambda API xử lý request và đọc/ghi DynamoDB theo partition của user hiện tại.

### 4.2 Journal CRUD

1. User tạo hoặc chỉnh sửa journal entry trên `/journal/new` hoặc `/journal/:entryId`.
2. Frontend gửi `POST /logs`, `PUT /logs/:id`, hoặc `DELETE /logs/:id` tới API Gateway.
3. API Gateway xác thực Cognito JWT.
4. Lambda API validate payload như title, date, category, tags, content, commands, errors, mood, difficulty.
5. Lambda API ghi dữ liệu vào `LearnFlowJournalLogs` trong DynamoDB.
6. DynamoDB lưu item theo `userId` và `entryId`, kèm `createdAt`/`updatedAt`.
7. Lambda API trả kết quả về frontend.
8. Frontend cập nhật UI và điều hướng tới entry detail nếu cần.

### 4.3 Upload Ảnh Journal Bằng Presigned URL

1. User chọn ảnh trong journal editor.
2. Frontend gửi request tới `POST /logs/:id/images/presigned-url`, kèm metadata như file name, content type, và size.
3. API Gateway xác thực JWT bằng Cognito Authorizer.
4. Lambda API kiểm tra quyền sở hữu journal entry trong DynamoDB.
5. Lambda API validate content type, size limit, và tạo object key dạng `users/{userId}/journal/{entryId}/{imageId}.{ext}`.
6. Lambda API sinh presigned URL cho S3 Journal Images.
7. Lambda API trả presigned URL về frontend.
8. Frontend upload file trực tiếp lên S3 bằng presigned URL.
9. Sau khi upload thành công, frontend gọi API cập nhật journal entry với image metadata nếu cần.
10. Lambda API lưu image metadata vào DynamoDB, ví dụ `imageKey`, `fileName`, `contentType`, `uploadedAt`.

### 4.4 AI Report Async Pipeline

1. User mở `/coach` và yêu cầu tạo AI report theo khoảng thời gian.
2. Frontend gửi `POST /ai/reports`.
3. API Gateway xác thực JWT bằng Cognito Authorizer.
4. Lambda API validate type, start date, end date, và giới hạn khoảng thời gian để kiểm soát chi phí.
5. Lambda API tạo item trong `LearnFlowAiReports` với `status = 'pending'`.
6. Lambda API gửi message vào `ai-report-jobs` gồm `reportId`, `userId`, `type`, `startDate`, `endDate`.
7. Lambda API trả ngay `{ report_id, status: "pending" }`.
8. Frontend hiển thị pending/processing và polling `GET /ai/reports/:id`.
9. SQS trigger Lambda AI Worker.
10. Lambda AI Worker đọc journal logs liên quan từ DynamoDB.
11. Lambda AI Worker build prompt strict JSON và gọi Amazon Bedrock.
12. Lambda AI Worker validate output gồm summary, strengths, weaknesses, recommendations.
13. Lambda AI Worker cập nhật report trong DynamoDB thành `completed`.
14. Nếu lỗi, worker cập nhật `status = 'failed'`, lưu `error_message`, và message có thể đi vào DLQ sau số lần retry đã cấu hình.

### 4.5 Quiz Generation Async Pipeline

1. User mở `/quiz`, chọn source type, topic/date range, question count, và difficulty.
2. Frontend gửi `POST /quiz`.
3. API Gateway xác thực JWT.
4. Lambda API validate input, giới hạn `question_count`, và chuẩn hóa difficulty như `easy`, `medium`, `hard`.
5. Lambda API tạo quiz item trong DynamoDB với `status = 'pending'`.
6. Lambda API gửi message vào `quiz-jobs` gồm `quizId`, `userId`, `sourceType`, `sourceTopic`, `dateRange`, `questionCount`, `difficulty`.
7. Lambda API trả ngay `{ quiz_id, status: "pending" }`.
8. Frontend hiển thị trạng thái đang tạo quiz và polling `GET /quiz/:id`.
9. SQS trigger Lambda AI Worker.
10. Lambda AI Worker đọc journal logs phù hợp từ DynamoDB.
11. Lambda AI Worker gọi Bedrock để sinh câu hỏi trắc nghiệm dạng strict JSON.
12. Lambda AI Worker validate mỗi câu hỏi có prompt, 4 options, `answer_index`, explanation, topic.
13. Lambda AI Worker ghi questions vào item quiz hoặc bảng questions liên quan trong DynamoDB.
14. Lambda AI Worker cập nhật quiz thành `completed`; nếu lỗi thì cập nhật `failed`.
15. Frontend tải quiz hoàn tất và chuyển sang màn hình làm bài.

### 4.6 Nộp Bài Quiz

1. User hoàn thành quiz và gửi đáp án qua `POST /quiz/:id/attempts`.
2. API Gateway xác thực JWT.
3. Lambda API đọc quiz và questions từ DynamoDB.
4. Lambda API kiểm tra quiz thuộc user hiện tại.
5. Lambda API chấm điểm dựa trên `answer_index`.
6. Lambda API ghi attempt vào `LearnFlowQuizAttempts`.
7. Lambda API trả score, total questions, wrong answers, và explanations.
8. Frontend hiển thị kết quả và cập nhật session stats.

### 4.7 Search Và Analytics

1. User mở `/search` hoặc `/analytics`.
2. Frontend gửi `GET /search` hoặc `GET /analytics/summary`.
3. API Gateway xác thực JWT.
4. Lambda API query DynamoDB theo `userId` và các GSI phù hợp.
5. Với search, Lambda API lọc theo query, topic, tags, và date range. Nếu cần full-text search nâng cao, có thể bổ sung OpenSearch sau, nhưng không cần cho MVP serverless tối giản.
6. Với analytics, Lambda API tổng hợp từ journal logs, quiz attempts, và report metadata.
7. Lambda API trả kết quả chuẩn hóa cho frontend render list, metric cards, và charts.

## 5. DynamoDB Data Model Gợi Ý

### Multi-Table MVP

- `LearnFlowUsers`
  - PK: `userId`
  - Thuộc tính: `email`, `name`, `provider`, `cognitoSub`, `createdAt`, `updatedAt`
- `LearnFlowJournalLogs`
  - PK: `userId`
  - SK: `entryId`
  - GSI: `userId-createdAt-index`, `userId-topic-index`
  - Thuộc tính: `title`, `date`, `category`, `tags`, `content`, `commands`, `errors`, `solutions`, `mood`, `difficulty`, `imageKeys`, `createdAt`, `updatedAt`
- `LearnFlowAiReports`
  - PK: `userId`
  - SK: `reportId`
  - GSI: `userId-createdAt-index`
  - Thuộc tính: `type`, `startDate`, `endDate`, `status`, `summary`, `strengths`, `weaknesses`, `recommendations`, `errorMessage`, `completedAt`, `createdAt`
- `LearnFlowQuizzes`
  - PK: `userId`
  - SK: `quizId`
  - GSI: `userId-createdAt-index`
  - Thuộc tính: `sourceType`, `sourceTopic`, `startDate`, `endDate`, `questionCount`, `difficulty`, `status`, `questions`, `errorMessage`, `createdAt`
- `LearnFlowQuizAttempts`
  - PK: `userId`
  - SK: `attemptId`
  - GSI: `quizId-submittedAt-index`
  - Thuộc tính: `quizId`, `score`, `totalQuestions`, `answers`, `startedAt`, `submittedAt`

### Single-Table Sau MVP

Khi cần tối ưu vận hành, có thể gom sang một bảng `LearnFlowTable`:

- PK: `USER#{userId}`
- SK:
  - `PROFILE`
  - `LOG#{createdAt}#{entryId}`
  - `REPORT#{createdAt}#{reportId}`
  - `QUIZ#{createdAt}#{quizId}`
  - `ATTEMPT#{submittedAt}#{attemptId}`
- GSI dùng cho lookup theo entity ID hoặc topic nếu cần.

## 6. Frontend Alignment Check

- `.env.example` cần đổi từ tư duy ALB sang API Gateway:
  - `VITE_API_BASE_URL=https://<api-id>.execute-api.<region>.amazonaws.com/<stage>`
- Auth hiện dùng Cognito trong `src/features/auth/cognitoAuth.ts`; phần này phù hợp với API Gateway Cognito Authorizer.
- Cần tạo API client dùng chung để gắn Cognito token vào mọi request nghiệp vụ.
- `/journal/new` cần hỗ trợ luồng upload ảnh 2 bước: xin presigned URL, upload trực tiếp lên S3, rồi lưu metadata vào journal.
- `/coach` đã có trạng thái async như pending/processing/completed/failed; cần thay mock timer bằng polling `GET /ai/reports/:id`.
- `/quiz` cần trạng thái pending generation trước khi vào màn hình làm bài.
- `/search` nên tránh giả định SQL/full-text search; MVP có thể lọc DynamoDB theo user/date/topic và filter thêm ở Lambda.
- `/analytics` nên chấp nhận kết quả tổng hợp từ DynamoDB, có loading/empty/error states rõ ràng.
- Các enum như difficulty, status, source type, category nên được chuẩn hóa ở API client để không lệch với DynamoDB item schema.

## 7. Cost Guardrails

- AWS Budgets:
  - Tạo monthly budget nhỏ cho tài khoản học tập.
  - Bật email/SNS alert ở các ngưỡng 50%, 80%, 100%.
- API Gateway:
  - Bật throttling theo route/stage.
  - Giới hạn burst và steady-state request rate để tránh abuse.
- Lambda:
  - Đặt reserved concurrency cho Lambda API và Lambda AI Worker.
  - Đặt timeout ngắn cho Lambda API, timeout dài hơn cho AI Worker nhưng vẫn có giới hạn.
  - Log payload tối thiểu, không log raw JWT, password, hoặc prompt đầy đủ nếu chứa dữ liệu nhạy cảm.
- DynamoDB:
  - Dùng on-demand capacity cho MVP để tránh cấu hình sai.
  - Theo dõi consumed read/write capacity và hot partition.
- SQS:
  - Cấu hình DLQ và `maxReceiveCount` hợp lý.
  - Alarm khi DLQ có message hoặc queue age vượt ngưỡng.
- Bedrock:
  - Giới hạn `question_count`.
  - Giới hạn date range khi tạo report/quiz.
  - Cắt bớt journal content quá dài trước khi build prompt.
  - Validate JSON output để tránh retry vô hạn.
  - Theo dõi số request, lỗi, latency, và chi phí model.
- S3 Journal Images:
  - Giới hạn file size và content type trước khi sinh presigned URL.
  - Bật lifecycle policy nếu ảnh chỉ phục vụ học tập ngắn hạn.
  - Không public bucket; chỉ upload bằng presigned URL và đọc qua cơ chế có kiểm soát.

## 8. Những Thành Phần Bị Loại Bỏ So Với Kiến Trúc Cũ

- Loại bỏ Application Load Balancer.
- Loại bỏ EC2 Backend API chạy liên tục.
- Loại bỏ RDS PostgreSQL.
- Loại bỏ VPC/private subnet bắt buộc cho backend API trong MVP serverless.
- Giảm nhu cầu quản trị server, patch OS, connection pool database, và scaling thủ công.

## 9. Ghi Chú Triển Khai

- Ưu tiên triển khai API Gateway HTTP API nếu chỉ cần JWT Authorizer và route đơn giản; dùng REST API nếu cần tính năng nâng cao hơn.
- Lambda API có thể tách theo domain sau khi MVP ổn định:
  - `journal-api`
  - `report-api`
  - `quiz-api`
  - `analytics-api`
- Với MVP nhỏ, một Lambda API dạng router vẫn chấp nhận được nếu code được tổ chức theo module.
- Dùng idempotency key cho các request tạo AI report hoặc quiz để tránh user bấm nhiều lần tạo nhiều job trùng.
- Worker cần idempotent theo `reportId` hoặc `quizId`; nếu item đã `completed` thì bỏ qua message trùng.
- CloudWatch dashboard nên gom các chỉ số chính: API errors, Lambda errors/duration, SQS visible messages, DLQ count, Bedrock failures, DynamoDB throttles, và budget alerts.
