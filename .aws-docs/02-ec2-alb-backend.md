# EC2 + ALB Backend Deployment

## Mục tiêu
Đưa backend API lên EC2 sau ALB theo mô hình 3 tier: Client -> ALB -> EC2 backend -> RDS.

## EC2 backend
- Đặt EC2 trong private subnet.
- Gắn IAM role tối thiểu:
  - CloudWatch Logs write.
  - SQS send message sau khi có queues.
  - RDS access nếu dùng IAM auth.
- Cài runtime backend, ví dụ Node.js/NestJS/Express.
- Clone repo/backend service, cài dependencies, build app.
- Cấu hình env:
  - `NODE_ENV=production`
  - `PORT=3000`
  - `DATABASE_URL`
  - `JWT_SECRET` hoặc Cognito issuer/audience config
  - `CORS_ORIGIN`
  - `AI_REPORT_QUEUE_URL`
  - `QUIZ_QUEUE_URL`

## ALB + Target Group
- ALB ở public subnets.
- ALB security group mở `80/443` từ Internet.
- EC2 security group chỉ cho inbound app port từ ALB security group.
- Target group trỏ tới EC2 backend port.
- Health check: `GET /health`.
- Bật HTTPS bằng ACM certificate khi có domain.

## CORS và base URL
- Backend phải allow origin của frontend dev/prod:
  - local: `http://localhost:5173`
  - prod: CloudFront/custom domain sau này.
- Frontend dùng biến:

```bash
VITE_API_BASE_URL=https://your-alb-dns-or-api-domain
```

## Test qua ALB
- `GET https://<alb-dns>/health`.
- `GET https://<alb-dns>/logs` với auth token hợp lệ.
- `POST https://<alb-dns>/logs`.
- `POST https://<alb-dns>/ai/reports`.
- `POST https://<alb-dns>/quiz`.

## Logging
- Ghi request id, user id, route, status code, latency.
- Không log raw tokens/passwords.
- Đẩy logs lên CloudWatch để debug EC2 và ALB 5xx.

### FRONTEND REVIEW CHECKLIST
Trước khi đưa backend qua ALB, hãy mở frontend hiện tại và rà:

- **Thừa/Thiếu chức năng:** Tất cả API calls phải đi qua API client chung, không hard-code `localhost`.
- **Sai sót dữ liệu:** Cần đảm bảo mọi request gửi `Authorization: Bearer <token>` nếu endpoint yêu cầu auth.
- **Điểm lệch hiện tại:** Repo chưa có `VITE_API_BASE_URL` và API client tập trung; thêm trước khi chuyển frontend khỏi mock.
