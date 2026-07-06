import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = ["/", "/assistant", "/map", "/dashboard"];

for (const path of pages) {
  test(`a11y: ${path} has no critical axe violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const critical = results.violations.filter(
      (violation) => violation.impact === "critical" || violation.impact === "serious",
    );
    expect(critical, formatViolations(critical)).toEqual([]);
  });
}

function formatViolations(
  violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"],
): string {
  return violations.map((item) => `${item.id}: ${item.help}`).join("\n");
}
