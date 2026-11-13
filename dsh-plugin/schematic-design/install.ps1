# Install the "原理图设计" plugin into the active DSH desktop profile.
#
# Idempotent: re-running it reports what is already in place and changes nothing.
# It performs three things only:
#   1. junction  <profile>/node_modules/@local/dsh-plugin-schematic-design -> this dir
#   2. add the link dependency + bundle entry to <profile>/package.json
#   3. install skills/hw-design/SKILL.md into the shared skill library
#      (real dir at .config/magpie/library/skills + junction at .dsh/skills)
#
# It never deletes anything and never overwrites an existing SKILL.md.
# After running, refresh the Web GUI (or restart the app) so the new bundle is loaded.

$ErrorActionPreference = 'Stop'
$pluginDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$profileDir = Join-Path $env:USERPROFILE '.dsh\profiles\desktop'
$localDir = Join-Path $profileDir 'node_modules\@local'
$linkPath = Join-Path $localDir 'dsh-plugin-schematic-design'
$pkgPath = Join-Path $profileDir 'package.json'
$skillSrc = Join-Path $pluginDir 'skills\hw-design\SKILL.md'
$libSkillDir = Join-Path $env:USERPROFILE '.config\magpie\library\skills\hw-design'
$dshSkillDir = Join-Path $env:USERPROFILE '.dsh\skills\hw-design'

function Write-Step($name, $action) {
  Write-Output ("[{0}] {1}" -f $name, $action)
}

# --- sanity checks -----------------------------------------------------------
foreach ($required in @($pluginDir, $profileDir, $localDir, $pkgPath, $skillSrc,
                       (Join-Path $pluginDir 'client.js'), (Join-Path $pluginDir 'package.json'))) {
  if (-not (Test-Path -LiteralPath $required)) { throw "missing required path: $required" }
}

# --- 1. junction -------------------------------------------------------------
$linkItem = Get-Item -LiteralPath $linkPath -Force -ErrorAction SilentlyContinue
if ($linkItem) {
  if ($linkItem.LinkType -eq 'Junction' -and $linkItem.Target -contains $pluginDir) {
    Write-Step 'junction' 'already present'
  } else {
    throw "path exists but is not the expected junction: $linkPath"
  }
} else {
  New-Item -ItemType Junction -Path $linkPath -Target $pluginDir | Out-Null
  Write-Step 'junction' "created -> $pluginDir"
}

# --- 2. package.json ---------------------------------------------------------
$pkg = Get-Content -LiteralPath $pkgPath -Raw
$changed = $false
if ($pkg.Contains('dsh-plugin-schematic-design')) {
  Write-Step 'package.json' 'already contains the plugin'
} else {
  $depAnchor = '"@local/sidebar-notes": "link:C:/Users/usbtgw/Documents/deepseek-harness/default-workspace/sidebar-notes-plugin",'
  $bundleAnchor = '"@local/dsh-plugin-hardware-review",'
  if (-not $pkg.Contains($depAnchor)) { throw 'dependency anchor not found in package.json; edit manually' }
  if (-not $pkg.Contains($bundleAnchor)) { throw 'bundle anchor not found in package.json; edit manually' }
  $depLine = '"@local/dsh-plugin-schematic-design": "link:C:/Users/usbtgw/Documents/deepseek-harness/default-workspace/schematic-design-plugin",'
  # The bundle anchor keeps its own trailing comma; the inserted line must end
  # with one too, otherwise the array is invalid JSON.
  $bundleLine = '"@local/dsh-plugin-schematic-design",'
  $pkg = $pkg.Replace($depAnchor, $depAnchor + "`n    " + $depLine)
  $pkg = $pkg.Replace($bundleAnchor, $bundleAnchor + "`n        " + $bundleLine)
  # Validate JSON before writing anything back: a failed parse must never leave
  # a half-edited profile behind.
  $null = $pkg | ConvertFrom-Json
  [System.IO.File]::WriteAllText($pkgPath, $pkg, (New-Object System.Text.UTF8Encoding($false)))
  $changed = $true
  Write-Step 'package.json' 'dependency + bundle entry added (JSON validated)'
}
if (-not $changed) { Write-Step 'package.json' 'no change needed' }

# --- 3. skill ----------------------------------------------------------------
if (-not (Test-Path -LiteralPath $libSkillDir)) {
  New-Item -ItemType Directory -Path $libSkillDir | Out-Null
  Write-Step 'skill' "created $libSkillDir"
}
$libSkillFile = Join-Path $libSkillDir 'SKILL.md'
if (Test-Path -LiteralPath $libSkillFile) {
  Write-Step 'skill' "SKILL.md already exists at $libSkillFile (not overwritten)"
} else {
  Copy-Item -LiteralPath $skillSrc -Destination $libSkillFile
  Write-Step 'skill' "installed $libSkillFile"
}

$skillItem = Get-Item -LiteralPath $dshSkillDir -Force -ErrorAction SilentlyContinue
if ($skillItem) {
  if ($skillItem.LinkType -eq 'Junction') {
    Write-Step 'skill-link' 'junction already present'
  } else {
    # A real directory works too: make sure the manifest is there.
    if (-not (Test-Path -LiteralPath (Join-Path $dshSkillDir 'SKILL.md'))) {
      Copy-Item -LiteralPath $skillSrc -Destination (Join-Path $dshSkillDir 'SKILL.md')
      Write-Step 'skill-link' 'SKILL.md copied into existing directory'
    } else {
      Write-Step 'skill-link' 'real directory already has SKILL.md'
    }
  }
} else {
  New-Item -ItemType Junction -Path $dshSkillDir -Target $libSkillDir | Out-Null
  Write-Step 'skill-link' "created junction -> $libSkillDir"
}

# --- verification ------------------------------------------------------------
Write-Output ''
Write-Output '=== verification ==='
Write-Output ("junction target : " + ((Get-Item -LiteralPath $linkPath).Target -join ', '))
Write-Output ("client.js       : " + (Test-Path -LiteralPath (Join-Path $linkPath 'client.js')))
Write-Output ("package.json    : " + ((Get-Content -LiteralPath $pkgPath -Raw) -match 'dsh-plugin-schematic-design'))
Write-Output ("skill manifest  : " + (Test-Path -LiteralPath (Join-Path $dshSkillDir 'SKILL.md')))
Write-Output ("kicad MCP       : configure in the GUI (magpie hub), not handled by this script")
Write-Output ''
Write-Output 'Next: restart DeepSeek Harness (or reload the profile) and refresh the Web GUI.'
Write-Output 'A plain page refresh alone may NOT load a newly added bundle: no dev:web watcher is running here.'
