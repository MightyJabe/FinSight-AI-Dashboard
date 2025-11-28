# Quick Setup Guide

## 🚀 Essential Setup Steps

### 1. Environment Variables (.env.local)

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

### 2. Required Environment Variables

#### **Encryption Key (Required)**

```bash
# Generate with this command:
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"

# Add to .env.local:
ENCRYPTION_KEY=your_64_character_hex_key_here
```

#### **Firebase (Required)**

Get these from [Firebase Console](https://console.firebase.google.com):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
# ... other Firebase vars from .env.example
```

### 3. Optional External Integrations

#### **Plaid (US Banks) - Optional**

Get free test credentials from [Plaid Dashboard](https://dashboard.plaid.com):

```bash
PLAID_CLIENT_ID="your_plaid_client_id"
PLAID_SECRET="your_plaid_sandbox_secret"
PLAID_ENV="sandbox"
```

#### **SaltEdge (Israeli/EU Banks) - Optional**

Get credentials from [Salt Edge Dashboard](https://www.saltedge.com):

```bash
SALTEDGE_APP_ID="your_saltedge_app_id"
SALTEDGE_SECRET="your_saltedge_secret"
```

#### **OpenAI (AI Features) - Optional**

```bash
OPENAI_API_KEY="your_openai_api_key"
```

## 🔧 Testing External Integrations

### Plaid Test Credentials

- **Username**: `user_good`
- **Password**: `pass_good`
- **Test Bank**: First Platypus Bank
- **MFA**: `1234` (if prompted)

### SaltEdge Test

- Use test bank credentials provided in SaltEdge documentation

## ⚠️ Troubleshooting

### "Encryption failed" Error

- Add `ENCRYPTION_KEY` to your `.env.local` file (see step 2 above)

### "401 Unauthorized" for External APIs

- Verify your API credentials are correct
- Check you're using the right environment (sandbox vs production)

### Missing Bank Connections

- External bank integrations are optional
- The app works fully with manual platform tracking
- Add external credentials only if you want automatic bank data import

## 🎯 Minimum Setup for Full Functionality

You can use the complete financial tracking system with just:

1. **Firebase** (authentication & database)
2. **Encryption Key** (data security)

All external bank integrations are optional and the manual platform tracking system works independently!
