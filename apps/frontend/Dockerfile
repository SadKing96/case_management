# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy the entire monorepo to ensure shared packages are available
COPY . .

# Install dependencies for the entire workspace
# Using npm ci for a clean, deterministic install
RUN npm ci

# Build the frontend application
# This assumes the build script in apps/frontend/package.json is "build"
RUN npm run build -w apps/frontend

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Remove default Nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy the built artifacts from the builder stage
# Vite adds a 'dist' folder by default
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
