FROM node:17.9.0

ARG REACT_APP_SERVER_ADDRESS
ENV REACT_APP_SERVER_ADDRESS $REACT_APP_SERVER_ADDRESS

ENV NODE_ENV=production

WORKDIR /app
COPY package.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/web-client-core/package.json ./packages/web-client-core/
COPY packages/react-client/package.json ./packages/react-client/
COPY packages/server/package.json ./packages/server/

RUN npm install --production

COPY . .

RUN npm -w packages/core run build
RUN npm -w packages/web-client-core run build
RUN npm -w packages/react-client run build
RUN npm -w packages/server run build

ENV WEB_CLIENT_BUNDLE="../react-client/build"

CMD [ "npm", "-w", "packages/server", "run", "start" ]