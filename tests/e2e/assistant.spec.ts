import { test, expect } from "@playwright/test";

test("assistant page loads with chat input", async ({ page }) => {
  await page.goto("/assistant");
  await expect(page.getByRole("heading", { name: "Kai Assistant" })).toBeVisible();
  await expect(page.getByLabel("Message to Kai")).toBeVisible();
});
