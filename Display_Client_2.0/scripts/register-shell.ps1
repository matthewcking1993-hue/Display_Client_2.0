param(
    [Parameter(Mandatory = $true)]
    [string]$ExecutablePath,

    [switch]$Revert
)

$registryPath = 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon'

if ($Revert) {
    Write-Host 'Restoring Explorer.exe as shell'
    Set-ItemProperty -Path $registryPath -Name Shell -Value 'explorer.exe'
    return
}

if (-not (Test-Path $ExecutablePath)) {
    throw "Executable not found: $ExecutablePath"
}

Write-Host "Registering $ExecutablePath as replacement shell"
Set-ItemProperty -Path $registryPath -Name Shell -Value $ExecutablePath
