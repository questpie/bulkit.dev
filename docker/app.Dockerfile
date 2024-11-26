FROM oven/bun:debian as base
WORKDIR /usr/src/app
COPY . .

ENV NODE_ENV=production
RUN bun install --frozen-lockfile
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