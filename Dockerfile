FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm install
COPY src/ ./src/
RUN npm run build

FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY bin/ ./bin/
RUN chmod +x ./bin/mcp-sentinel.js

ENV PORT=8787
EXPOSE 8787
CMD ["node", "bin/mcp-sentinel.js"]
