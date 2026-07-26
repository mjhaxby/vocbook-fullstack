FROM node:20-bullseye-slim

WORKDIR /app

COPY package.json package-lock.json /app/
RUN npm ci --legacy-peer-deps --no-audit --no-fund

COPY . /app/

EXPOSE 3000

CMD ["npm", "start"]