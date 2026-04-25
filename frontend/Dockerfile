FROM node:lts-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
ARG NEXT_PUBLIC_KONG_URL
ENV NEXT_PUBLIC_KONG_URL=$NEXT_PUBLIC_KONG_URL

RUN npm run build

FROM node:lts-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]