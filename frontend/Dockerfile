# Multi-stage build for the SJT Next.js frontend. Works on any Docker host.
#
# IMPORTANT: NEXT_PUBLIC_* variables are baked in at BUILD time. Pass them as
# build args, e.g.:
#   docker build \
#     --build-arg NEXT_PUBLIC_API_URL=https://api.example.com/api \
#     --build-arg NEXT_PUBLIC_SITE_URL=https://app.example.com \
#     -t sjt-frontend .

FROM node:20-alpine AS build
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_REVERB_APP_KEY
ARG NEXT_PUBLIC_REVERB_HOST
ARG NEXT_PUBLIC_REVERB_PORT
ARG NEXT_PUBLIC_REVERB_SCHEME
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_REVERB_APP_KEY=$NEXT_PUBLIC_REVERB_APP_KEY \
    NEXT_PUBLIC_REVERB_HOST=$NEXT_PUBLIC_REVERB_HOST \
    NEXT_PUBLIC_REVERB_PORT=$NEXT_PUBLIC_REVERB_PORT \
    NEXT_PUBLIC_REVERB_SCHEME=$NEXT_PUBLIC_REVERB_SCHEME

COPY package.json package-lock.json ./
# HUSKY=0 skips git hooks (not present in CI); --include=dev keeps build tooling.
RUN HUSKY=0 npm ci --include=dev
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
# start script binds to 0.0.0.0 and $PORT (injected by the host, default 3000).
CMD ["npm", "run", "start"]
