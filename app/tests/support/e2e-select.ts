import type { Locator, Page } from "@playwright/test";

// components/ui/select.tsx is Base UI's Select (ARIA listbox pattern,
// not a native <select>) — open the trigger, then click the option by
// its accessible name.
export async function selectOption(page: Page, trigger: Locator, optionName: string): Promise<void> {
  await trigger.click();
  await page.getByRole("option", { name: optionName, exact: true }).click();
}
