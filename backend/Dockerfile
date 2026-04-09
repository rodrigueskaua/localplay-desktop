FROM node:22-alpine3.21

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

ENV NODE_ENV=development \
    PORT=8000 \
    VIDEOS_DIR=/videos \
    COVERS_DIR=/data/covers \
    DB_PATH=/data/progress.db

EXPOSE 8000

CMD ["npx", "nodemon", "src/server.js"]
