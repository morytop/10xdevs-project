import type { Page } from "@playwright/test";

export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url);
  }

  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/${name}.png` });
  }
}
