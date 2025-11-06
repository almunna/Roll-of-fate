# --- Dependencies stage ---
FROM node:20-alpine AS deps
WORKDIR /app
ENV NODE_ENV=development
# Fixes some native packages and sharp on alpine
RUN apk add --no-cache libc6-compat

# Install deps (prefer lockfile when present)
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build your Next.js app
RUN npm run build

# --- Runtime stage ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080 \
    HOSTNAME=0.0.0.0

# Copy only what's needed at runtime
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
# Reuse the built node_modules (simplest & reliable for Next start)
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 8080

# Start Next in production
CMD ["npm", "run", "start", "--", "-p", "8080"]
