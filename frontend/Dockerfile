# Build stage: installs dependencies and produces the static build in /app/dist.
FROM node:22-alpine AS build
WORKDIR /app

# Copy the manifests first so the dependency layer is cached until they change.
COPY package.json package-lock.json ./
# npm ci installs exactly what package-lock.json says, which makes builds reproducible.
RUN npm ci

COPY . .
RUN npm run build

# Runtime stage: nginx serves the static files and proxies the API. Node is not included.
FROM nginx:1.28-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY proxy_headers.conf /etc/nginx/proxy_headers.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# 127.0.0.1, not localhost: in Alpine localhost resolves to IPv6 first, and nginx listens on IPv4.
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
