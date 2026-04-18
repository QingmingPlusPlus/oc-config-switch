# oc-config-switch

[English](README.md) | 简体中文

`oc-config-switch` 是一个用于切换 opencode 配置环境的小型 CLI。它通过管理
`OPENCODE_CONFIG_DIR`，让不同的 opencode 配置可以放在不同目录里，并用一条命令切换。

## 功能

- 使用 `ocs on <mode>` 切换当前 opencode 配置目录
- 创建、列出、查看和删除环境目录
- 通过一个可配置的 `baseDir` 统一管理所有环境
- macOS/Linux 通过 `~/.zshrc` 中的托管 export 块生效
- Windows 通过用户级 `OPENCODE_CONFIG_DIR` 环境变量生效
- 纯 Node.js 实现，没有运行时依赖

## 环境要求

- Node.js 20 或更新版本
- npm

## 安装

安装依赖并构建 CLI：

```sh
npm install
npm run build
```

从当前项目全局安装命令：

```sh
npm run setup
```

安装后，可以使用 `ocs` 命令。

## 配置

编辑项目根目录下的 `config.json`：

```json
{
  "baseDir": "~/opencode-config"
}
```

`baseDir` 支持绝对路径和 `~/...` 路径。每个环境都是 `baseDir` 下面的直接子目录。

目录示例：

```text
~/opencode-config/
├── work/
│   └── opencode.json
└── personal/
    └── opencode.json
```

## 使用

创建环境：

```sh
ocs new work
```

切换到该环境：

```sh
ocs on work
```

查看当前环境：

```sh
ocs current
```

清除本工具写入的环境变量：

```sh
ocs off
```

列出所有环境：

```sh
ocs list
```

删除环境：

```sh
ocs remove work
```

## 命令

| 命令 | 说明 |
| --- | --- |
| `ocs on <mode>` | 将 `OPENCODE_CONFIG_DIR` 切换到指定环境 |
| `ocs off` | 清除 `oc-config-switch` 写入的环境变量 |
| `ocs current` | 打印当前环境 |
| `ocs list` | 列出 `baseDir` 下的所有环境 |
| `ocs new <mode>` | 创建一个空环境目录 |
| `ocs remove <mode>` | 删除一个环境目录 |
| `ocs version` | 打印版本号 |
| `ocs help` | 显示帮助 |

环境名必须是直接子目录名，不能为空，不能以 `-` 开头，也不能包含路径分隔符。

## 让修改生效

在 macOS/Linux 上，`ocs on` 和 `ocs off` 会更新 `~/.zshrc` 中的托管块：

```sh
# oc-config-switch begin
export OPENCODE_CONFIG_DIR='...'
# oc-config-switch end
```

在当前终端里立即生效：

```sh
source ~/.zshrc
```

打开新的终端窗口也会生效。

在 Windows 上，`ocs` 会更新用户级 `OPENCODE_CONFIG_DIR` 环境变量。打开新的终端窗口后生效。

## 开发

```sh
npm install
npm run typecheck
npm run build
npm run dev -- help
```

直接运行构建后的 CLI：

```sh
node dist/index.js help
```
