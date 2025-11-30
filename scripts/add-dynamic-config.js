#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const apiRoutes = [
  'src/app/api/accounts/route.ts',
  'src/app/api/analytics/spending-trends/route.ts',
  'src/app/api/auth/session/route.ts',
  'src/app/api/budget/route.ts',
  'src/app/api/chat/route.ts',
  'src/app/api/financial-overview/route.ts',
  'src/app/api/insights/route.ts',
  'src/app/api/investment-accounts/route.ts',
  'src/app/api/liabilities/route.ts',
  'src/app/api/manual-data/route.ts',
  'src/app/api/overview/route.ts',
  'src/app/api/plaid/create-link-token/route.ts',
  'src/app/api/plaid/exchange-public-token/route.ts',
  'src/app/api/plaid/items/route.ts',
  'src/app/api/plaid/transactions/route.ts',
];

const configToAdd = `\nexport const dynamic = 'force-dynamic';\n`;

apiRoutes.forEach(routePath => {
  const fullPath = path.join(process.cwd(), routePath);
  if (!fs.existsSync(fullPath)) return;

  const content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes('export const dynamic')) return;
  if (!content.includes('cookies()')) return;

  const lines = content.split('\n');
  let lastImportIndex = lines.findIndex(
    (line, i) =>
      i > 0 && line.trim().startsWith('import') && !lines[i + 1]?.trim().startsWith('import')
  );

  if (lastImportIndex === -1) lastImportIndex = 0;
  lines.splice(lastImportIndex + 1, 0, configToAdd);

  fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
  console.log(`✅ ${routePath}`);
});
