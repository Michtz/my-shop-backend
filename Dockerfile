# Multi-stage build for Node.js/TypeScript backend
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy package files and install all dependencies including bcrypt rebuild
COPY package*.json ./
RUN npm ci && npm rebuild bcrypt --build-from-source

# Build the source code
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the TypeScript application
ENV NODE_ENV development
RUN npm run build

# Production image, copy files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodeapp

# Copy the built application and node_modules with rebuilt bcrypt
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/uploads ./uploads

# Create uploads directory if it doesn't exist
RUN mkdir -p /app/uploads && chown -R nodeapp:nodejs /app

USER nodeapp

EXPOSE 5000

CMD ["npm", "start"]