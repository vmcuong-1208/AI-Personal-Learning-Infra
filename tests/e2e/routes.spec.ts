import { expect, test } from "@playwright/test";

const routes = [
  { path: "/", text: "Bảng điều khiển học tập" },
  { path: "/journal", text: "Danh sách nhật ký học" },
  { path: "/journal/new", text: "Ghi chép buổi học mới" },
  { path: "/journal/redis-streams", text: "Redis Streams cho hàng đợi học tập bền vững" },
  { path: "/coach", text: "Cùng phân tích ghi chú học tập" },
  { path: "/search", text: "Kết nối lại các ghi chú cũ" },
  { path: "/quiz", text: "Quiz kiến thức" },
  { path: "/analytics", text: "Tiến độ học tập" },
  { path: "/account/settings", text: "Cài đặt tài khoản" },
  { path: "/help", text: "Trung tâm trợ giúp" },
  { path: "/auth/register", text: "Đăng ký tài khoản" },
  { path: "/auth/login", text: "Đăng nhập" },
  { path: "/auth/forgot-password", text: "Quên mật khẩu" }
];

for (const route of routes) {
  test(`tải trang ${route.path}`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page.getByText(route.text).first()).toBeVisible();
  });
}

test("quiz có thể trả lời và chuyển câu", async ({ page }) => {
  await page.goto("/quiz");
  await page.getByRole("button", { name: /Consumer groups/ }).click();
  await expect(page.getByText("Đúng", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Câu tiếp theo/ }).click();
  await expect(page.getByText(/Probe nào/)).toBeVisible();
});

test("đăng nhập thường cập nhật trạng thái tài khoản trên Dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Đăng nhập/ })).toBeVisible();
  await page.goto("/auth/login");
  await page.getByRole("button", { name: /^Đăng nhập$/ }).click();
  await expect(page.getByText(/Đăng nhập thành công/)).toBeVisible();
  await expect(page.getByLabel(/Menu tài khoản của learner/)).toBeVisible();
  await page.getByLabel(/Menu tài khoản của learner/).click();
  await expect(page.getByRole("link", { name: /Cài đặt tài khoản/ })).toBeVisible();
});

test("quên mật khẩu xác thực email và hiện xác nhận", async ({ page }) => {
  await page.goto("/auth/forgot-password");
  await page.getByLabel("Email").fill("learner@example.com");
  await page.getByRole("button", { name: /Gửi liên kết đặt lại/ }).click();
  await expect(page.getByText("Đã yêu cầu liên kết đặt lại")).toBeVisible();
});

test("hamburger mobile mở và đóng sidebar overlay", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Chỉ kiểm tra overlay điều hướng ở viewport mobile.");

  await page.goto("/");
  await page.getByRole("button", { name: "Mở menu điều hướng" }).click();
  const mobileSidebar = page.getByRole("complementary", { name: "Điều hướng chính" });
  await expect(mobileSidebar).toBeVisible();
  await mobileSidebar.getByRole("link", { name: "Huấn luyện AI", exact: true }).click();
  await expect(mobileSidebar).toHaveCount(0);
  await expect(page.getByText("Cùng phân tích ghi chú học tập")).toBeVisible();
});

test("navbar tìm kiếm và thông báo hoạt động", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Tìm kiếm các khái niệm, ghi chú hoặc thông tin chi tiết từ AI").fill("redis");
  await expect(page.getByRole("listbox", { name: "Gợi ý tìm kiếm" })).toBeVisible();
  await expect(page.getByRole("option").first()).toContainText(/Redis|BullMQ/);
  await page.getByLabel("Mở thông báo").click();
  await expect(page.getByText("Nhắc nhở học tập")).toBeVisible();
});

test("journal lọc và lưu nhật ký học", async ({ page }) => {
  await page.goto("/journal");
  await page.getByRole("button", { name: "7 ngày trước" }).click();
  await expect(page.getByText(/nhật ký, sắp xếp mới nhất trước/)).toBeVisible();
  await page.getByRole("link", { name: "Ghi nhật ký mới" }).first().click();
  await page.getByLabel("Tiêu đề buổi học *").fill("Lab xử lý sự cố AWS VPC");
  await page.getByLabel("Nhật ký chi tiết & tài liệu tham khảo *").fill("Kiểm tra route table, IAM permission và kết nối NAT Gateway.");
  await page.getByRole("button", { name: "Lưu" }).first().click();
  await expect(page.getByText("Đã lưu buổi học thành công.")).toBeVisible();
  await expect(page.getByText("Lab xử lý sự cố AWS VPC")).toBeVisible();
});

test("trang danh sách journal ẩn sidebar desktop", async ({ page, isMobile }) => {
  test.skip(isMobile, "Chỉ kiểm tra hành vi sidebar desktop.");
  await page.goto("/journal");
  await expect(page.locator(".desktop-sidebar")).toBeHidden();
  await expect(page.locator(".app-navbar")).toBeVisible();
});
