# 實作計劃：過關時間統計

**分支**: `001-completion-time-stats` | **日期**: 2025-11-14 | **規格**: [spec.md](./spec.md)
**輸入**: 功能規格來自 `/specs/001-completion-time-stats/spec.md`

**註**: 本模板由 `/speckit.plan` 指令填寫。

## 摘要

為迷宮遊戲新增過關時間統計功能，包含三個優先級的使用者故事：
1. **P1**: 過關時顯示本次時間（MVP 核心功能）
2. **P2**: 顯示和儲存歷史最佳紀錄（localStorage）
3. **P3**: 遊戲中顯示即時計時器

技術方式：在現有 Maze class 中新增計時邏輯，使用原生 JavaScript Date API 和 localStorage，保持簡單直觀的實作。

## 技術背景

**語言/版本**: JavaScript (ES6+) - 瀏覽器原生支援
**主要依賴**:
- 無外部依賴（純原生 JavaScript）
- 現有：Materialize CSS（僅用於 UI 樣式）

**儲存**: localStorage（瀏覽器原生 API）
**測試**: 手動測試（跨瀏覽器測試：桌面 + 移動端）
**目標平台**: 現代瀏覽器（Chrome 90+, Firefox 88+, Safari 14+, Edge 90+）
**專案類型**: 單一前端專案（純 HTML/CSS/JS，無建置工具）
**效能目標**:
- 過關時間顯示延遲 < 1 秒
- 計時器更新頻率：每秒一次
- localStorage 讀寫 < 50ms

**約束**:
- 不使用任何建置工具或模組打包器
- 不引入額外的 JavaScript 函式庫
- 保持與現有 Maze class 的向後相容
- 檔案可直接在瀏覽器開啟執行

**規模/範圍**:
- 單一 HTML 頁面應用
- 1 個主要 Class (Maze) 的擴展
- 預估新增程式碼：約 200-300 行 JavaScript

## 憲章檢查

*GATE: Phase 0 研究前必須通過。Phase 1 設計後重新檢查。*

### I. 簡單至上（不要過度設計）
✅ **通過** - 使用原生 Date API 和 localStorage，無引入額外抽象層
✅ **通過** - 計時邏輯直接整合在現有 Maze class，無建立新的模組系統
✅ **通過** - 時間格式化使用簡單的字串操作，不引入 moment.js 等函式庫

### II. 純前端專案
✅ **通過** - 無後端依賴，所有資料儲存在 localStorage
✅ **通過** - 無需建置工具，直接修改現有 js/maze.js
✅ **通過** - 可直接在瀏覽器開啟執行

### III. 原生優先
✅ **通過** - 使用原生 JavaScript Date API（`Date.now()`, `new Date()`）
✅ **通過** - 使用原生 localStorage API（`localStorage.getItem/setItem`）
✅ **通過** - 使用原生 `setInterval` 進行計時器更新
✅ **通過** - 無引入任何新的外部函式庫

### IV. 繁體中文優先
✅ **通過** - 所有使用者介面文字使用繁體中文（「分」、「秒」、「首次完成！」、「打破紀錄！」）
✅ **通過** - 程式碼註解使用繁體中文
✅ **通過** - 變數和函數命名使用英文（如 `startTimer()`, `saveRecord()`）

**憲章檢查結果**: ✅ 全部通過，無違規項目

## 專案結構

### 文件（本功能）

```text
specs/001-completion-time-stats/
├── spec.md              # 功能規格
├── plan.md              # 本檔案（/speckit.plan 指令輸出）
├── research.md          # Phase 0 輸出
├── data-model.md        # Phase 1 輸出
├── quickstart.md        # Phase 1 輸出
└── checklists/          # 品質檢查清單
    └── requirements.md  # 規格品質檢查清單
```

### 原始碼（儲存庫根目錄）

本專案為單一前端應用，無需複雜的目錄結構。所有修改集中在現有檔案：

```text
/（專案根目錄）
├── index.html           # 主頁面 - 新增計時器顯示 UI
├── js/
│   └── maze.js          # ⭐ 核心修改檔案 - 新增計時和紀錄邏輯
├── css/
│   └── index.css        # 可能新增計時器樣式
└── CLAUDE.md            # 更新功能說明
```

**結構決策**: 使用現有的單一專案結構，所有新功能直接整合到現有 `Maze` class 中。這符合憲章的「簡單至上」原則，避免建立不必要的模組或檔案。

## 複雜度追蹤

**無違規項目** - 本功能完全符合所有憲章原則，無需複雜度豁免。

