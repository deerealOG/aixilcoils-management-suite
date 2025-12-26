# AIXILCOILS Server Deployment - Railway

## Quick Deploy

1. Push this directory to a Git repository
2. Connect to [Railway](https://railway.app)
3. Create a new project from GitHub
4. Add a PostgreSQL database service
5. Set environment variables:
   - `DATABASE_URL` → From Railway Postgres
   - `JWT_SECRET` → Generate a secure random string
   - `CLIENT_URL` → Your frontend URL (for CORS)
   - `NODE_ENV` → production

## Environment Variables Required

```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-super-secret-jwt-key-here
CLIENT_URL=*
NODE_ENV=production
PORT=5000
```

## After Deploy

1. Run database migrations: `npx prisma db push`
2. Seed database: `npm run db:seed`
