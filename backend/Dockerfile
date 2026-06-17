# Backend — Strapi v5 production image.
# Node 22 on Debian slim (same base as the dev container, so native deps like
# sharp / better-sqlite3 resolve from prebuilt binaries — no compiler needed).
FROM node:22-bookworm-slim

WORKDIR /opt/app

# Install all deps (incl. dev) — the TypeScript admin needs them to build.
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# App source
COPY . .

# Build the admin panel (production-optimized).
RUN NODE_ENV=production npm run build

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=1337
EXPOSE 1337
CMD ["npm", "run", "start"]
