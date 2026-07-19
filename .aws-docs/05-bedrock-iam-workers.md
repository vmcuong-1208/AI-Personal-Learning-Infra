# Bedrock + IAM cho Serverless Workers

## Mục tiêu

Cấp quyền tối thiểu cho Lambda API và Lambda AI Worker trong kiến trúc serverless. Tài liệu này thay thế hướng EC2/Lambda/RDS cũ bằng mô hình API Gateway + Lambda + DynamoDB + S3 Presigned URL + SQS + Bedrock.

## IAM roles

### Lambda API execution role

Quyền cần có:

- CloudWatch Logs:
  - `logs:CreateLogGroup`
  - `logs:CreateLogStream`
  - `logs:PutLogEvents`
- DynamoDB:
  - `dynamodb:GetItem`
  - `dynamodb:PutItem`
  - `dynamodb:UpdateItem`
  - `dynamodb:DeleteItem`
  - `dynamodb:Query`
- SQS:
  - `sqs:SendMessage` tới `ai-report-jobs` và `quiz-jobs`
- S3 Journal Images:
  - `s3:PutObject` cho key prefix `users/*/journal/*`
  - Nếu cần đọc metadata/object: `s3:GetObject` giới hạn cùng prefix
- Không cấp quyền Bedrock trực tiếp cho Lambda API nếu API chỉ tạo job async.

### Lambda AI Worker execution role

Quyền cần có:

- CloudWatch Logs:
  - `logs:CreateLogGroup`
  - `logs:CreateLogStream`
  - `logs:PutLogEvents`
- SQS:
  - `sqs:ReceiveMessage`
  - `sqs:DeleteMessage`
  - `sqs:GetQueueAttributes`
- DynamoDB:
  - `dynamodb:GetItem`
  - `dynamodb:UpdateItem`
  - `dynamodb:Query`
- Bedrock:
  - `bedrock:InvokeModel`
- Không cấp quyền ghi S3 nếu worker không xử lý ảnh.

## Cognito Authorizer

- API Gateway dùng Cognito User Pool làm JWT Authorizer.
- Lambda API không tự tin tưởng `userId` từ body.
- Lambda API lấy `sub`, `email`, hoặc custom claims từ request context do API Gateway truyền vào.
- Mọi DynamoDB key phải được scope theo `userId` đã xác thực.

## Bedrock config

- Enable Bedrock trong region triển khai.
- Chọn model phù hợp với tiếng Việt và JSON output ổn định.
- Prompt yêu cầu JSON strict:
  - AI report: `summary`, `strengths`, `weaknesses`, `recommendations`.
  - Quiz: list questions với 4 options, `answer_index`, `explanation`, `topic`.
- Worker validate JSON trước khi ghi DynamoDB.
- Không retry vô hạn khi output sai schema; lưu failed state có `errorMessage`.

## S3 Presigned URL security

- Bucket `S3 - Journal Images` không public.
- Lambda API chỉ tạo presigned URL sau khi kiểm tra user sở hữu journal entry.
- Object key phải nằm trong prefix của user: `users/{userId}/journal/{entryId}/...`.
- Validate file size, content type, extension trước khi tạo URL.
- Presigned URL nên có TTL ngắn, ví dụ 5-15 phút.
- Có thể bật S3 lifecycle policy để dọn ảnh cũ nếu sản phẩm cho phép.

## Observability

Theo dõi các metric chính:

- API Gateway 4xx/5xx, latency, throttles.
- Lambda API errors, duration, throttles, concurrent executions.
- Lambda AI Worker errors, duration, throttles.
- SQS visible messages, oldest message age, DLQ message count.
- DynamoDB consumed capacity, throttles, user hot partition.
- Bedrock invoke failures, latency, số request.
- S3 4xx/5xx và object count nếu cần.

## Monitoring & cost guardrails

- CloudWatch Alarms:
  - DLQ > 0.
  - Lambda error rate cao.
  - API Gateway 5xx tăng bất thường.
  - SQS oldest message age vượt ngưỡng.
  - DynamoDB throttles > 0.
- SNS topic gửi cảnh báo qua email.
- AWS Budgets:
  - Monthly budget cho tài khoản học tập.
  - Alert ở 50%, 80%, 100%.
- Bedrock guardrails:
  - Giới hạn `questionCount`.
  - Giới hạn date range report/quiz.
  - Cắt bớt journal content quá dài.
  - Không log prompt đầy đủ nếu chứa dữ liệu cá nhân.

## FRONTEND REVIEW CHECKLIST

- Frontend phải gọi API Gateway domain, không gọi ALB/EC2 endpoint.
- API client phải attach Cognito token.
- UI có failed state cho AI report và quiz generation.
- Upload ảnh dùng presigned URL, không upload qua Lambda body.
- Không hard-code public S3 URL nếu bucket private; dùng metadata/key do backend trả về.
