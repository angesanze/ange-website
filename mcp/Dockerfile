# MCP server — small Node service (no build step).
FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund --omit=dev
COPY . .
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "src/server.js"]
