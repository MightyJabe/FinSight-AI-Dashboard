// israeli-bank-scrapers v6.6.0 with visible browser mode for 2FA
import { CompanyTypes, createScraper } from 'israeli-bank-scrapers';
import { ScraperCredentials, ScraperScrapingResult } from 'israeli-bank-scrapers/lib/scrapers/interface';

const isLocalMode = process.env.PUPPETEER_LOCAL === 'true';

export interface ScrapeRequest {
    companyId: string;
    credentials: ScraperCredentials;
    startDate?: Date;
    showBrowser?: boolean;
}

export async function runScrape(req: ScrapeRequest): Promise<ScraperScrapingResult> {
    const { companyId, credentials, startDate, showBrowser } = req;

    console.log(`[Scraper] Starting scrape for ${companyId}`);
    console.log(`[Scraper] Mode: ${isLocalMode ? 'LOCAL (visible browser)' : 'DOCKER (headless)'}`);

    // In local mode, force showBrowser to true for OTP entry
    const effectiveShowBrowser = isLocalMode ? true : !!showBrowser;

    let browser;

    if (isLocalMode) {
        // Local mode: use regular puppeteer which bundles Chromium
        const puppeteer = await import('puppeteer');
        browser = await puppeteer.default.launch({
            headless: !effectiveShowBrowser,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        });
        console.log(`[Scraper] Browser launched in ${effectiveShowBrowser ? 'VISIBLE' : 'headless'} mode`);
    } else {
        // Docker mode: use puppeteer-core with installed Chrome
        const puppeteerCore = await import('puppeteer-core');
        browser = await puppeteerCore.default.launch({
            headless: !effectiveShowBrowser,
            executablePath: '/usr/bin/google-chrome',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });
    }

    try {
        const scraper = createScraper({
            companyId: companyId as CompanyTypes,
            startDate: startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year of history
            combineInstallments: false,
            showBrowser: effectiveShowBrowser,
            verbose: true,
            browser: browser as any, // Cast to any - Puppeteer types don't match israeli-bank-scrapers
            // Very long timeout for manual OTP entry (10 minutes)
            defaultTimeout: isLocalMode ? 600000 : 120000,
            // Also set navigation timeout
            timeout: isLocalMode ? 600000 : 120000
        });

        // Listen for progress events
        scraper.onProgress((company, payload) => {
            console.log(`[Scraper] Progress for ${company}: ${payload.type}`);
        });

        const scraperResult = await scraper.scrape(credentials);

        if (scraperResult.success) {
            console.log(`[Scraper] Success for ${companyId}. Accounts: ${scraperResult.accounts?.length}`);
            if (scraperResult.accounts) {
                for (const acc of scraperResult.accounts) {
                    console.log(`  - Account: ${acc.accountNumber}, Transactions: ${acc.txns?.length || 0}`);
                }
            }
        } else {
            console.error(`[Scraper] Failed for ${companyId}.`);
            console.error(`  - Error Type: ${scraperResult.errorType}`);
            console.error(`  - Error Message: ${scraperResult.errorMessage || 'No message'}`);
        }

        return scraperResult;

    } catch (e) {
        console.error(`[Scraper] Unexpected error:`, e);
        throw e;
    } finally {
        await browser.close();
    }
}
