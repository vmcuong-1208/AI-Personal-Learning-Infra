import { Camera, CreditCard, Languages, LockKeyhole, Mail, MonitorSmartphone, ShieldCheck, UserRound } from "lucide-react";
import { Button, Card, Chip, Input, PageHeader } from "../../components/ui";
import { useAuth } from "../auth/AuthContext";

export function AccountSettingsPage() {
  const auth = useAuth();
  const name = auth.user?.name ?? "Người học LearnFlow";
  const email = auth.user?.email ?? "learner@example.com";

  return (
    <>
      <PageHeader eyebrow="Tài khoản" title="Cài đặt tài khoản" description="Quản lý thông tin cá nhân, bảo mật, giao diện, thông báo và gói dịch vụ." />
      <div className="settings-grid">
        <Card className="settings-card">
          <div className="section-heading"><UserRound size={19} /><h2>Thông tin cá nhân</h2></div>
          <div className="settings-avatar-row">
            <span className="avatar large">{name.slice(0, 1).toUpperCase()}</span>
            <Button variant="ghost" icon={<Camera size={16} />}>Tải lên / đổi ảnh đại diện</Button>
          </div>
          <div className="meta-grid">
            <div className="form-field"><label>Tên hiển thị</label><Input defaultValue={name} /></div>
            <div className="form-field"><label>Email</label><Input type="email" defaultValue={email} /></div>
            <div className="form-field"><label>Số điện thoại</label><Input placeholder="+84 ..." /></div>
          </div>
        </Card>

        <Card className="settings-card">
          <div className="section-heading"><LockKeyhole size={19} /><h2>Bảo mật</h2></div>
          <div className="settings-list"><div><strong>Đổi mật khẩu</strong><p>Cập nhật mật khẩu định kỳ để bảo vệ tài khoản.</p></div><Button variant="secondary" size="sm">Đổi mật khẩu</Button></div>
          <div className="settings-list"><div><strong>Xác thực hai lớp (2FA)</strong><p>Tăng bảo mật bằng mã xác thực khi đăng nhập.</p></div><label className="toggle"><input type="checkbox" /> <span>Bật 2FA</span></label></div>
          <div className="settings-list"><div><strong>Thiết bị đăng nhập gần đây</strong><p>Windows Chrome, Thành phố Hồ Chí Minh, hôm nay.</p></div><Chip tone="success"><MonitorSmartphone size={14} /> Tin cậy</Chip></div>
        </Card>

        <Card className="settings-card">
          <div className="section-heading"><Languages size={19} /><h2>Tùy chọn giao diện</h2></div>
          <div className="meta-grid">
            <div className="form-field"><label>Giao diện</label><select className="input" defaultValue="light"><option value="light">Chế độ sáng</option><option value="dark">Chế độ tối</option></select></div>
            <div className="form-field"><label>Ngôn ngữ</label><select className="input" defaultValue="vi"><option value="vi">Tiếng Việt</option><option value="en">Tiếng Anh</option></select></div>
          </div>
        </Card>

        <Card className="settings-card">
          <div className="section-heading"><Mail size={19} /><h2>Thông báo</h2></div>
          <div className="settings-list"><span>Nhận thông báo qua email</span><label className="toggle"><input type="checkbox" defaultChecked /> <span>Email</span></label></div>
          <div className="settings-list"><span>Nhận thông báo trong ứng dụng</span><label className="toggle"><input type="checkbox" defaultChecked /> <span>Ứng dụng</span></label></div>
          <div className="page-actions"><Chip>Hệ thống</Chip><Chip tone="primary">Học tập</Chip><Chip>Khuyến mãi</Chip></div>
        </Card>

        <Card className="settings-card">
          <div className="section-heading"><CreditCard size={19} /><h2>Gói dịch vụ</h2></div>
          <div className="settings-list"><div><strong>Gói hiện tại: Learning OS miễn phí</strong><p>Lịch sử thanh toán sẽ hiển thị khi kết nối backend billing.</p></div><Button>Nâng cấp</Button></div>
          <Button variant="ghost">Hủy gói</Button>
        </Card>

        <Card className="settings-card">
          <div className="section-heading"><ShieldCheck size={19} /><h2>Ghi chú bảo mật</h2></div>
          <p>Các thay đổi ở trang này là giao diện MVP. Backend cần xác thực lại mật khẩu, ghi audit log và mã hóa dữ liệu nhạy cảm trước khi phát hành production.</p>
        </Card>
      </div>
    </>
  );
}
