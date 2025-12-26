# AIXILCOILS Server Deployment - Koyeb (FREE)

## ✅ Why Koyeb?

- Free tier with NO credit card required
- 512MB RAM + free PostgreSQL (1GB)
- Direct GitHub deployment
- Always-on (doesn't sleep like Render)

## 🚀 Step-by-Step Deployment

### Step 1: Create Koyeb Account

1. Go to [koyeb.com](https://koyeb.com)
2. Click **"Get started for free"**
3. Sign up with **GitHub** (recommended)

### Step 2: Create PostgreSQL Database

1. Go to **"Databases"** in sidebar
2. Click **"Create Database"**
3. Name: `aixilcoils-db`
4. Region: Choose closest to you
5. Plan: **Free**
6. Copy the **Connection String**

### Step 3: Deploy the Server

1. Go to **"Apps"** → **"Create App"**
2. Choose **"GitHub"**
3. Select your `aixilcoils-management-suite` repository
4. Configure:
   - **Builder**: Buildpack
   - **Work directory**: `server`
   - **Run command**: `npm start`
   - **Port**: `5000`

### Step 4: Set Environment Variables

Add these in the **Environment Variables** section:

| Variable       | Value                                   |
| -------------- | --------------------------------------- |
| `DATABASE_URL` | _(paste connection string from Step 2)_ |
| `JWT_SECRET`   | `your-super-secret-key-change-this-123` |
| `CLIENT_URL`   | `*`                                     |
| `NODE_ENV`     | `production`                            |

### Step 5: Deploy & Seed

1. Click **"Deploy"**
2. After deployment, open the **Console** tab
3. Run: `npx prisma db push && npm run db:seed`

### Step 6: Get Your URL

Your API will be at: `https://your-app-name.koyeb.app`

---

## 📝 Notes

- Free tier includes 512MB RAM
- Database has 1GB storage limit
- No sleep mode - always available!
