import { test, expect } from "@playwright/test";

const journeys = [
  {
    linkName: "Fan · Accessible route",
    path: "/assistant?persona=fan&lang=es",
    heading: "Kai Assistant",
  },
  {
    linkName: "Fan · Green transport",
    path: "/assistant?persona=fan&topic=transport",
    heading: "Kai Assistant",
  },
  {
    linkName: "Volunteer · Lost child SOP",
    path: "/assistant?persona=volunteer",
    heading: "Kai Assistant",
  },
  {
    linkName: "Staff · Crowd surge",
    path: "/assistant?persona=staff",
    heading: "Kai Assistant",
  },
  {
    linkName: "Organizer · Operations",
    path: "/dashboard",
    heading: "Operations Dashboard",
  },
] as const;

for (const journey of journeys) {
  test(`${journey.linkName} loads from home in one click`, async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: journey.linkName }).click();
    await expect(page.getByRole("heading", { name: journey.heading })).toBeVisible({
      timeout: 20_000,
    });
  });

  test(`${journey.linkName} loads via direct URL`, async ({ page }) => {
    await page.goto(journey.path);
    await expect(page.getByRole("heading", { name: journey.heading })).toBeVisible();
  });
}
