FROM node:16.3.0-alpine

WORKDIR /user/src/app

COPY package.json ./

RUN npm install && npm cache clean --force

COPY . .

EXPOSE 8081

CMD ["npm", "start"]

