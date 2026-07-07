import { test, expect } from "@playwright/test";

test("map page loads with route controls and heatmap", async ({ page }) => {
  await page.goto("/map");
  await expect(page.getByRole("heading", { name: "Stadium Map" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Which gate now?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Show route on map" })).toBeVisible();
  await expect(page.getByRole("group", { name: /Liberty Stadium map/i })).toBeVisible();
});

test("planning a route shows steps and moves focus to them", async ({ page }) => {
  await page.goto("/map");
  await page.getByRole("button", { name: "Show route on map" }).click();

  const steps = page.getByRole("region", { name: "Route steps" });
  await expect(steps).toBeVisible({ timeout: 15_000 });
  await expect(steps.getByRole("listitem").first()).toBeVisible();
  // Focus lands on the route panel so keyboard/screen-reader users hear the result.
  await expect(steps).toBeFocused();
});
