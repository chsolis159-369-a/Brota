# Asistente para cargar las claves de BROTA en GitHub (Actions) sin escribirlas en el codigo ni en el chat.
# Pide cada dato en esta ventana (las claves secretas no se muestran al pegarlas) y en cada paso abre en el
# navegador la pagina de donde sacarlo. Las guarda como variables y secretos del repositorio con la CLI de
# GitHub y publica la funcion del Agente con IA. Deja en %TEMP%\brota-claves.log solo el avance (sin datos).
# Uso: clic derecho > Ejecutar con PowerShell, o: powershell -ExecutionPolicy Bypass -File tools\cargar-claves.ps1

$repo = 'chsolis159-369-a/Brota'
$gh = 'C:\Program Files\GitHub CLI\gh.exe'
if (-not (Test-Path $gh)) { $gh = 'gh' }
$log = Join-Path $env:TEMP 'brota-claves.log'
Set-Content -Path $log -Value 'inicio' -Encoding ascii

function Avance([string]$texto) { Add-Content -Path $log -Value $texto -Encoding ascii }

function Leer-Secreto([string]$texto) {
  $seguro = Read-Host -AsSecureString $texto
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($seguro)
  try { return ([Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)).Trim() }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

function Paso([string]$titulo, [string[]]$lineas, [string]$pagina) {
  Write-Host ''
  Write-Host $titulo -ForegroundColor Cyan
  foreach ($l in $lineas) { Write-Host "  $l" }
  if ($pagina) { Start-Process $pagina }
}

function Mal([string]$texto) { Write-Host "  No parece correcto: $texto Proba de nuevo." -ForegroundColor Yellow }

Write-Host ''
Write-Host '=== BROTA: cargar las claves en GitHub ===' -ForegroundColor Green
Write-Host 'Son 5 datos. En cada paso se abre sola la pagina de donde sacarlo.'
Write-Host 'Para pegar en esta ventana: clic derecho. Despues, Enter.'

# 1. Reference ID (acepta el codigo solo, la direccion del navegador o la URL https://<ref>.supabase.co)
Paso 'PASO 1 de 5: el ID de tu proyecto de Supabase' @(
  'Se abrio Supabase: entra a tu proyecto.',
  'Copia la direccion completa de la barra del navegador (o el Project ID) y pegala aca.'
) 'https://supabase.com/dashboard/projects'
while ($true) {
  $v = (Read-Host 'Pega aca').Trim()
  if ($v -match 'project/([a-z0-9]{15,30})') { $ref = $Matches[1]; break }
  if ($v -match '([a-z0-9]{15,30})\.supabase\.co') { $ref = $Matches[1]; break }
  if ($v -match '^[a-z0-9]{15,30}$') { $ref = $v; break }
  Mal 'tiene que ser la direccion de tu proyecto (supabase.com/dashboard/project/...) o su codigo.'
}
Write-Host "  OK, proyecto $ref" -ForegroundColor Green
Avance 'paso 1 ok'

# 2. Clave publica
Paso 'PASO 2 de 5: la clave publica de Supabase' @(
  'Se abrio la pagina API Keys de tu proyecto.',
  'Copia la "Publishable key" (empieza con sb_publishable_) y pegala aca.',
  'Si no la ves, abri la pestania "Legacy API Keys" y copia la "anon public" (empieza con eyJ).'
) "https://supabase.com/dashboard/project/$ref/settings/api-keys"
while ($true) {
  $anon = (Read-Host 'Pega aca').Trim()
  if ($anon -match '^(sb_publishable_|eyJ)') { break }
  Mal 'empieza con sb_publishable_ o con eyJ.'
}
Write-Host '  OK' -ForegroundColor Green
Avance 'paso 2 ok'

# 3. Access token
Paso 'PASO 3 de 5: el access token de Supabase' @(
  'Se abrio la pagina Access Tokens.',
  'Toca "Generate new token", ponele de nombre github y copialo (se muestra una sola vez).',
  'Pegalo aca: vas a ver asteriscos, es normal.'
) 'https://supabase.com/dashboard/account/tokens'
while ($true) {
  $token = Leer-Secreto 'Pega aca'
  if ($token -match '^sbp_') { break }
  Mal 'empieza con sbp_.'
}
Write-Host '  OK' -ForegroundColor Green
Avance 'paso 3 ok'

# 4. Contrasena de la base
Paso 'PASO 4 de 5: la contrasena de la base de datos' @(
  'Es la que elegiste al crear el proyecto. Escribila y Enter (vas a ver asteriscos).',
  'Si no te la acordas, escribi la letra R y Enter: se abre la pagina para cambiarla',
  '("Reset database password" > generar, copiar y guardar) y despues la pegas aca.'
) $null
while ($true) {
  $clave = Leer-Secreto 'Contrasena (o R)'
  if ($clave -eq 'R' -or $clave -eq 'r') {
    Start-Process "https://supabase.com/dashboard/project/$ref/database/settings"
    Write-Host '  Se abrio la pagina. Cuando la tengas copiada, pegala aca.'
    continue
  }
  if ($clave.Length -ge 6) { break }
  Mal 'la contrasena tiene al menos 6 caracteres.'
}
Write-Host '  OK' -ForegroundColor Green
Avance 'paso 4 ok'

# 5. API key de Anthropic
Paso 'PASO 5 de 5: la clave de Anthropic' @(
  'Se abrio la consola de Anthropic.',
  'Primero carga credito en Settings > Billing (minimo US$ 5); sin credito el agente no responde.',
  'Despues en Settings > API Keys toca "Create Key", nombre brota, y copiala (se muestra una sola vez).',
  'Pegala aca: vas a ver asteriscos, es normal.'
) 'https://console.anthropic.com/settings/keys'
while ($true) {
  $anthropic = Leer-Secreto 'Pega aca'
  if ($anthropic -match '^sk-ant-') { break }
  Mal 'empieza con sk-ant-.'
}
Write-Host '  OK' -ForegroundColor Green
Avance 'paso 5 ok'

Write-Host ''
Write-Host 'Cargando en GitHub...' -ForegroundColor Green
$errores = 0
function Cargar([string]$tipo, [string]$nombre, [string]$valor) {
  & $gh $tipo set $nombre --repo $repo --body $valor
  if ($LASTEXITCODE -ne 0) { $script:errores++; Write-Host "  Fallo al cargar $nombre" -ForegroundColor Red; Avance "fallo $nombre" }
}
Cargar 'variable' 'SUPABASE_PROJECT_REF' $ref
Cargar 'variable' 'EXPO_PUBLIC_SUPABASE_URL' "https://$ref.supabase.co"
Cargar 'variable' 'EXPO_PUBLIC_SUPABASE_ANON_KEY' $anon
Cargar 'secret' 'SUPABASE_ACCESS_TOKEN' $token
Cargar 'secret' 'SUPABASE_DB_PASSWORD' $clave
Cargar 'secret' 'ANTHROPIC_API_KEY' $anthropic
$token = $null; $clave = $null; $anthropic = $null

if ($errores -gt 0) {
  Write-Host ''
  Write-Host 'Algo fallo al cargar en GitHub. No cierres esta ventana y avisale a Claude.' -ForegroundColor Red
  Avance 'fin con errores'
  Read-Host 'Presiona Enter para cerrar'
  exit 1
}
Avance 'github ok'

Write-Host 'Publicando la funcion del Agente con IA...' -ForegroundColor Green
& $gh workflow run supabase.yml --repo $repo
if ($LASTEXITCODE -eq 0) { Avance 'publicacion lanzada' } else { Avance 'fallo publicacion' }

Write-Host ''
Write-Host 'LISTO. Ya podes cerrar esta ventana y avisarle a Claude.' -ForegroundColor Green
Avance 'fin'
Read-Host 'Presiona Enter para cerrar'
