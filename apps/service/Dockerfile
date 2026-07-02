FROM oven/bun:1 AS runner
WORKDIR /app
COPY package.json bun.lock* tsconfig.json ./
RUN bun install --frozen-lockfile
COPY . .
EXPOSE 4000
CMD ["bun", "run", "src/index.ts"]
