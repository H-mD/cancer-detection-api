FROM node:18-slim

WORKDIR /app

COPY . /app

RUN npm install

EXPOSE 3000

CMD ["npm", "run", "start"]