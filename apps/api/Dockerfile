FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY apps/api/package.json ./
RUN npm install

COPY apps/api ./

EXPOSE 4000

CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run start:dev"]
