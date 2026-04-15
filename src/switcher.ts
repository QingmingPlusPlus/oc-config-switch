import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type SwitchConfig = {
  baseDir: string;
  aliases: Record<string, string>;
};

export type SwitchResult = {
  mode: string;
  configDir: string;
  updateTarget: string;
  applyHint: string;
};

type SwitchOptions = {
  configPath?: string;
  homeDir?: string;
  shellConfigPath?: string;
  platform?: NodeJS.Platform;
  moduleUrl?: string;
};

const CONFIG_FILE_NAME = 'config.json';
const SHELL_BLOCK_START = '# omo-switch begin';
const SHELL_BLOCK_END = '# omo-switch end';

export function switchMode(mode: string, options: SwitchOptions = {}): SwitchResult {
  const homeDir = options.homeDir ?? homedir();
  const platform = options.platform ?? process.platform;
  const projectRoot = resolveProjectRoot(options.moduleUrl);
  const configPath = options.configPath ?? join(projectRoot, CONFIG_FILE_NAME);
  const config = readSwitchConfig(configPath);
  const baseDir = expandHomePath(config.baseDir, homeDir);

  if (!isAbsolute(baseDir)) {
    throw new Error(`config.json baseDir must be an absolute path or start with "~": ${config.baseDir}`);
  }

  const targetName = config.aliases[mode] ?? mode;
  assertConfigFolderName(targetName, mode);

  const resolvedBaseDir = resolve(baseDir);
  const configDir = resolve(resolvedBaseDir, targetName);
  assertInsideBaseDir(configDir, resolvedBaseDir);
  assertUsableConfigDir(configDir);

  if (platform === 'win32') {
    persistWindowsUserEnvironment(configDir);
    return {
      mode,
      configDir,
      updateTarget: 'Windows user environment variable OPENCODE_CONFIG_DIR',
      applyHint: 'Open a new terminal window to apply it.',
    };
  }

  const shellConfigPath = options.shellConfigPath ?? join(homeDir, '.zshrc');
  writeShellConfig(shellConfigPath, configDir);
  return {
    mode,
    configDir,
    updateTarget: shellConfigPath,
    applyHint: 'Run "source ~/.zshrc" or open a new terminal to apply it.',
  };
}

export function resolveProjectRoot(moduleUrl = import.meta.url): string {
  const moduleDir = dirname(fileURLToPath(moduleUrl));
  const moduleDirName = basename(moduleDir);
  if (moduleDirName === 'src' || moduleDirName === 'dist') {
    return dirname(moduleDir);
  }
  return moduleDir;
}

export function expandHomePath(pathValue: string, homeDir = homedir()): string {
  if (pathValue === '~') {
    return homeDir;
  }
  if (pathValue.startsWith('~/') || pathValue.startsWith('~\\')) {
    return join(homeDir, pathValue.slice(2));
  }
  if (pathValue.startsWith('~')) {
    throw new Error(`Unsupported home path: ${pathValue}`);
  }
  return pathValue;
}

function readSwitchConfig(configPath: string): SwitchConfig {
  if (!existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const rawConfig = readFileSync(configPath, 'utf8');
  let parsedConfig: unknown;
  try {
    parsedConfig = JSON.parse(rawConfig);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid config.json: ${message}`);
  }

  if (!isRecord(parsedConfig)) {
    throw new Error('Invalid config.json: expected an object');
  }

  const baseDir = parsedConfig.baseDir;
  if (typeof baseDir !== 'string' || baseDir.length === 0) {
    throw new Error('Invalid config.json: baseDir must be a non-empty string');
  }

  const aliasesValue = parsedConfig.aliases;
  const aliases: Record<string, string> = {};
  if (aliasesValue !== undefined) {
    if (!isRecord(aliasesValue)) {
      throw new Error('Invalid config.json: aliases must be an object');
    }
    for (const [alias, target] of Object.entries(aliasesValue)) {
      if (typeof target !== 'string' || target.length === 0) {
        throw new Error(`Invalid config.json: aliases.${alias} must be a non-empty string`);
      }
      aliases[alias] = target;
    }
  }

  return { baseDir, aliases };
}

function writeShellConfig(shellConfigPath: string, configDir: string): void {
  const currentContent = existsSync(shellConfigPath) ? readFileSync(shellConfigPath, 'utf8') : '';
  const nextContent = updateShellConfigContent(currentContent, configDir);
  writeFileSync(shellConfigPath, nextContent, 'utf8');
}

function persistWindowsUserEnvironment(configDir: string): void {
  try {
    execFileSync('setx', ['OPENCODE_CONFIG_DIR', configDir], { stdio: 'ignore' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to update Windows user environment: ${message}`);
  }
}

function updateShellConfigContent(content: string, configDir: string): string {
  const block = [
    SHELL_BLOCK_START,
    `export OPENCODE_CONFIG_DIR=${shellQuote(configDir)}`,
    SHELL_BLOCK_END,
  ].join('\n');
  const blockPattern = new RegExp(
    `${escapeRegExp(SHELL_BLOCK_START)}[\\s\\S]*?${escapeRegExp(SHELL_BLOCK_END)}\\n?`,
    'g',
  );
  const contentWithoutBlocks = content.replace(blockPattern, '').trimEnd();

  if (contentWithoutBlocks.includes(SHELL_BLOCK_START) || contentWithoutBlocks.includes(SHELL_BLOCK_END)) {
    throw new Error(`Shell config contains a malformed ${SHELL_BLOCK_START} block`);
  }

  if (contentWithoutBlocks.length === 0) {
    return `${block}\n`;
  }
  return `${contentWithoutBlocks}\n\n${block}\n`;
}

function assertConfigFolderName(folderName: string, mode: string): void {
  if (folderName === '' || folderName === '.' || folderName === '..') {
    throw new Error(`Invalid mode "${mode}": resolved folder name must be a direct child folder`);
  }
  if (folderName.includes('/') || folderName.includes('\\')) {
    throw new Error(`Invalid mode "${mode}": resolved folder name must not contain path separators`);
  }
}

function assertInsideBaseDir(configDir: string, baseDir: string): void {
  const relativePath = relative(baseDir, configDir);
  if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
    throw new Error(`Resolved config directory is outside baseDir: ${configDir}`);
  }
}

function assertUsableConfigDir(configDir: string): void {
  if (!existsSync(configDir)) {
    throw new Error(`Config directory not found: ${configDir}`);
  }
  if (!statSync(configDir).isDirectory()) {
    throw new Error(`Config path is not a directory: ${configDir}`);
  }

  const opencodeConfigPath = join(configDir, 'opencode.json');
  if (!existsSync(opencodeConfigPath)) {
    throw new Error(`opencode.json not found: ${opencodeConfigPath}`);
  }
  if (!statSync(opencodeConfigPath).isFile()) {
    throw new Error(`opencode.json is not a file: ${opencodeConfigPath}`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
