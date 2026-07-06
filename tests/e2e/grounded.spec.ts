import { test, expect } from "@playwright/test";

test("transport journey enables grounded assistant path", async ({ page }) => {
  await page.goto("/assistant?persona=fan&topic=transport");
  await expect(page.getByRole("heading", { name: "Kai Assistant" })).toBeVisible();
  await expect(page.getByLabel("Message to Kai")).toBeVisible();
});
