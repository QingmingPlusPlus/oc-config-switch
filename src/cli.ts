export type Command =
  | { type: 'switch'; mode: string }
  | { type: 'help' }
  | { type: 'version' };

export const VERSION = '1.0.0';

export function parseCommand(args: string[]): Command {
  if (args.length === 0) {
    return { type: 'help' };
  }
  const arg = args[0];
  if (arg === '--help' || arg === '-h') {
    return { type: 'help' };
  }
  if (arg === '--version' || arg === '-v') {
    return { type: 'version' };
  }
  if (arg.startsWith('-')) {
    throw new Error(`Unknown option: ${arg}`);
  }
  return { type: 'switch', mode: arg };
}

export function printHelp(): void {
  console.log(`omos — opencode config switcher

Usage:
  omos <mode>

Modes:
  <mode>   Folder name under baseDir, or an alias from config.json

Options:
  -v, --version   Print version
  -h, --help      Show this help message

Config file:      config.json next to the package root
baseDir:          Supports absolute paths and ~/ paths
Effect:           Writes OPENCODE_CONFIG_DIR to ~/.zshrc
Apply changes:    Run "source ~/.zshrc" or open a new terminal`);
}

export function printVersion(): void {
  console.log(VERSION);
}
