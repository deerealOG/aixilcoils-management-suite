FROM node:22-alpine

WORKDIR /app

# Copy only server package files first for better layer caching
COPY server/package*.json ./
COPY server/prisma ./prisma/

# Install ALL dependencies (including devDependencies for prisma CLI)
RUN npm install

# Generate Prisma client with explicit output
RUN npx prisma generate

# Copy server source code
COPY server/ ./

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 5000

# Set production environment
ENV NODE_ENV=production

# Run migrations and start server
CMD sh -c "npx prisma migrate deploy && npm start"
