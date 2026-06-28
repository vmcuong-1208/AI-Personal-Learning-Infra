import { expect, test } from "@playwright/test";

const routes = [
  { path: "/", text: "Bảng điều khiển học tập" },
  { path: "/journal", text: "Danh sách nhật ký học" },
  { path: "/journal/new", text: "Ghi chép buổi học mới" },
  { path: "/journal/redis-streams", text: "Redis Streams cho hàng đợi học tập bền vững" },
  { path: "/coach", text: "AI Learning Coach" },
  { path: "/search", text: "Tìm kiếm nhật ký học" },
  { path: "/quiz", text: "Ôn tập / Quiz AI" },
  { path: "/analytics", text: "Tiến độ học tập" },
  { path: "/account/settings", text: "Cài đặt tài khoản" },
  { path: "/help", text: "Trung tâm trợ giúp" },
  { path: "/auth/register", text: "Đăng ký tài khoản" },
  { path: "/auth/login", text: "Đăng nhập" },
  { path: "/auth/forgot-password", text: "Quên mật khẩu" }
];

for (const route of routes) {
  test(`loads ${route.path}`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page.getByText(route.text).first()).toBeVisible();
  });
}

test("quiz flow works", async ({ page }) => {
  await page.goto("/quiz");
  await expect(page.getByText("Generate Quiz")).toBeVisible();
  await expect(page.getByText("API request")).toHaveCount(0);
  await page.getByLabel("Bạn muốn thử sức với bao nhiêu câu?").selectOption("5");
  await page.getByRole("button", { name: "Tạo Quiz" }).click();
  await expect(page.getByText("Bài làm Quiz AI")).toBeVisible();
  await expect(page.getByText("Câu 1/5")).toBeVisible();
  await page.getByRole("radio", { name: /Route table chưa trỏ subnet private qua NAT Gateway/ }).check();
  await page.getByRole("button", { name: /Tiếp theo/ }).click();
  await page.getByRole("radio", { name: /Kiểm tra namespace, dimension/ }).check();
  await page.getByRole("button", { name: /Tiếp theo/ }).click();
  await page.getByRole("radio", { name: /Policy attached, trust relationship/ }).check();
  await page.getByRole("button", { name: /Tiếp theo/ }).click();
  await page.getByRole("radio", { name: /Retry là thử lại tác vụ/ }).check();
  await page.getByRole("button", { name: /Tiếp theo/ }).click();
  await page.getByRole("radio", { name: "Readiness probe" }).check();
  await page.getByRole("button", { name: "Nộp bài" }).click();
  await expect(page.getByText("Kết quả Quiz AI")).toBeVisible();
  await expect(page.getByText("5 đúng, 0 sai")).toBeVisible();
  await page.getByRole("button", { name: /Đi tới câu 1/ }).click();
  await expect(page.getByText(/Nhật ký tập trung/)).toBeVisible();
});

test("password login updates account state", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Đăng nhập/ })).toBeVisible();
  await page.goto("/auth/login");
  await page.getByRole("button", { name: /^Đăng nhập$/ }).click();
  await expect(page.getByText(/Đăng nhập thành công/)).toBeVisible();
  await expect(page.getByLabel(/Menu tài khoản của learner/)).toBeVisible();
  await page.getByLabel(/Menu tài khoản của learner/).click();
  await expect(page.getByRole("link", { name: /Cài đặt tài khoản/ })).toBeVisible();
});

test("forgot password validates and confirms reset request", async ({ page }) => {
  await page.goto("/auth/forgot-password");
  await page.getByLabel("Email").fill("learner@example.com");
  await page.getByRole("button", { name: /Gửi liên kết đặt lại/ }).click();
  await expect(page.getByText("Đã yêu cầu liên kết đặt lại")).toBeVisible();
});

test("mobile hamburger opens and closes sidebar overlay", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile-only navigation overlay.");

  await page.goto("/");
  await page.getByRole("button", { name: "Mở menu điều hướng" }).click();
  const mobileSidebar = page.getByRole("complementary", { name: "Điều hướng chính" });
  await expect(mobileSidebar).toBeVisible();
  await mobileSidebar.getByRole("link", { name: "Huấn luyện AI", exact: true }).click();
  await expect(mobileSidebar).toHaveCount(0);
  await expect(page.getByText("AI Learning Coach")).toBeVisible();
});

test("coach creates an AI report request and opens report details", async ({ page }) => {
  await page.goto("/coach");
  await page.getByRole("button", { name: "Generate AI Report" }).click();
  await expect(page.getByText("Sending request...")).toBeVisible();
  await expect(page.getByText("Your report is being generated in the background. You can continue using the app.")).toBeVisible();
  await expect(page.getByText(/Yêu cầu báo cáo đã được tạo/)).toBeVisible();
  await expect(page.getByText("Hoàn thành").first()).toBeVisible();
  await page.getByRole("button", { name: "Xem chi tiết" }).nth(1).click();
  const detailPanel = page.getByRole("complementary");
  await expect(detailPanel.getByRole("heading", { name: "Weekly AI Report - Week 24, 2026" })).toBeVisible();
  await expect(detailPanel.getByText("Điểm mạnh")).toBeVisible();
});

test("top navbar search and notifications work", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Tìm kiếm các khái niệm, ghi chú hoặc thông tin chi tiết từ AI").fill("redis");
  await expect(page.getByRole("listbox", { name: "Gợi ý tìm kiếm" })).toBeVisible();
  await expect(page.getByRole("option").first()).toContainText(/Redis|BullMQ/);
  await page.getByLabel("Mở thông báo").click();
  await expect(page.getByText("Nhắc nhở học tập")).toBeVisible();
});

test("search page filters logs, pins a result, and shows details", async ({ page }) => {
  await page.goto("/search");
  await expect(page.getByText("Nhập từ khóa để tìm trong nhật ký học của bạn.")).toBeVisible();
  await page.getByLabel("Từ khóa tìm kiếm nhật ký học").fill("Redis");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByText(/GET \/search\?query=Redis/)).toBeVisible();
  await expect(page.getByText(/Redis Streams/).first()).toBeVisible();
  await page.getByLabel("Ghim kết quả").first().click();
  await expect(page.getByText("Kết quả đã ghim")).toBeVisible();
  await page.getByRole("link", { name: "Xem chi tiết" }).first().click();
  await expect(page).toHaveURL(/\/journal\/redis-streams/);
});

test("journal filters and saves a learning log", async ({ page }) => {
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

test("journal list hides the desktop sidebar", async ({ page, isMobile }) => {
  test.skip(isMobile, "Desktop-only sidebar behavior.");
  await page.goto("/journal");
  await expect(page.locator(".desktop-sidebar")).toBeHidden();
  await expect(page.locator(".app-navbar")).toBeVisible();
});
