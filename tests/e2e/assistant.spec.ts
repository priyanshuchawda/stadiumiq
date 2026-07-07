import { test, expect } from "@playwright/test";

test("assistant page loads with chat input", async ({ page }) => {
  await page.goto("/assistant");
  await expect(page.getByRole("heading", { name: "Kai Assistant" })).toBeVisible();
  await expect(page.getByLabel("Message to Kai")).toBeVisible();
});

test("sending a message streams a Kai reply", async ({ page }) => {
  await page.goto("/assistant");
  await page.getByLabel("Message to Kai").fill("Which gate has the shortest wait?");
  await page.getByRole("button", { name: "Send" }).click();

  // The user's message renders immediately.
  await expect(page.getByText("Which gate has the shortest wait?")).toBeVisible();

  // A Kai reply arrives (live model or deterministic zero-key fallback).
  await expect(page.getByText("Kai said:").first()).toBeAttached({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Send" })).toBeEnabled({
    timeout: 30_000,
  });
});
