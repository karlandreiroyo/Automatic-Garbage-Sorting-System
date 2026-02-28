# Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Build backend and run both
FROM node:20-alpine

WORKDIR /app

# Backend
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./

# Frontend static files (from build stage)
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Install nginx and create start script (nginx in background, node in foreground)
RUN apk add --no-cache nginx && \
    echo '#!/bin/sh' > /start.sh && \
    echo 'nginx -g "daemon off;" &' >> /start.sh && \
    echo 'exec node server.js' >> /start.sh && \
    chmod +x /start.sh

EXPOSE 80 3001

CMD ["/start.sh"]
