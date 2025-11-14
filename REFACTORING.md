# 代碼重構說明

## 重構概述

原本的 `Maze` 類別已經被拆分成四個專注的類別，遵循單一職責原則（Single Responsibility Principle）：

## 新的類別架構

### 1. **MazeGenerator** (`js/MazeGenerator.js`)
**職責：** 負責迷宮生成算法

**主要方法：**
- `initMazeGrids()` - 初始化迷宮網格數據結構
- `generatePath(grid, preGrid, callback)` - 使用遞歸回溯算法生成迷宮路徑
- `getValidDirections(x, y)` - 獲取當前格子的有效候選方向
- `forkPath(grid1, grid2, directions)` - 處理路徑分叉邏輯
- `getRandomDirection(directions)` - 根據遊戲難度隨機返回候選方向
- `getFrontGrid()`, `getFrontLeftGrid()`, `getFrontRightGrid()` - 獲取相對位置的格子

### 2. **MazeRenderer** (`js/MazeRenderer.js`)
**職責：** 負責所有繪製邏輯

**主要方法：**
- `resizeCanvas(width, height)` - 調整 Canvas 尺寸
- `setBackground(color)` - 設置背景顏色
- `fillGrid(x, y, color)` - 繪製單個格子
- `drawWalls(mazeGrids, wallColor, tunnelColor)` - 繪製圍牆和出入口
- `drawCorrectPath(mazeGrids, entrance, exitX, exitY)` - 繪製迷宮的正確路徑（提示功能）
- `drawBall(elBall, diameter, entrance)` - 繪製小球
- `updateBallPosition(elBall, x, y)` - 更新小球位置

### 3. **BallController** (`js/BallController.js`)
**職責：** 負責小球移動控制和碰撞檢測

**主要方法：**
- `setBallPosition(x, y)` - 設置小球初始位置
- `moveBall(speedX, speedY, onMove, onArriveExit)` - 控制小球移動
- `getBallValidPosition(x, y)` - 碰撞檢測，限制小球在路徑內移動
- `keyDownHandler(evt, onMove, onArriveExit)` - 處理鍵盤按下事件
- `keyUpHandler(evt)` - 處理鍵盤釋放事件
- `startListening(onMove, onArriveExit)` - 開始監聽鍵盤事件
- `stopListening()` - 停止監聽鍵盤事件

### 4. **GameController** (`js/GameController.js`)
**職責：** 遊戲流程控制，協調其他三個類別

**主要方法：**
- `initControllers()` - 初始化三個子控制器
- `initMaze()` - 初始化迷宮（協調生成器和渲染器）
- `startMove()` - 開始遊戲（啟用小球控制）
- `arriveExit()` - 處理到達出口的邏輯
- `drawCorrectPath()` - 顯示提示路徑

### 5. **maze.js**
**職責：** 全局配置和入口點

**內容：**
- `GAME_CONSTANTS` - 遊戲常數配置對象
- 全局函數：`genMaze()`, `startGame()`, `reGenMaze()`, `drawHintPath()`
- DOM 元素引用
- 事件監聽器設置

## 重構優勢

### 1. **單一職責**
每個類別只負責一個明確的功能領域，易於理解和維護。

### 2. **可測試性**
各個類別可以獨立測試，不需要依賴完整的遊戲環境。

### 3. **可擴展性**
- 想要更換渲染方式？只需修改 `MazeRenderer`
- 想要改進迷宮生成算法？只需修改 `MazeGenerator`
- 想要添加新的控制方式（如觸控）？只需擴展 `BallController`

### 4. **代碼重用**
各個類別可以在其他項目中重用，例如：
- `MazeGenerator` 可用於服務器端生成迷宮數據
- `MazeRenderer` 可用於純渲染場景

### 5. **易於維護**
相關功能集中在一起，修改某個功能時不會影響其他無關部分。

## 類別依賴關係

```
GameController (主控制器)
    ├── MazeGenerator (生成迷宮數據)
    ├── MazeRenderer (渲染視覺效果)
    └── BallController (控制小球)
```

## 使用方式

```javascript
// 創建遊戲實例
const game = new GameController({
    elMaze: canvasElement,
    elBall: ballElement,
    width: 31,
    height: 31,
    step: 10,
    ballDia: 6,
    gameLevel: 0
});

// 開始遊戲
game.startMove();

// 顯示提示
game.drawCorrectPath();
```

## 向後兼容

重構保持了與原有代碼的完全兼容性：
- 所有原有的功能都正常工作
- 全局函數接口保持不變
- HTML 結構無需修改（僅需引入新的 JS 檔案）

## 文件結構

```
js/
├── MazeGenerator.js    # 迷宮生成器
├── MazeRenderer.js     # 迷宮渲染器
├── BallController.js   # 小球控制器
├── GameController.js   # 遊戲控制器
├── maze.js            # 主入口和配置
└── maze.old.js        # 原始代碼備份
```

## 未來改進建議

1. 考慮使用 ES6 模組 (`import`/`export`) 替代全局變數
2. 添加 TypeScript 類型定義提高代碼安全性
3. 實現事件系統替代回調函數
4. 添加單元測試覆蓋各個類別
