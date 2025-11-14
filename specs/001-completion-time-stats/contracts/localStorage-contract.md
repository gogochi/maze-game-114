# localStorage 操作合約

**功能**: 過關時間統計
**日期**: 2025-11-14
**版本**: 1.0.0

## 概述

本文件定義過關時間統計功能與 localStorage 的互動合約。雖然這是瀏覽器原生 API，但明確定義資料格式和操作規範能確保實作一致性和可測試性。

## Storage Key 定義

### maze_best_records

**用途**: 儲存所有地圖設定的最佳過關紀錄

**資料類型**: JSON 字串

**Schema**:
```typescript
{
  [recordKey: string]: {
    time: number;      // 最佳時間（秒），正整數
    date: string;      // 達成日期，YYYY-MM-DD 格式
  }
}
```

**recordKey 格式**: `"{mapSize}-{difficulty}"`
- `mapSize`: 地圖尺寸（31 | 51 | 71 | 101）
- `difficulty`: 難度等級（0 | 1 | 2）

**範例**:
```json
{
  "31-0": {
    "time": 45,
    "date": "2025-11-14"
  },
  "51-1": {
    "time": 120,
    "date": "2025-11-13"
  },
  "101-2": {
    "time": 3600,
    "date": "2025-11-12"
  }
}
```

## 操作合約

### 操作 1: 儲存最佳紀錄

**方法簽名**:
```javascript
saveBestRecord(mapSize: number, difficulty: number, time: number): Object
```

**參數**:
- `mapSize` (number, 必填): 地圖尺寸，有效值 31, 51, 71, 101
- `difficulty` (number, 必填): 難度等級，有效值 0, 1, 2
- `time` (number, 必填): 過關時間（秒），必須 > 0

**回傳值**:
```typescript
{
  isNewRecord: boolean;     // 是否為新紀錄或打破紀錄
  previousBest?: number;    // 若打破紀錄，返回之前的最佳時間
  currentBest?: number;     // 若未打破紀錄，返回當前最佳時間
  error?: string;           // 若操作失敗，返回錯誤訊息
}
```

**行為**:
1. 讀取 localStorage 中的 `maze_best_records`
2. 解析 JSON（失敗則使用空物件）
3. 生成 recordKey: `"{mapSize}-{difficulty}"`
4. 比較 `time` 與現有紀錄（若有）
5. 若時間更短或無現有紀錄，則更新並儲存
6. 回傳操作結果

**錯誤處理**:
- localStorage 禁用：捕獲 QuotaExceededError，回傳 `{ isNewRecord: false, error: "..." }`
- JSON 解析失敗：使用空物件作為預設值
- 參數無效：不驗證（呼叫方負責）

**範例呼叫**:
```javascript
// 案例 1: 首次完成
const result = maze.saveBestRecord(31, 0, 45);
// 回傳: { isNewRecord: true, previousBest: null }

// 案例 2: 打破紀錄
const result = maze.saveBestRecord(31, 0, 30);
// 回傳: { isNewRecord: true, previousBest: 45 }

// 案例 3: 未打破紀錄
const result = maze.saveBestRecord(31, 0, 60);
// 回傳: { isNewRecord: false, currentBest: 30 }

// 案例 4: localStorage 失敗
const result = maze.saveBestRecord(31, 0, 25);
// 回傳: { isNewRecord: false, error: "QuotaExceededError" }
```

### 操作 2: 讀取最佳紀錄

**方法簽名**:
```javascript
getBestRecord(mapSize: number, difficulty: number): Object | null
```

**參數**:
- `mapSize` (number, 必填): 地圖尺寸
- `difficulty` (number, 必填): 難度等級

**回傳值**:
```typescript
{
  time: number;      // 最佳時間（秒）
  date: string;      // 達成日期（YYYY-MM-DD）
} | null              // 無紀錄時返回 null
```

**行為**:
1. 讀取 localStorage 中的 `maze_best_records`
2. 解析 JSON（失敗則返回 null）
3. 生成 recordKey 並查詢
4. 返回紀錄物件或 null

**錯誤處理**:
- localStorage 不可用：返回 null
- JSON 解析失敗：返回 null
- recordKey 不存在：返回 null

**範例呼叫**:
```javascript
// 案例 1: 有紀錄
const record = maze.getBestRecord(31, 0);
// 回傳: { time: 30, date: "2025-11-14" }

// 案例 2: 無紀錄
const record = maze.getBestRecord(71, 2);
// 回傳: null

// 案例 3: localStorage 失敗
const record = maze.getBestRecord(31, 0);
// 回傳: null
```

### 操作 3: 清除所有紀錄（測試用）

**方法簽名**:
```javascript
clearAllRecords(): boolean
```

**參數**: 無

**回傳值**:
- `true`: 成功清除
- `false`: 操作失敗

**行為**:
1. 呼叫 `localStorage.removeItem('maze_best_records')`
2. 捕獲任何錯誤並回傳結果

**範例呼叫**:
```javascript
const success = maze.clearAllRecords();
// 回傳: true 或 false
```

## 資料驗證規則

### recordKey 格式驗證
```javascript
// 正則表達式
const recordKeyPattern = /^(31|51|71|101)-(0|1|2)$/;

// 有效範例
"31-0"  // ✅
"51-1"  // ✅
"101-2" // ✅

// 無效範例
"30-0"  // ❌ 地圖尺寸無效
"31-3"  // ❌ 難度無效
"31"    // ❌ 缺少難度
```

### time 驗證
```javascript
// 有效值
time > 0 && Number.isInteger(time)

// 有效範例
45      // ✅
120     // ✅
3600    // ✅

// 無效範例
0       // ❌ 必須 > 0
-10     // ❌ 不能為負數
45.5    // ❌ 必須為整數
```

### date 格式驗證
```javascript
// 正則表達式
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

// 有效範例
"2025-11-14"  // ✅
"2024-01-01"  // ✅

// 無效範例
"2025/11/14"  // ❌ 分隔符錯誤
"14-11-2025"  // ❌ 順序錯誤
"2025-11-1"   // ❌ 日期少一位
```

## 容量限制

### localStorage 容量
- **標準限制**: 5-10 MB（各瀏覽器不同）
- **本功能用量**: < 1 KB
- **最大紀錄數**: 12 筆（4 種尺寸 × 3 種難度）
- **安全邊際**: 遠低於限制，無容量問題

### 單筆紀錄大小
```json
{
  "101-2": {
    "time": 3600,
    "date": "2025-11-14"
  }
}
```
序列化後約 50-60 bytes

## 相容性保證

### 瀏覽器支援
- Chrome 4+ (2010)
- Firefox 3.5+ (2009)
- Safari 4+ (2009)
- Edge 所有版本
- **結論**: 所有現代瀏覽器完全支援

### 降級策略
若 localStorage 不可用：
1. 紀錄操作失敗回傳 `false` 或 `null`
2. 過關時僅顯示本次時間，不顯示歷史紀錄
3. 遊戲核心玩法不受影響

## 測試場景

### 單元測試

```javascript
// 測試 1: 首次儲存紀錄
describe('saveBestRecord - 首次儲存', () => {
  it('應該儲存新紀錄並回傳 isNewRecord=true', () => {
    localStorage.clear();
    const result = maze.saveBestRecord(31, 0, 45);
    assert.equal(result.isNewRecord, true);
    assert.equal(result.previousBest, null);
  });
});

// 測試 2: 打破紀錄
describe('saveBestRecord - 打破紀錄', () => {
  it('應該更新紀錄並回傳之前最佳時間', () => {
    maze.saveBestRecord(31, 0, 60);  // 先儲存一筆
    const result = maze.saveBestRecord(31, 0, 45);  // 打破紀錄
    assert.equal(result.isNewRecord, true);
    assert.equal(result.previousBest, 60);
  });
});

// 測試 3: 未打破紀錄
describe('saveBestRecord - 未打破紀錄', () => {
  it('應該不更新並回傳當前最佳時間', () => {
    maze.saveBestRecord(31, 0, 45);  // 先儲存一筆
    const result = maze.saveBestRecord(31, 0, 60);  // 未打破
    assert.equal(result.isNewRecord, false);
    assert.equal(result.currentBest, 45);
  });
});

// 測試 4: 讀取存在的紀錄
describe('getBestRecord - 讀取紀錄', () => {
  it('應該回傳正確的紀錄物件', () => {
    maze.saveBestRecord(31, 0, 45);
    const record = maze.getBestRecord(31, 0);
    assert.equal(record.time, 45);
    assert.match(record.date, /^\d{4}-\d{2}-\d{2}$/);
  });
});

// 測試 5: 讀取不存在的紀錄
describe('getBestRecord - 無紀錄', () => {
  it('應該回傳 null', () => {
    const record = maze.getBestRecord(999, 999);
    assert.equal(record, null);
  });
});

// 測試 6: 不同設定的紀錄獨立
describe('多個紀錄獨立性', () => {
  it('不同地圖尺寸和難度的紀錄互不干擾', () => {
    maze.saveBestRecord(31, 0, 30);
    maze.saveBestRecord(31, 1, 40);
    maze.saveBestRecord(51, 0, 50);

    assert.equal(maze.getBestRecord(31, 0).time, 30);
    assert.equal(maze.getBestRecord(31, 1).time, 40);
    assert.equal(maze.getBestRecord(51, 0).time, 50);
  });
});
```

## 變更歷史

### v1.0.0 (2025-11-14)
- 初始版本
- 定義 `maze_best_records` key 和資料結構
- 定義三個操作：儲存、讀取、清除

## 附註

本合約文件雖然定義的是 localStorage 操作（非傳統意義的 API），但明確的介面定義有助於：
1. 確保實作一致性
2. 編寫可測試的程式碼
3. 未來可能的資料遷移或儲存方案變更
4. 多人協作時的溝通清晰
