# --- Dependencies stage ---
FROM node:20-alpine AS deps
WORKDIR /app
ENV NODE_ENV=development
# Helps native deps (e.g., sharp) on Alpine
RUN apk add --no-cache libc6-compat

# Install deps (use lockfile when present)
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Reuse deps layer, then add source and build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Runtime stage ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0
# IMPORTANT: Do NOT set PORT here; Render provides it at runtime.

# Copy only what’s needed to run "next start"
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=deps  /app/node_modules ./node_modules

# Do NOT EXPOSE a fixed port; Render injects PORT
# EXPOSE 8080  <- remove this

# Start Next.js; uses PORT from env (via package.json script)
# Ensure your package.json has: "start": "next start -p ${PORT:-3000}"
CMD ["sh", "-c", "npm start"]
