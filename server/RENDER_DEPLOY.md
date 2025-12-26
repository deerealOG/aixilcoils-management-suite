# AIXILCOILS Server Deployment - Render.com (FREE)

## One-Click Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/deerealOG/aixilcoils-management-suite)

## Manual Setup

### Step 1: Create Web Service

1. Go to [render.com](https://render.com) → Sign up with GitHub
2. Click **"New"** → **"Web Service"**
3. Connect your `aixilcoils-management-suite` repository
4. Configure:
   - **Name**: `aixilcoils-api`
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Step 2: Create PostgreSQL Database

1. Click **"New"** → **"PostgreSQL"**
2. Name: `aixilcoils-db`
3. Plan: **Free**
4. Copy the **Internal Database URL**

### Step 3: Set Environment Variables

In your Web Service → **Environment** tab:

| Variable       | Value                               |
| -------------- | ----------------------------------- |
| `DATABASE_URL` | _(paste Internal Database URL)_     |
| `JWT_SECRET`   | _(generate random 32+ char string)_ |
| `CLIENT_URL`   | `*`                                 |
| `NODE_ENV`     | `production`                        |

### Step 4: Seed Database

After first deploy:

1. Go to your Web Service → **Shell** tab
2. Run: `npx prisma db push && npm run db:seed`

### Step 5: Your API is Live!

Your server will be at: `https://aixilcoils-api.onrender.com`

---

## ⚠️ Free Tier Notes

- Service sleeps after 15 min inactivity
- First request after sleep takes ~30 seconds
- Perfect for testing, consider paid tier for production
