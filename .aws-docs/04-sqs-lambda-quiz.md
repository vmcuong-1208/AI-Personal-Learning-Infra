# SQS + Lambda Quiz Generation trong kiến trúc Serverless

## Mục tiêu

`POST /quiz` tạo quiz job bất đồng bộ thay vì sinh câu hỏi ngay trong frontend. Lambda API ghi quiz pending vào DynamoDB, gửi job vào SQS, Lambda AI Worker gọi Bedrock và cập nhật questions vào DynamoDB.

## Luồng tổng quan

1. Frontend gọi `POST /quiz` qua API Gateway.
2. API Gateway xác thực Cognito JWT.
3. Lambda API validate input và lấy `userId` từ JWT claims.
4. Lambda API tạo quiz item trong `Quizzes` với `status = 'pending'`.
5. Lambda API gửi message vào `quiz-jobs`.
6. Frontend polling `GET /quiz/:id`.
7. SQS trigger Lambda AI Worker.
8. Worker đọc journal logs từ DynamoDB, gọi Bedrock để tạo câu hỏi.
9. Worker validate questions và cập nhật quiz thành `completed` hoặc `failed`.
10. Frontend tải quiz hoàn tất và cho user làm bài.

## SQS queues

- Main queue: `quiz-jobs`
- Dead-letter queue: `quiz-dlq`
- Redrive policy: chuyển sang DLQ sau 3-5 lần retry.
- CloudWatch alarm khi queue age hoặc DLQ count vượt ngưỡng.

Message từ Lambda API:

```json
{
  "quizId": "qz_123",
  "userId": "u_456",
  "sourceType": "weekly",
  "startDate": "2026-06-24",
  "endDate": "2026-06-30",
  "sourceTopic": "networking",
  "questionCount": 5,
  "difficulty": "medium"
}
```

## Lambda API: POST /quiz

1. Validate `sourceType`, `startDate`, `endDate`, `sourceTopic`, `questionCount`, `difficulty`.
2. Chuẩn hóa `difficulty` thành lowercase: `easy`, `medium`, `hard`.
3. Giới hạn `questionCount` để kiểm soát chi phí.
4. Tạo item trong `LearnFlowQuizzes`:
   - `status = 'pending'`
   - `sourceType`
   - `sourceTopic`
   - `startDate`
   - `endDate`
   - `questionCount`
   - `difficulty`
   - `createdAt`
5. Send message vào `quiz-jobs`.
6. Trả ngay:

```json
{
  "quiz_id": "qz_123",
  "status": "pending"
}
```

## Lambda AI Worker

1. Nhận SQS event.
2. Kiểm tra idempotency theo `quizId`.
3. Nếu quiz đã `completed`, bỏ qua message trùng.
4. Query `LearnFlowJournalLogs` theo source:
   - weekly/monthly dùng `startDate`, `endDate`.
   - topic dùng `sourceTopic`.
5. Build prompt strict JSON cho Bedrock.
6. Validate output từng câu hỏi:
   - `topic`
   - `prompt`
   - `options` gồm 4 lựa chọn
   - `answer_index`
   - `explanation`
7. Ghi questions vào `Quizzes` hoặc bảng questions riêng nếu tách về sau.
8. Update `status = 'completed'` và `completedAt`.
9. Nếu lỗi, update `status = 'failed'` và `errorMessage`.

## Attempts

`POST /quiz/:id/attempts` là request đồng bộ qua Lambda API, không cần Bedrock:

1. API Gateway xác thực JWT.
2. Lambda API đọc quiz từ DynamoDB.
3. Verify quiz thuộc `userId` hiện tại.
4. Tính score bằng `answer_index`.
5. Ghi attempt vào `LearnFlowQuizAttempts`.
6. Trả score, wrong answers, explanations.

## API read model

`GET /quiz/:id` nên trả:

```json
{
  "id": "qz_123",
  "status": "completed",
  "source_type": "weekly",
  "difficulty": "medium",
  "questions": []
}
```

Nếu `status = 'pending'`, `questions` có thể rỗng và frontend hiển thị trạng thái đang tạo.

## FRONTEND REVIEW CHECKLIST

- `/quiz` cần màn hình pending generation trước khi làm bài.
- UI không lấy câu hỏi từ local `questionBank` trong production path.
- Map difficulty frontend sang `easy`, `medium`, `hard` ở API client.
- UI xử lý `failed` state và cho phép tạo quiz lại nếu cần.
- Submit attempt dùng `POST /quiz/:id/attempts`, không gọi Bedrock.
