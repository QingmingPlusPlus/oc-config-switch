#!/usr/bin/env node

import { parseCommand, printHelp, printVersion } from './cli.js';
import { switchMode } from './switcher.js';

function main(args: string[]): void {
  const command = parseCommand(args);
  switch (command.type) {
    case 'help':
      printHelp();
      break;
    case 'version':
      printVersion();
      break;
    case 'switch':
      const result = switchMode(command.mode);
      console.log(`Switched to mode: ${result.mode}`);
      console.log(`OPENCODE_CONFIG_DIR=${result.configDir}`);
      console.log(`Updated shell config: ${result.shellConfigPath}`);
      console.log('Run "source ~/.zshrc" or open a new terminal to apply it.');
      break;
  }
}

try {
  main(process.argv.slice(2));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  console.error('Run "omos --help" for usage.');
  process.exitCode = 1;
}
