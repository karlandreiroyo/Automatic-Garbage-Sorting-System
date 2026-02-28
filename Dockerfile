# Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Backend
FROM node:20-alpine
WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./

# Copy frontend build into backend
COPY --from=frontend-build /app/dist ./dist

EXPOSE 3001

CMD ["node", "server.js"]