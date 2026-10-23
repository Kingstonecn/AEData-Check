# AEData-Check 项目

## 概述

AE 数据分析工具。解析 Excel 工作簿（AE Data 工作表），逐条检测可疑数据并支持人工审核修正，提供分析仪表盘进行多维度数据分析。

## 前端目录（单版本）

前端源码唯一路径：`tauri-app/frontend/`（含 `index.html` 与 `lib/*`）。
既可用于 Tauri 打包，也可直接双击 `tauri-app/frontend/index.html` 在浏览器中运行。

## 构建

```bash
# 在 tauri-app 目录下
cargo tauri build
```

输出：`tauri-app/target/release/ae-data-analysis.exe`
同步到：`D:\SynologyDrive\分析工具\AE数据分析.exe`

仅在传奇绳匠明确要求时构建。

## 关键决策

- **`dragDropEnabled: false`**：Tauri v2 默认拦截 OS 级拖放，导致 HTML5 `drop` 事件无法获取文件。必须禁用以让 WebView 原生处理。
- **`createDateRangeControl` 工厂函数**（analysis.js）：封装日期范围控制的通用逻辑（日期选择、span 下拉、锁定机制），被资产效率总览和帕雷托分析共用。新增类似区域时应复用此函数。
