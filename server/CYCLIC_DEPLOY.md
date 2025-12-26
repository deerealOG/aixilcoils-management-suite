# AIXILCOILS Server Deployment - Cyclic.sh (FREE)

## ✅ Why Cyclic.sh?

- 100% Free tier (no credit card)
- Direct GitHub deployment
- Supports monorepo (subfolder deployment)
- AWS-backed infrastructure

---

## 🚀 Step-by-Step Deployment

### Step 1: Sign Up

1. Go to [cyclic.sh](https://cyclic.sh)
2. Click **"Deploy Now"** or **"Get Started"**
3. Sign in with **GitHub**

### Step 2: Connect Repository

1. Click **"Link Your Own"** or **"Deploy"**
2. Select your `aixilcoils-management-suite` repository
3. **Important**: Set the subdirectory to `server`

### Step 3: Configure Build

Cyclic should auto-detect Node.js. If prompted:

- **Root Directory**: `server`
- **Build Command**: `npm install && npx prisma generate`
- **Start Command**: `npm start`

### Step 4: Set Environment Variables

In the **Variables** tab, add:

| Key            | Value                                |
| -------------- | ------------------------------------ |
| `DATABASE_URL` | _(Your Neon.tech connection string)_ |
| `JWT_SECRET`   | `your-super-secret-key-change-this`  |
| `CLIENT_URL`   | `*`                                  |
| `NODE_ENV`     | `production`                         |

### Step 5: Deploy

1. Click **"Deploy"** or **"Approve & Deploy"**
2. Wait for build to complete (2-5 minutes)

### Step 6: Seed Database

After deployment:

1. Go to **"Logs"** or **"Console"** tab
2. If available, run: `npx prisma db push && npm run db:seed`
3. Or, seed locally pointing to your Neon DB

### Step 7: Your API is Live!

Your server URL: `https://your-app-name.cyclic.app`

---

## 📝 Notes for Neon.tech Database

If you haven't created the Neon database yet:

1. Go to [neon.tech](https://neon.tech) → Sign up (free)
2. Create a project called `aixilcoils`
3. Copy the connection string
4. Use it as `DATABASE_URL` in Cyclic
