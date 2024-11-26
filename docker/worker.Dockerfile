# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:debian as base
WORKDIR /usr/src/app

# Create a non-root user
RUN groupadd -r bunuser && useradd -r -g bunuser bunuser

FROM base AS build
ARG DATABASE_URL
COPY . .
RUN bun install --frozen-lockfile

# Build the API
RUN cd apps/api && bun build:worker

FROM base AS release
COPY --from=build /usr/src/app/apps/api/out .

USER bunuser

EXPOSE 3333/tcp

ENV NODE_ENV=production

CMD ["bun", "run", "worker.entry.js"]
