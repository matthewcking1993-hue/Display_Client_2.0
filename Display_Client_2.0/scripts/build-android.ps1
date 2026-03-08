[CmdletBinding()]
param(
    [switch]$Release,
    [switch]$SkipWebBuild,
    [switch]$SkipSync
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$androidDir = Join-Path $repoRoot 'android'

function Test-JavaHome {
    if (-not $env:JAVA_HOME) {
        throw 'JAVA_HOME is not set. Point it to your JDK installation before running this script.'
    }

    $javaExe = Join-Path $env:JAVA_HOME 'bin/java.exe'
    if (-not (Test-Path $javaExe)) {
        throw "java.exe not found at $javaExe. Verify JAVA_HOME points to a valid JDK."
    }

    Write-Host "JAVA_HOME -> $env:JAVA_HOME"
}

function Invoke-Native {
    param(
        [string]$Message,
        [string]$Command,
        [string[]]$Arguments
    )

    Write-Host ''
    Write-Host "==> $Message"
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Step failed: $Message"
    }
}

Test-JavaHome

Push-Location $repoRoot
try {
    if (-not $SkipWebBuild) {
        Invoke-Native -Message 'Building web assets (npm run build)' -Command 'npm' -Arguments @('run', 'build')
    } else {
        Write-Host 'Skipping npm run build'
    }

    if (-not $SkipSync) {
        Invoke-Native -Message 'Syncing Capacitor assets (npx cap sync android)' -Command 'npx' -Arguments @('cap', 'sync', 'android')
    } else {
        Write-Host 'Skipping npx cap sync android'
    }

    Push-Location $androidDir
    try {
        $gradleTask = if ($Release) { 'assembleRelease' } else { 'assembleDebug' }
        Invoke-Native -Message "Running Gradle $gradleTask" -Command '.\gradlew.bat' -Arguments @($gradleTask)
    } finally {
        Pop-Location
    }
} finally {
    Pop-Location
}

$buildTypeFolder = if ($Release) { 'release' } else { 'debug' }
$apkName = if ($Release) { 'app-release.apk' } else { 'app-debug.apk' }
$apkPath = Join-Path $androidDir "app\build\outputs\apk\$buildTypeFolder\$apkName"

if (Test-Path $apkPath) {
    Write-Host ''
    Write-Host "APK ready -> $apkPath"
} else {
    throw "Gradle completed but $apkPath was not found."
}
