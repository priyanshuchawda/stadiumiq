import { test, expect } from "@playwright/test";

test("map page loads with route controls and heatmap", async ({ page }) => {
  await page.goto("/map");
  await expect(page.getByRole("heading", { name: "Stadium Map" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Which gate now?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Show route on map" })).toBeVisible();
  await expect(page.getByRole("group", { name: /Liberty Stadium map/i })).toBeVisible();
});
