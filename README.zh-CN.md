# 点文件显示开关

[English](README.md) | 简体中文

用于切换 VS Code `files.exclude` 配置中排除项的显示状态。

## 功能

命令面板中的命令统一归类在 **点文件显示开关** 分类下：

- `隐藏点文件`
- `显示点文件`
- `切换点文件显示状态`

资源管理器右键菜单中也提供 `切换点文件显示状态`。

在简体中文 VS Code 的命令面板中，通常会显示中文主标题和英文原始别名，例如：

```text
点文件显示开关: 显示点文件
Dotfile Toggle: Show Dotfiles
```

中文和英文都可以用于搜索命令。资源管理器右键菜单通常只显示中文命令标题。

## 实际作用范围

“点文件”是本扩展采用的中文产品用语。扩展底层实际操作的是 VS Code 的 `files.exclude` 配置，因此它可能切换任意被排除的文件或文件夹，并不只处理名称以 `.` 开头的文件。

扩展会检查以下配置范围：

- 用户全局配置；
- 当前工作区配置；
- 多根工作区中各文件夹的配置。

## 已知限制

扩展只切换值为布尔类型的排除项，例如：

```json
{
  "files.exclude": {
    "**/.git": true,
    "**/.DS_Store": true
  }
}
```

带条件的排除对象不会被修改。

## 始终显示的点文件

使用 `dotfileToggle.keepVisible` 填写隐藏其他点文件时仍应显示的点文件或点文件夹名称。只填写名称，不需要填写 `files.exclude` 的规则键：

```json
{
  "files.exclude": {
    "**/.*": true
  },
  "dotfileToggle.keepVisible": [
    ".env",
    ".vscode"
  ]
}
```

这正是针对常见 `"**/.*"` 宽泛规则的用法。执行“隐藏点文件”时，扩展会自动把该宽泛规则替换为一条**排除列表中名称**的等价生成规则。因此 `.env` 和 `.vscode` 会保持显示，不需要你手工拆分或维护复杂的 glob 规则；执行“显示点文件”时，生成规则会自动删除。

也兼容旧的 `"**/.env"` 写法。该设置只接受简单的点文件名称，故意不支持任意 glob 表达式；可配置在用户、工作区或多根工作区文件夹范围。

扩展只修改布尔型 `files.exclude` 条目，带条件的排除对象不会被修改。如果在点文件隐藏期间要手工编辑 `files.exclude`，请先执行“显示点文件”，让扩展清理临时生成的规则。

## 安装与迁移

计划使用的独立 Marketplace 扩展标识为：

```text
henrychang.dotfile-toggle
```

扩展正式发布后，可以在扩展视图中搜索并安装，也可以运行：

```bash
code --install-extension henrychang.dotfile-toggle
```

此前生成的私有 VSIX 使用上游扩展标识 `adrianwilczynski.toggle-hidden`。由于更换 publisher 会产生新的扩展标识，不能预期 Settings Sync 自动把私有版本迁移成 Marketplace 版本。应先安装并验证 Marketplace 版本，再卸载仍然存在的私有版本或上游标识版本。

## Settings Sync

扩展发布到 Visual Studio Marketplace 后，VS Code Settings Sync 可以在其他机器上根据 Marketplace 扩展标识恢复安装。

用户级 `files.exclude` 和 `dotfileToggle.keepVisible` 配置由 VS Code 的设置同步功能处理；工作区级配置仍应保存在工作区配置文件或项目仓库中。在支持该能力的 VS Code 版本中，扩展还会同步一个内部清理键，用于在另一台机器上清理临时生成的全局排除规则。

## 本地构建

```bash
npm install
npm run compile
npx @vscode/vsce package --out temp/dotfile-toggle-1.2.1.vsix
```

项目不增加自动化测试、自动打包或自动发布脚本。发布包采用手工构建和检查。

## 演示

![演示](img/example.gif)

## 项目来源

本项目基于 [Adrian Wilczyński 的 Peek Hidden Files](https://github.com/AdrianWilczynski/PeekHiddenFiles) 独立维护。项目保留原有命令 ID 和核心行为，并增加扩展清单本地化、简体中文文档及构建维护。

## 许可证

本项目使用 MIT 许可证，详见 [LICENSE](LICENSE)，并保留原作者版权声明。
