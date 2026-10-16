# Website renco.vn — ảnh Docker cho production (Next.js standalone + Payload CMS).
# Build không cần cơ sở dữ liệu; migration chạy tự động khi máy chủ khởi động (prodMigrations).

FROM node:22.22.0-alpine AS base
RUN apk add --no-cache libc6-compat
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Biến NEXT_PUBLIC_* được nhúng lúc build
ARG NEXT_PUBLIC_SITE_URL=https://renco.vn
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=
ARG NEXT_PUBLIC_UMAMI_SRC=
ARG NEXT_PUBLIC_UMAMI_ID=
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY \
    NEXT_PUBLIC_UMAMI_SRC=$NEXT_PUBLIC_UMAMI_SRC \
    NEXT_PUBLIC_UMAMI_ID=$NEXT_PUBLIC_UMAMI_ID \
    PAYLOAD_SECRET=build-time-placeholder \
    DATABASE_URL=postgres://build:build@127.0.0.1:1/build
RUN corepack enable pnpm && pnpm build

FROM base AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 UPLOAD_DIR=/data/uploads
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs \
    && mkdir -p /data/uploads/media /data/uploads/documents && chown -R nextjs:nodejs /data
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]
