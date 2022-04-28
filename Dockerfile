FROM node:17.9.0

ENV NODE_ENV=production

WORKDIR /app
COPY package.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/server/package.json ./packages/server/
COPY packages/web-client/package.json ./packages/web-client/

RUN npm install --production

COPY . .

RUN npm install -g typescript

RUN npm -w packages/core run build
RUN npm -w packages/server run build
RUN npm -w packages/web-client run build

ENV WEB_CLIENT_BUNDLE="../web-client/build"

CMD [ "npm", "-w", "packages/server", "run", "start-prod" ]