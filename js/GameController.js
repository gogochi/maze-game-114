/**
 * @file 遊戲控制器類
 * @description 負責協調迷宮生成、渲染和小球控制，管理遊戲整體流程
 */

/**
 * 遊戲控制器類
 * 作為主控制器，協調 MazeGenerator、MazeRenderer 和 BallController
 *
 * @class GameController
 */
class GameController {
    /**
     * @constructor
     * @param {object}   options
     * @param {Element}  options.elMaze        - 承載迷宮的 canvas 元素
     * @param {Element}  options.elBall        - 繪制小球的元素
     * @param {number}   [options.ballDia=6]   - 小球的直徑（像素）
     * @param {number}   [options.width=31]    - 迷宮寬度（格數）
     * @param {number}   [options.height=31]   - 迷宮高度（格數）
     * @param {number}   [options.step=10]     - 單元格大小
     * @param {number}   [options.gameLevel=0] - 遊戲難度等級
     * @memberof GameController
     */
    constructor(options) {
        this.elMaze = options.elMaze;
        this.elBall = options.elBall;
        this.width = options.width || GAME_CONSTANTS.DEFAULT_MAZE_SIZE;
        this.height = options.height || GAME_CONSTANTS.DEFAULT_MAZE_SIZE;
        this.step = options.step || GAME_CONSTANTS.DEFAULT_CELL_SIZE;
        this.ballDia = options.ballDia || GAME_CONSTANTS.DEFAULT_BALL_DIAMETER;
        this.gameLevel = options.gameLevel || GAME_CONSTANTS.DEFAULT_GAME_LEVEL;

        // 入口位置
        this.entrance = {
            x: GAME_CONSTANTS.ENTRANCE_X_OFFSET,
            y: GAME_CONSTANTS.ENTRANCE_Y_OFFSET,
        };

        // 出口位置
        this.exit = {
            x: this.width - GAME_CONSTANTS.EXIT_X_OFFSET,
            y: this.height - GAME_CONSTANTS.EXIT_Y_OFFSET,
        };

        // 是否使用過提示
        this.useHint = false;

        // 初始化三個子控制器
        this.initControllers();

        // 初始化迷宮
        this.initMaze();
    }

    /**
     * 初始化三個子控制器
     *
     * @memberof GameController
     */
    initControllers() {
        // 迷宮生成器
        this.mazeGenerator = new MazeGenerator(
            this.width,
            this.height,
            this.gameLevel,
            this.entrance,
            this.exit
        );

        // 渲染器
        this.renderer = new MazeRenderer(this.elMaze, this.step);

        // 小球控制器（稍後會更新迷宮網格數據）
        this.ballController = new BallController(
            this.width,
            this.height,
            this.step,
            this.ballDia,
            [], // 初始為空，生成迷宮後更新
            this.exit
        );
    }

    /**
     * 初始化迷宮
     *
     * @memberof GameController
     */
    initMaze() {
        // 調整 canvas 尺寸
        this.renderer.resizeCanvas(this.width, this.height);

        // 初始化迷宮網格數據
        this.mazeGenerator.initMazeGrids();

        // 獲取迷宮網格數據
        const mazeGrids = this.mazeGenerator.getMazeGrids();

        // 畫牆和出入口
        this.renderer.drawWalls(mazeGrids, "#004d40", "white");

        // 設置內部牆的顏色
        this.renderer.setBackground("#4D4040");

        // 挖路 - 使用回調函數進行繪製
        const pathCallback = (x, y) => {
            this.renderer.fillGrid(x, y, "#e0f2f1");
        };

        this.mazeGenerator.generatePath(
            this.entrance,
            { x: 1, y: -1 },
            pathCallback
        );

        // 更新小球控制器的迷宮網格數據
        this.ballController.updateMazeGrids(mazeGrids);

        // 畫小球並獲取初始位置
        const ballPos = this.renderer.drawBall(
            this.elBall,
            this.ballDia,
            this.entrance
        );

        // 設置小球控制器的初始位置
        this.ballController.setBallPosition(ballPos.x, ballPos.y);
    }

    /**
     * 開始移動小球（啟用鍵盤控制）
     *
     * @memberof GameController
     */
    startMove() {
        // 小球移動時的回調 - 更新顯示位置
        const onMove = (x, y) => {
            this.renderer.updateBallPosition(this.elBall, x, y);
        };

        // 到達出口時的回調
        const onArriveExit = () => {
            this.arriveExit();
        };

        // 開始監聽鍵盤事件
        this.ballController.startListening(onMove, onArriveExit);
    }

    /**
     * 小球到達出口後的操作
     *
     * @memberof GameController
     */
    arriveExit() {
        // 停止控制小球
        this.ballController.stopListening();

        // 信息提示
        if (this.width === GAME_CONSTANTS.MAX_MAZE_SIZE && !this.useHint) {
            // 最大地圖無提示通關
            M.toast({
                html: `<span class="orange-text text-accent-4">
                        ✨🎉恭喜通關最大地圖🎉✨<br>
                        你擁有百折不撓的毅力和持之以恒的耐心！<br>
                        請重新開始遊戲
                       </span>`,
                displayLength: 5000,
            });
        } else {
            // 正常提示
            M.toast({
                html: `<span class="orange-text text-accent-4">
                        ✨✨恭喜抵達出口🎉🎉請重新開始遊戲
                       </span>`,
                displayLength: 3000,
            });
        }
    }

    /**
     * 繪制迷宮的正確出路
     *
     * @memberof GameController
     */
    drawCorrectPath() {
        // 標記使用過提示
        this.useHint = true;

        // 獲取迷宮網格數據並繪製正確路徑
        const mazeGrids = this.mazeGenerator.getMazeGrids();
        this.renderer.drawCorrectPath(
            mazeGrids,
            this.entrance,
            this.exit.x,
            this.exit.y
        );
    }
}
