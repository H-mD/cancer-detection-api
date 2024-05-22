FROM node:18-slim

WORKDIR /app

COPY . /app

RUN npm install

EXPOSE 8080

CMD ["npm", "run", "start"]