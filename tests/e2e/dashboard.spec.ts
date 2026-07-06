import { test, expect } from "@playwright/test";

test("dashboard page loads organizer widgets", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Operations Dashboard" }),
  ).toBeVisible();
  await expect(page.getByLabel("Key performance indicators")).toBeVisible();
  await expect(page.getByLabel("Sentiment digest")).toBeVisible();
});
