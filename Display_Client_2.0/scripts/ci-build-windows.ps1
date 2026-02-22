param(
    [string]$CertificatePath,
    [string]$CertificatePassword
)

if ($CertificatePath) {
    $env:CSC_LINK = $CertificatePath
}
if ($CertificatePassword) {
    $env:CSC_KEY_PASSWORD = $CertificatePassword
}

npm ci
npm run build:windows
