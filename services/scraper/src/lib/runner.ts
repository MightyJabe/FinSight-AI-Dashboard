// israeli-bank-scrapers v6.6.0 with Browserless cloud browser for 2FA support
import { CompanyTypes, createScraper } from 'israeli-bank-scrapers';
import { ScraperCredentials, ScraperScrapingResult } from 'israeli-bank-scrapers/lib/scrapers/interface';

const isLocalMode = process.env.PUPPETEER_LOCAL === 'true';
const browserlessApiKey = process.env.BROWSERLESS_API_KEY;

export interface ScrapeRequest {
    companyId: string;
    credentials: ScraperCredentials;
    startDate?: Date;
    showBrowser?: boolean;
}

export interface ScrapeResponse extends ScraperScrapingResult {
    // Add live session URL for 2FA interaction
    liveSessionUrl?: string;
}

export async function runScrape(req: ScrapeRequest): Promise<ScrapeResponse> {
    const { companyId, credentials, startDate, showBrowser } = req;

    // Determine mode: Local, Browserless (cloud), or Docker
    const useBrowserless = !isLocalMode && browserlessApiKey;
    const mode = isLocalMode ? 'LOCAL' : useBrowserless ? 'BROWSERLESS' : 'DOCKER';

    console.log(`[Scraper] Starting scrape for ${companyId}`);
    console.log(`[Scraper] Mode: ${mode}`);

    // In local mode, force showBrowser to true for OTP entry
    const effectiveShowBrowser = isLocalMode ? true : !!showBrowser;

    let browser;
    let liveSessionUrl: string | undefined;

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
    } else if (useBrowserless) {
        // Browserless cloud mode: connect via WebSocket for 2FA support
        const puppeteerCore = await import('puppeteer-core');

        // Browserless WebSocket URL with live debugging enabled
        const browserlessUrl = `wss://chrome.browserless.io?token=${browserlessApiKey}&--window-size=1920,1080`;

        console.log(`[Scraper] Connecting to Browserless cloud browser...`);

        browser = await puppeteerCore.default.connect({
            browserWSEndpoint: browserlessUrl
        });

        // Get the live session URL for the user to interact with 2FA
        // Browserless provides a live view at: https://chrome.browserless.io/live?token=TOKEN
        liveSessionUrl = `https://chrome.browserless.io/live?token=${browserlessApiKey}`;
        console.log(`[Scraper] Live session available at: ${liveSessionUrl}`);
        console.log(`[Scraper] Connected to Browserless successfully`);
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
            // Very long timeout for manual OTP entry (10 minutes for cloud, 2 min for headless)
            defaultTimeout: isLocalMode || useBrowserless ? 600000 : 120000,
            // Also set navigation timeout
            timeout: isLocalMode || useBrowserless ? 600000 : 120000
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

        // Return result with optional live session URL
        return {
            ...scraperResult,
            liveSessionUrl
        };

    } catch (e) {
        console.error(`[Scraper] Unexpected error:`, e);
        throw e;
    } finally {
        // For Browserless, disconnect instead of close to preserve session
        if (useBrowserless) {
            await browser.disconnect();
        } else {
            await browser.close();
        }
    }
}
