import { test, expect, type Page } from "@playwright/test";
import { HomePage } from "./page-objects";

test.describe("Home Page", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }: { page: Page }) => {
    homePage = new HomePage(page);
    await homePage.navigateToHome();
  });

  test("should display hero section", async () => {
    await expect(homePage.heroSection).toBeVisible();
  });

  test("should have correct page title", async () => {
    const title = await homePage.getTitle();
    expect(title).toContain("AI Meal Planner");
  });

  test("should navigate to login page when login button is clicked", async () => {
    await homePage.clickLogin();
    const currentUrl = await homePage.getCurrentUrl();
    expect(currentUrl).toMatch(/.*login/);
  });

  test("should navigate to register page when register button is clicked", async () => {
    await homePage.clickRegister();
    const currentUrl = await homePage.getCurrentUrl();
    expect(currentUrl).toMatch(/.*register/);
  });
});
