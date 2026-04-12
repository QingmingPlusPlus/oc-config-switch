# omo-switch

`omo-switch` is a small CLI for switching opencode config directories.

It writes an `OPENCODE_CONFIG_DIR` export block to `~/.zshrc` instead of copying
or overwriting `opencode.json`.

## Configuration

Edit `config.json` next to the package root:

```json
{
  "baseDir": "~/opencode-config",
  "aliases": {
    "on": "omo.copilot",
    "off": "pure"
  }
}
```

`baseDir` supports absolute paths and `~/...` paths. A mode can be either a
direct child folder under `baseDir` or an alias key from `config.json`.

Each target folder must already contain an `opencode.json` file.

## Usage

```sh
omos pure
omos omo.copilot
omos on
omos off
source ~/.zshrc
```

Open a new terminal instead of running `source ~/.zshrc` if you prefer a clean
shell session.

## Development

```sh
npm install
npm run typecheck
npm run build
npm run dev -- pure
```
