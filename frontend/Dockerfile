# ─────────────────────────────────────────────
# Stage 1: Build Angular app
# ─────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --silent

COPY . .
RUN npm run build:prod

# Angular 17 esbuild builder outputs to dist/<name>/browser/
# Verify the output exists
RUN ls -la dist/myaangan-frontend/browser/

# ─────────────────────────────────────────────
# Stage 2: Serve with Nginx
# ─────────────────────────────────────────────
FROM nginx:1.25-alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/myaangan.conf

# ✅ Correct path for Angular 17 esbuild builder output
COPY --from=builder /app/dist/myaangan-frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
