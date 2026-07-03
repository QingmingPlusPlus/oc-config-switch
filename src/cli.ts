export type Command =
  | { type: 'on'; mode: string }
  | { type: 'off' }
  | { type: 'current' }
  | { type: 'list' }
  | { type: 'new'; mode: string }
  | { type: 'remove'; mode: string }
  | { type: 'run'; mode: string; passthroughArgs: string[] }
  | { type: 'help' }
  | { type: 'version' };

export const VERSION = '3.0.0';

export function parseCommand(args: string[]): Command {
  if (args.length === 0) {
    return { type: 'help' };
  }

  const command = args[0];
  if (command === 'help' || command === '--help' || command === '-h') {
    assertNoExtraArgs(command, args);
    return { type: 'help' };
  }
  if (command === 'version' || command === '--version' || command === '-v') {
    assertNoExtraArgs(command, args);
    return { type: 'version' };
  }
  if (command === 'off' || command === 'current' || command === 'list') {
    assertNoExtraArgs(command, args);
    return { type: command };
  }
  if (command === 'on' || command === 'new' || command === 'remove') {
    const mode = args[1];
    if (mode === undefined) {
      throw new Error(`Missing mode. Usage: ocs ${command} <mode>`);
    }
    if (args.length > 2) {
      throw new Error(`Too many arguments. Usage: ocs ${command} <mode>`);
    }
    return { type: command, mode };
  }
  if (command === 'run') {
    const mode = args[1];
    if (mode === undefined) {
      throw new Error('Missing mode. Usage: ocs run <mode> [opencode-args...]');
    }
    const passthroughArgs = args.slice(2);
    return { type: 'run', mode, passthroughArgs };
  }
  if (command.startsWith('-')) {
    throw new Error(`Unknown option: ${command}`);
  }
  throw new Error(`Unknown command: ${command}. Use "ocs on ${command}" to switch to a mode.`);
}

export function printHelp(): void {
  console.log(`ocs - opencode environment switcher

Usage:
  ocs on <mode>        Switch OPENCODE_CONFIG_DIR to an environment
  ocs off              Clear OPENCODE_CONFIG_DIR written by oc-config-switch
  ocs current          Print the current environment
  ocs list             List all environments ( (*) = active, ( ) = inactive )
  ocs new <mode>       Create an empty environment directory
  ocs remove <mode>    Remove an environment directory
  ocs run <mode> [..]  Launch opencode with this environment for one session
  ocs version          Print version
  ocs help             Show this help message

Options:
  -v, --version        Print version
  -h, --help           Show this help message

Config file:           config.json next to the package root
baseDir:               Supports absolute paths and ~/ paths
Mode names:            Direct child folders under baseDir
Effect:                macOS/Linux writes ~/.zshrc; Windows sets a user env var
Apply changes:         Open a new terminal (or run source ~/.zshrc on macOS/Linux)
ocs run:               Launches opencode with OPENCODE_CONFIG_DIR set for this
                       session only — non-persistent, no shell config changes`);
}

export function printVersion(): void {
  console.log(VERSION);
}

function assertNoExtraArgs(command: string, args: string[]): void {
  if (args.length > 1) {
    throw new Error(`Too many arguments for "${command}"`);
  }
}
