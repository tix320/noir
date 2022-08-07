Param(
    [String]
    [Parameter(Mandatory = $true)]
    $Hostname
)

$env:REACT_APP_SERVER_ADDRESS=$Hostname

npm install --production

npm -w packages/core run build
npm -w packages/web-client-core run build
npm -w packages/react-client run build
npm -w packages/server run build