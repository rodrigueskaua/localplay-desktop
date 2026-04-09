FROM node:22-alpine3.21

WORKDIR /app

COPY package.json ./
RUN npm install

ENV NODE_ENV=development \
    NUXT_HOST=0.0.0.0 \
    NUXT_PORT=3000

EXPOSE 3000

CMD ["npx", "nuxt", "dev", "--host", "0.0.0.0", "--port", "3000"]
