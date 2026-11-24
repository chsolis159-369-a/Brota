# Asistente para cargar las claves de BROTA en GitHub (Actions) sin escribirlas en el codigo ni en el chat.
# Pide cada dato en esta ventana (las claves secretas no se muestran al pegarlas), las guarda como
# variables y secretos del repositorio con la CLI de GitHub y publica la funcion del Agente con IA.
# Uso: clic derecho > Ejecutar con PowerShell, o: powershell -ExecutionPolicy Bypass -File tools\cargar-claves.ps1

$ErrorActionPreference = 'Stop'
$repo = 'chsolis159-369-a/Brota'
$gh = 'C:\Program Files\GitHub CLI\gh.exe'
if (-not (Test-Path $gh)) { $gh = 'gh' }

function Leer-Secreto([string]$texto) {
  $seguro = Read-Host -AsSecureString $texto
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($seguro)
  try { return ([Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)).Trim() }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

function Pedir([string]$texto, [scriptblock]$valido, [string]$ayuda, [switch]$secreto) {
  while ($true) {
    $v = if ($secreto) { Leer-Secreto $texto } else { (Read-Host $texto).Trim() }
    if (& $valido $v) { return $v }
    Write-Host "  No parece correcto: $ayuda" -ForegroundColor Yellow
  }
}

Write-Host ''
Write-Host '=== BROTA: cargar las claves en GitHub ===' -ForegroundColor Green
Write-Host 'Los datos 3, 4 y 5 son secretos: al pegarlos no se ven, es normal. Pega con clic derecho.'
Write-Host ''

$ref = Pedir '1/5 ID del proyecto de Supabase (Reference ID, ej. abcdefghijklmnopqrst)' { param($v) $v -match '^[a-z0-9]{15,30}$' } 'son solo letras minusculas y numeros, el codigo de la direccion del proyecto.'
$anon = Pedir '2/5 Clave publica de Supabase (Publishable "sb_publishable_..." o anon "eyJ...")' { param($v) $v -match '^(sb_publishable_|eyJ)' } 'empieza con sb_publishable_ o con eyJ.'
$token = Pedir '3/5 Access token de Supabase (empieza con sbp_)' { param($v) $v -match '^sbp_' } 'se genera en supabase.com/dashboard/account/tokens y empieza con sbp_.' -secreto
$clave = Pedir '4/5 Contrasena de la base de datos de Supabase' { param($v) $v.Length -ge 6 } 'es la contrasena que elegiste al crear el proyecto.' -secreto
$anthropic = Pedir '5/5 API key de Anthropic (empieza con sk-ant-)' { param($v) $v -match '^sk-ant-' } 'se crea en console.anthropic.com > Settings > API Keys y empieza con sk-ant-.' -secreto

Write-Host ''
Write-Host 'Cargando en GitHub...' -ForegroundColor Green
& $gh variable set SUPABASE_PROJECT_REF --repo $repo --body $ref
& $gh variable set EXPO_PUBLIC_SUPABASE_URL --repo $repo --body "https://$ref.supabase.co"
& $gh variable set EXPO_PUBLIC_SUPABASE_ANON_KEY --repo $repo --body $anon
& $gh secret set SUPABASE_ACCESS_TOKEN --repo $repo --body $token
& $gh secret set SUPABASE_DB_PASSWORD --repo $repo --body $clave
& $gh secret set ANTHROPIC_API_KEY --repo $repo --body $anthropic
$token = $null; $clave = $null; $anthropic = $null

Write-Host 'Publicando la funcion del Agente con IA...' -ForegroundColor Green
& $gh workflow run supabase.yml --repo $repo

Write-Host ''
Write-Host 'Listo. Ya podes cerrar esta ventana y avisarle a Claude.' -ForegroundColor Green
Read-Host 'Presiona Enter para cerrar'
