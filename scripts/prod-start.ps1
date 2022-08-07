Param(
    [int]
    [Parameter(Mandatory = $true)]
    $ServerPort,

    [String]
    [Parameter(Mandatory = $true)]
    $DBAddress
)

& "$PSScriptRoot/prod-build.ps1"

$env:SERVER_PORT=$ServerPort
$env:DB_HOST=$DBAddress
$env:WEB_CLIENT_BUNDLE="../react-client/build"

$env:NODE_ENV="production"

npm -w packages/server run start