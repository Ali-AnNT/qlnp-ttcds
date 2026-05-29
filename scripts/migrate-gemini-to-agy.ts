import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const HOMEDIR = os.homedir();
const LEGACY_GEMINI_DIR = path.join(HOMEDIR, '.gemini');
const NEW_AGY_DIR = path.join(HOMEDIR, '.gemini', 'antigravity-cli');
const NEW_AGY_CORE_DIR = path.join(HOMEDIR, '.gemini', 'antigravity');
const WORKSPACE_DIR = process.cwd();

// Helper to log with styling
function logInfo(msg: string) {
  console.log(`\x1b[34m[INFO]\x1b[0m ${msg}`);
}
function logSuccess(msg: string) {
  console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`);
}
function logWarning(msg: string) {
  console.log(`\x1b[33m[WARNING]\x1b[0m ${msg}`);
}
function logError(msg: string) {
  console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`);
}

// Deep transform 'url' key to 'serverUrl' in MCP config
function transformMcpServers(mcpServers: any): any {
  if (!mcpServers || typeof mcpServers !== 'object') return mcpServers;
  const result: any = {};
  for (const [key, value] of Object.entries(mcpServers)) {
    if (value && typeof value === 'object') {
      const serverConfig: any = { ...value };
      if ('url' in serverConfig) {
        serverConfig.serverUrl = serverConfig.url;
        delete serverConfig.url;
        logInfo(`  Renamed "url" to "serverUrl" for MCP server: "${key}"`);
      }
      result[key] = serverConfig;
    } else {
      result[key] = value;
    }
  }
  return result;
}

// Safe directory copy
function copyDirectory(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true, force: true });
}

// 1. Migrate Global Configurations
function migrateGlobal() {
  logInfo('--- Starting Global Migration ---');
  if (!fs.existsSync(LEGACY_GEMINI_DIR)) {
    logWarning(`Legacy Gemini directory not found at ${LEGACY_GEMINI_DIR}. Skipping global migration.`);
    return;
  }

  // Ensure new config directories exist
  fs.mkdirSync(NEW_AGY_DIR, { recursive: true });
  fs.mkdirSync(NEW_AGY_CORE_DIR, { recursive: true });

  // Migrate global settings to both locations
  const legacySettingsPath = path.join(LEGACY_GEMINI_DIR, 'settings.json');
  let legacyMcpServers: any = null;

  if (fs.existsSync(legacySettingsPath)) {
    try {
      const settingsContent = fs.readFileSync(legacySettingsPath, 'utf8');
      const settings = JSON.parse(settingsContent);

      // Extract legacy MCP servers before saving
      if (settings.mcpServers) {
        legacyMcpServers = settings.mcpServers;
        delete settings.mcpServers;
      }

      fs.writeFileSync(path.join(NEW_AGY_DIR, 'settings.json'), JSON.stringify(settings, null, 2), 'utf8');
      fs.writeFileSync(path.join(NEW_AGY_CORE_DIR, 'settings.json'), JSON.stringify(settings, null, 2), 'utf8');
      logSuccess(`Migrated global settings to ${NEW_AGY_DIR}/settings.json and ${NEW_AGY_CORE_DIR}/settings.json`);
    } catch (e: any) {
      logError(`Failed to parse legacy settings.json: ${e.message}`);
    }
  }

  // Migrate global MCP configuration to both locations
  if (legacyMcpServers) {
    const transformedMcp = transformMcpServers(legacyMcpServers);
    const targetDirs = [NEW_AGY_DIR, NEW_AGY_CORE_DIR];

    for (const targetDir of targetDirs) {
      const newMcpConfigPath = path.join(targetDir, 'mcp_config.json');
      let existingMcpConfig: any = { mcpServers: {} };

      if (fs.existsSync(newMcpConfigPath)) {
        try {
          existingMcpConfig = JSON.parse(fs.readFileSync(newMcpConfigPath, 'utf8'));
        } catch (e) {}
      }

      existingMcpConfig.mcpServers = {
        ...existingMcpConfig.mcpServers,
        ...transformedMcp
      };

      fs.writeFileSync(newMcpConfigPath, JSON.stringify(existingMcpConfig, null, 2), 'utf8');
      logSuccess(`Migrated global MCP servers to ${newMcpConfigPath}`);
    }
  }

  // Folders to migrate recursively from old ~/.gemini/ to both new locations
  const foldersToMigrate = ['skills', 'hooks', 'commands', 'config'];

  for (const folder of foldersToMigrate) {
    const legacyPath = path.join(LEGACY_GEMINI_DIR, folder);
    if (fs.existsSync(legacyPath)) {
      copyDirectory(legacyPath, path.join(NEW_AGY_DIR, folder));
      copyDirectory(legacyPath, path.join(NEW_AGY_CORE_DIR, folder));
      logSuccess(`Migrated global folder "${folder}" to ${NEW_AGY_DIR}/${folder}/ and ${NEW_AGY_CORE_DIR}/${folder}/`);
    }
  }
}

// 2. Migrate Workspace Configurations
function migrateWorkspace() {
  logInfo('--- Starting Workspace Migration ---');
  const legacyDirs = ['.gemini', '.claude'];
  const newAgentsDir = path.join(WORKSPACE_DIR, '.agents');

  let workspaceMigrated = false;

  for (const legacyDirName of legacyDirs) {
    const legacyPath = path.join(WORKSPACE_DIR, legacyDirName);
    if (!fs.existsSync(legacyPath)) continue;

    logInfo(`Found legacy workspace configuration in ${legacyDirName}/`);

    // Migrate local skills
    const legacySkillsPath = path.join(legacyPath, 'skills');
    if (fs.existsSync(legacySkillsPath)) {
      const newSkillsPath = path.join(newAgentsDir, 'skills');
      copyDirectory(legacySkillsPath, newSkillsPath);
      logSuccess(`Migrated workspace skills to ${newSkillsPath}`);
      workspaceMigrated = true;
    }

    // Migrate local MCP servers
    const legacySettingsPath = path.join(legacyPath, 'settings.json');
    if (fs.existsSync(legacySettingsPath)) {
      try {
        const settings = JSON.parse(fs.readFileSync(legacySettingsPath, 'utf8'));
        if (settings.mcpServers) {
          const newMcpPath = path.join(newAgentsDir, 'mcp_config.json');
          let existingMcp: any = { mcpServers: {} };
          if (fs.existsSync(newMcpPath)) {
            try {
              existingMcp = JSON.parse(fs.readFileSync(newMcpPath, 'utf8'));
            } catch (e) {}
          }

          const transformedMcp = transformMcpServers(settings.mcpServers);
          existingMcp.mcpServers = {
            ...existingMcp.mcpServers,
            ...transformedMcp
          };

          fs.mkdirSync(newAgentsDir, { recursive: true });
          fs.writeFileSync(newMcpPath, JSON.stringify(existingMcp, null, 2), 'utf8');
          logSuccess(`Migrated workspace MCP servers to ${newMcpPath}`);
          workspaceMigrated = true;
        }
      } catch (e: any) {
        logError(`Failed to parse legacy workspace settings.json: ${e.message}`);
      }
    }
  }

  if (!workspaceMigrated) {
    logInfo('No legacy workspace-level configurations found in current folder.');
  }
}

// Run migration
function run() {
  console.log('\x1b[36m====================================================\x1b[0m');
  console.log('\x1b[36m   Gemini to Antigravity CLI Migration Helper       \x1b[0m');
  console.log('\x1b[36m====================================================\x1b[0m');
  
  migrateGlobal();
  console.log();
  migrateWorkspace();
  
  console.log('\x1b[36m====================================================\x1b[0m');
  logSuccess('Migration checks and copying complete!');
  logInfo('Verify settings by running: \x1b[1magy plugin list\x1b[0m');
}

run();
