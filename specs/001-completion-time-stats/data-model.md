# 資料模型：過關時間統計

**功能**: 過關時間統計
**日期**: 2025-11-14
**狀態**: 完成

## 概述

本功能涉及兩個主要實體：遊戲階段資料（執行時記憶體）和最佳紀錄資料（localStorage 持久化）。所有資料都在瀏覽器端處理，無後端互動。

## 實體定義

### 1. GameSession（遊戲階段 - 執行時記憶體）

**說明**: 追蹤單次遊戲進行中的計時狀態，儲存在 Maze class 實例屬性中。

**屬性**:

| 屬性名稱 | 類型 | 說明 | 驗證規則 | 預設值 |
|---------|------|------|---------|--------|
| `gameStartTime` | Number\|null | 遊戲開始時間戳（毫秒），由 Date.now() 取得 | >= 0 或 null | `null` |
| `gameEndTime` | Number\|null | 遊戲結束時間戳（毫秒），由 Date.now() 取得 | >= gameStartTime 或 null | `null` |
| `timerInterval` | Number\|null | setInterval 返回的計時器 ID，用於即時更新顯示 | > 0 或 null | `null` |
| `usedHint` | Boolean | 本次遊戲是否使用提示功能 | true 或 false | `false` |

**生命週期**:
1. **初始化**: `genMaze()` 開始時，所有屬性重置為預設值
2. **開始計時**: 迷宮生成完成後，設定 `gameStartTime = Date.now()`
3. **使用提示**: 玩家點擊提示按鈕時，設定 `usedHint = true`
4. **結束計時**: 抵達終點時，設定 `gameEndTime = Date.now()`，清除 `timerInterval`
5. **銷毀**: 生成新迷宮時重置

**狀態轉換**:
```
[未開始] --genMaze()--> [已初始化]
[已初始化] --drawPath完成--> [計時中]
[計時中] --使用提示--> [計時中(已用提示)]
[計時中] --arriveExit()--> [已完成]
[計時中(已用提示)] --arriveExit()--> [已完成(已用提示)]
[已完成] --genMaze()--> [已初始化]
```

**計算屬性**:

```javascript
// 計算經過秒數
getElapsedSeconds() {
  if (!this.gameStartTime) return 0;
  const endTime = this.gameEndTime || Date.now();
  return Math.floor((endTime - this.gameStartTime) / 1000);
}
```

### 2. BestRecord（最佳紀錄 - localStorage 持久化）

**說明**: 儲存特定地圖設定下的歷史最佳通關時間，使用 localStorage 持久化。

**儲存結構**:

**localStorage key**: `"maze_best_records"`

**值格式**: JSON 字串，反序列化後為物件

```javascript
{
  "{mapSize}-{difficulty}": {
    "time": Number,      // 最佳時間（秒）
    "date": String       // 達成日期（YYYY-MM-DD 格式）
  },
  // 範例：
  "31-0": {
    "time": 45,
    "date": "2025-11-14"
  },
  "51-1": {
    "time": 120,
    "date": "2025-11-13"
  }
}
```

**複合鍵格式**: `"{mapSize}-{difficulty}"`
- `mapSize`: 地圖尺寸（31, 51, 71, 101）
- `difficulty`: 難度等級（0=簡單, 1=複雜, 2=困難）
- 範例：`"31-0"` 表示 31x31 地圖，簡單難度

**屬性**:

| 屬性名稱 | 類型 | 說明 | 驗證規則 | 範例 |
|---------|------|------|---------|------|
| `time` | Number | 最佳通關時間（秒） | > 0，整數 | `45` |
| `date` | String | 達成日期 | YYYY-MM-DD 格式 | `"2025-11-14"` |

**驗證規則**:
- `time` 必須為正整數
- `date` 必須符合 ISO 8601 日期格式（YYYY-MM-DD）
- 複合鍵必須符合 `"{數字}-{0|1|2}"` 格式

**操作方法**:

```javascript
// 儲存最佳紀錄（若時間更短則更新）
saveBestRecord(mapSize, difficulty, time) {
  const STORAGE_KEY = 'maze_best_records';
  const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const recordKey = `${mapSize}-${difficulty}`;

  // 檢查是否打破紀錄
  const existing = records[recordKey];
  if (!existing || time < existing.time) {
    records[recordKey] = {
      time: time,
      date: new Date().toISOString().split('T')[0]
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      return { isNewRecord: true, previousBest: existing?.time || null };
    } catch (e) {
      console.error('無法儲存紀錄至 localStorage:', e);
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
    console.error('無法讀取 localStorage 紀錄:', e);
    return null;
  }
}

// 清除所有紀錄（測試或重置用）
clearAllRecords() {
  const STORAGE_KEY = 'maze_best_records';
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (e) {
    console.error('無法清除紀錄:', e);
    return false;
  }
}
```

## 資料關係圖

```
┌─────────────────────────┐
│   Maze Class Instance   │
│  (執行時記憶體)          │
├─────────────────────────┤
│ - gameStartTime         │
│ - gameEndTime           │◄─── Date.now() 時間戳
│ - timerInterval         │◄─── setInterval ID
│ - usedHint              │◄─── 使用者操作觸發
└─────────────┬───────────┘
              │
              │ arriveExit() 時
              │ 若 !usedHint
              ▼
┌─────────────────────────┐
│     localStorage        │
│  (瀏覽器持久化儲存)      │
├─────────────────────────┤
│ Key: maze_best_records  │
│ Value: JSON Object      │
│  {                      │
│    "31-0": {            │
│      time: 45,          │◄─── 比較並更新
│      date: "2025-11-14" │
│    }                    │
│  }                      │
└─────────────────────────┘
```

## 資料流程

### 1. 遊戲開始流程

```
使用者點擊「開始」
  ↓
genMaze() 被呼叫
  ↓
重置計時狀態：
  - gameStartTime = null
  - gameEndTime = null
  - usedHint = false
  - 清除 timerInterval
  ↓
開始生成迷宮（drawPath 遞歸）
  ↓
迷宮生成完成
  ↓
gameStartTime = Date.now()
timerInterval = setInterval(更新顯示, 1000ms)
```

### 2. 使用提示流程

```
使用者點擊「提示」按鈕
  ↓
drawCorrectPath() 被呼叫
  ↓
usedHint = true  （標記已使用提示）
  ↓
顯示正確路徑
  ↓
（計時繼續，但過關後不儲存紀錄）
```

### 3. 過關流程

```
小球抵達終點
  ↓
arriveExit() 被呼叫
  ↓
gameEndTime = Date.now()
clearInterval(timerInterval)
  ↓
計算過關時間（秒）=
  floor((gameEndTime - gameStartTime) / 1000)
  ↓
顯示過關時間給玩家
  ↓
if (!usedHint) {
  讀取 localStorage 最佳紀錄
    ↓
  比較本次時間與最佳紀錄
    ↓
  if (本次更快 || 無紀錄) {
    更新 localStorage
    顯示「打破紀錄！」或「首次完成！」
  } else {
    顯示本次時間 vs. 最佳紀錄
  }
} else {
  僅顯示本次時間（不儲存）
}
```

## 儲存容量分析

### 單筆紀錄大小
```javascript
{
  "31-0": {
    "time": 999,
    "date": "2025-11-14"
  }
}
```
序列化後約 50 bytes

### 最大資料量
- 地圖尺寸選項：4 種（31, 51, 71, 101）
- 難度選項：3 種（0, 1, 2）
- 最大紀錄數：4 × 3 = 12 筆
- 總容量：12 × 50 bytes ≈ 600 bytes

**結論**: localStorage 限制為 5-10 MB，本功能用量 < 1 KB，遠低於限制。

## 錯誤處理

### localStorage 不可用
```javascript
try {
  localStorage.setItem('maze_best_records', JSON.stringify(records));
} catch (e) {
  // 可能原因：
  // - 隱私模式
  // - 容量已滿
  // - 瀏覽器禁用
  console.error('無法儲存紀錄:', e);
  // 降級處理：僅顯示本次時間，不儲存紀錄
  // 不影響核心遊戲玩法
}
```

### JSON 解析失敗
```javascript
try {
  const records = JSON.parse(localStorage.getItem('maze_best_records') || '{}');
} catch (e) {
  console.error('localStorage 資料損壞:', e);
  // 使用空物件作為預設值
  const records = {};
}
```

## 測試場景

### 單元測試驗證點
1. ✅ `getElapsedSeconds()` 在未開始時返回 0
2. ✅ `getElapsedSeconds()` 正確計算經過秒數
3. ✅ `saveBestRecord()` 在首次完成時儲存紀錄
4. ✅ `saveBestRecord()` 在時間更短時更新紀錄
5. ✅ `saveBestRecord()` 在時間更長時不更新紀錄
6. ✅ `getBestRecord()` 在無紀錄時返回 null
7. ✅ 不同地圖設定的紀錄互不干擾
8. ✅ 使用提示後不儲存紀錄

### 整合測試驗證點
1. ✅ localStorage 資料在瀏覽器重啟後保留
2. ✅ 隱私模式下不儲存但遊戲正常運行
3. ✅ 多個分頁同時遊戲時資料同步（最後寫入優先）

## 資料遷移

目前為初版，無需遷移。若未來版本需修改資料結構：

```javascript
// 版本檢查與遷移
function migrateRecords() {
  const records = JSON.parse(localStorage.getItem('maze_best_records') || '{}');

  // 檢查版本標記
  if (!records._version) {
    // v1.0 -> v2.0 遷移邏輯
    records._version = 2;
    localStorage.setItem('maze_best_records', JSON.stringify(records));
  }
}
```

## 總結

資料模型設計完全符合憲章原則：
- ✅ **簡單至上**: 使用最簡單的 JSON 結構，無 ORM 或複雜抽象
- ✅ **純前端**: 所有資料在瀏覽器端處理和儲存
- ✅ **原生優先**: 僅使用 localStorage 和 JSON API
- ✅ **可靠性**: 錯誤處理完整，降級策略明確
