# FinSight AI - Firestore Database Structure

Complete documentation of the Firestore database schema for production and test environments.

## Database Overview

Both **production** (`finsight-ai-dashboard-2281a`) and **test** (`finsight-ai-test`) projects use identical database structures.

### Firebase Projects

| Environment | Project ID | Location | Status |
|-------------|------------|----------|--------|
| **Production** | `finsight-ai-dashboard-2281a` | nam5 | ✅ Active |
| **Test** | `finsight-ai-test` | nam5 | ✅ Active |

---

## Collection Structure

### Root Collections

```
firestore/
├── users/                    # User profiles and data
├── documents/                # Top-level document storage
└── system/                   # Admin-only system data
```

---

## Detailed Schema

### 1. `users` Collection

**Path**: `/users/{userId}`

Main collection containing all user-specific data. Each document represents one user.

**Document Structure**:
```typescript
{
  uid: string;              // Firebase Auth UID
  email: string;            // User email
  displayName?: string;     // Optional display name
  photoURL?: string;        // Optional profile photo
  createdAt: Timestamp;     // Account creation timestamp
  lastLoginAt: Timestamp;   // Last login timestamp
  settings?: {              // User preferences
    currency: string;       // Preferred currency (USD, ILS, etc.)
    locale: string;         // Locale (en-US, he-IL, etc.)
    notifications: boolean; // Email notifications enabled
  };
}
```

---

### 2. User Subcollections

All subcollections are nested under `/users/{userId}/`

#### 2.1 `plaidItems` Subcollection

**Path**: `/users/{userId}/plaidItems/{itemId}`

Stores Plaid financial institution connections.

**Document Structure**:
```typescript
{
  itemId: string;           // Plaid item ID
  accessToken: string;      // Encrypted Plaid access token
  institutionId: string;    // Plaid institution ID
  institutionName: string;  // Bank/institution name
  availableProducts: string[]; // Available Plaid products
  billedProducts: string[]; // Billed Plaid products
  consentExpirationTime?: Timestamp;
  updateMode: string;       // "background" | "user_present_required"
  status: string;           // "good" | "needs_update" | "error"
  error?: any;              // Error object if status is error
  createdAt: Timestamp;
  lastUpdated: Timestamp;
}
```

##### 2.1.1 `accounts` Nested Subcollection

**Path**: `/users/{userId}/plaidItems/{itemId}/accounts/{accountId}`

Financial accounts under each Plaid item.

**Document Structure**:
```typescript
{
  accountId: string;        // Plaid account ID
  mask: string;             // Last 4 digits of account
  name: string;             // Account name
  officialName?: string;    // Official account name
  type: string;             // "depository" | "credit" | "loan" | "investment"
  subtype: string;          // "checking" | "savings" | "credit card" | etc.
  currentBalance: number;   // Current balance
  availableBalance?: number; // Available balance
  limit?: number;           // Credit limit (for credit accounts)
  currency: string;         // Currency code (USD, ILS, etc.)
  isoCurrencyCode: string;  // ISO currency code
  persistentAccountId?: string; // Persistent Plaid account ID
  lastSynced: Timestamp;    // Last sync timestamp
}
```

---

#### 2.2 `categorizedTransactions` Subcollection

**Path**: `/users/{userId}/categorizedTransactions/{transactionId}`

AI-categorized financial transactions.

**Document Structure**:
```typescript
{
  transactionId: string;    // Unique transaction ID
  accountId: string;        // Reference to account
  plaidItemId: string;      // Reference to plaid item
  date: Timestamp;          // Transaction date
  name: string;             // Merchant/transaction name
  merchant?: string;        // Merchant name
  amount: number;           // Transaction amount (negative for expenses)
  currency: string;         // Currency code

  // AI Categorization
  category: string;         // Primary category
  subcategory?: string;     // Subcategory
  confidence: number;       // AI confidence score (0-1)
  reasoning?: string;       // AI reasoning for categorization

  // Metadata
  pending: boolean;         // Is transaction pending
  paymentChannel: string;   // "online" | "in store" | "other"
  location?: {              // Transaction location
    address: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
    lat: number;
    lon: number;
  };

  // User overrides
  userCategory?: string;    // User-modified category
  userNotes?: string;       // User notes

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

#### 2.3 `conversations` Subcollection

**Path**: `/users/{userId}/conversations/{conversationId}`

AI chat conversations about finances.

**Document Structure**:
```typescript
{
  conversationId: string;   // Unique conversation ID
  title: string;            // Conversation title/summary
  messages: {               // Array of messages
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Timestamp;
    metadata?: any;
  }[];
  context?: {               // Financial context
    accountIds: string[];   // Accounts discussed
    transactionIds: string[]; // Transactions referenced
    timeRange?: {
      start: Timestamp;
      end: Timestamp;
    };
  };
  createdAt: Timestamp;
  lastMessageAt: Timestamp;
}
```

---

#### 2.4 `manualData` Subcollection

**Path**: `/users/{userId}/manualData/{dataId}`

User-entered financial data not from Plaid.

**Document Structure**:
```typescript
{
  dataId: string;
  type: "income" | "expense" | "asset" | "liability";
  name: string;
  amount: number;
  currency: string;
  frequency?: "once" | "daily" | "weekly" | "monthly" | "yearly";
  startDate?: Timestamp;
  endDate?: Timestamp;
  category?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

#### 2.5 `insights` Subcollection

**Path**: `/users/{userId}/insights/{insightId}`

Cached AI-generated financial insights.

**Document Structure**:
```typescript
{
  insightId: string;
  type: "spending" | "saving" | "investment" | "budget" | "forecast";
  title: string;
  description: string;
  actionItems?: string[];   // Recommended actions
  priority: "low" | "medium" | "high" | "critical";
  confidence: number;       // AI confidence (0-1)
  dataReferences: {         // References to supporting data
    accountIds?: string[];
    transactionIds?: string[];
    timeRange?: {
      start: Timestamp;
      end: Timestamp;
    };
  };
  dismissed: boolean;       // User dismissed insight
  actedUpon: boolean;       // User acted on insight
  createdAt: Timestamp;
  validUntil: Timestamp;    // Insight expiry
}
```

---

#### 2.6 `analysis` Subcollection

**Path**: `/users/{userId}/analysis/{analysisId}`

Detailed AI financial analysis results.

**Document Structure**:
```typescript
{
  analysisId: string;
  type: "monthly" | "quarterly" | "yearly" | "custom";
  period: {
    start: Timestamp;
    end: Timestamp;
  };
  metrics: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    savingsRate: number;    // Percentage
    categories: {
      [category: string]: {
        amount: number;
        percentage: number;
        trend: "up" | "down" | "stable";
      };
    };
  };
  insights: string[];       // Analysis insights
  recommendations: string[]; // AI recommendations
  generatedAt: Timestamp;
}
```

---

#### 2.7 `physicalAssets` Subcollection

**Path**: `/users/{userId}/physicalAssets/{assetId}`

Physical assets (real estate, vehicles, jewelry, etc.)

**Document Structure**:
```typescript
{
  assetId: string;
  type: "real_estate" | "vehicle" | "jewelry" | "art" | "collectibles" | "other";
  name: string;
  description?: string;
  purchasePrice: number;
  currentValue: number;     // User-estimated value
  purchaseDate?: Timestamp;
  currency: string;
  location?: string;
  condition?: string;
  photos?: string[];        // Photo URLs
  documents?: string[];     // Document URLs
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

#### 2.8 `informalDebts` Subcollection

**Path**: `/users/{userId}/informalDebts/{debtId}`

Informal loans (lending to/borrowing from friends/family)

**Document Structure**:
```typescript
{
  debtId: string;
  type: "lending" | "borrowing";
  personName: string;       // Person involved
  amount: number;
  currency: string;
  startDate: Timestamp;
  dueDate?: Timestamp;
  status: "active" | "partially_paid" | "fully_paid";
  amountPaid: number;       // Amount paid so far
  payments: {               // Payment history
    date: Timestamp;
    amount: number;
    note?: string;
  }[];
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

#### 2.9 `documents` Subcollection (User)

**Path**: `/users/{userId}/documents/{documentId}`

User's financial documents.

**Document Structure**:
```typescript
{
  documentId: string;
  type: "bank_statement" | "tax_return" | "receipt" | "invoice" | "contract" | "other";
  name: string;
  description?: string;
  fileUrl: string;          // Storage URL
  fileType: string;         // MIME type
  fileSize: number;         // Bytes
  uploadedAt: Timestamp;

  // AI-extracted data
  extractedData?: {
    amount?: number;
    date?: Timestamp;
    vendor?: string;
    category?: string;
    metadata?: any;
  };

  tags?: string[];
  notes?: string;
}
```

---

#### 2.10 `taxData` Subcollection

**Path**: `/users/{userId}/taxData/{taxId}`

Tax-related financial data.

**Document Structure**:
```typescript
{
  taxId: string;
  year: number;             // Tax year
  type: "deduction" | "credit" | "income" | "payment";
  category: string;         // Tax category
  amount: number;
  currency: string;
  date: Timestamp;
  description: string;
  documentRef?: string;     // Reference to document
  confidence?: number;      // AI confidence if auto-detected
  verified: boolean;        // User verified
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

#### 2.11 `subscriptions` Subcollection

**Path**: `/users/{userId}/subscriptions/{subscriptionId}`

Recurring subscriptions and payments.

**Document Structure**:
```typescript
{
  subscriptionId: string;
  name: string;             // Service name (Netflix, Spotify, etc.)
  category: string;         // Subscription category
  amount: number;
  currency: string;
  frequency: "weekly" | "monthly" | "yearly";
  startDate: Timestamp;
  nextBillingDate: Timestamp;
  endDate?: Timestamp;      // If cancelled
  status: "active" | "cancelled" | "paused";
  autoDetected: boolean;    // AI-detected vs manually added
  transactionPattern?: string; // Pattern for matching transactions
  accountId?: string;       // Account charged
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

#### 2.12 `financialMemory` Subcollection

**Path**: `/users/{userId}/financialMemory/{memoryId}`

AI context and memory for personalized assistance.

**Document Structure**:
```typescript
{
  memoryId: string;
  type: "preference" | "goal" | "constraint" | "insight";
  key: string;              // Memory key
  value: any;               // Memory value
  context?: string;         // Additional context
  importance: number;       // Importance score (0-1)
  learned: "user_stated" | "ai_inferred";
  learnedAt: Timestamp;
  lastUsed?: Timestamp;
  usageCount: number;
}
```

---

### 3. `documents` Collection (Top-Level)

**Path**: `/documents/{documentId}`

Top-level document storage with user ownership.

**Document Structure**:
```typescript
{
  documentId: string;
  userId: string;           // Owner user ID
  // Same structure as user documents subcollection
  // ... (see section 2.9)
}
```

**Security**: Users can only access documents where `userId == auth.uid`

---

### 4. `system` Collection

**Path**: `/system/{document}`

Admin-only system data and configuration.

**Access**: Restricted to admin emails only (configured in security rules)

**Example Documents**:
- `config` - System configuration
- `maintenance` - Maintenance mode flags
- `analytics` - System-wide analytics
- `rate_limits` - Rate limiting configuration

---

## Security Rules

Both production and test use identical security rules:

### Key Security Principles

1. **User Isolation**: Users can only access their own data (`userId == auth.uid`)
2. **Authentication Required**: All access requires Firebase Authentication
3. **Nested Security**: Subcollection access inherits parent userId check
4. **Admin-Only System Data**: System collection restricted to admin emails
5. **Default Deny**: All other access explicitly denied

### Rule Highlights

```javascript
// Users can only access their own data
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;

  // All subcollections inherit this restriction
  match /{subcollection}/{document} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
}

// Top-level documents require userId match
match /documents/{documentId} {
  allow read, delete: if request.auth != null && resource.data.userId == request.auth.uid;
  allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
}

// System data - admin only
match /system/{document=**} {
  allow read, write: if request.auth != null &&
    request.auth.token.email_verified == true &&
    request.auth.token.email in ['admin@finsight.ai'];
}

// Deny everything else
match /{document=**} {
  allow read, write: if false;
}
```

---

## Indexes

Required composite indexes for efficient queries:

```json
{
  "indexes": [
    {
      "collectionGroup": "categorizedTransactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "categorizedTransactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "insights",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "priority", "order": "DESCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## Data Migration & Backup

### Production to Test

To replicate production data structure to test:

```bash
# 1. Export production data
firebase firestore:export gs://finsight-ai-dashboard-2281a-backup --project finsight-ai-dashboard-2281a

# 2. Import to test (optional - for testing with real data)
# WARNING: Use anonymized data only!
firebase firestore:import gs://finsight-ai-dashboard-2281a-backup --project finsight-ai-test
```

### Backup Strategy

- **Automated Daily Backups**: Enabled in Firebase Console
- **Retention**: 7 days for automatic backups
- **Manual Exports**: Before major schema changes

---

## Testing Data Structure

For E2E and integration tests, use this minimal data structure:

```typescript
// Test user structure
users/{testUserId} {
  uid: "test-user-123",
  email: "test@finsight-test.com",
  createdAt: Timestamp.now(),

  // Minimal test data in subcollections
  plaidItems/{testItemId} {
    itemId: "test-item",
    institutionName: "Test Bank",
    status: "good",

    accounts/{testAccountId} {
      accountId: "test-account",
      name: "Test Checking",
      type: "depository",
      currentBalance: 1000.00,
      currency: "USD"
    }
  },

  categorizedTransactions/{testTxId} {
    transactionId: "test-tx-1",
    name: "Test Purchase",
    amount: -50.00,
    category: "Groceries",
    date: Timestamp.now()
  }
}
```

---

## References

- **Production Project**: https://console.firebase.google.com/project/finsight-ai-dashboard-2281a
- **Test Project**: https://console.firebase.google.com/project/finsight-ai-test
- **Security Rules**: `firestore.rules`
- **Indexes Config**: `firestore.indexes.json`

---

## Maintenance

### Regular Tasks

- **Weekly**: Review security rules for vulnerabilities
- **Monthly**: Check database size and optimize queries
- **Quarterly**: Review and update indexes based on query patterns
- **Yearly**: Audit data retention and cleanup old test data

### Emergency Recovery

If production database is corrupted:

1. Restore from latest automated backup
2. Verify data integrity
3. Compare with test database structure
4. Run security rules validation
5. Test critical queries
6. Notify users of any data loss

---

**Last Updated**: 2026-01-17
**Database Version**: 1.0
**Schema Version**: production-test-parity-v1
