/**
 * @file 小球控制器類
 * @description 負責小球的移動控制、碰撞檢測和鍵盤事件處理
 */

/**
 * 小球控制器類
 * 負責小球的移動邏輯和碰撞檢測
 *
 * @class BallController
 */
class BallController {
    /**
     * @constructor
     * @param {number} width      - 迷宮寬度（格數）
     * @param {number} height     - 迷宮高度（格數）
     * @param {number} step       - 單元格大小（像素）
     * @param {number} ballDia    - 小球直徑（像素）
     * @param {Array}  mazeGrids  - 迷宮網格數據
     * @param {object} exit       - 出口坐標 {x, y}
     * @memberof BallController
     */
    constructor(width, height, step, ballDia, mazeGrids, exit) {
        this.width = width;
        this.height = height;
        this.step = step;
        this.ballDia = ballDia;
        this.mazeGrids = mazeGrids;
        this.exit = exit;

        // 小球當前位置（像素）
        this.ballX = 0;
        this.ballY = 0;

        // 小球移動速度
        this.ballSpeedX = 0;
        this.ballSpeedY = 0;

        // 當前按鍵方向
        this.curKey = '';

        // 移動計時器
        this.moveInterval = null;

        // 是否已經到達出口
        this.hasReachedExit = false;

        // 綁定事件處理器
        this.keyDownHandler = this.keyDownHandler.bind(this);
        this.keyUpHandler = this.keyUpHandler.bind(this);
    }

    /**
     * 設置小球初始位置
     *
     * @param {number} x - 小球 x 坐標（像素）
     * @param {number} y - 小球 y 坐標（像素）
     * @memberof BallController
     */
    setBallPosition(x, y) {
        this.ballX = x;
        this.ballY = y;
    }

    /**
     * 更新迷宮網格數據（當重新生成迷宮時需要更新）
     *
     * @param {Array} mazeGrids - 新的迷宮網格數據
     * @memberof BallController
     */
    updateMazeGrids(mazeGrids) {
        this.mazeGrids = mazeGrids;
        this.hasReachedExit = false;
    }

    /**
     * 實現移動控制小球
     *
     * @param {number}   speedX           - x 軸方向的移動速度
     * @param {number}   speedY           - y 軸方向的移動速度
     * @param {function} onMove           - 移動後的回調函數，傳入新坐標
     * @param {function} onArriveExit     - 到達出口的回調函數
     * @memberof BallController
     */
    moveBall(speedX, speedY, onMove, onArriveExit) {
        // 未移動時的坐標
        let ballX = this.ballX;
        let ballY = this.ballY;

        // x, y 為各自方向上的移動速度
        this.ballSpeedX = speedX;
        this.ballSpeedY = speedY;

        // 移動後的坐標
        ballX += this.ballSpeedX;
        ballY += this.ballSpeedY;

        // 把小球變換後的坐標限制在路內（防止穿牆）
        const validPos = this.getBallValidPosition(ballX, ballY);

        // 保存變換後的坐標
        this.ballX = validPos.x;
        this.ballY = validPos.y;

        // 判斷是否到達出口（只觸發一次）
        if (
            !this.hasReachedExit &&
            this.ballX >= this.exit.x * this.step &&
            this.ballY >= this.exit.y * this.step
        ) {
            this.hasReachedExit = true;
            onArriveExit();
        }

        // 通知外部更新小球位置
        onMove(this.ballX, this.ballY);
    }

    /**
     * 限制小球移動範圍，返回限制後的有效坐標
     *
     * @param   {number} x - 變換後的小球 x 坐標
     * @param   {number} y - 變換後的小球 y 坐標
     * @returns {object}   - 限制後的 x，y 坐標
     * @memberof BallController
     */
    getBallValidPosition(x, y) {
        // 限制小球在迷宮範圍內
        const bounds = MazeUtils.constrainToBounds(
            x,
            y,
            this.ballDia,
            this.width,
            this.height,
            this.step
        );
        
        x = bounds.x;
        y = bounds.y;
        
        if (bounds.needStopX) {
            this.ballSpeedX = 0;
        }
        if (bounds.needStopY) {
            this.ballSpeedY = 0;
        }

        // 小球四個角的坐標轉換為迷宮坐標
        const corners = MazeUtils.getBallCornerGrids(x, y, this.ballDia, this.step);
        const leftTop = corners.leftTop;
        const leftBottom = corners.leftBottom;
        const rightTop = corners.rightTop;
        const rightBottom = corners.rightBottom;

        // 判斷每個角對應的迷宮格子是否是路
        const that = this;

        function isGridPath(grid) {
            return MazeUtils.isGridPath(grid.x, grid.y, that.mazeGrids);
        }

        // 小球穿牆的情況處理
        // 1. 一個角穿牆
        // 1.1. 左上角
        if (
            !isGridPath(leftTop) &&
            isGridPath(leftBottom) &&
            isGridPath(rightTop) &&
            isGridPath(rightBottom)
        ) {
            // 向左穿牆
            if (x - leftTop.x * this.step > y - leftTop.y * this.step) {
                x = (leftTop.x + 1) * this.step;
                this.ballSpeedX = 0;
            // 向上穿牆
            } else {
                y = (leftTop.y + 1) * this.step;
                this.ballSpeedY = 0;
            }
        }
        // 1.2. 左下角
        if (
            !isGridPath(leftBottom) &&
            isGridPath(leftTop) &&
            isGridPath(rightBottom) &&
            isGridPath(rightTop)
        ) {
            // 向左穿牆
            if (
                (leftBottom.x + 1) * this.step - x <
                y + this.ballDia - leftBottom.y * this.step
            ) {
                x = (leftBottom.x + 1) * this.step;
                this.ballSpeedX = 0;
            // 向下穿牆
            } else {
                y = leftBottom.y * this.step - this.ballDia;
                this.ballSpeedY = 0;
            }
        }
        // 1.3. 右下角
        if (
            !isGridPath(rightBottom) &&
            isGridPath(rightTop) &&
            isGridPath(leftBottom) &&
            isGridPath(leftTop)
        ) {
            // 向右穿牆
            if (
                y + this.ballDia - rightBottom.y * this.step >
                x + this.ballDia - rightBottom.x * this.step
            ) {
                x = rightBottom.x * this.step - this.ballDia;
                this.ballSpeedX = 0;
            // 向下穿牆
            } else {
                y = rightBottom.y * this.step - this.ballDia;
                this.ballSpeedY = 0;
            }
        }
        // 1.4. 右上角
        if (
            !isGridPath(rightTop) &&
            isGridPath(rightBottom) &&
            isGridPath(leftTop) &&
            isGridPath(leftBottom)
        ) {
            // 向右穿牆
            if (
                (rightTop.y + 1) * this.step - y >
                x + this.ballDia - rightTop.x * this.step
            ) {
                x = rightTop.x * this.step - this.ballDia;
                this.ballSpeedX = 0;
            // 向上穿牆
            } else {
                y = (rightTop.y + 1) * this.step;
                this.ballSpeedY = 0;
            }
        }

        // 2. 同側兩個角穿牆
        // 2.1. 左側
        if (!isGridPath(leftTop) && !isGridPath(leftBottom)) {
            x = (leftTop.x + 1) * this.step;
            this.ballSpeedX = 0;
        }
        // 2.2. 下側
        if (!isGridPath(leftBottom) && !isGridPath(rightBottom)) {
            y = leftBottom.y * this.step - this.ballDia;
            this.ballSpeedY = 0;
        }
        // 2.3. 右側
        if (!isGridPath(rightTop) && !isGridPath(rightBottom)) {
            x = rightTop.x * this.step - this.ballDia;
            this.ballSpeedX = 0;
        }
        // 2.4. 上側
        if (!isGridPath(leftTop) && !isGridPath(rightTop)) {
            y = (leftTop.y + 1) * this.step;
            this.ballSpeedY = 0;
        }

        return { x, y };
    }

    /**
     * 處理鍵盤按下事件
     *
     * @param {Event}    evt    - 鍵盤事件對象
     * @param {function} onMove - 移動回調函數
     * @param {function} onArriveExit - 到達出口回調函數
     * @memberof BallController
     */
    keyDownHandler(evt, onMove, onArriveExit) {
        // 阻止默認移動行為
        evt.preventDefault();

        // 移動速度和延遲
        const step = GAME_CONSTANTS.BALL_MOVE_STEP;
        const delay = GAME_CONSTANTS.MOVE_DELAY_MS;

        switch (evt.key) {
            case "w":
            case "ArrowUp":
                if (this.curKey === 'up') {
                    break;
                }

                window.clearInterval(this.moveInterval);
                this.curKey = 'up';
                this.moveInterval = window.setInterval(
                    () => this.moveBall(0, -step, onMove, onArriveExit),
                    delay
                );
                break;

            case "a":
            case "ArrowLeft":
                if (this.curKey === 'left') {
                    break;
                }

                window.clearInterval(this.moveInterval);
                this.curKey = 'left';
                this.moveInterval = window.setInterval(
                    () => this.moveBall(-step, 0, onMove, onArriveExit),
                    delay
                );
                break;

            case "s":
            case "ArrowDown":
                if (this.curKey === 'down') {
                    break;
                }

                window.clearInterval(this.moveInterval);
                this.curKey = 'down';
                this.moveInterval = window.setInterval(
                    () => this.moveBall(0, step, onMove, onArriveExit),
                    delay
                );
                break;

            case "d":
            case "ArrowRight":
                if (this.curKey === 'right') {
                    break;
                }

                window.clearInterval(this.moveInterval);
                this.curKey = 'right';
                this.moveInterval = window.setInterval(
                    () => this.moveBall(step, 0, onMove, onArriveExit),
                    delay
                );
                break;

            default:
                break;
        }
    }

    /**
     * 處理鍵盤釋放事件
     *
     * @param {Event} evt - 鍵盤事件對象
     * @memberof BallController
     */
    keyUpHandler(evt) {
        evt.preventDefault();
        this.curKey = '';
        window.clearInterval(this.moveInterval);
    }

    /**
     * 開始監聽鍵盤事件
     *
     * @param {function} onMove       - 移動回調函數
     * @param {function} onArriveExit - 到達出口回調函數
     * @memberof BallController
     */
    startListening(onMove, onArriveExit) {
        window.addEventListener('keydown', (evt) => {
            this.keyDownHandler(evt, onMove, onArriveExit);
        });
        window.addEventListener('keyup', this.keyUpHandler);
    }

    /**
     * 停止監聽鍵盤事件
     *
     * @memberof BallController
     */
    stopListening() {
        window.removeEventListener('keydown', this.keyDownHandler);
        window.removeEventListener('keyup', this.keyUpHandler);
        this.curKey = '';
        window.clearInterval(this.moveInterval);
    }

    /**
     * 獲取小球當前位置
     *
     * @returns {object} - 小球坐標 {x, y}
     * @memberof BallController
     */
    getBallPosition() {
        return {
            x: this.ballX,
            y: this.ballY,
        };
    }
}
