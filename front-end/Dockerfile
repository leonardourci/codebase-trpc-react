FROM node:20-alpine AS build
WORKDIR /app

# Install security updates
RUN apk update && apk upgrade

# Copy frontend package files
COPY front-end/package*.json ./
RUN npm ci && npm cache clean --force

# Copy frontend source and environment
COPY front-end/ ./
COPY .env ./.env

# Build the application
RUN npm run build

FROM nginx:1.25-alpine AS web

# Install security updates and curl for health checks
RUN apk update && apk upgrade && apk add --no-cache curl

# Create non-root user for nginx
RUN addgroup -g 1001 -S nginx-app && adduser -S nginx-app -u 1001

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY front-end/nginx/default.conf /etc/nginx/conf.d/default.conf

# Create health check endpoint
RUN echo '<!DOCTYPE html><html><body>OK</body></html>' > /usr/share/nginx/html/health

# Set proper permissions
RUN chown -R nginx-app:nginx-app /usr/share/nginx/html && \
    chown -R nginx-app:nginx-app /var/cache/nginx && \
    chown -R nginx-app:nginx-app /var/log/nginx && \
    chown -R nginx-app:nginx-app /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx-app:nginx-app /var/run/nginx.pid

# Switch to non-root user
USER nginx-app

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
