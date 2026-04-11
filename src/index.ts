#!/usr/bin/env node

type CliOptions = {
  help: boolean;
  version: boolean;
  name?: string;
};

const VERSION = "1.0.0";

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    help: false,
    version: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    switch (arg) {
      case "-h":
      case "--help":
        options.help = true;
        break;
      case "-v":
      case "--version":
        options.version = true;
        break;
      case "-n":
      case "--name": {
        const value = args[index + 1];
        if (!value || value.startsWith("-")) {
          throw new Error("Missing value for --name");
        }
        options.name = value;
        index += 1;
        break;
      }
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`omo-switch

Usage:
  omo-switch [options]

Options:
  -n, --name <name>   Print a greeting for the given name
  -v, --version       Print the CLI version
  -h, --help          Show this help message`);
}

function main(args: string[]): void {
  const options = parseArgs(args);

  if (options.help) {
    printHelp();
    return;
  }

  if (options.version) {
    console.log(VERSION);
    return;
  }

  const name = options.name ?? "world";
  console.log(`Hello, ${name}!`);
}

try {
  main(process.argv.slice(2));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  console.error("Run `omo-switch --help` for usage.");
  process.exitCode = 1;
}
