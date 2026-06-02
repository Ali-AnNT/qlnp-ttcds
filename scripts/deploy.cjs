#!/usr/bin/env node

/**
 * Unified Deployment Script
 * Cross-platform deployment with automatic tool installation
 * Supports: Windows (PowerShell/Robocopy), Linux/macOS (PowerShell/smbclient)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SCRIPT_DIR = __dirname;
const PROJECT_ROOT = path.dirname(SCRIPT_DIR);
const DEFAULT_DEPLOY_TARGET = 'ttcds';
const DEFAULT_REMOTE_PATH = '\\\\webproduction\\WEB\\TTCDS\\Portal\\DesktopModules\\MVC\\QuanLyNghiPhep\\GUI\\Scripts\\build';
const REMOTE_PATHS = {
  ttcds: DEFAULT_REMOTE_PATH
};

function getDeployTarget() {
  const target = process.env.DEPLOY_TARGET || process.argv[2] || DEFAULT_DEPLOY_TARGET;
  const normalized = target.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!REMOTE_PATHS[normalized]) {
    log(`Warning: preset '${target}' (normalized: '${normalized}') is not registered. Available: ${Object.keys(REMOTE_PATHS).join(', ')}. Falling back to default '${DEFAULT_DEPLOY_TARGET}'.`, 'yellow');
    return DEFAULT_DEPLOY_TARGET;
  }
  return normalized;
}

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Load environment variables from .env file
 */
function loadEnvFile(target) {
  const envFiles = [
    path.join(PROJECT_ROOT, `.env.${target}`),
    path.join(PROJECT_ROOT, '.env.local'),
    path.join(PROJECT_ROOT, '.env')
  ];

  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      log(`Loading environment from: ${path.basename(envFile)}`, 'blue');
      const content = fs.readFileSync(envFile, 'utf-8');
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const match = trimmed.match(/^(?:export\s+)?([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (match) {
          const [, key, value] = match;
          const cleanValue = value.replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = cleanValue;
          }
        }
      }
      break;
    }
  }
}

/**
 * Detect package manager (apt, yum, dnf, pacman, brew)
 */
function detectPackageManager() {
  const platform = os.platform();

  if (platform === 'darwin') return 'brew';
  if (platform === 'win32') return null;

  try {
    if (fs.existsSync('/usr/bin/apt') || fs.existsSync('/usr/bin/apt-get')) return 'apt';
    if (fs.existsSync('/usr/bin/yum')) return 'yum';
    if (fs.existsSync('/usr/bin/dnf')) return 'dnf';
    if (fs.existsSync('/usr/bin/pacman')) return 'pacman';
  } catch {
    return null;
  }

  return null;
}

/**
 * Execute command with optional auto-confirmation flag
 */
function execCommand(cmd, options = {}) {
  try {
    execSync(cmd, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Install smbclient on Linux
 */
function installSMBClient() {
  const pkgManager = detectPackageManager();
  if (!pkgManager) {
    log('Could not detect package manager. Please install smbclient manually.', 'red');
    log('  Debian/Ubuntu: sudo apt install smbclient', 'blue');
    log('  RHEL/CentOS: sudo yum install samba-client', 'blue');
    log('  Arch: sudo pacman -S smbclient', 'blue');
    return false;
  }

  log(`Installing smbclient using ${pkgManager}...`, 'yellow');

  const installCommands = {
    apt: 'sudo DEBIAN_FRONTEND=noninteractive apt install -y smbclient',
    yum: 'sudo yum install -y samba-client',
    dnf: 'sudo dnf install -y samba-client',
    pacman: 'sudo pacman -S --noconfirm smbclient',
    brew: 'brew install samba'
  };

  const cmd = installCommands[pkgManager];
  if (cmd && execCommand(cmd)) {
    log('smbclient installed successfully!', 'green');
    return true;
  }

  return false;
}

/**
 * Install PowerShell on Linux/macOS
 */
function installPowerShell() {
  const platform = os.platform();
  const pkgManager = detectPackageManager();

  log(`Installing PowerShell using ${pkgManager}...`, 'yellow');

  if (platform === 'linux') {
    // Download and install PowerShell for Linux
    const psInstallScript = `
# Detect Linux distribution
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS=$ID
  VERSION=$VERSION_ID
fi

# Install PowerShell based on distribution
case "$OS" in
  ubuntu|debian)
    wget -q https://github.com/PowerShell/PowerShell/releases/download/v7.4.6/powershell_7.4.6-1.deb_amd64.deb -O /tmp/powershell.deb
    sudo dpkg -i /tmp/powershell.deb || sudo apt-get install -f -y
    rm -f /tmp/powershell.deb
    ;;
  fedora|rhel|centos)
    sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc
    sudo yum install -y https://github.com/PowerShell/PowerShell/releases/download/v7.4.6/powershell-7.4.6-1.rh.x86_64.rpm
    ;;
  opensuse*)
    sudo zypper install -y https://github.com/PowerShell/PowerShell/releases/download/v7.4.6/powershell-7.4.6-1.rh.x86_64.rpm
    ;;
  arch|manjaro)
    sudo pacman -S --noconfirm powershell
    ;;
esac
`;

    const scriptPath = path.join(SCRIPT_DIR, '.install-ps.sh');
    fs.writeFileSync(scriptPath, psInstallScript);
    fs.chmodSync(scriptPath, '755');

    const success = execCommand(`bash "${scriptPath}"`, { cwd: PROJECT_ROOT });
    fs.unlinkSync(scriptPath);

    if (success) {
      log('PowerShell installed successfully!', 'green');
      return true;
    }
  } else if (platform === 'darwin') {
    if (pkgManager === 'brew') {
      if (execCommand('brew install powershell')) {
        log('PowerShell installed successfully!', 'green');
        return true;
      }
    }
  }

  log('Failed to install PowerShell automatically.', 'red');
  log('Please install manually:', 'yellow');
  log('  Linux: https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell-on-linux', 'blue');
  log('  macOS: brew install powershell', 'blue');
  return false;
}

/**
 * Check and auto-install deployment tools
 */
async function ensureDeploymentTools() {
  const platform = os.platform();

  let psCmd = null;
  let hasSMB = false;

  // On Linux/macOS: Check smbclient FIRST (preferred for UNC paths)
  if (platform !== 'win32') {
    try {
      execSync('smbclient --version', { stdio: 'ignore' });
      hasSMB = true;
    } catch {
      log('smbclient not found.', 'yellow');
      log('smbclient is recommended for SMB/UNC path deployment on Linux/macOS.', 'cyan');
      const shouldInstall = await askYesNo('Install smbclient automatically? [Y/n]: ', true);
      if (shouldInstall) {
        hasSMB = installSMBClient();
      }
    }
  }

  // Check PowerShell (as fallback on non-Windows, primary on Windows)
  if (platform === 'win32') {
    psCmd = 'powershell'; // Windows has PowerShell pre-installed
  } else {
    try {
      execSync('pwsh -Version', { stdio: 'ignore' });
      psCmd = 'pwsh';
    } catch {
      try {
        execSync('powershell -Version', { stdio: 'ignore' });
        psCmd = 'powershell';
      } catch {
        // PowerShell not found, try to install (if smbclient also not available)
        if (!hasSMB) {
          log('PowerShell not found.', 'yellow');
          const shouldInstall = await askYesNo('Install PowerShell automatically? (fallback) [Y/n]: ', true);
          if (shouldInstall) {
            if (installPowerShell()) {
              psCmd = 'pwsh';
            }
          }
        }
      }
    }
  }

  return { psCmd, hasSMB };
}

/**
 * Simple yes/no prompt
 */
function askYesNo(prompt, defaultValue = true) {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(prompt, (answer) => {
      rl.close();
      const trimmed = answer.trim().toLowerCase();
      if (trimmed === '' || trimmed === 'y' || trimmed === 'yes') {
        resolve(defaultValue || trimmed === 'y' || trimmed === 'yes');
      } else {
        resolve(false);
      }
    });
  });
}

/**
 * Ensure packages/web/dist exists. Default behavior: force-rebuild
 * (remove then build) to guarantee fresh output. Opt-out via DEPLOY_SKIP_REBUILD=1
 * to keep existing dist and only build when missing.
 */
function ensureDistBuilt() {
  const distPath = path.join(PROJECT_ROOT, 'packages/web/dist');
  const forceRebuild = process.env.DEPLOY_SKIP_REBUILD !== '1';

  if (forceRebuild && fs.existsSync(distPath)) {
    log('Force rebuild: removing existing packages/web/dist...', 'yellow');
    fs.rmSync(distPath, { recursive: true, force: true });
  }

  if (!fs.existsSync(distPath)) {
    log('dist not found — running pnpm --filter @qlnp/web build...', 'yellow');
    const success = execCommand('pnpm --filter @qlnp/web build:dev ', { cwd: PROJECT_ROOT });
    if (!success) {
      log('Build failed. Aborting deployment.', 'red');
      process.exit(1);
    }
    log('Build completed.', 'green');
  }
  return distPath;
}

/**
 * Check if dist directory exists
 */
function checkDistExists() {
  const distPath = path.join(PROJECT_ROOT, 'packages/web/dist');
  if (!fs.existsSync(distPath)) {
    log('Error: dist directory does not exist at packages/web/dist. Run "pnpm --filter @qlnp/web build" first.', 'red');
    process.exit(1);
  }
  return distPath;
}

function resolveRemotePath(target) {
  return process.env.DEPLOY_REMOTE_PATH || REMOTE_PATHS[target] || DEFAULT_REMOTE_PATH;
}

/**
 * Deploy using PowerShell (Windows/Linux/macOS)
 * Includes embedded PowerShell deployment logic
 */
async function deployWithPowerShell(localPath, remotePath, useRobocopy, threads, batchSize) {
  // Convert JS boolean to PowerShell boolean
  const psUseRobocopy = useRobocopy ? '$true' : '$false';
  const psIsWindows = os.platform() === 'win32' ? '$true' : '$false';

  const psScript = `
param(
  [string]$LocalPath = "${localPath}",
  [string]$RemotePath = "${remotePath.replace(/\\/g, '\\\\')}",
  [int]$Threads = ${threads},
  [int]$BatchSize = ${batchSize},
  [bool]$UseRobocopy = ${psUseRobocopy},
  [bool]$IsWindowsPlatform = ${psIsWindows}
)

function Write-Log {
  param([string]$Message)
  Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $Message"
}

if (-not (Test-Path -Path $LocalPath -PathType Container)) {
  Write-Log "Error: Local directory '$LocalPath' does not exist."
  exit 1
}

$LocalPath = Resolve-Path $LocalPath
Write-Log "Starting deployment from '$LocalPath' to '$RemotePath'"

function Ensure-RemoteDirectory {
  param([string]$Path)
  if (-not (Test-Path -Path $Path -PathType Container)) {
    try {
      Write-Log "Creating directory: $Path"
      New-Item -Path $Path -ItemType Directory -Force | Out-Null
      return $true
    } catch {
      Write-Log "Error creating directory $Path - $_"
      return $false
    }
  }
  return $true
}

function Copy-Directory {
  param(
    [string]$LocalDir,
    [string]$RemoteDir,
    [int]$BatchSize = $BatchSize
  )

  if (-not (Ensure-RemoteDirectory -Path $RemoteDir)) {
    Write-Log "Failed to create remote directory: $RemoteDir"
    return $false
  }

  $files = @(Get-ChildItem -Path $LocalDir -File)
  $filesTotal = $files.Count
  $filesUploaded = 0
  $filesFailed = 0

  if ($filesTotal -gt 0) {
    Write-Log "Processing $filesTotal files in '$LocalDir'"

    for ($i = 0; $i -lt $filesTotal; $i += $BatchSize) {
      $batch = $files[$i..[Math]::Min($i + $BatchSize - 1, $filesTotal - 1)]

      if ($PSVersionTable.PSVersion.Major -ge 7) {
        $batch | ForEach-Object -Parallel {
          $file = $_
          $remoteFile = Join-Path -Path $using:RemoteDir -ChildPath $file.Name
          try {
            Copy-Item -Path $file.FullName -Destination $remoteFile -Force -ErrorAction Stop
            $true
          } catch {
            Write-Host "Error copying $($file.FullName): $_"
            $false
          }
        } -ThrottleLimit 10 | ForEach-Object {
          if ($_) { $filesUploaded++ } else { $filesFailed++ }
        }
      } else {
        foreach ($file in $batch) {
          $remoteFile = Join-Path -Path $RemoteDir -ChildPath $file.Name
          try {
            Copy-Item -Path $file.FullName -Destination $remoteFile -Force -ErrorAction Stop
            $filesUploaded++
          } catch {
            Write-Log "Error copying $($file.FullName): $_"
            $filesFailed++
          }
        }
      }

      if ($filesTotal -gt $BatchSize) {
        $progress = [Math]::Min(100, [int](($i + $batch.Count) / $filesTotal * 100))
        Write-Log "Progress: $progress% ($($i + $batch.Count)/$filesTotal files)"
      }
    }

    Write-Log "Completed: $filesUploaded uploaded, $filesFailed failed in '$LocalDir'"
  }

  $directories = @(Get-ChildItem -Path $LocalDir -Directory)
  foreach ($dir in $directories) {
    $localSubDir = $dir.FullName
    $remoteSubDir = Join-Path -Path $RemoteDir -ChildPath $dir.Name
    Copy-Directory -LocalDir $localSubDir -RemoteDir $remoteSubDir -BatchSize $BatchSize
  }
}

if (-not (Ensure-RemoteDirectory -Path $RemotePath)) {
  Write-Log "Failed to access or create the destination directory."
  exit 1
}

try {
  if ($UseRobocopy -and $IsWindowsPlatform) {
    Write-Log "Using Robocopy for deployment (Multi-threaded: $Threads)..."
    $robocopyArgs = @($LocalPath, $RemotePath, "/E", "/MT:$Threads", "/R:2", "/W:5", "/NFL", "/NDL", "/NP", "/BYTES", "/XO")
    $result = & robocopy @robocopyArgs
    $exitCode = $LASTEXITCODE

    if ($exitCode -lt 8) {
      Write-Log "Robocopy completed successfully! (Exit code: $exitCode)"
    } else {
      Write-Log "Robocopy completed with errors. (Exit code: $exitCode)"
    }
  } else {
    Write-Log "Using PowerShell Copy-Item (compatible with all platforms)"
    Copy-Directory -LocalDir $LocalPath -RemoteDir $RemotePath -BatchSize $BatchSize
  }

  Write-Log "Deployment completed successfully!"
} catch {
  Write-Log "Error during deployment: $_"
  exit 1
}
`;

  const scriptPath = path.join(SCRIPT_DIR, '.deploy-ps.ps1');
  fs.writeFileSync(scriptPath, psScript);

  try {
    const psCmd = process.env.PS_CMD || 'pwsh';
    const fullCommand = `${psCmd} -ExecutionPolicy Bypass -NoProfile -File "${scriptPath}"`;
    execSync(fullCommand, { stdio: 'inherit', cwd: PROJECT_ROOT, env: { ...process.env } });
    fs.unlinkSync(scriptPath);
    return true;
  } catch (error) {
    fs.unlinkSync(scriptPath);
    throw error;
  }
}

/**
 * Deploy using smbclient (Linux only)
 */
function deployWithSMBClient(localPath, remotePath) {
  log('Using smbclient for deployment', 'yellow');
  log(`Note: Set SMB_USER and SMB_PASS environment variables for authentication.`, 'yellow');

  const user = process.env.SMB_USER || process.env.DEPLOY_USER || process.env.USER || 'anonymous';
  const pass = process.env.SMB_PASS || process.env.DEPLOY_PASS || '';

  const normalizedPath = remotePath.replace(/\\/g, '/');
  const match = normalizedPath.match(/^\/\/([^/]+)\/([^/]+)(?:\/(.*))?$/);
  if (!match) {
    log(`Error: Invalid remote path format: ${remotePath}`, 'red');
    return false;
  }

  const [, server, share, remoteDir = ''] = match;
  const targetDir = remoteDir || process.env.DEPLOY_REMOTE_DIR || '';

  const scriptPath = path.join(SCRIPT_DIR, '.smb-deploy.txt');
  const commands = [
    `echo Starting deployment to //${server}/${share}/${targetDir}`,
    targetDir ? `cd "${targetDir}"` : '',
    `lcd "${path.resolve(PROJECT_ROOT, localPath)}"`,
    'recurse',
    'prompt',
    'mput *',
    'exit'
  ].filter(Boolean).join('; ');

  fs.writeFileSync(scriptPath, commands);

  try {
    const smbCmd = `smbclient "//${server}/${share}" -U "${user}%${pass}" -c "$(cat "${scriptPath}")"`;
    log(`Executing: ${smbCmd.replace(pass, '****')}`, 'blue');
    execSync(smbCmd, { stdio: 'inherit', cwd: PROJECT_ROOT, shell: '/bin/bash' });
    fs.unlinkSync(scriptPath);
    return true;
  } catch (error) {
    fs.unlinkSync(scriptPath);
    log('smbclient deployment failed.', 'red');
    return false;
  }
}

/**
 * Main deployment function
 */
async function deploy() {
  const target = getDeployTarget();
  loadEnvFile(target);

  const localPath = process.env.DEPLOY_LOCAL_PATH || 'packages/web/dist';
  const remotePath = resolveRemotePath(target);
  const useRobocopy = process.env.DEPLOY_USE_ROBOCOPY !== 'false';
  const threads = parseInt(process.env.DEPLOY_THREADS || '16', 10);
  const batchSize = parseInt(process.env.DEPLOY_BATCH_SIZE || '50', 10);
  const platform = os.platform();

  log('='.repeat(60), 'blue');
  log('qlnp-ttcds - Unified Deployment', 'bright');
  log(`Target preset: ${target}`, 'blue');
  log(`Platform: ${platform}`, 'blue');
  log('='.repeat(60), 'blue');

  const distPath = ensureDistBuilt();
  log(`Source: ${distPath}`, 'blue');
  log(`Target: ${remotePath}`, 'blue');
  log('-', 'blue');

  // Ensure deployment tools are available (with auto-install)
  const { psCmd, hasSMB } = await ensureDeploymentTools();

  if (!psCmd && !hasSMB) {
    log('', 'blue');
    log('Error: No deployment tool available. Please install:', 'red');
    log('  Windows: PowerShell (pre-installed)', 'blue');
    log('  Linux/macOS: smbclient (recommended for UNC paths)', 'blue');
    log('', 'blue');
    process.exit(1);
  }

  // Log which tool will be used
  if (platform === 'win32' && psCmd) {
    log(`Using: ${psCmd} (with Robocopy)`, 'green');
  } else if (hasSMB) {
    log('Using: smbclient', 'green');
  } else if (psCmd) {
    log(`Using: ${psCmd} (limited SMB support)`, 'yellow');
  }

  log('', 'blue');
  log('Starting deployment...', 'yellow');
  log('', 'blue');

  try {
    // On Linux/macOS: Prefer smbclient for UNC paths (PowerShell doesn't support SMB on non-Windows)
    // On Windows: Use PowerShell/Robocopy
    if (platform === 'win32' && psCmd) {
      await deployWithPowerShell(localPath, remotePath, useRobocopy, threads, batchSize);
    } else if (hasSMB) {
      deployWithSMBClient(localPath, remotePath);
    } else if (psCmd) {
      // Check if remote path is UNC format
      const isUNCPath = remotePath.match(/^\\\\+/);
      if (isUNCPath) {
        log('', 'blue');
        log('Error: PowerShell cannot access UNC paths on Linux/macOS.', 'red');
        log('', 'blue');
        log('Please install smbclient for SMB/UNC path access:', 'yellow');
        log('  sudo apt install smbclient  # Debian/Ubuntu', 'cyan');
        log('  sudo yum install samba-client  # RHEL/CentOS', 'cyan');
        log('  sudo pacman -S smbclient  # Arch', 'cyan');
        log('', 'blue');
        process.exit(1);
      }
      // Fallback to PowerShell on non-Windows for local paths only
      log('Warning: PowerShell on Linux/macOS has limited SMB support.', 'yellow');
      await deployWithPowerShell(localPath, remotePath, false, threads, batchSize);
    }

    log('', 'blue');
    log('='.repeat(60), 'green');
    log('Deployment completed successfully!', 'green');
    log('='.repeat(60), 'green');
  } catch (error) {
    log('', 'blue');
    log('='.repeat(60), 'red');
    log('Deployment failed!', 'red');
    log('='.repeat(60), 'red');
    process.exit(1);
  }
}

// Run deployment
deploy().catch(error => {
  log(`Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});
