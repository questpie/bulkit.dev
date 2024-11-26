FROM oven/bun:debian as base
WORKDIR /usr/src/app
COPY . .

ENV NODE_ENV=production
RUN bun install --frozen-lockfile

ENV NEXT_PUBLIC_API_URL=NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_PUSHER_APP_KEY=NEXT_PUBLIC_PUSHER_APP_KEY
ENV NEXT_PUBLIC_PUSHER_APP_CLUSTER=NEXT_PUBLIC_PUSHER_APP_CLUSTER
ENV NEXT_PUBLIC_PUSHER_HOST=NEXT_PUBLIC_PUSHER_HOST
ENV NEXT_PUBLIC_PUSHER_PORT=NEXT_PUBLIC_PUSHER_PORT
ENV NEXT_PUBLIC_PUSHER_USE_TLS=NEXT_PUBLIC_PUSHER_USE_TLS

RUN cd apps/app && bun run build


FROM node:lts-alpine AS runner
WORKDIR /usr/src/app

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=base /usr/src/app/apps/app/public ./apps/app/public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=base --chown=nextjs:nodejs /usr/src/app/apps/app/.next/standalone/ ./
COPY --from=base --chown=nextjs:nodejs /usr/src/app/apps/app/.next/static ./apps/app/.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME 0.0.0.0

CMD ["node", "apps/app/server.js"]