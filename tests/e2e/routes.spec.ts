import { expect, test } from "@playwright/test";

const routes = [
  { path: "/", text: "Learning dashboard" },
  { path: "/journal/new", text: "New journal entry" },
  { path: "/journal/redis-streams", text: "Redis Streams for durable learning queues" },
  { path: "/coach", text: "Reason through your notes" },
  { path: "/search", text: "Reconnect prior notes" },
  { path: "/quiz", text: "Knowledge quiz" },
  { path: "/analytics", text: "Learning progress" },
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

test("quiz can answer and advance", async ({ page }) => {
  await page.goto("/quiz");
  await page.getByRole("button", { name: /Consumer groups/ }).click();
  await expect(page.getByText("Correct", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Next Question/ }).click();
  await expect(page.getByText(/Which probe/)).toBeVisible();
});

test("password login updates dashboard account state", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Đăng nhập/ })).toBeVisible();
  await page.goto("/auth/login");
  await page.getByRole("button", { name: /^Đăng nhập$/ }).click();
  await expect(page.getByText(/Đăng nhập thành công/)).toBeVisible();
  await expect(page.getByLabel(/Signed in as learner/)).toBeVisible();
});

test("forgot password validates and confirms reset request", async ({ page }) => {
  await page.goto("/auth/forgot-password");
  await page.getByLabel("Email").fill("learner@example.com");
  await page.getByRole("button", { name: /Send reset link/ }).click();
  await expect(page.getByText("Reset link requested")).toBeVisible();
});

test("mobile hamburger opens and closes sidebar overlay", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile navigation overlay is only visible below desktop width.");

  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toHaveCount(0);
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await expect(page.getByRole("complementary", { name: "Main navigation" })).toBeVisible();
  await page.getByRole("link", { name: /Coach/ }).click();
  await expect(page.getByRole("complementary", { name: "Main navigation" })).toHaveCount(0);
  await expect(page.getByText("Reason through your notes")).toBeVisible();
});
