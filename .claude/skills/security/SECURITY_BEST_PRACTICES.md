# Security Best Practices for Sports Game Hub

## Core Principle: Never Hardcode Credentials

**CREDENTIALS SHOULD NEVER BE HARD CODED IN SOURCE CODE OR COMMITTED TO VERSION CONTROL**

This includes:
- API keys
- Secret tokens
- Database passwords
- OAuth client secrets
- Private keys
- Any sensitive configuration values

---

## Environment Variables for AWS AppSync

### ✅ Correct Approach: Use .env Files

**Local Development (.env file):**
```bash
# .env - NEVER commit this file to Git
REACT_APP_APPSYNC_ENDPOINT=https://your-endpoint.appsync-api.us-east-2.amazonaws.com/event
REACT_APP_APPSYNC_REGION=us-east-2
REACT_APP_APPSYNC_API_KEY=da2-your-api-key-here
```

**Configuration File (aws-config.js):**
```javascript
// src/aws-config.js
export const awsConfig = {
  endpoint: process.env.REACT_APP_APPSYNC_ENDPOINT,
  region: process.env.REACT_APP_APPSYNC_REGION,
  apiKey: process.env.REACT_APP_APPSYNC_API_KEY
};
```

**Ensure .gitignore includes:**
```
# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

---

## What We Did to Fix Exposure

### 1. Refactored Code
- Moved hardcoded credentials to environment variables
- Updated `aws-config.js` to use `process.env` values
- Committed the refactored code (safe to push)

### 2. Added .env to .gitignore
- Ensures future `.env` files are never committed
- Protects local development credentials

### 3. Rotated API Key
- Deleted old exposed API key in AWS AppSync console
- Created new API key with 365-day expiration
- Updated local `.env` file with new key

---

## Production Deployment (AWS Amplify)

For AWS Amplify hosting, add environment variables in the console:

1. Go to AWS Amplify Console
2. Select your app
3. Go to "Environment variables" section
4. Add:
   - `REACT_APP_APPSYNC_ENDPOINT`
   - `REACT_APP_APPSYNC_REGION`
   - `REACT_APP_APPSYNC_API_KEY`

AWS Amplify will inject these during build time.

---

## Future Authentication (AWS Cognito)

When we implement user authentication:
- Cognito credentials will also use environment variables
- User session tokens will be handled by AWS Amplify libraries
- No hardcoded User Pool IDs or Client IDs

**Example:**
```bash
REACT_APP_COGNITO_USER_POOL_ID=us-east-2_xxxxxxxxx
REACT_APP_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
REACT_APP_COGNITO_REGION=us-east-2
```

---

## Security Checklist for Future Features

Before committing code:
- [ ] No API keys in code
- [ ] No passwords or secrets
- [ ] All sensitive config in `.env`
- [ ] `.env` is in `.gitignore`
- [ ] Production env vars set in AWS Amplify console

---

## Resources

- [AWS Security Best Practices](https://docs.aws.amazon.com/prescriptive-guidance/latest/security-reference-architecture/welcome.html)
- [React Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [AWS Amplify Environment Variables](https://docs.aws.amazon.com/amplify/latest/userguide/environment-variables.html)

---

**Last Updated:** February 1, 2026
**Lesson Learned:** After initial deployment, we discovered hardcoded AppSync API key in GitHub. Immediately refactored, rotated credentials, and implemented proper environment variable management.
