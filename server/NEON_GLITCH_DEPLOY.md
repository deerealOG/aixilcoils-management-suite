# AIXILCOILS Server Deployment - Neon.tech + Glitch (FREE)

## ✅ This Setup:

- **Neon.tech** = Free PostgreSQL (10GB storage, no credit card)
- **Glitch.com** = Free Node.js hosting (no credit card)

---

## Part 1: Create PostgreSQL Database (Neon.tech)

### Step 1: Sign Up

1. Go to [neon.tech](https://neon.tech)
2. Click **"Sign Up"** → Use GitHub or email
3. No credit card required!

### Step 2: Create Database

1. Click **"Create Project"**
2. Name: `aixilcoils`
3. Region: Choose closest to you
4. Click **"Create Project"**

### Step 3: Get Connection String

1. After creation, you'll see the **Connection String**
2. It looks like: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb`
3. **Copy this** - you'll need it for Glitch!

---

## Part 2: Deploy Server (Glitch.com)

### Step 1: Sign Up

1. Go to [glitch.com](https://glitch.com)
2. Click **"Sign up"** → Use GitHub

### Step 2: Import from GitHub

1. Click **"New Project"** → **"Import from GitHub"**
2. Paste: `https://github.com/deerealOG/aixilcoils-management-suite`
3. Wait for import to complete

### Step 3: Configure Project

1. Click on the project name → **"Settings"**
2. Change **"Glitch project URL"** to: `aixilcoils-api` (or similar)

### Step 4: Set Root Directory

1. Open the **Terminal** in Glitch (bottom left)
2. Run:
   ```bash
   cd server
   npm install
   npx prisma generate
   ```

### Step 5: Set Environment Variables

1. Click the `.env` file (or create one)
2. Add these:
   ```
   DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb
   JWT_SECRET=your-super-secret-key-change-this-123
   CLIENT_URL=*
   NODE_ENV=production
   PORT=3000
   ```
   (Replace DATABASE_URL with your Neon connection string)

### Step 6: Update Start Script

1. Open `package.json` in the **root** of Glitch project
2. Add to scripts:
   ```json
   "start": "cd server && npm start"
   ```

### Step 7: Seed Database

In Glitch Terminal:

```bash
cd server
npx prisma db push
npm run db:seed
```

### Step 8: Your API is Live!

Your server URL: `https://aixilcoils-api.glitch.me`

---

## ⚠️ Important Notes

- Glitch projects sleep after 5 min inactivity
- First request after sleep takes ~10 seconds to wake
- For production, consider a keep-alive ping service
