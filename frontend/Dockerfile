# Multi-stage build for the SJT Next.js frontend.
# Using an explicit Dockerfile removes Railway's build/type auto-detection,
# which is what caused the Caddy static-server fallback.
FROM node:20-alpine AS build

WORKDIR /app
COPY package.json ./
RUN npm cache clean --force
RUN HUSKY=0 npm install --no-package-lock
COPY . .
RUN npm run build

FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
# Copy only what the production server needs.
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/next.config.ts ./next.config.ts
EXPOSE 3000
# start script binds to 0.0.0.0 and $PORT (Railway injects PORT).
CMD ["npm", "run", "start"]
