import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly welcomeText: Locator;
  readonly addAccountButton: Locator;
  readonly netWorthSection: Locator;
  readonly accountsSection: Locator;
  readonly accountsHeading: Locator;
  readonly viewAllAccountsLink: Locator;
  readonly accountCards: Locator;
  readonly netWorthBreakdown: Locator;
  readonly connectBankCTA: Locator;
  readonly proactiveInsightsCard: Locator;
  readonly realTimeIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1').filter({ hasText: 'Your Finances' });
    this.welcomeText = page.locator('text=Welcome back');
    this.addAccountButton = page.locator('a[href="/accounts"]').filter({ hasText: 'Add Account' });
    this.netWorthSection = page.locator('section').first();
    this.accountsSection = page.locator('section').filter({ has: page.locator('h3:text("Your Accounts")') });
    this.accountsHeading = page.locator('h3').filter({ hasText: 'Your Accounts' });
    this.viewAllAccountsLink = page.locator('a[href="/accounts"]').filter({ hasText: 'View all' });
    this.accountCards = page.locator('[class*="bg-secondary/40"]');
    this.netWorthBreakdown = page.locator('section').nth(1);
    this.connectBankCTA = page.locator('section').nth(2);
    this.proactiveInsightsCard = page.locator('section').last();
    this.realTimeIndicator = page.locator('[class*="RealTimeIndicator"]');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async expectDashboardPage() {
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
    await expect(this.welcomeText).toBeVisible({ timeout: 10000 });
    await expect(this.addAccountButton).toBeVisible({ timeout: 10000 });
  }

  async expectNetWorthVisible() {
    await expect(this.netWorthSection).toBeVisible();
  }

  async expectAccountsVisible() {
    await expect(this.accountsHeading).toBeVisible();
    await expect(this.accountCards.first()).toBeVisible();
  }

  async clickAddAccount() {
    await this.addAccountButton.click();
  }

  async clickViewAllAccounts() {
    await this.viewAllAccountsLink.click();
  }

  async getAccountCount() {
    return await this.accountCards.count();
  }

  async getNetWorthText() {
    return await this.netWorthSection.textContent();
  }
}
