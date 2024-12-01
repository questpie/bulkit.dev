# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:debian as base
WORKDIR /usr/src/app

# Install curl and wget
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN groupadd -r bunuser && useradd -r -g bunuser bunuser

FROM base AS build
COPY . .
RUN bun install --frozen-lockfile

# Build the API
RUN cd apps/api && bun build:api

FROM base AS release
COPY --from=build /usr/src/app/apps/api/out .
COPY --from=build /usr/src/app/apps/api/src/db/migrations/ ./migrations/

RUN chown -R bunuser:bunuser /usr/src/app

USER bunuser

EXPOSE 3333/tcp

ENV NODE_ENV=production

CMD ["bun", "run", "server.entry.js"]
