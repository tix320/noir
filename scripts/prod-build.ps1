$env:REACT_APP_USE_SAME_ORIGIN="true"

npm install --production

npm -w packages/core run build
npm -w packages/web-client-core run build
npm -w packages/react-client run build
npm -w packages/server run build