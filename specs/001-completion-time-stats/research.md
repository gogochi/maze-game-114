# 技術研究：過關時間統計

**功能**: 過關時間統計
**日期**: 2025-11-14
**狀態**: 完成

## 研究目標

確定實作過關時間統計功能的最佳技術方案，確保符合專案憲章的「簡單至上」和「原生優先」原則。

## 關鍵技術決策

### 1. 計時機制

**決策**: 使用原生 JavaScript `Date.now()` 進行時間戳記錄

**理由**:
- `Date.now()` 返回毫秒級時間戳，精確度足夠（規格僅需秒級）
- 瀏覽器原生支援，無需額外依賴
- 效能優異，呼叫成本極低（< 1μs）
- 計算經過時間簡單：`elapsedMs = Date.now() - startTime`

**考慮的替代方案**:
- ❌ `performance.now()`: 提供更高精確度，但規格不需要毫秒以下精度，過度設計
- ❌ `setInterval` 累加秒數: 不精確，分頁切換時可能暫停，與需求不符
- ❌ 第三方計時函式庫: 違反「原生優先」原則

**實作細節**:
```javascript
// Maze class 新增屬性
this.gameStartTime = null;      // 遊戲開始時間戳（毫秒）
this.gameEndTime = null;        // 過關時間戳（毫秒）
this.timerInterval = null;      // 即時計時器 ID

// 計算經過時間（秒）
getElapsedSeconds() {
  if (!this.gameStartTime) return 0;
  const end = this.gameEndTime || Date.now();
  return Math.floor((end - this.gameStartTime) / 1000);
}
```

### 2. 時間格式化

**決策**: 使用簡單的字串操作進行時間格式化

**理由**:
- 格式需求簡單：「45秒」、「1分23秒」、「1時23分45秒」
- 原生字串操作足夠，無需引入 Intl.DateTimeFormat 或 moment.js
- 程式碼清晰易懂，符合「簡單至上」原則

**考慮的替代方案**:
- ❌ `Intl.DateTimeFormat`: 過於複雜，且無法靈活控制中文格式
- ❌ moment.js / date-fns: 違反「原生優先」原則，檔案體積大
- ❌ `toLocaleTimeString()`: 格式不符合需求（會顯示完整時鐘時間）

**實作細節**:
```javascript
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
```

### 3. 資料儲存

**決策**: 使用 localStorage 儲存最佳紀錄，以 JSON 格式序列化

**理由**:
- localStorage 是瀏覽器原生 API，無需依賴
- 持久化儲存，瀏覽器關閉後保留
- 讀寫速度快（< 10ms）
- 符合規格的「僅本機儲存」需求

**考慮的替代方案**:
- ❌ IndexedDB: 過於複雜，功能遠超需求（儲存幾筆紀錄而已）
- ❌ SessionStorage: 瀏覽器關閉後遺失，不符合需求
- ❌ Cookies: 容量限制小（4KB），且會發送到伺服器（無意義）
- ❌ 後端資料庫: 違反「純前端專案」原則

**資料結構**:
```javascript
// localStorage key: "maze_best_records"
// Value: JSON 字串
{
  "31-0": {  // key 格式："{地圖大小}-{難度}"
    "time": 45,           // 最佳時間（秒）
    "date": "2025-11-14"  // 達成日期
  },
  "51-1": {
    "time": 120,
    "date": "2025-11-13"
  }
  // ... 其他設定的紀錄
}
```

**實作細節**:
```javascript
// 儲存最佳紀錄
saveBestRecord(size, difficulty, time) {
  const key = 'maze_best_records';
  const records = JSON.parse(localStorage.getItem(key) || '{}');
  const recordKey = `${size}-${difficulty}`;

  // 只在時間更短時更新
  if (!records[recordKey] || time < records[recordKey].time) {
    records[recordKey] = {
      time: time,
      date: new Date().toISOString().split('T')[0]  // YYYY-MM-DD
    };
    localStorage.setItem(key, JSON.stringify(records));
    return true;  // 打破紀錄
  }
  return false;  // 未打破紀錄
}

// 讀取最佳紀錄
getBestRecord(size, difficulty) {
  const key = 'maze_best_records';
  const records = JSON.parse(localStorage.getItem(key) || '{}');
  const recordKey = `${size}-${difficulty}`;
  return records[recordKey] || null;
}
```

### 4. 即時計時器更新

**決策**: 使用 `setInterval` 每秒更新一次顯示

**理由**:
- 規格要求：「計時器每秒更新一次」
- `setInterval` 是瀏覽器原生 API，穩定可靠
- 每秒更新不會造成效能問題

**考慮的替代方案**:
- ❌ `requestAnimationFrame`: 更新頻率過高（60fps），浪費資源
- ❌ 更高頻率的 setInterval（100ms）: 違反需求，且無實質益處

**實作細節**:
```javascript
// 開始計時器
startTimer() {
  this.gameStartTime = Date.now();
  this.timerInterval = setInterval(() => {
    this.updateTimerDisplay();
  }, 1000);  // 每秒更新一次
}

// 停止計時器
stopTimer() {
  if (this.timerInterval) {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }
  this.gameEndTime = Date.now();
}

// 更新計時器顯示
updateTimerDisplay() {
  const elapsed = this.getElapsedSeconds();
  const displayElement = document.getElementById('timer-display');
  if (displayElement) {
    displayElement.textContent = this.formatTime(elapsed);
  }
}
```

### 5. UI 整合點

**決策**: 在現有 Maze class 的關鍵事件點整合計時邏輯

**理由**:
- 保持與現有程式碼的一致性
- 避免建立新的事件系統，符合「簡單至上」原則
- 利用現有的遊戲狀態管理

**整合點**:
1. **開始計時**: `drawPath()` 完成後（迷宮生成完畢）
2. **停止計時**: `arriveExit()` 觸發時（抵達終點）
3. **重置計時**: `genMaze()` 開始時（生成新迷宮）

**實作策略**:
```javascript
// 在 Maze class constructor 中初始化
constructor(w, h) {
  // ... 現有程式碼
  this.gameStartTime = null;
  this.gameEndTime = null;
  this.timerInterval = null;
  this.usedHint = false;  // 追蹤是否使用提示
}

// 在迷宮生成完成後開始計時
// 修改 drawPath() 的完成回調
drawPath(x, y) {
  // ... 現有遞歸挖路邏輯
  // 當所有路徑完成後
  if (allPathsComplete) {
    this.startTimer();  // 🆕 開始計時
  }
}

// 在抵達終點時停止計時並顯示
// 修改 arriveExit()
arriveExit() {
  this.stopTimer();  // 🆕 停止計時
  const time = this.getElapsedSeconds();
  this.showCompletionMessage(time);  // 🆕 顯示過關訊息
  if (!this.usedHint) {
    this.saveBestRecord(this.w, this.difficulty, time);  // 🆕 儲存紀錄
  }
  // ... 現有勝利邏輯
}

// 在使用提示時標記
// 修改 drawCorrectPath()
drawCorrectPath() {
  this.usedHint = true;  // 🆕 標記使用提示
  // ... 現有提示邏輯
}

// 在生成新迷宮時重置
// 修改 genMaze()
genMaze() {
  this.stopTimer();  // 🆕 停止舊計時器
  this.gameStartTime = null;
  this.gameEndTime = null;
  this.usedHint = false;  // 🆕 重置提示標記
  // ... 現有生成邏輯
}
```

## 效能考量

### localStorage 容量
- 每筆紀錄約 50 bytes（JSON 序列化）
- 地圖尺寸 3 種 × 難度 3 種 = 最多 9 筆紀錄
- 總容量 < 1 KB（localStorage 限制 5-10 MB，遠遠足夠）

### 計時器效能
- `setInterval` 每秒執行一次，CPU 佔用可忽略
- DOM 更新僅涉及一個文字節點，重排成本極低
- `Date.now()` 呼叫速度 < 1μs，對效能無影響

### 記憶體使用
- 新增屬性：3 個時間戳 + 1 個布林值 + 1 個 interval ID ≈ 40 bytes
- 對現有遊戲記憶體使用無顯著影響

## 瀏覽器相容性

### localStorage
- Chrome 4+ (2010)
- Firefox 3.5+ (2009)
- Safari 4+ (2009)
- Edge 所有版本
- ✅ 現代瀏覽器全部支援

### Date.now()
- Chrome 5+ (2010)
- Firefox 3+ (2008)
- Safari 4+ (2009)
- Edge 所有版本
- ✅ 現代瀏覽器全部支援

### setInterval/clearInterval
- 所有瀏覽器原生支援
- ✅ 無相容性問題

## 風險與緩解

### 風險 1: 分頁切換時計時不準確
**緩解**: 使用 `Date.now()` 時間戳而非累加計數，分頁切換不影響計時準確性

### 風險 2: localStorage 被禁用或滿載
**緩解**:
- 使用 try-catch 包裝 localStorage 操作
- 失敗時僅顯示本次時間，不儲存紀錄
- 對核心遊戲玩法無影響

### 風險 3: 使用者手動修改 localStorage
**緩解**:
- 僅為單機遊戲，無排行榜競爭
- 作弊僅影響個人體驗
- 成本/效益比不值得實作防作弊機制（符合「簡單至上」原則）

## 總結

所有技術決策都符合專案憲章的核心原則：
- ✅ **簡單至上**: 使用最簡單的原生 API，無不必要的抽象
- ✅ **純前端**: 無後端依賴，所有邏輯在瀏覽器執行
- ✅ **原生優先**: 零外部依賴，僅使用瀏覽器原生 API
- ✅ **繁體中文**: 所有使用者介面文字使用繁體中文

預估實作時間：2-3 小時（包含測試）
預估程式碼行數：約 200-250 行（含註解）
