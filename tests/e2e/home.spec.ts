import { test, expect } from "@playwright/test";

test("home page loads with StadiumIQ heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("StadiumIQ");
});
