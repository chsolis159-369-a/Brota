# Conecta Google Stitch como servidor MCP "stitch" de Claude Code (alcance de usuario).
# La clave se pega en esta ventana y queda solo en la configuración de Claude Code del usuario:
# nunca en el repositorio ni en el chat. El resultado (sin la clave) va a %TEMP%\brota-stitch.log.
$ErrorActionPreference = 'Stop'
$log = Join-Path $env:TEMP 'brota-stitch.log'
Set-Content -Path $log -Value "INICIO $(Get-Date -Format s)" -Encoding utf8

function Escribir([string]$texto) { Add-Content -Path $log -Value $texto -Encoding utf8 }

try {
  Write-Host ''
  Write-Host 'Conectar Google Stitch con Claude Code' -ForegroundColor Green
  Write-Host '1. Se abre stitch.withgoogle.com/settings en el navegador.'
  Write-Host '2. En "API Keys", toca "Create API Key" y copia la clave.'
  Write-Host '3. Pegala aca abajo con clic derecho o Ctrl+V y apreta Enter.'
  Write-Host '   No se ve mientras la pegas: es normal, por seguridad.'
  Write-Host ''
  Start-Process 'https://stitch.withgoogle.com/settings'

  $clave = ''
  for ($intento = 1; $intento -le 5 -and $clave.Length -lt 10; $intento++) {
    $segura = Read-Host 'Clave de Stitch' -AsSecureString
    $clave = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($segura)).Trim()
    if ($clave.Length -lt 10) { Write-Host 'No llego la clave (quedo vacia). Copiala en Stitch y volve a pegarla.' -ForegroundColor Yellow }
  }
  if ($clave.Length -lt 10) { throw 'La clave parece vacia o incompleta.' }
  Escribir 'CLAVE recibida (no se guarda en este registro)'

  Write-Host ''
  Write-Host 'Configurando el servidor "stitch" (la primera vez descarga Claude Code, puede tardar)...'
  $cli = @('-y', '@anthropic-ai/claude-code')
  # Los comandos de npx escriben avisos en stderr: no se cortan por eso, se mira el código de salida.
  $ErrorActionPreference = 'Continue'
  # Si ya existia, se reemplaza (si no existia, el aviso se ignora).
  & npx @cli mcp remove stitch --scope user 2>&1 | Out-Null
  $salida = & npx @cli mcp add --transport http --scope user stitch 'https://stitch.googleapis.com/mcp' --header "X-Goog-Api-Key: $clave" 2>&1 | Out-String
  $codigo = $LASTEXITCODE
  Escribir ('ADD codigo ' + $codigo + ' ' + $salida.Replace($clave, '***').Trim())
  if ($codigo -ne 0) { throw ('No se pudo agregar el servidor: ' + $salida.Replace($clave, '***').Trim()) }

  Write-Host 'Verificando la conexion...'
  $lista = & npx @cli mcp list 2>&1 | Out-String
  $linea = ($lista -split "`r?`n" | Where-Object { $_ -match 'stitch' }) -join ' | '
  Escribir ('LISTA ' + $linea.Replace($clave, '***'))
  Write-Host $linea.Replace($clave, '***')
  Escribir 'FIN ok'
  Write-Host ''
  Write-Host 'Listo. Ya podes cerrar esta ventana y abrir una conversacion nueva en Claude Code.' -ForegroundColor Green
} catch {
  Escribir ('FIN error ' + $_.Exception.Message)
  Write-Host ('Error: ' + $_.Exception.Message) -ForegroundColor Red
} finally {
  $clave = $null
  Read-Host 'Enter para cerrar'
}
