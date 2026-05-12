FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY voice-bridge ./voice-bridge
COPY src ./src
COPY tsconfig.json ./tsconfig.json
COPY next-env.d.ts ./next-env.d.ts

RUN npm ci

ENV NODE_ENV=production
ENV PORT=8787

EXPOSE 8787

CMD ["npm","run","voice:bridge"]

