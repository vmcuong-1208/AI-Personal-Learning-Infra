# DynamoDB Data Model thay thế RDS

## Mục tiêu

Kiến trúc serverless mới loại bỏ RDS PostgreSQL và thay bằng Amazon DynamoDB. File này giữ tên cũ để không làm gãy liên kết tài liệu, nhưng nội dung mới là hướng dẫn thiết kế DynamoDB cho LearnFlow.

## Thành phần bị loại bỏ

- Không dùng RDS PostgreSQL trong kiến trúc mới.
- Không cần connection pool, migration SQL, private DB subnet bắt buộc, hoặc EC2 backend duy trì kết nối DB.
- Không nhận `user_id` từ request body; identity luôn lấy từ Cognito JWT.

## Chiến lược bảng cho MVP

Để dễ học và dễ debug, MVP nên dùng multi-table design. Sau khi ổn định có thể gom về single-table nếu cần tối ưu chi phí/truy vấn.

### LearnFlowUsers

- PK: `userId`
- Thuộc tính: `email`, `name`, `provider`, `cognitoSub`, `createdAt`, `updatedAt`
- Mục đích: map Cognito user sang profile nội bộ.

### LearnFlowJournalLogs

- PK: `userId`
- SK: `entryId`
- GSI đề xuất:
  - `userId-createdAt-index`
  - `userId-topic-index`
- Thuộc tính: `title`, `date`, `category`, `tags`, `content`, `commands`, `errors`, `solutions`, `mood`, `difficulty`, `imageKeys`, `createdAt`, `updatedAt`
- Mục đích: lưu journal logs và metadata ảnh.

### LearnFlowAiReports

- PK: `userId`
- SK: `reportId`
- GSI đề xuất: `userId-createdAt-index`
- Thuộc tính: `type`, `startDate`, `endDate`, `status`, `summary`, `strengths`, `weaknesses`, `recommendations`, `errorMessage`, `completedAt`, `createdAt`
- Mục đích: lưu trạng thái và kết quả AI report.

### LearnFlowQuizzes

- PK: `userId`
- SK: `quizId`
- GSI đề xuất: `userId-createdAt-index`
- Thuộc tính: `sourceType`, `sourceTopic`, `startDate`, `endDate`, `questionCount`, `difficulty`, `status`, `questions`, `errorMessage`, `createdAt`, `completedAt`
- Mục đích: lưu quiz request, trạng thái generation, và questions.

### LearnFlowQuizAttempts

- PK: `userId`
- SK: `attemptId`
- GSI đề xuất: `quizId-submittedAt-index`
- Thuộc tính: `quizId`, `score`, `totalQuestions`, `answers`, `startedAt`, `submittedAt`
- Mục đích: lưu lịch sử làm bài và phục vụ analytics.

## Single-table design sau MVP

Có thể gom vào bảng `LearnFlowTable`:

- PK: `USER#{userId}`
- SK:
  - `PROFILE`
  - `LOG#{createdAt}#{entryId}`
  - `REPORT#{createdAt}#{reportId}`
  - `QUIZ#{createdAt}#{quizId}`
  - `ATTEMPT#{submittedAt}#{attemptId}`
- GSI cho lookup theo entity ID, topic, hoặc status nếu cần.

## Query patterns cần hỗ trợ

- List journal logs mới nhất của user.
- Lấy journal log theo `entryId`.
- Filter journal theo topic/date range/tags.
- List AI reports theo user và thời gian.
- Lấy AI report theo `reportId` để polling trạng thái.
- Lấy quiz theo `quizId` để polling hoặc làm bài.
- Lưu quiz attempt và tính analytics theo user.

## Lưu ý search

DynamoDB không phải full-text search engine. Với MVP, Lambda API có thể:

1. Query theo `userId` và date/topic qua GSI.
2. Filter thêm trong Lambda theo keyword/tags.
3. Giới hạn page size để tránh scan tốn chi phí.

Nếu sau này cần search mạnh hơn, bổ sung OpenSearch hoặc một index riêng, nhưng không thêm vào MVP serverless tối giản.

## Cost guardrails

- Dùng on-demand capacity cho MVP.
- Tránh scan toàn bảng.
- Bắt buộc mọi query scope theo `userId`.
- Bật CloudWatch alarm cho throttles và consumed capacity bất thường.
- Đặt TTL cho job/debug records nếu có dữ liệu tạm.

## FRONTEND REVIEW CHECKLIST

- Frontend không phụ thuộc vào auto-increment ID kiểu SQL.
- API client chấp nhận trạng thái async: `pending`, `processing`, `completed`, `failed`.
- Tags/topic/difficulty/status cần chuẩn hóa trước khi gửi API.
- Analytics UI cần xử lý trường hợp DynamoDB trả dữ liệu tổng hợp rỗng.
