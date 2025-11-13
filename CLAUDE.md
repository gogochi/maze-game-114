# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Language Preferences
- Always respond in Traditional Chinese (zh-tw)

## 專案概述

這是一個 H5 線上走迷宮遊戲，支援桌面端和移動端操作。移動端可透過重力感應器控制小球移動，桌面端則使用方向鍵或 WASD 鍵控制。

## 技術架構

### 核心架構
- **純前端專案**：無後端依賴，使用原生 JavaScript、HTML5 Canvas 和 CSS
- **單一 Class 設計**：所有迷宮邏輯封裝在 `Maze` class 中 (js/maze.js)
- **迷宮生成算法**：使用遞歸回溯法 (Recursive Backtracking) 隨機生成迷宮路徑

### 檔案結構
```
├── index.html              # 主頁面，包含遊戲 UI 和控制面板
├── js/
│   ├── maze.js            # 核心遊戲邏輯和 Maze 類別實現
│   └── materialize.min.js  # Materialize CSS 框架
├── css/
│   ├── index.css          # 自定義樣式
│   └── materialize.min.css # Materialize CSS 框架
└── img/                   # 圖片資源
```

## Maze 類別核心功能

### 迷宮生成 (js/maze.js)
- `initMaze()`: 初始化迷宮，建立二維網格陣列
- `drawPath()`: 遞歸挖路，使用 setTimeout 實現異步分叉
- `getValidDirections()`: 獲取當前格子的所有有效候選方向
- `forkPath()`: 處理路徑分叉邏輯，根據遊戲難度決定分叉數量
- `getRandomDirection()`: 根據遊戲難度 (0=簡單, 1=複雜, 2=困難) 返回候選方向

### 小球移動控制
- `moveBall(x, y, useAcc)`: 處理小球移動，支援重力加速度模式
- `getBallValidPosition()`: 碰撞檢測，防止小球穿牆
- `keyDownHandler()` / `keyUpHandler()`: 桌面端鍵盤控制
- `motionHandler()`: 移動端重力感應器控制

### 遊戲機制
- **入口/出口**：入口固定在 (1, 0)，出口在 (w-2, h-1)
- **提示功能**：`drawCorrectPath()` 從出口反向追溯到入口，顯示正確路徑
- **特殊通關提示**：無提示通關最大地圖 (101x101) 會顯示特別的祝賀訊息
- **重力加速度**：使用 G = 9.8，透過時間戳計算速度變化

## 開發指令

### 執行專案
```bash
# 使用任何 HTTP 伺服器執行，例如：
python -m http.server 8000
# 或
npx serve
```

然後在瀏覽器開啟 http://localhost:8000

### 部署
本專案為靜態網頁，可直接部署到任何靜態託管服務 (GitHub Pages, Netlify, Vercel 等)

## 關鍵實現細節

### 迷宮生成演算法
使用修改版的遞歸回溯法：
1. 從入口開始，每次前進兩格（一次挖兩個格子）
2. 使用 `setTimeout` 實現異步遞歸，允許同時挖掘多個分支
3. 根據遊戲難度控制分叉概率（maxRatio = 0.3）
4. 每個格子儲存 `preGrid` 用於路徑提示功能

### 碰撞檢測邏輯
小球有四個角點，每個角點轉換為迷宮座標系：
- 一個角穿牆：根據移動方向調整座標
- 兩個角穿牆：必在同一側，直接限制該側座標
- 碰到牆時速度歸零（`ballSpeedX` / `ballSpeedY = 0`）

### 重力感應器整合
- 使用 `DeviceMotionEvent.accelerationIncludingGravity`
- 支援 Accelerometer API 檢測
- 加速度範圍：[-10, 10]，對應傾斜角度
- 右翻 x 為負，後翻 y 為正

## 注意事項

1. **Canvas 座標系**：左上角為原點 (0, 0)
2. **迷宮座標系**：使用單元格索引，需乘以 `step` (預設 10px) 轉換為 Canvas 座標
3. **小球直徑**：預設 6px (`ballDia`)，碰撞檢測需考慮小球尺寸
4. **遊戲難度**：
   - 0 (簡單): 隨機返回 1 個候選方向
   - 1 (複雜): 隨機返回 2 個候選方向（難度最大）
   - 2 (困難): 隨機返回 3 個候選方向（全部）
5. **地圖尺寸**：必須為奇數（31-101），確保迷宮格子對齊

## 修改建議

- **新增關卡模式**：修改 `genMaze()` 函數，允許預設地圖配置
- **調整難度演算法**：修改 `forkPath()` 和 `getRandomDirection()` 中的 `maxRatio` 參數
- **自定義主題**：修改 `drawWall()` 和 `fillGrid()` 中的顏色參數
- **添加音效**：在 `moveBall()` 和 `arriveExit()` 中整合音效
