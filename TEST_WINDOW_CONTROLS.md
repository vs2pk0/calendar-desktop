# 窗口控制功能测试指南

## 当前问题诊断

### 已实现的功能：

1. ✅ 窗口控制按钮已添加（红、黄、绿）
2. ✅ 图标在悬停时显示
3. ✅ 添加了 `data-tauri-drag-region` 属性
4. ✅ 添加了错误处理和控制台日志

### 问题排查步骤：

#### 1. 打开开发者工具

按 `Cmd+Option+I` (macOS) 打开开发者工具，查看控制台是否有错误信息。

#### 2. 测试窗口控制按钮

- 点击红色按钮（关闭） - 应该关闭应用
- 点击黄色按钮（最小化） - 应该最小化窗口
- 点击绿色按钮（最大化） - 应该最大化/还原窗口

如果按钮不工作，控制台会显示错误信息。

#### 3. 测试拖动功能

- 尝试拖动标题栏的空白区域（不是按钮、图标或导航标签）
- 应该能够拖动整个窗口

### 可能的原因：

1. **Tauri API 版本问题** - 检查控制台是否有导入错误
2. **权限问题** - macOS 可能需要授予窗口管理权限
3. **拖动区域设置** - CSS 的 `-webkit-app-region` 可能在某些情况下不生效

### 当前 API 调用方式：

```javascript
const { appWindow } = await import('@tauri-apps/api/window');
await appWindow.close();
await appWindow.minimize();
await appWindow.maximize();
await appWindow.unmaximize();
```

### 下一步调试：

请打开开发者工具并点击按钮，然后告诉我控制台显示了什么错误信息。
