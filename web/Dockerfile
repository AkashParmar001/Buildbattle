# InsightFlow web app — production image (Next.js standalone).
# Build from the repo root:  docker build -f web/Dockerfile -t insightflow-web ./web
# Or via compose:             docker compose up --build web
# Runs entirely from the committed seed data (web/data/analysis.json) when no
# Supabase env vars are set. User submissions persist in /app/data (mount a
# volume there) as data/user-*.json overlays.

FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# No env vars needed: the build uses seed data; Supabase is runtime-optional.
RUN npm run build

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 --ingroup nodejs nextjs

# Standalone server + traced deps. JSON seed files and public/ images are read
# via fs at runtime, so they are copied explicitly (standalone tracing only
# covers npm imports).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/data ./data
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Writable overlay dir for user submissions (mount a volume in compose).
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data
VOLUME /app/data

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
