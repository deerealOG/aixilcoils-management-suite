# AIXILCOILS Server Deployment - AWS (Free Tier)

## ⚠️ Important: AWS Free Tier

- AWS Free Tier is available for **12 months** after signup
- **Credit card required** for registration (but won't be charged within free limits)
- Free tier includes: EC2 t2.micro, RDS db.t2.micro

---

## Option A: AWS Elastic Beanstalk (Easiest)

### Step 1: Create AWS Account

1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click **"Create an AWS Account"**
3. Complete registration (credit card required for verification)

### Step 2: Install EB CLI

```bash
pip install awsebcli
```

Or download from: https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html

### Step 3: Initialize EB in Server Directory

```bash
cd server
eb init -p node.js aixilcoils-api --region us-east-1
```

### Step 4: Create Environment

```bash
eb create aixilcoils-production --single --instance-type t2.micro
```

### Step 5: Set Environment Variables

```bash
eb setenv DATABASE_URL="your-rds-connection-string" JWT_SECRET="your-secret" CLIENT_URL="*" NODE_ENV="production"
```

### Step 6: Deploy

```bash
eb deploy
```

---

## Option B: AWS Lightsail (Simpler, Fixed Pricing)

### Step 1: Go to Lightsail

1. Go to [lightsail.aws.amazon.com](https://lightsail.aws.amazon.com)
2. Click **"Create instance"**

### Step 2: Configure Instance

- **Platform**: Linux/Unix
- **Blueprint**: Node.js
- **Instance plan**: $3.50/month (first 3 months free)
- **Name**: `aixilcoils-api`

### Step 3: Connect via SSH

1. Click on instance → **"Connect using SSH"**
2. Clone your repo:
   ```bash
   git clone https://github.com/deerealOG/aixilcoils-management-suite.git
   cd aixilcoils-management-suite/server
   npm install
   npx prisma generate
   ```

### Step 4: Create Database

1. In Lightsail, go to **Databases** → **Create database**
2. Choose PostgreSQL, $15/month tier (free for 1 month on new accounts)
3. Copy connection string

### Step 5: Set Up and Run

```bash
export DATABASE_URL="your-connection-string"
export JWT_SECRET="your-secret"
export CLIENT_URL="*"
export NODE_ENV="production"
npm start
```

---

## For Database: AWS RDS PostgreSQL

### Create RDS Instance

1. Go to [RDS Console](https://console.aws.amazon.com/rds)
2. Click **"Create database"**
3. Choose:
   - **PostgreSQL**
   - **Free tier** checkbox
   - **db.t3.micro** instance
4. Set credentials and create
5. Copy the endpoint for `DATABASE_URL`

**Connection string format:**

```
postgresql://username:password@your-rds-endpoint:5432/postgres
```

---

## 📝 AWS Free Tier Limits (12 months)

- **EC2**: 750 hours/month (t2.micro)
- **RDS**: 750 hours/month (db.t2.micro, 20GB)
- After free tier expires, expect ~$15-25/month
