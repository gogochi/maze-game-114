# 任務：過關時間統計

**輸入**: 設計文件來自 `/specs/001-completion-time-stats/`
**前置需求**: plan.md (必需), spec.md (必需，包含使用者故事), data-model.md, contracts/

**測試**: 本功能採用手動測試（跨瀏覽器測試），無自動化測試需求

**組織方式**: 任務按使用者故事分組，支援獨立實作和測試每個故事

## 格式：`[ID] [P?] [Story] 說明`

- **[P]**: 可並行執行（不同檔案，無依賴）
- **[Story]**: 任務所屬的使用者故事（如 US1, US2, US3）
- 包含確切的檔案路徑

## 路徑慣例

- **單一專案**: 專案根目錄的檔案（index.html, js/maze.js, css/index.css）
- 本專案為單一前端專案，所有修改集中在現有檔案

## Phase 1: 設定（共享基礎設施）

**目的**: 專案初始化和基本結構

- [ ] T001 閱讀並理解現有 Maze class 結構（js/maze.js）
- [ ] T002 閱讀功能規格和設計文件（specs/001-completion-time-stats/）
- [ ] T003 備份現有 js/maze.js（建立 git commit 或副本）

---

## Phase 2: 基礎設施（阻塞前置條件）

**目的**: 所有使用者故事必須依賴的核心基礎設施

**⚠️ 關鍵**: 此階段完成前，任何使用者故事都無法開始

- [ ] T004 在 Maze class constructor 中新增計時相關屬性（gameStartTime, gameEndTime, timerInterval, usedHint）在 js/maze.js
- [ ] T005 [P] 實作 getElapsedSeconds() 方法計算經過秒數在 js/maze.js
- [ ] T006 [P] 實作 formatTime() 方法格式化時間顯示（支援時/分/秒）在 js/maze.js
- [ ] T007 [P] 實作 startTimer() 方法開始計時在 js/maze.js
- [ ] T008 [P] 實作 stopTimer() 方法停止計時並清除 interval 在 js/maze.js

**檢查點**: 基礎設施就緒 - 使用者故事實作現在可以並行開始

---

## Phase 3: 使用者故事 1 - 查看本次過關時間 (優先級: P1) 🎯 MVP

**目標**: 玩家在過關時能立即看到本次遊戲花費的時間

**獨立測試**: 完成一次迷宮遊戲並觀察是否顯示過關時間（格式：分:秒 或 秒）

### 實作 使用者故事 1

- [ ] T009 [US1] 在 genMaze() 方法中重置計時狀態（gameStartTime, gameEndTime, usedHint, timerInterval）在 js/maze.js
- [ ] T010 [US1] 在 drawPath() 迷宮生成完成後呼叫 startTimer() 開始計時在 js/maze.js
- [ ] T011 [US1] 在 arriveExit() 方法中呼叫 stopTimer() 停止計時在 js/maze.js
- [ ] T012 [US1] 在 arriveExit() 中計算經過時間並格式化顯示訊息在 js/maze.js
- [ ] T013 [US1] 在 arriveExit() 中使用 alert 或現有 UI 機制顯示過關時間在 js/maze.js
- [ ] T014 [US1] 驗證分頁切換時計時器持續計時（使用 Date.now() 確保準確性）
- [ ] T015 [US1] 驗收測試：完成遊戲並檢查時間顯示格式正確

**檢查點**: 此時使用者故事 1 應該完全功能正常且可獨立測試

---

## Phase 4: 使用者故事 2 - 查看當前地圖最佳紀錄 (優先級: P2)

**目標**: 玩家在過關時能看到該地圖設定下的歷史最佳紀錄，激勵挑戰更好成績

**獨立測試**: 多次完成相同設定的迷宮，驗證系統正確記錄和顯示最佳時間

### 實作 使用者故事 2

- [ ] T016 [P] [US2] 實作 saveBestRecord(mapSize, difficulty, time) 方法儲存最佳紀錄至 localStorage 在 js/maze.js
- [ ] T017 [P] [US2] 實作 getBestRecord(mapSize, difficulty) 方法從 localStorage 讀取最佳紀錄在 js/maze.js
- [ ] T018 [US2] 在 drawCorrectPath() 方法中設定 usedHint = true 標記使用提示在 js/maze.js
- [ ] T019 [US2] 在 arriveExit() 中檢查 !usedHint，若為 true 則嘗試儲存紀錄在 js/maze.js
- [ ] T020 [US2] 在 arriveExit() 中讀取最佳紀錄並比較本次時間在 js/maze.js
- [ ] T021 [US2] 在 arriveExit() 中根據比較結果顯示適當訊息（「首次完成！」、「打破紀錄！」、或本次 vs. 最佳）在 js/maze.js
- [ ] T022 [US2] 加入 try-catch 錯誤處理確保 localStorage 失敗時不影響遊戲在 js/maze.js
- [ ] T023 [US2] 驗收測試：首次完成某設定，檢查顯示「首次完成！」
- [ ] T024 [US2] 驗收測試：打破紀錄，檢查顯示「打破紀錄！」和之前時間
- [ ] T025 [US2] 驗收測試：未打破紀錄，檢查顯示本次時間 vs. 最佳時間
- [ ] T026 [US2] 驗收測試：使用提示過關，檢查僅顯示本次時間且不更新紀錄

**檢查點**: 使用者故事 1 和 2 現在都應該獨立運作

---

## Phase 5: 使用者故事 3 - 在遊戲中查看即時計時 (優先級: P3)

**目標**: 玩家在遊戲進行中能看到即時跳動的計時器，隨時了解已花費的時間

**獨立測試**: 開始遊戲並觀察畫面上是否有持續更新的計時器

### 實作 使用者故事 3

- [ ] T027 [P] [US3] 在 index.html 中新增計時器顯示 UI 元素（id="timer-display"）在 index.html
- [ ] T028 [P] [US3] 在 css/index.css 中新增計時器樣式（固定位置、背景、邊框等）在 css/index.css
- [ ] T029 [US3] 實作 updateTimerDisplay() 方法更新計時器 UI 顯示在 js/maze.js
- [ ] T030 [US3] 在 startTimer() 中設定 setInterval 每秒呼叫 updateTimerDisplay() 在 js/maze.js
- [ ] T031 [US3] 在 stopTimer() 中確保 clearInterval 正確清除計時器在 js/maze.js
- [ ] T032 [US3] 驗收測試：開始遊戲，檢查計時器從 0 開始並每秒更新
- [ ] T033 [US3] 驗收測試：過關時，檢查計時器停止更新

**檢查點**: 所有使用者故事現在都應該獨立運作

---

## Phase 6: 整合與測試

**目的**: 跨使用者故事的改善和整體品質提升

- [ ] T034 [P] 跨瀏覽器測試（Chrome, Firefox, Safari, Edge）
- [ ] T035 [P] 移動端瀏覽器測試（iOS Safari, Chrome Mobile）
- [ ] T036 測試 localStorage 清除後的行為（開發者工具清除 storage）
- [ ] T037 測試超長時間顯示（等待 > 1 小時，驗證格式「1時23分45秒」）
- [ ] T038 測試不同地圖設定的紀錄獨立性（31x31 簡單 vs. 31x31 複雜）
- [ ] T039 [P] 程式碼註解補充（繁體中文註解說明關鍵邏輯）在 js/maze.js
- [ ] T040 [P] 更新 CLAUDE.md 記錄新功能說明在 CLAUDE.md
- [ ] T041 驗證向後相容性（現有遊戲功能不受影響）
- [ ] T042 效能檢查（計時器更新不造成卡頓，localStorage 讀寫 < 50ms）

---

## 依賴關係與執行順序

### Phase 依賴關係

- **設定 (Phase 1)**: 無依賴 - 可立即開始
- **基礎設施 (Phase 2)**: 依賴設定完成 - **阻塞所有使用者故事**
- **使用者故事 (Phase 3+)**: 全部依賴基礎設施完成
  - 使用者故事之間可並行（若有人力）
  - 或依優先級順序執行（P1 → P2 → P3）
- **整合測試 (Final Phase)**: 依賴所有想要的使用者故事完成

### 使用者故事依賴

- **使用者故事 1 (P1)**: 基礎設施完成後可開始 - 無依賴其他故事
- **使用者故事 2 (P2)**: 基礎設施完成後可開始 - 建議在 US1 之後（共用 arriveExit 顯示邏輯）
- **使用者故事 3 (P3)**: 基礎設施完成後可開始 - 可獨立實作（僅新增 UI 顯示）

### 每個使用者故事內

- genMaze() 重置 → drawPath() 開始計時 → arriveExit() 停止計時
- 核心實作完成後再整合
- 故事完成後再進入下一優先級

### 並行機會

- 所有設定任務標記 [P] 可並行
- 所有基礎設施任務標記 [P] 可並行（Phase 2 內）
- 基礎設施完成後，所有使用者故事可並行（若團隊容量允許）
- 使用者故事內標記 [P] 的任務可並行（如 US2 的兩個實作方法）
- 整合測試中標記 [P] 的可並行

---

## 並行範例：使用者故事 2

```bash
# 同時啟動使用者故事 2 的兩個儲存方法實作：
任務: "實作 saveBestRecord(mapSize, difficulty, time) 方法儲存最佳紀錄至 localStorage 在 js/maze.js"
任務: "實作 getBestRecord(mapSize, difficulty) 方法從 localStorage 讀取最佳紀錄在 js/maze.js"
```

---

## 實作策略

### MVP 優先（僅使用者故事 1）

1. 完成 Phase 1: 設定
2. 完成 Phase 2: 基礎設施（關鍵 - 阻塞所有故事）
3. 完成 Phase 3: 使用者故事 1
4. **停止並驗證**: 獨立測試使用者故事 1
5. 部署/展示（若準備好）

### 漸進式交付

1. 完成設定 + 基礎設施 → 基礎就緒
2. 新增使用者故事 1 → 獨立測試 → 部署/展示（MVP！）
3. 新增使用者故事 2 → 獨立測試 → 部署/展示
4. 新增使用者故事 3 → 獨立測試 → 部署/展示
5. 每個故事增加價值而不破壞之前的故事

### 並行團隊策略

若有多位開發者：

1. 團隊一起完成設定 + 基礎設施
2. 基礎設施完成後：
   - 開發者 A: 使用者故事 1
   - 開發者 B: 使用者故事 2
   - 開發者 C: 使用者故事 3
3. 故事獨立完成並整合

---

## 備註

- [P] 任務 = 不同檔案，無依賴
- [Story] 標籤將任務對應到特定使用者故事以利追蹤
- 每個使用者故事應該可獨立完成和測試
- 在每個檢查點停下驗證故事獨立運作
- 避免：模糊任務、相同檔案衝突、破壞故事獨立性的跨故事依賴
- 每個任務或邏輯群組後提交 git commit
