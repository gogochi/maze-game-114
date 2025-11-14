/**
 * @file 走迷宮遊戲的主入口和全局配置
 * @copyright 2020 knightyun. <https://raw.githubusercontent.com/knightyun/maze-game/master/maze.js>
 * @license MIT License. <https://raw.githubusercontent.com/knightyun/maze-game/master/LICENSE>
 */

/**
 * 遊戲常數配置
 */
const GAME_CONSTANTS = {
    // 預設值
    DEFAULT_MAZE_SIZE: 31,
    DEFAULT_CELL_SIZE: 10,
    DEFAULT_BALL_DIAMETER: 6,
    DEFAULT_GAME_LEVEL: 0,
    
    // 移動控制
    BALL_MOVE_STEP: 4,
    MOVE_DELAY_MS: 15,
    
    // 迷宮生成
    FORK_MAX_RATIO: 0.3,
    
    // UI 延遲
    HINT_DELAY_MS: 5000,
    
    // 入口出口偏移
    ENTRANCE_X_OFFSET: 1,
    ENTRANCE_Y_OFFSET: 0,
    EXIT_X_OFFSET: 2,
    EXIT_Y_OFFSET: 1,
    
    // 特殊地圖尺寸
    MAX_MAZE_SIZE: 101,
};

// ========== 全局變數 ==========

const elMaze = document.querySelector("#maze-map");
const elBall = document.querySelector("#maze-ball");
const elMazeWrapper = document.querySelector(".maze");
const elControl = document.querySelector(".control");
const elStartGame = document.querySelector(".start-game");
const elGameLevel = document.querySelector(".game-level");
const elMazeSize = document.querySelector(".maze-size");
const elGameHint = document.querySelector(".game-hint");

let maze = genMaze();

// ========== 全局函數 ==========

/**
 * 重新生成迷宮
 */
function reGenMaze() {
    // 重新生成迷宮並移動小球
    maze = genMaze({
        width: +elMazeSize.value,
        height: +elMazeSize.value,
        gameLevel: +elGameLevel.value,
    });
}

/**
 * 開始遊戲
 */
function startGame() {
    // 開始移動小球
    maze.startMove();

    // 禁用開始按鈕
    elStartGame.classList.add("disabled");
    elStartGame.classList.remove("pulse");

    M.toast({
        html: `<span class="teal-text text-accent-2">
                 遊戲開始！<br>
                 請使用方向鍵移動小球
               </span>`,
        displayLength: 2000,
    });

    // 一定時間後顯示提示按鈕
    setTimeout(() => {
        elGameHint.classList.remove("scale-out");
        elGameHint.classList.add("scale-in");
    }, GAME_CONSTANTS.HINT_DELAY_MS);
}

/**
 * 生成迷宮
 * @param {object} options - 配置選項
 * @returns {GameController} - 遊戲控制器實例
 */
function genMaze(options) {
    const _options = Object.assign(
        {
            elMaze: elMaze,
            elBall: elBall,
        },
        options
    );

    // 啟用開始按鈕
    elStartGame.classList.remove("disabled");
    elStartGame.classList.add("pulse");

    // 隱藏提示按鈕
    elGameHint.classList.remove("scale-in");
    elGameHint.classList.add("scale-out");

    return new GameController(_options);
}

/**
 * 點擊提示後繪制迷宮的解
 */
function drawHintPath() {
    // 隱藏提示按鈕
    elGameHint.classList.remove("scale-in");
    elGameHint.classList.add("scale-out");

    // 繪制迷宮的出路
    maze.drawCorrectPath();
}

// ========== 事件監聽 ==========

// 監聽地圖尺寸調整
elMazeSize.addEventListener("change", function () {
    maze = genMaze({
        width: +this.value,
        height: +this.value,
        gameLevel: +elGameLevel.value,
    });

    elMazeWrapper.style.width = maze.width * maze.step + "px";
    elMazeWrapper.style.zoom = elControl.clientWidth / (maze.width * maze.step);
});

// 監聽遊戲難度調整
elGameLevel.addEventListener("change", function () {
    maze = genMaze({
        width: +elMazeSize.value,
        height: +elMazeSize.value,
        gameLevel: +this.value,
    });
});

// 縮放迷宮地圖以適應頁面
elMazeWrapper.style.width = maze.width * maze.step + "px";
elMazeWrapper.style.zoom = elControl.clientWidth / (maze.width * maze.step);
