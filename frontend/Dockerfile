# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENV PORT=80
# Set BACKEND_URL to your backend API root (e.g. https://your-backend.up.railway.app) so /api is proxied there
ENV BACKEND_URL=http://127.0.0.1:3001
CMD ["/docker-entrypoint.sh"]
