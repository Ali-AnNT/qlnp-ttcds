# Build stage
FROM node:20-alpine AS build

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY packages/web/package.json packages/web/pnpm-lock.yaml* ./packages/web/
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./

# Install dependencies
RUN pnpm install --filter @qlnp/web...

# Copy source code
COPY packages/web ./packages/web

# Build the application
# We use build-time arguments for Vite environment variables
ARG VITE_API_URL
ARG VITE_DEV_MODE
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_DEV_MODE=${VITE_DEV_MODE}

WORKDIR /app/packages/web
RUN pnpm build

# Production stage
FROM nginx:stable-alpine
COPY --from=build /app/packages/web/dist /usr/share/nginx/html
# Custom nginx config to handle SPA routing
COPY packages/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
