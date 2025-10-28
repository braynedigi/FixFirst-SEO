# 🤖 OpenAI Integration - Quick Start

## 3-Step Setup

### Step 1: Get OpenAI API Key
1. Visit: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Copy the key (starts with `sk-...`)

### Step 2: Add to Environment
```bash
# apps/api/.env
OPENAI_API_KEY="sk-your-api-key-here"
```

### Step 3: Restart Server
```bash
cd apps/api
npm run dev
```

✅ **Done!** You should see: `✅ OpenAI service initialized`

---

## Usage

1. **Run an audit** on any project
2. **Open audit details** page
3. **Click "Recommendations"** tab
4. **Click "Generate Recommendations"**
5. **Expand any recommendation** to see detailed AI analysis!

---

## What You Get

✅ **Detailed Problem Analysis** - WHY issues matter  
✅ **Step-by-Step Solutions** - HOW to fix them  
✅ **Code Examples** - Copy-paste ready snippets  
✅ **Impact Assessment** - Expected improvements  
✅ **Smart Prioritization** - Based on impact vs. effort

---

## Costs

| Audit Size | Cost |
|------------|------|
| Small (10-20 issues) | ~$0.01-0.03 |
| Medium (30-50 issues) | ~$0.03-0.07 |
| Large (100+ issues) | ~$0.10-0.20 |

**100 audits/month** ≈ **$5-15/month**

---

## Without OpenAI?

**No problem!** The app works perfectly without it:
- Uses template-based recommendations
- Still provides good SEO advice
- No AI costs

---

## Example Recommendation

**Title**: Implement Critical Security Headers

**Why This Matters**:
Your website is missing HTTP security headers that protect against vulnerabilities. Search engines reward secure sites with better rankings.

**How to Fix It**:
1. For Node.js: `npm install helmet`
2. Add to your server: `app.use(helmet())`
3. Test at: https://securityheaders.com
4. Aim for A+ rating

**Code Example**:
```javascript
const helmet = require('helmet');
app.use(helmet());
```

**Expected Impact**:
✅ Improve SEO rankings  
✅ Increase user trust  
✅ Pass security audits  

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "API key not provided" warning | Add `OPENAI_API_KEY` to `.env` file |
| Generic recommendations | Check API key is valid |
| "Rate limit exceeded" | Upgrade to paid OpenAI tier ($5 min) |
| Slow generation | Normal for large audits (20-60s) |

---

## Set Spending Limits

1. Visit: [https://platform.openai.com/account/billing/limits](https://platform.openai.com/account/billing/limits)
2. Set monthly budget cap (e.g., $20)
3. Enable email alerts

---

## Full Documentation

📖 Read the complete guide: `OPENAI_INTEGRATION_GUIDE.md`

- Detailed cost optimization
- Configuration options
- Advanced usage
- Best practices
- Monitoring and troubleshooting

