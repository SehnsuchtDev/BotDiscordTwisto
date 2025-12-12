FROM node:latest

COPY ./app /app 

WORKDIR /app

RUN npm install

CMD ["node", "./src/index.js"]