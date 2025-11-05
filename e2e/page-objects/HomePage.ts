import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class HomePage extends BasePage {
  readonly heroSection: Locator;
  readonly registerButton: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    super(page);
    this.heroSection = page.getByText("Przestań martwić się, co na obiad AI wygeneruje dla Ciebie spersonalizowany");
    this.registerButton = page.getByRole("link", { name: "Zarejestruj się" });
    this.loginLink = page.getByRole("link", { name: "Zaloguj się" });
  }

  async navigateToHome(): Promise<void> {
    await this.navigateTo("/");
    await this.waitForLoad();
  }

  async clickRegister(): Promise<void> {
    await this.registerButton.click();
  }

  async clickLogin(): Promise<void> {
    await this.loginLink.click();
  }
}
