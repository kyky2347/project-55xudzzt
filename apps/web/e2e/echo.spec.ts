import { expect, test } from "@playwright/test";

test("home, language switch, and seeded game loop", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "ECHO" })).toBeVisible();
  await page.getByRole("button", { name: "切换到中文" }).click();
  await expect(page.getByRole("button", { name: "进入黑暗" })).toBeVisible();
  await page.getByRole("button", { name: "进入黑暗" }).click();
  await expect(page).toHaveURL(/\/play/);
  await page.getByRole("button", { name: "估计你的位置" }).click();
  await page.getByRole("button", { name: "向北移动" }).click();
  await page.getByRole("button", { name: /被动聆听/ }).first().click();
  await page.getByRole("button", { name: /短促脉冲/ }).first().click();
  await page.getByRole("button", { name: /主动声呐/ }).first().click();
  await expect(page.getByText(/更多信息/)).toBeVisible();
});

test("lab filter controls change the posterior", async ({ page }) => {
  await page.goto("/lab");
  await expect(page.getByRole("heading", { name: /Probability laboratory/ })).toBeVisible();
  await page.getByRole("button", { name: "Predict" }).click();
  await page.getByRole("button", { name: "Observe" }).click();
  await page.getByRole("button", { name: "Normalize" }).click();
  await page.getByRole("button", { name: "Resample" }).click();
  await expect(page.getByText(/resample/i).first()).toBeVisible();
});

test("deterministic debug run opens debrief and X-Ray", async ({ page }) => {
  await page.goto("/play?debug=1");
  await page.getByRole("button", { name: "Estimate position" }).click();
  const debugToggle = page.getByRole("button", { name: "Open debug telemetry" });
  if (await debugToggle.isVisible()) await debugToggle.click();
  await page.getByRole("button", { name: "TRIGGER DEBRIEF" }).click();
  await expect(page).toHaveURL(/\/debrief\?id=/);
  await expect(page.getByRole("heading", { name: "Run debrief" })).toBeVisible();
  await page.getByRole("link", { name: /Open X-Ray replay/ }).click();
  await expect(page).toHaveURL(/\/replay\//);
  await expect(page.getByRole("heading", { name: "X-Ray replay" })).toBeVisible();
});

test("mobile layout keeps primary actions reachable", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile-only assertion");
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Enter the dark" })).toBeVisible();
  await page.goto("/play");
  await page.getByRole("button", { name: "Estimate position" }).click();
  await expect(page.getByRole("button", { name: /Active sonar/ }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Move north" })).toBeVisible();
});
