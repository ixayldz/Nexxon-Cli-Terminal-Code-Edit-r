# Multi-stage build for Nexxon CLI
# Stage 1: Build
FROM node:lts-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package*.json tsconfig.json tsconfig.base.json ./
COPY packages ./packages

# Install dependencies and build
RUN npm ci
RUN npm run build

# Stage 2: Runtime
FROM node:lts-alpine

WORKDIR /app

# Copy built artifacts and runtime dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules

# Install only production dependencies
RUN npm ci --production

# Create nexxon user for security
RUN addgroup -S nexxon && adduser -S nexxon -G nexxon
USER nexxon

# Expose potential ports (if runtime needs HTTP)
EXPOSE 3000

# Set default command
ENTRYPOINT ["node", "packages/cli/dist/main.js"]
CMD ["--help"]
