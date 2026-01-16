import cors from 'cors';
import express, { Request, Response } from 'express';

import { runScrape, ScrapeRequest } from './lib/runner';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Scrape Endpoint
app.post('/scrape', async (req: Request, res: Response) => {
    try {
        const { companyId, credentials, startDate, showBrowser } = req.body;

        // Debug logging - show credential keys (not values) to verify format
        console.log(`[API] Received scrape request:`);
        console.log(`  - companyId: ${companyId}`);
        console.log(`  - credential keys: ${credentials ? Object.keys(credentials).join(', ') : 'NONE'}`);
        console.log(`  - startDate: ${startDate || 'default'}`);

        if (!companyId || !credentials) {
            return res.status(400).json({ error: 'Missing companyId or credentials' });
        }

        const request: ScrapeRequest = {
            companyId,
            credentials,
            startDate: startDate ? new Date(startDate) : undefined,
            showBrowser
        };

        const result = await runScrape(request);
        res.json(result);

    } catch (error: any) {
        console.error('API Error:', error);
        res.status(500).json({
            success: false,
            errorType: 'INTERNAL_SERVER_ERROR',
            errorMessage: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`[API] Scraper service running on port ${PORT}`);
});
