FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

# 開発サーバーを起動
CMD ["npm", "start"]