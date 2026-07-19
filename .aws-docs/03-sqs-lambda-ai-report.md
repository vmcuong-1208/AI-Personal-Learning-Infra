# SQS + Lambda AI Reports trong kiến trúc Serverless

## Mục tiêu

`POST /ai/reports` không xử lý AI đồng bộ. Lambda API tạo report job, gửi vào SQS, Lambda AI Worker gọi Bedrock và cập nhật kết quả vào DynamoDB.

## Luồng tổng quan

1. Frontend gọi `POST /ai/reports` qua API Gateway.
2. API Gateway xác thực Cognito JWT bằng Authorizer.
3. Lambda API validate request và lấy `userId` từ JWT claims.
4. Lambda API tạo item trong `LearnFlowAiReports` với `status = 'pending'`.
5. Lambda API gửi message vào `ai-report-jobs`.
6. Frontend nhận `{ report_id, status: "pending" }` và bắt đầu polling `GET /ai/reports/:id`.
7. SQS trigger Lambda AI Worker.
8. Worker đọc journal logs từ DynamoDB, gọi Bedrock, validate JSON output.
9. Worker cập nhật report trong DynamoDB thành `completed` hoặc `failed`.

## SQS queues

- Main queue: `ai-report-jobs`
- Dead-letter queue: `ai-report-dlq`
- Redrive policy: chuyển sang DLQ sau 3-5 lần retry.
- CloudWatch alarm khi DLQ có message hoặc queue age vượt ngưỡng.

Message từ Lambda API:

```json
{
  "reportId": "rep_123",
  "userId": "u_456",
  "type": "weekly",
  "startDate": "2026-06-24",
  "endDate": "2026-06-30",
  "requestedAt": "2026-07-17T10:00:00.000Z"
}
```

## Lambda API: POST /ai/reports

1. Validate `type`, `startDate`, `endDate`.
2. Giới hạn date range để kiểm soát chi phí Bedrock.
3. Lấy `userId` từ Cognito JWT.
4. Tạo `reportId` và ghi DynamoDB item:
   - `status = 'pending'`
   - `type`
   - `startDate`
   - `endDate`
   - `createdAt`
5. Send message vào `ai-report-jobs`.
6. Trả ngay:

```json
{
  "report_id": "rep_123",
  "status": "pending"
}
```

## Lambda AI Worker

1. Nhận SQS event.
2. Với mỗi message, kiểm tra idempotency theo `reportId`.
3. Nếu report đã `completed`, bỏ qua message trùng.
4. Update report sang `processing` nếu muốn frontend thấy tiến độ rõ hơn.
5. Query `LearnFlowJournalLogs` theo `userId` và date range.
6. Cắt bớt content quá dài trước khi build prompt.
7. Gọi Amazon Bedrock với yêu cầu JSON strict gồm `summary`, `strengths`, `weaknesses`, `recommendations`.
8. Validate JSON output.
9. Update `LearnFlowAiReports`:
   - `status = 'completed'`
   - `summary`
   - `strengths`
   - `weaknesses`
   - `recommendations`
   - `completedAt`
10. Nếu lỗi không retry được, update:
   - `status = 'failed'`
   - `errorMessage`

## Failure handling

- Worker phải idempotent theo `reportId`.
- Bedrock trả JSON sai thì lưu `failed`, không retry vô hạn.
- Lỗi transient có thể để SQS retry.
- DLQ cần alarm qua CloudWatch/SNS.
- Không log full prompt nếu chứa dữ liệu nhạy cảm.

## FRONTEND REVIEW CHECKLIST

- `/coach` dùng `POST /ai/reports` để tạo job.
- UI không kỳ vọng summary trả về ngay trong response tạo job.
- UI polling `GET /ai/reports/:id` hoặc refresh list report.
- UI có trạng thái `pending`, `processing`, `completed`, `failed`.
- Nút retry chỉ hiển thị nếu backend có endpoint retry hoặc cho phép tạo job mới.
