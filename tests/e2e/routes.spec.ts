import { expect, test } from "@playwright/test";

const routes = [
  { path: "/", text: "Learning dashboard" },
  { path: "/journal/new", text: "New journal entry" },
  { path: "/journal/redis-streams", text: "Redis Streams for durable learning queues" },
  { path: "/coach", text: "Reason through your notes" },
  { path: "/search", text: "Reconnect prior notes" },
  { path: "/quiz", text: "Knowledge quiz" },
  { path: "/analytics", text: "Learning progress" }
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
