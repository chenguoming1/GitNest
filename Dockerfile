# Use official Node.js lightweight Alpine image
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifest files
COPY package.json package-lock.json* ./

# Install all dependencies
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the frontend and server bundler
RUN npm run build

# --- Second Stage (Production Runtime) ---
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy package.json and install production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy compiled artifacts from the builder stage
COPY --from=builder /app/dist ./dist

# Expose port 3000 (standard ingress port for the reverse proxy and Docker container)
EXPOSE 3000

# Run the app
CMD ["npm", "run", "start"]
