import { LifeBuoy, Mail, MessageCircleQuestion } from "lucide-react";
import { Button, Card, PageHeader } from "../../components/ui";

const faqs = [
  ["LearnFlow dùng AI như thế nào?", "Huấn luyện AI hiện dùng phản hồi mô phỏng để hỗ trợ luồng MVP. Bản production cần kết nối backend và model thật."],
  ["Tôi có thể khôi phục mật khẩu không?", "Trang quên mật khẩu đã có giao diện. Backend cần gửi liên kết đặt lại mật khẩu có thời hạn ngắn qua email."],
  ["Google OAuth đã dùng được chưa?", "Frontend đã tạo redirect và xác minh state; backend vẫn cần đổi authorization code và xác minh ID token."]
];

export function HelpCenterPage() {
  return (
    <>
      <PageHeader eyebrow="Hỗ trợ" title="Trung tâm trợ giúp" description="FAQ, tài liệu nhanh và kênh liên hệ hỗ trợ LearnFlow." />
      <div className="help-grid">
        <Card>
          <div className="section-heading"><MessageCircleQuestion size={19} /><h2>Câu hỏi thường gặp</h2></div>
          <div className="stack">
            {faqs.map(([question, answer]) => (
              <div className="help-item" key={question}>
                <strong>{question}</strong>
                <p>{answer}</p>
              </div>
            ))}
          </div>
        </Card>
        <aside className="stack">
          <Card>
            <div className="section-heading"><LifeBuoy size={19} /><h2>Liên hệ hỗ trợ</h2></div>
            <p>Gửi câu hỏi về tài khoản, dữ liệu học tập hoặc tích hợp AI.</p>
            <Button icon={<Mail size={16} />}>support@learnflow.local</Button>
          </Card>
        </aside>
      </div>
    </>
  );
}
