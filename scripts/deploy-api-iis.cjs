#!/usr/bin/env node

/**
 * IIS Deployment Script for .NET API
 * Publishes API and deploys to IIS via SMB share or local copy.
 *
 * Usage:
 *   make api-iis-deploy
 *   node scripts/deploy-api-iis.cjs
 *
 * Environment variables:
 *   DEPLOY_TARGET       - Preset name (default: "ttcds")
 *   API_DEPLOY_REMOTE   - Remote UNC path for IIS site (default: preset path)
 *   DEPLOY_SKIP_PUBLISH - Set "1" to skip dotnet publish step
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SCRIPT_DIR = __dirname;
const PROJECT_ROOT = path.dirname(SCRIPT_DIR);
const PUBLISH_DIR = path.join(PROJECT_ROOT, 'packages', 'api', 'publish');

// IIS deploy target presets
const DEPLOY_PRESETS = {
  ttcds: {
    remotePath: '\\\\webproduction\\WEB\\TTCDS\\Portal\\DesktopModules\\MVC\\QuanLyNghiPhep\\API',
    description: 'TTCDS Production IIS'
  }
};

// ---------- Terminal colors ----------
const colors = {
  reset: '\x1b[0m', bright: '\x1b[1m', green: '\x1b[32m',
  yellow: '\x1b[33m', red: '\x1b[31m', blue: '\x1b[34m', cyan: '\x1b[36m'
};
function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

// ---------- Load .env ----------
function loadEnvFile(target) {
  const envFiles = [
    path.join(PROJECT_ROOT, `.env.${target}`),
    path.join(PROJECT_ROOT, '.env.local'),
    path.join(PROJECT_ROOT, '.prod.env')
  ];
  for (const f of envFiles) {
    if (fs.existsSync(f)) {
      log(`Loading env: ${path.basename(f)}`, 'blue');
      const lines = fs.readFileSync(f, 'utf-8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const match = trimmed.match(/^(?:export\s+)?([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (match) {
          const [, key, value] = match;
          const clean = value.replace(/^["']|["']$/g, '');
          if (!process.env[key]) process.env[key] = clean;
        }
      }
      break;
    }
  }
}

// ---------- Publish API ----------
function publishApi() {
  log('\n==> Publishing .NET API for IIS...', 'bright');
  try {
    execSync('dotnet publish QLNP.Api.csproj -c Release -o publish --nologo -v minimal /p:UseAppHost=false', {
      stdio: 'inherit',
      cwd: path.join(PROJECT_ROOT, 'packages', 'api')
    });
    log('Publish complete.', 'green');
    return true;
  } catch {
    log('Publish FAILED.', 'red');
    return false;
  }
}

// ---------- Deploy via PowerShell (Windows) ----------
async function deployWithPowerShell(localPath, remotePath) {
  const useRobocopy = os.platform() === 'win32';
  const threads = parseInt(process.env.DEPLOY_THREADS || '16', 10);
  const batchSize = parseInt(process.env.DEPLOY_BATCH_SIZE || '50', 10);

  const psScript = `
param(
  [string]$LocalPath = "${localPath.replace(/\\/g, '\\\\')}",
  [string]$RemotePath = "${remotePath.replace(/\\/g, '\\\\')}",
  [int]$Threads = ${threads},
  [int]$BatchSize = ${batchSize}
)

function Write-Log { param([string]$Msg) Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $Msg" }

if (-not (Test-Path -Path $LocalPath -PathType Container)) {
  Write-Log "Error: Local directory '$LocalPath' does not exist."
  exit 1
}

# Ensure remote directory exists
if (-not (Test-Path -Path $RemotePath -PathType Container)) {
  Write-Log "Creating remote directory: $RemotePath"
  New-Item -Path $RemotePath -ItemType Directory -Force | Out-Null
}

# Use Robocopy on Windows for fast parallel copy
if ($Threads -gt 0) {
  Write-Log "Using Robocopy (MT:$Threads)..."
  $args = @($LocalPath, $RemotePath, "/E", "/MT:$Threads", "/R:2", "/W:5", "/NFL", "/NDL", "/NP", "/XO")
  & robocopy @args
  $rc = $LASTEXITCODE
  if ($rc -lt 8) { Write-Log "Robocopy OK (exit: $rc)" } else { Write-Log "Robocopy ERR (exit: $rc)" }
} else {
  Write-Log "Using Copy-Item..."
  Copy-Item -Path "$LocalPath\\*" -Destination $RemotePath -Recurse -Force
}
Write-Log "Deployment complete."
`;

  const scriptPath = path.join(SCRIPT_DIR, '.deploy-api-iis.ps1');
  fs.writeFileSync(scriptPath, psScript);
  try {
    const psCmd = process.env.PS_CMD || (os.platform() === 'win32' ? 'powershell' : 'pwsh');
    execSync(`${psCmd} -ExecutionPolicy Bypass -NoProfile -File "${scriptPath}"`, {
      stdio: 'inherit', cwd: PROJECT_ROOT, env: { ...process.env }
    });
    fs.unlinkSync(scriptPath);
    return true;
  } catch {
    fs.unlinkSync(scriptPath);
    return false;
  }
}

// ---------- Deploy via smbclient (Linux/macOS) ----------
function deployWithSMBClient(localPath, remotePath) {
  const user = process.env.SMB_USER || process.env.DEPLOY_USER || process.env.USER || 'anonymous';
  const pass = process.env.SMB_PASS || process.env.DEPLOY_PASS || '';

  const normalized = remotePath.replace(/\\/g, '/');
  const match = normalized.match(/^\/\/([^/]+)\/([^/]+)(?:\/(.*))?$/);
  if (!match) {
    log(`Invalid UNC path: ${remotePath}`, 'red');
    return false;
  }
  const [, server, share, remoteDir = ''] = match;

  const tmpScript = path.join(SCRIPT_DIR, '.smb-api-deploy.txt');
  const commands = [
    `lcd "${path.resolve(localPath)}"`,
    remoteDir ? `cd "${remoteDir}"` : '',
    'recurse',
    'prompt',
    'mput *',
    'exit'
  ].filter(Boolean).join('; ');

  fs.writeFileSync(tmpScript, commands);

  try {
    const cmd = `smbclient "//${server}/${share}" -U "${user}%${pass}" -c "$(cat "${tmpScript}")"`;
    log(`Running: ${cmd.replace(pass, '****')}`, 'blue');
    execSync(cmd, { stdio: 'inherit', cwd: PROJECT_ROOT, shell: '/bin/bash' });
    fs.unlinkSync(tmpScript);
    return true;
  } catch {
    fs.unlinkSync(tmpScript);
    log('smbclient deploy failed.', 'red');
    return false;
  }
}

// ---------- Main ----------
async function main() {
  const target = (process.env.DEPLOY_TARGET || process.argv[2] || 'ttcds').toLowerCase();
  const preset = DEPLOY_PRESETS[target];

  if (!preset) {
    log(`Unknown preset '${target}'. Available: ${Object.keys(DEPLOY_PRESETS).join(', ')}`, 'red');
    process.exit(1);
  }

  loadEnvFile(target);

  const remotePath = process.env.API_DEPLOY_REMOTE || preset.remotePath;

  log('='.repeat(60), 'blue');
  log('QLNP API — IIS Deployment', 'bright');
  log(`Target: ${target} (${preset.description})`, 'blue');
  log(`Platform: ${os.platform()}`, 'blue');
  log('='.repeat(60), 'blue');

  // Step 1: Publish
  if (process.env.DEPLOY_SKIP_PUBLISH === '1') {
    if (!fs.existsSync(PUBLISH_DIR)) {
      log('DEPLOY_SKIP_PUBLISH=1 but publish/ missing. Run make api-iis-publish first.', 'red');
      process.exit(1);
    }
    log('Skipping publish (DEPLOY_SKIP_PUBLISH=1)', 'yellow');
  } else {
    if (!publishApi()) process.exit(1);
  }

  log(`\nSource:  ${PUBLISH_DIR}`, 'blue');
  log(`Target:  ${remotePath}`, 'blue');
  log('-', 'blue');

  // Step 2: Deploy
  const platform = os.platform();
  let success = false;

  if (platform === 'win32') {
    success = await deployWithPowerShell(PUBLISH_DIR, remotePath);
  } else {
    // Try smbclient first (preferred on Linux/macOS for UNC paths)
    try {
      execSync('smbclient --version', { stdio: 'ignore' });
      success = deployWithSMBClient(PUBLISH_DIR, remotePath);
    } catch {
      log('smbclient not found. Trying PowerShell fallback...', 'yellow');
      try {
        execSync('pwsh -Version', { stdio: 'ignore' });
        success = await deployWithPowerShell(PUBLISH_DIR, remotePath);
      } catch {
        log('No deployment tool available. Install smbclient or pwsh.', 'red');
        log('  sudo apt install smbclient', 'cyan');
        process.exit(1);
      }
    }
  }

  if (success) {
    log('\n' + '='.repeat(60), 'green');
    log('API IIS deployment completed successfully!', 'green');
    log('='.repeat(60), 'green');
  } else {
    log('\n' + '='.repeat(60), 'red');
    log('API IIS deployment FAILED!', 'red');
    log('='.repeat(60), 'red');
    process.exit(1);
  }
}

main().catch(err => { log(`Unexpected error: ${err.message}`, 'red'); process.exit(1); });