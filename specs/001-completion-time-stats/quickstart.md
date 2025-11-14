# 快速上手指南：過關時間統計

**功能**: 過關時間統計
**日期**: 2025-11-14
**目標受眾**: 開發者

## 概述

本文件提供過關時間統計功能的快速實作指南。功能將整合到現有的 `Maze` class 中，無需建立新檔案或引入外部依賴。

## 前置需求

- 熟悉 JavaScript ES6+ 語法
- 了解 Maze class 的基本結構（位於 `js/maze.js`）
- 瀏覽器開發者工具使用經驗

## 實作步驟

### 步驟 1: 在 Maze class 新增屬性

在 `Maze` class 的 constructor 中新增計時相關屬性：

```javascript
class Maze {
  constructor(w, h) {
    // ... 現有屬性

    // 🆕 計時功能屬性
    this.gameStartTime = null;      // 遊戲開始時間戳（毫秒）
    this.gameEndTime = null;        // 遊戲結束時間戳（毫秒）
    this.timerInterval = null;      // 計時器 ID
    this.usedHint = false;          // 是否使用提示
  }
}
```

### 步驟 2: 實作計時核心方法

在 Maze class 中新增以下方法：

```javascript
// 開始計時
startTimer() {
  this.gameStartTime = Date.now();
  this.gameEndTime = null;

  // 每秒更新顯示（P3 功能）
  this.timerInterval = setInterval(() => {
    this.updateTimerDisplay();
  }, 1000);
}

// 停止計時
stopTimer() {
  if (this.timerInterval) {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }
  this.gameEndTime = Date.now();
}

// 計算經過秒數
getElapsedSeconds() {
  if (!this.gameStartTime) return 0;
  const endTime = this.gameEndTime || Date.now();
  return Math.floor((endTime - this.gameStartTime) / 1000);
}

// 格式化時間顯示
formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}時${minutes}分${secs}秒`;
  } else if (minutes > 0) {
    return `${minutes}分${secs}秒`;
  } else {
    return `${secs}秒`;
  }
}

// 更新即時計時器顯示（P3 功能）
updateTimerDisplay() {
  const elapsed = this.getElapsedSeconds();
  const displayElement = document.getElementById('timer-display');
  if (displayElement) {
    displayElement.textContent = this.formatTime(elapsed);
  }
}
```

### 步驟 3: 實作紀錄儲存方法

```javascript
// 儲存最佳紀錄
saveBestRecord(mapSize, difficulty, time) {
  const STORAGE_KEY = 'maze_best_records';
  let records = {};

  try {
    records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch (e) {
    console.error('讀取紀錄失敗:', e);
    records = {};
  }

  const recordKey = `${mapSize}-${difficulty}`;
  const existing = records[recordKey];

  // 檢查是否打破紀錄
  if (!existing || time < existing.time) {
    records[recordKey] = {
      time: time,
      date: new Date().toISOString().split('T')[0]
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      return { isNewRecord: true, previousBest: existing?.time };
    } catch (e) {
      console.error('儲存紀錄失敗:', e);
      return { isNewRecord: false, error: e.message };
    }
  }

  return { isNewRecord: false, currentBest: existing.time };
}

// 讀取最佳紀錄
getBestRecord(mapSize, difficulty) {
  const STORAGE_KEY = 'maze_best_records';
  try {
    const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const recordKey = `${mapSize}-${difficulty}`;
    return records[recordKey] || null;
  } catch (e) {
    console.error('讀取紀錄失敗:', e);
    return null;
  }
}
```

### 步驟 4: 整合到現有流程

#### 4.1 在迷宮生成完成後開始計時

找到 `drawPath()` 方法中迷宮生成完成的邏輯，新增計時開始：

```javascript
drawPath(x, y) {
  // ... 現有遞歸挖路邏輯 ...

  // 當所有路徑完成後（找到這個判斷點）
  if (/* 迷宮生成完成的條件 */) {
    // 🆕 開始計時
    this.startTimer();
  }
}
```

#### 4.2 在使用提示時標記

找到 `drawCorrectPath()` 方法，標記使用提示：

```javascript
drawCorrectPath() {
  this.usedHint = true;  // 🆕 標記使用提示
  // ... 現有提示邏輯 ...
}
```

#### 4.3 在抵達終點時停止計時並顯示

找到 `arriveExit()` 方法，新增計時結束邏輯：

```javascript
arriveExit() {
  // 🆕 停止計時
  this.stopTimer();

  // 🆕 計算過關時間
  const elapsedSeconds = this.getElapsedSeconds();
  const timeText = this.formatTime(elapsedSeconds);

  // 🆕 處理紀錄
  let message = `過關時間：${timeText}`;

  if (!this.usedHint) {
    // 未使用提示，嘗試儲存紀錄
    const result = this.saveBestRecord(this.w, this.difficulty, elapsedSeconds);

    if (result.isNewRecord) {
      if (result.previousBest) {
        message += `\n🎉 打破紀錄！`;
        message += `\n（之前最佳：${this.formatTime(result.previousBest)}）`;
      } else {
        message += `\n🎊 首次完成！`;
      }
    } else if (result.currentBest) {
      const bestTime = this.formatTime(result.currentBest);
      message += `\n最佳紀錄：${bestTime}`;
    }
  }

  // 顯示訊息（使用現有的顯示機制，如 alert 或 toast）
  alert(message);  // 可替換為更好的 UI 顯示方式

  // ... 現有勝利邏輯（如特殊彩蛋）...
}
```

#### 4.4 在生成新迷宮時重置

找到 `genMaze()` 方法，新增重置邏輯：

```javascript
genMaze() {
  // 🆕 重置計時狀態
  this.stopTimer();
  this.gameStartTime = null;
  this.gameEndTime = null;
  this.usedHint = false;

  // ... 現有迷宮生成邏輯 ...
}
```

### 步驟 5: 新增 UI 顯示（P3 - 即時計時器）

在 `index.html` 中新增計時器顯示元素：

```html
<!-- 在適當位置新增 -->
<div id="timer-container" style="position: fixed; top: 10px; right: 10px; font-size: 18px; font-weight: bold; background: rgba(255,255,255,0.9); padding: 10px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
  計時：<span id="timer-display">0秒</span>
</div>
```

## 測試方法

### 手動測試步驟

#### 測試 P1: 查看本次過關時間

1. 開啟遊戲，點擊「開始」生成迷宮
2. 等待迷宮生成完成（觀察是否開始計時）
3. 操作小球到達終點
4. 驗證是否顯示過關時間
5. 驗證時間格式正確（如「1分23秒」或「45秒」）

#### 測試 P2: 查看最佳紀錄

1. 首次完成某個設定（如 31x31 簡單）
2. 驗證顯示「首次完成！」
3. 重新生成相同設定的迷宮，更快完成
4. 驗證顯示「打破紀錄！」和之前最佳時間
5. 重新生成相同設定，更慢完成
6. 驗證同時顯示本次時間和最佳紀錄
7. 使用提示功能過關
8. 驗證僅顯示本次時間，不更新紀錄

#### 測試 P3: 即時計時顯示

1. 開啟遊戲並開始
2. 觀察右上角計時器是否每秒更新
3. 驗證格式正確
4. 過關後計時器是否停止

### 瀏覽器測試

在以下瀏覽器測試：
- ✅ Chrome（最新版）
- ✅ Firefox（最新版）
- ✅ Safari（最新版 - macOS/iOS）
- ✅ Edge（最新版）

### localStorage 測試

1. 完成遊戲並儲存紀錄
2. 開啟開發者工具 → Application → Local Storage
3. 驗證 `maze_best_records` key 存在
4. 驗證 JSON 格式正確
5. 關閉瀏覽器並重新開啟
6. 驗證紀錄保留

### 邊界情況測試

1. **分頁切換**: 遊戲中切換分頁，返回後過關，驗證計時包含離開時間
2. **清除紀錄**: 清除 localStorage，驗證下次過關視為「首次完成」
3. **超長時間**: 刻意等待超過 1 小時，驗證顯示格式正確（如「1時2分3秒」）

## 常見問題

### Q1: 計時器不啟動？
**A**: 檢查 `drawPath()` 完成後是否正確呼叫 `startTimer()`。使用 `console.log('計時開始')` 除錯。

### Q2: localStorage 儲存失敗？
**A**: 可能是隱私模式或容量已滿。檢查 try-catch 是否正確處理錯誤。

### Q3: 紀錄沒有更新？
**A**: 檢查是否使用了提示功能（`usedHint` 標記）。確認比較邏輯：只有時間更短才更新。

### Q4: 計時不準確？
**A**: 確認使用 `Date.now()` 而非 `setInterval` 累加。時間戳方法不受分頁切換影響。

### Q5: 不同難度的紀錄混淆？
**A**: 檢查複合鍵格式：`"{mapSize}-{difficulty}"`。確認讀寫時使用相同的鍵生成邏輯。

## 程式碼檢查清單

開發完成後，確認以下項目：

- [ ] ✅ 所有新增方法都有繁體中文註解
- [ ] ✅ 變數命名清晰（英文），無縮寫
- [ ] ✅ 使用 try-catch 包裝 localStorage 操作
- [ ] ✅ 時間格式化正確處理小時/分/秒
- [ ] ✅ `usedHint` 標記在 `genMaze()` 時重置
- [ ] ✅ `stopTimer()` 正確清除 `setInterval`
- [ ] ✅ 過關訊息對使用者友善
- [ ] ✅ 無引入任何外部依賴
- [ ] ✅ 程式碼風格與現有檔案一致

## 效能檢查

- [ ] ✅ 計時器更新頻率為 1 秒（不要用 100ms 等高頻率）
- [ ] ✅ `Date.now()` 使用正確（不要在 setInterval 中重複宣告 Date 物件）
- [ ] ✅ localStorage 僅在需要時讀寫（不要每秒讀取）
- [ ] ✅ 過關時延遲 < 1 秒（符合成功標準 SC-001）

## 下一步

實作完成後，執行 `/speckit.tasks` 指令生成詳細的任務分解清單。

## 參考資料

- [MDN: Date.now()](https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Reference/Global_Objects/Date/now)
- [MDN: localStorage](https://developer.mozilla.org/zh-TW/docs/Web/API/Window/localStorage)
- [MDN: setInterval](https://developer.mozilla.org/zh-TW/docs/Web/API/setInterval)
- 專案憲章: `.specify/memory/constitution.md`
- 功能規格: `specs/001-completion-time-stats/spec.md`
- 資料模型: `specs/001-completion-time-stats/data-model.md`
