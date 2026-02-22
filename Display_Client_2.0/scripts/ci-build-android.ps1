param(
    [string]$KeystorePath,
    [string]$KeystoreAlias,
    [string]$KeystorePassword
)

if ($KeystorePath) {
    $env:KDS_KEYSTORE = $KeystorePath
    $env:KDS_KEY_ALIAS = $KeystoreAlias
    $env:KDS_KEY_PASSWORD = $KeystorePassword
}

npm ci
npm run build:android
