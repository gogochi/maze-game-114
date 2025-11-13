/**
 * @file 走迷宮遊戲的實現. (https://github.com/knightyun/maze-game)
 * @copyright 2020 knightyun. <https://raw.githubusercontent.com/knightyun/maze-game/master/maze.js>
 * @license MIT License. <https://raw.githubusercontent.com/knightyun/maze-game/master/LICENSE>
 */

/**
 * 迷宮類實現
 *
 * @class Maze
 */
class Maze {
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
     * @memberof Maze
     */
    constructor(options) {
        this.elMaze = options.elMaze;
        this.elBall = options.elBall;
        this.w = options.width || 31;
        this.h = options.height || 31;
        this.step = options.step || 10;
        this.ballDia = options.ballDia || 6;
        this.gameLevel = options.gameLevel || 0;
        this.keyDownHandler = this.keyDownHandler.bind(this);
        this.keyUpHandler = this.keyUpHandler.bind(this);
        this.motionHandler = this.motionHandler.bind(this);

        this.ballSpeedX = 0; // 小球 x 軸方向的移動速度；
        this.ballSpeedY = 0; // 小球 y 軸方向的移動速度；
        this.G = 9.8; // 重力加速度
        this.time = null; // 時間戳，用於設置重力加速度
        this.curKey = ''; // 當前按鍵控制的方向 'up' | 'left' | 'right' | 'down'
        this.int = null; // 按鍵後觸發的 setInterval 的返回值

        // 遊戲難度等級：簡單 -> 困難 -> 複雜
        //   0 - 簡單：隨機返回一個候選方向；
        //   1 - 複雜：隨機返回兩個候選方向；（難度最大）
        //   2 - 困難：隨機返回三個候選方向；（全部）

        this.cvsCtx = this.elMaze.getContext("2d");

        // 包含所有格子的二維數組
        this.mazeGrids = [];

        // 入口位置
        this.entrance = {
            x: 1,
            y: 0,
        };

        // 出口位置
        this.exit = {
            x: this.w - 2,
            y: this.h - 1,
        };

        this.initMaze();
    }

    /**
     * 初始化迷宮
     *
     * @memberof Maze
     */
    initMaze() {
        var mazeGrids = this.mazeGrids,
            w = this.w,
            h = this.h,
            step = this.step,
            elMaze = this.elMaze,
            elBall = this.elBall,
            ballDia = this.ballDia,
            entrance = this.entrance,
            exit = this.exit;

        // 調整 canvas 元素尺寸
        elMaze.width = w * step;
        elMaze.height = h * step;

        // 移除移動操作監聽
        window.removeEventListener('keydown', this.keyDownHandler);
        window.removeEventListener('keyup', this.keyUpHandler);
        window.removeEventListener('devicemotion', this.motionHandler);

        // 繪畫初始迷宮，包括圍牆，出入口，
        // 並初始化每個單元格的信息
        for (var y = 0; y < h; y++) {
            mazeGrids[y] = [];

            for (var x = 0; x < w; x++) {
                // 每個單元格的信息，包括坐標，是否為牆，是否為路
                mazeGrids[y][x] = {
                    // 格子坐標
                    x: x,
                    y: y,
                    // 判斷是否是圍牆
                    isWall: x === 0 || y === 0 || x === w - 1 || y === h - 1,
                    // 是否為入口
                    isEntrance: x === entrance.x && y === entrance.y,
                    // 是否為出口
                    isExit: x === exit.x && y === exit.y,
                    // 判斷是否為路：後期畫路時置為 true
                    isPath: false,
                    // 鏈接上一個格子，用於搜索迷宮的解
                    preGrid: null,
                };
            }
        }

        // 畫牆和出入口
        this.drawWall("#004d40", "white");

        // 內部牆的顏色
        elMaze.style.background = "#4D4040";

        // 挖路
        this.drawPath(entrance, { x: 1, y: -1 }, "#e0f2f1");

        // 畫小球
        this.drawBall(elBall, ballDia);
    }

    /**
     * 封裝的畫格子方法
     *
     * @param {number} x     - 左上角的 x 坐標
     * @param {number} y     - 左上角的 y 坐標
     * @param {string} color - 格子顏色
     * @memberof Maze
     */
    fillGrid(x, y, color) {
        var ctx = this.cvsCtx;

        ctx.fillStyle = color;
        ctx.fillRect(x * this.step, y * this.step, this.step, this.step);
    }

    /**
     * 獲取當前格子的“前面”一個格子（相對）
     *
     * @param   {number} x1 - 前一個格子的 x 坐標
     * @param   {number} y1 - 前一個格子的 y 坐標
     * @param   {number} x2 - 當前格子的 x 坐標
     * @param   {number} y2 - 當前格子的 y 坐標
     * @returns {object}    - 迷宮格子對象
     * @memberof Maze
     */
    getFrontGrid(x1, y1, x2, y2) {
        var x = 2 * x2 - x1,
            y = 2 * y2 - y1;

        // 判斷該格子是否存在；
        var isExist = !!this.mazeGrids[y] && !!this.mazeGrids[y][x];

        return isExist ? this.mazeGrids[y][x] : null;
    }

    /**
     * 獲取當前格子的左前方一個格子（相對）
     *
     * @param   {number} x1 - 前一個格子的 x 坐標
     * @param   {number} y1 - 前一個格子的 y 坐標
     * @param   {number} x2 - 當前格子的 x 坐標
     * @param   {number} y2 - 當前格子的 y 坐標
     * @returns {object}    - 迷宮格子對象
     * @memberof Maze
     */
    getFrontLeftGrid(x1, y1, x2, y2) {
        // 先獲取前方格子
        var x = 2 * x2 - x1,
            y = 2 * y2 - y1;

        // 再判斷左前方
        if (x2 - x1 === 0) {
            if (y2 - y1 > 0) x += 1;
            else x -= 1;
        }

        if (y2 - y1 === 0) {
            if (x2 - x1 > 0) y -= 1;
            else y += 1;
        }

        // 判斷該格子是否存在；
        var isExist = !!this.mazeGrids[y] && !!this.mazeGrids[y][x];

        return isExist ? this.mazeGrids[y][x] : null;
    }

    /**
     * 獲取當前格子的右前方一個格子（相對）
     *
     * @param   {number} x1 - 前一個格子的 x 坐標
     * @param   {number} y1 - 前一個格子的 y 坐標
     * @param   {number} x2 - 當前格子的 x 坐標
     * @param   {number} y2 - 當前格子的 y 坐標
     * @returns {object}    - 迷宮格子對象
     * @memberof Maze
     */
    getFrontRightGrid(x1, y1, x2, y2) {
        // 先獲取前方格子
        var x = 2 * x2 - x1,
            y = 2 * y2 - y1;

        // 再判斷右前方
        if (x2 - x1 === 0) {
            if (y2 - y1 > 0) x -= 1;
            else x += 1;
        }

        if (y2 - y1 === 0) {
            if (x2 - x1 > 0) y += 1;
            else y -= 1;
        }

        // 判斷該格子是否存在；
        var isExist = !!this.mazeGrids[y] && !!this.mazeGrids[y][x];

        return isExist ? this.mazeGrids[y][x] : null;
    }

    /**
     * 獲取當前格子的所有有效候選方向
     *
     * @param   {*} x   - 當前格子 x 坐標
     * @param   {*} y   - 當前格子 y 坐標
     * @returns {Array} - 有效的候選方向（格子對象）
     * @memberof Maze
     */
    getValidDirections(x, y) {
        // 格子周圍有上右下左四個方向,
        // 索引 0, 1, 2, 3，
        // 無效方向：
        //   格子為圍牆；
        //   格子前面是路；
        // 如果領居數為 0，則尋路結束；

        var mazeGrids = this.mazeGrids,
            directions = [];

        // 4 個方向
        var top = {
                x: x,
                y: y - 1,
            },
            bottom = {
                x: x,
                y: y + 1,
            },
            left = {
                x: x - 1,
                y: y,
            },
            right = {
                x: x + 1,
                y: y,
            };

        directions.push(top, bottom, left, right);

        // 過濾掉無效方向
        directions = directions.filter((item) => {
            // 候選方向的 x, y 坐標
            var _x = item.x,
                _y = item.y;

            // 判斷是否到達出口

            // 判斷是否為有效方向（按順序判斷）：
            //     格子存在；
            //     格子是出口；
            //     格子不是圍牆；
            //     格子不是路；
            //     前方格子存在；
            //     前方格子不是路；
            var isValidDirection,
                isExist,
                isExit,
                isWall,
                isPath,
                isFrontExist,
                isFrontPath;

            // 是出口直接返回
            isExit = mazeGrids[_y][_x].isExit;

            if (isExit) return true;

            isExist = !!mazeGrids[_y] && !!mazeGrids[_y][_x];
            isFrontExist = !!this.getFrontGrid(x, y, _x, _y);

            // 格子不存在直接排除
            if (!isExist || !isFrontExist) return false;

            isWall = mazeGrids[_y][_x].isWall;
            isPath = mazeGrids[_y][_x].isPath;
            isFrontPath = this.getFrontGrid(x, y, _x, _y).isPath;

            isValidDirection = isExit || (!isWall && !isPath && !isFrontPath);

            return isValidDirection;
        });

        // 轉換為迷宮格子對象
        directions = directions.map((item) => {
            return mazeGrids[item.y][item.x];
        });

        return directions;
    }

    /**
     * 判斷第三個格子相對於第二個格子的方位
     *
     * @param   {object} grid1                  - 格子對象
     * @param   {object} grid2                  - 格子對象
     * @param   {object} grid2                  - 格子對象
     * @returns {string='front'|'left'|'right'} - 方位
     * @memberof Maze
     */
    getDirection(grid1, grid2, grid3) {
        var directions = ["front", "left", "right"];

        var x1 = grid1.x,
            y1 = grid1.y,
            x2 = grid2.x,
            y2 = grid2.y,
            x3 = grid3.x,
            y3 = grid3.y;

        var isFront, isLeft, isRight;

        isFront = x3 - x2 === x2 - x1 || y3 - y2 === y2 - y1;

        if (y2 === y1) {
            if (x2 > x1) {
                if (x3 === x2 && y3 < y2) isLeft = true;
                if (x3 === x2 && y3 > y2) isRight = true;
            } else {
                if (x3 === x2 && y3 > y2) isLeft = true;
                if (x3 === x2 && y3 < y2) isRight = true;
            }
        }

        if (x2 === x1) {
            if (y2 > y1) {
                if (y3 === y2 && x3 > x2) isLeft = true;
                if (y3 === y2 && x3 < x2) isRight = true;
            } else {
                if (y3 === y2 && x3 < x2) isLeft = true;
                if (y3 === y2 && x3 > x2) isRight = true;
            }
        }

        if (isFront) return directions[0];
        if (isLeft) return directions[1];
        if (isRight) return directions[2];
    }

    /**
     * 隨機返回一個候選方向
     *
     * @param   {Array} directions - 包含候選方向的數組
     * @returns {object[]}         - 一個包含隨機的候選方向的數組
     * @memberof Maze
     */
    getRandomDirection(directions) {
        var results = [];

        // 打亂數組
        directions.sort(() => 0.5 - Math.random());

        // 根據遊戲難度返回候選方向
        //   gameLevel = 0：一條；
        //   gameLevel = 1：兩條；
        //   gameLevel = 2：三條；
        //
        // 需要返回的候選方向個數大於 1 時，
        // 如果每次都返回一條以上，會導致迷宮規律化，
        // 所以需要控制生成多個候選方向時的概率，如 40%

        // 多個候選方向可以出現的最大概率
        var maxRatio = 0.3;

        // 當前的隨機概率
        var ratio = Math.random();

        for (let i = 0; i <= this.gameLevel; i++) {
            // 如果候選方向個數少於相應遊戲難度的，
            // 則直接中斷
            if (!directions[i]) break;

            // 如果當前概率大於最大概率，
            // 則只返回第一個候選方向
            if (i > 0 && ratio > maxRatio) break;

            results.push(directions[i]);
        }

        return results;
    }

    /**
     * 處理當前格子下一步路徑分叉的問題
     *
     * @param   {object}   grid1      - 前一個格子對象
     * @param   {object}   grid2      - 當前格子對象
     * @param   {object[]} directions - 候選方向的格子對象
     * @returns {object[]}            - 返回確定要挖的格子對象
     * @memberof Maze
     */
    forkPath(grid1, grid2, directions) {
        // 判斷是否需要路徑分叉：（按順序）
        //   前方是圍牆（分左、右）；
        //   前方的前方是路（分左、右）；
        //   左前方的左前方是路（分前、左）；
        //   右前方的右前方是路（分前、右）；
        //   左右前方的前方都是路（分前、左、右）；
        // 前方是圍牆、或前方的前方是路、或左右前方的前方都是路，
        // 則所有候選方向都要挖；
        // 左右前方的前方其中一個為路時，只能挖前方和左或右；
        // 以上情況都不是，則使用隨機選擇；

        var isFrontWall, isFrontPath, isFrontLeftPath, isFrontRightPath;

        // 標記每個候選方向的方位
        var _directions = {
            front: null,
            left: null,
            right: null,
        };

        // 處理隨機獲取候選方向的東西情況
        var randomDirections = [],
            flagRandom = false;

        // 最後匯總返回的方向
        var returnDirections = [];

        // 遍歷判斷 directions 的方位
        directions.forEach((grid) => {
            var direction = this.getDirection(grid1, grid2, grid);

            _directions[direction] = grid;
        });

        // 現獲取前面的格子
        // 前面一定存在有效格子
        // 不存在是路的情況
        // 如果是圍牆直接返回全部方向，不用繼續判斷
        var frontGrid = this.getFrontGrid(grid1.x, grid1.y, grid2.x, grid2.y);
        isFrontWall = frontGrid.isWall;

        if (isFrontWall) return directions;

        // 獲取前面的前面的格子
        // 此時前面的前面也一定存在有效格子
        // 不存在是圍牆的情況
        // 如果是路直接返回全部對象，不判斷左右
        var frontFrontGrid = this.getFrontGrid(
            grid2.x,
            grid2.y,
            frontGrid.x,
            frontGrid.y
        );
        isFrontPath = frontFrontGrid.isPath;

        if (isFrontPath) return directions;

        // 此時前方的前方不是路，也不會是圍牆，
        // 只會是待挖的路，所以需要返回 front 方位的候選方向
        // 並考慮獲取隨機方向的情況
        returnDirections.push(_directions["front"]);
        randomDirections.push(_directions["front"]);

        // 獲取左前方的左前方的格子
        // 左前方一定存在有效格子
        var frontLeftGrid = this.getFrontLeftGrid(
            grid1.x,
            grid1.y,
            grid2.x,
            grid2.y
        );
        if (!frontLeftGrid.isWall && !!_directions["left"]) {
            // 如果左前方是圍牆，或者左邊沒有候選方向，
            // 則跳過；

            // 否則繼續判斷左前方的左前方
            // 此時左前方的左前方一定不會是圍牆
            var frontFrontLeftGrid = this.getFrontLeftGrid(
                grid2.x,
                grid2.y,
                frontLeftGrid.x,
                frontLeftGrid.y
            );

            if (frontFrontLeftGrid.isPath) {
                // 如果是路，則需要返回 left 方位的候選方向
                returnDirections.push(_directions["left"]);
                isFrontLeftPath = true;
            } else {
                // 如果不是，就要考慮隨機選擇 front, left
                randomDirections.push(_directions["left"]);
                isFrontLeftPath = false;
            }
        } else {
            // 標記為不是路，方便處理另外兩個方向可能出現隨機的情況
            isFrontLeftPath = false;
        }

        // 獲取右前方的左前方的格子
        // 右前方一定存在有效格子
        var frontRightGrid = this.getFrontRightGrid(
            grid1.x,
            grid1.y,
            grid2.x,
            grid2.y
        );
        if (!frontRightGrid.isWall && !!_directions["right"]) {
            // 如果右前方也是牆（很難出現）且存在右側候選方向，
            // 則跳過

            // 否則繼續判斷右前方的左前方
            // 此時右前方的右前方一定不會是圍牆
            var frontFrontRightGrid = this.getFrontRightGrid(
                grid2.x,
                grid2.y,
                frontRightGrid.x,
                frontRightGrid.y
            );

            if (frontFrontRightGrid.isPath) {
                // 如果也是路，則需要返回 right 方位的候選方向
                returnDirections.push(_directions["right"]);
                isFrontRightPath = true;
            } else {
                // 如果不是，就要考慮隨機選擇 front, right
                // 如果 left 方位也要考慮隨機，則隨機選擇 front, left, right
                randomDirections.push(_directions["right"]);
                isFrontRightPath = false;
            }
        } else {
            isFrontRightPath = false;
        }

        // 使用隨機的情況：
        //   前方的前方不是路（可以挖）；
        //   左右前方的前方只有一個是路時，選擇前面和另一個不是路的方位；
        //   左右前方的前方都不是路時，randomDirections 中隨機選一個；
        // 否則返回全部方向
        flagRandom = !isFrontLeftPath && !isFrontRightPath;

        if (flagRandom) return this.getRandomDirection(randomDirections);
        else return returnDirections;
    }

    /**
     * 繪畫四周的圍牆，以及出入口
     *
     * @param {string} wallColor   - 圍牆的顏色
     * @param {string} tunnelColor - 出入口的顏色
     * @memberof Maze
     */
    drawWall(wallColor, tunnelColor) {
        this.mazeGrids.forEach((y) => {
            y.forEach((x) => {
                // 畫牆
                x.isWall && this.fillGrid(x.x, x.y, wallColor);

                // 畫出入口
                x.isEntrance && this.fillGrid(x.x, x.y, tunnelColor);
                x.isExit && this.fillGrid(x.x, x.y, tunnelColor);
            });
        });
    }

    /**
     * 挖路實現函數，遞歸地繪制有效路徑
     * 從 this.start 開始，到無路後結束
     *
     * @param {object} grid      - 當前格子對象（要挖的路）
     * @param {object} preGrid   - 前一個格子對象，用於獲取前進兩格需要的方向
     * @param {string} pathColor - 路的顏色
     * @param {object} ctx       - 保存當前類的上下文，方便使用計時器時獲取上下文
     * @memberof Maze
     */
    drawPath(grid, preGrid, pathColor, ctx) {
        var x = grid.x,
            y = grid.y,
            preX = preGrid.x,
            preY = preGrid.y;

        ctx = ctx || this;

        var mazeGrids = ctx.mazeGrids;

        // 鏈接上一個格子
        mazeGrids[y][x].preGrid = {
            x: preX,
            y: preY,
        };

        // 如果是出口直接繪制後停止
        if (mazeGrids[y][x].isExit) {
            ctx.fillGrid(x, y, pathColor);
            mazeGrids[y][x].isPath = true;

            return;
        }

        // 獲取前面方向的格子
        var frontGrid = ctx.getFrontGrid(preX, preY, x, y);
        var fx = frontGrid.x,
            fy = frontGrid.y;

        // 先判斷當前繪制的路是否有效：
        //   當前格子不是路；
        //   當前格子前面不是路；
        // 無效直接返回
        if (mazeGrids[y][x].isPath || mazeGrids[fy][fx].isPath) return;

        // 繪制路（第一格）
        ctx.fillGrid(x, y, pathColor);
        mazeGrids[y][x].isPath = true;

        // 畫同方向第二格路
        ctx.fillGrid(fx, fy, pathColor);
        mazeGrids[fy][fx].isPath = true;

        // 第二格鏈接到第一格
        mazeGrids[fy][fx].preGrid = {
            x: x,
            y: y,
        };

        // 獲取候選方向（第二格的）
        var directions = ctx.getValidDirections(fx, fy);

        // 遞歸挖路結束
        if (directions.length === 0) return;

        // 處理分叉情況，獲取最終要挖的所有方向
        directions = ctx.forkPath(grid, frontGrid, directions);

        for (let i = 0; i < directions.length; i++) {
            // 使用計時器可以利用事件隊列的特性，同時挖多個候選方向
            // 使用同步方式遞歸會導致一條路挖到頭，剩下候選方向無效
            setTimeout(
                ctx.drawPath,
                0,
                directions[i],
                mazeGrids[fy][fx],
                pathColor,
                ctx
            );
        }
    }

    /**
     * 繪制迷宮的正確出路
     *
     * @param {number} x - 要繪制的格子 x 坐標
     * @param {number} y - 要繪制的格子 y 坐標
     * @memberof Maze
     */
    drawCorrectPath(x, y) {
        // 從出口開始，從後往前找，到入口為止
        // 利用每個子節點只有一個父節點的特性

        // 標記使用提示
        this.useHint = this.useHint || true;

        this.fillGrid(x, y, "#ffe0b2");

        if (x === this.entrance.x && y === this.entrance.y) return;

        var preX = this.mazeGrids[y][x].preGrid.x,
            preY = this.mazeGrids[y][x].preGrid.y;

        this.drawCorrectPath(preX, preY);
    }

    /**
     * 畫出走迷宮的小球
     *
     * @param {Element} elBall - 用於繪制小球的元素
     * @param {number}  d      - 小球的直徑
     * @memberof Maze
     */
    drawBall(elBall, d) {
        // 初始化小球坐標
        this.ballX = this.entrance.x * this.step;
        this.ballY = this.entrance.y * this.step;

        // debug
        // this.ballX = this.exit.x * this.step;
        // this.ballY = (this.exit.y - 1) * this.step;

        // 初始化位置、大小、顏色
        elBall.style.width = d + "px";
        elBall.style.height = d + "px";
        elBall.style.left = this.ballX + "px";
        elBall.style.top = this.ballY + "px";
    }

    /**
     * 實現移動控制小球
     *
     * @param {number}  x      - x 軸方向的重力加速度比率，10 >= x >= -10
     *                         - 值的絕對值越大，越接近重力加速度
     * @param {number}  y      - y 軸方向的重力加速度比率，10 >= y >= -10
     *                         - 值的絕對值越大，越接近重力加速度
     * @param {boolean} useAcc - 是否使用重力加速度移動
     * @memberof Maze
     */
    moveBall(x, y, useAcc) {
        var elBall = this.elBall;

        // 未移動時的坐標
        var bx = this.ballX,
            by = this.ballY;

        if (useAcc) {
            // 應用重力加速度：
            // 每秒速度增加量等於重力加速度；
            // 加速度的大小與傾斜角度（近似為 x，y 的值）成正比；
            // 時間戳單位為 1/1000 秒，
            // 重力加速度則為 G / 1000；

            // 不同軸方向換算後的加速度
            var gX = (this.G / 1000) * (x / 10),
                gY = (this.G / 1000) * (y / 10);

            // 當前時間戳
            var time = Date.now();

            // 每次調用根據時間戳確定要移動的距離
            if (!this.time) {
                this.time = time;
            } else {
                // 兩次調用的時間間隔
                var timeDur = time - this.time;

                // 時間間隔閾值，超過這個值判斷為小球停止後重新移動，
                // 此時速度需要置 0
                var timeout = 50;

                // 根據重力加速度增加速度
                if (!x || timeDur > timeout) {
                    // 如果該方向沒有移動，則速度置為 0
                    this.ballSpeedX = 0;
                } else {
                    // 否則速度加上一個加速度值
                    this.ballSpeedX += timeDur * gX;
                }

                if (!y || timeDur > timeout) {
                    this.ballSpeedY = 0;
                } else {
                    this.ballSpeedY += timeDur * gY;
                }
            }

            this.time = time;
        } else {
            // 不使用加速度移動
            // x, y 判斷為各自方向上的移動速度
            this.ballSpeedX = x;
            this.ballSpeedY = y;
        }

        // 移動後的坐標
        (bx += this.ballSpeedX), (by += this.ballSpeedY);

        // 把小球變換後的坐標限制在路內（防止穿牆）
        var validPos = this.getBallValidPosition(bx, by);

        // 保存變換後的坐標
        this.ballX = validPos.x;
        this.ballY = validPos.y;

        // 判斷是否到達出口
        if (
            this.ballX >= this.exit.x * this.step &&
            this.ballY >= this.exit.y * this.step
        ) {
            this.arriveExit();
        }
        // 移動小球
        elBall.style.left = this.ballX + "px";
        elBall.style.top = this.ballY + "px";
    }

    /**
     * 限制小球移動範圍，返回限制後的有效坐標
     *
     * @param   {number} x - 變換後的小球 x 坐標
     * @param   {number} y - 變換後的小球 y 坐標
     * @returns {object}   - 限制後的 x，y 坐標
     * @memberof Maze
     */
    getBallValidPosition(x, y) {
        // 限制小球在迷宮範圍內
        if (x <= 0) (x = 0), (this.ballSpeedX = 0);
        if (y <= 0) y = 0;

        if (x >= this.w * this.step - this.ballDia)
            (x = this.w * this.step - this.ballDia), (this.ballSpeedX = 0);

        if (y >= this.h * this.step - this.ballDia)
            y = this.h * this.step - this.ballDia;

        // 小球四個角的坐標轉換為迷宮坐標，
        // 即除以單元格長度後去掉小數部分
        // 剛好接觸牆判斷為路
        var leftTop = {
                x: ~~(x / this.step),
                y: ~~(y / this.step),
            },
            leftBottom = {
                x: ~~(x / this.step),
                y: ~~((y + this.ballDia) / this.step),
            },
            rightTop = {
                x: ~~((x + this.ballDia) / this.step),
                y: ~~(y / this.step),
            },
            rightBottom = {
                x: ~~((x + this.ballDia) / this.step),
                y: ~~((y + this.ballDia) / this.step),
            };

        // 判斷每個角對應的迷宮格子是否是路
        // 格子不存在就視作牆
        var that = this;

        function isGridPath(grid) {
            var x = grid.x,
                y = grid.y;

            var isPath =
                that.mazeGrids[y] &&
                that.mazeGrids[y][x] &&
                that.mazeGrids[y][x].isPath;

            return isPath;
        }

        // 小球穿牆的情況：
        //   1. 只有一個角穿牆，需要考慮移動方向；
        //   2. 只有兩個角穿牆，一定在同一側；
        //   3. 三個角同時穿牆（暫時不考慮）；

        // 1. 一個角穿牆，向坐標值更大的一個軸方向移動
        // 1.1. 左上角
        if (
            !isGridPath(leftTop) &&
            isGridPath(leftBottom) &&
            isGridPath(rightTop) &&
            isGridPath(rightBottom)
        ) {
            // 向左穿牆
            if (x - leftTop.x * this.step > y - leftTop.y * this.step)
                (x = (leftTop.x + 1) * this.step), (this.ballSpeedX = 0);
            // 向上穿牆
            else (y = (leftTop.y + 1) * this.step), (this.ballSpeedY = 0);
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
            )
                (x = (leftBottom.x + 1) * this.step), (this.ballSpeedX = 0);
            // 向下穿牆
            else
                (y = leftBottom.y * this.step - this.ballDia),
                    (this.ballSpeedY = 0);
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
            )
                (x = rightBottom.x * this.step - this.ballDia),
                    (this.ballSpeedX = 0);
            // 向下穿牆
            else
                (y = rightBottom.y * this.step - this.ballDia),
                    (this.ballSpeedY = 0);
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
            )
                (x = rightTop.x * this.step - this.ballDia),
                    (this.ballSpeedX = 0);
            // 向上穿牆
            else (y = (rightTop.y + 1) * this.step), (this.ballSpeedY = 0);
        }

        // 2. 同側兩個角穿牆
        // 2.1. 左側
        if (!isGridPath(leftTop) && !isGridPath(leftBottom))
            (x = (leftTop.x + 1) * this.step), (this.ballSpeedX = 0);
        // 2.2. 下側
        if (!isGridPath(leftBottom) && !isGridPath(rightBottom))
            (y = leftBottom.y * this.step - this.ballDia),
                (this.ballSpeedY = 0);
        // 2.3. 右側
        if (!isGridPath(rightTop) && !isGridPath(rightBottom))
            (x = rightTop.x * this.step - this.ballDia), (this.ballSpeedX = 0);
        // 2.4. 上側
        if (!isGridPath(leftTop) && !isGridPath(rightTop))
            (y = (leftTop.y + 1) * this.step), (this.ballSpeedY = 0);

        return { x, y };
    }

    /**
     * 開始移動，添加事件監聽
     *
     * @memberof Maze
     */
    startMove() {
        // 監控鍵盤移動事件
        window.addEventListener('keydown', this.keyDownHandler);
        window.addEventListener('keyup', this.keyUpHandler);

        // 監控移動端重力感應器事件
        window.addEventListener('devicemotion', this.motionHandler);
    }

    /**
     * 小球到達出口後的操作
     *
     * @memberof Maze
     */
    arriveExit() {
        // 停止控制小球
        window.removeEventListener('keydown', this.keyDownHandler);
        window.removeEventListener('keyup', this.keyUpHandler);
        window.removeEventListener('devicemotion', this.motionHandler);
        this.curKey = '';
        window.clearInterval(this.int);

        // 信息提示
        if (this.w === 101 && !this.useHint) {
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
     * 處理移動端重力感應移動事件的回調
     *
     * @param {Event} evt - 傳入的事件對象
     */
    motionHandler(evt) {
        var acc = evt.accelerationIncludingGravity;

        // 右翻 x 為負，後翻 y 為正
        // 不同方向的重力加速度比率，範圍 [-10, 10]
        var aX = -acc.x,
            aY = acc.y;

        this.moveBall(aX, aY, true);
    }

    /**
     * 處理鍵盤移動事件的回調函數
     *
     * @param {Event} evt - 傳入的事件對象
     */
    keyDownHandler(evt) {
        // 上      左        下        右
        // w       a         s         d
        // ArrowUp ArrowLeft ArrowDown ArrowRight

        // 阻止默認移動行為
        evt.preventDefault();

        // 不同方向的加速度
        var step = 5;
        // 每次移動小球的延時
        var delay = 30;

        switch (evt.key) {
            case "w":
            case "ArrowUp":
                if (this.curKey === 'up') break;

                window.clearInterval(this.int);
                this.curKey = 'up';
                this.int = window.setInterval(
                    this.moveBall.bind(this),
                    delay,
                    0,
                    -step,
                    false
                );
                break;

            case "a":
            case "ArrowLeft":
                if (this.curKey === 'left') break;

                window.clearInterval(this.int);
                this.curKey = 'left';
                this.int = window.setInterval(
                    this.moveBall.bind(this),
                    delay,
                    -step,
                    0,
                    false
                );
                break;

            case "s":
            case "ArrowDown":
                if (this.curKey === 'down') break;

                window.clearInterval(this.int);
                this.curKey = 'down';
                this.int = window.setInterval(
                    this.moveBall.bind(this),
                    delay,
                    0,
                    step,
                    false
                );
                break;

            case "d":
            case "ArrowRight":
                if (this.curKey === 'right') break;

                window.clearInterval(this.int);
                this.curKey = 'right';
                this.int = window.setInterval(
                    this.moveBall.bind(this),
                    delay,
                    step,
                    0,
                    false
                );
                break;

            default:
                break;
        }
    }

    // 按鍵松開事件
    keyUpHandler(evt) {
        evt.preventDefault();
        this.curKey = '';
        window.clearInterval(this.int);
    }
}

// 重新開始遊戲
function reGenMaze() {
    // 重新生成迷宮並移動小球
    maze = genMaze({
        width: +elMazeSize.value,
        height: +elMazeSize.value,
        gameLevel: +elGameLevel.value,
    });
}

// 開始遊戲
function startGame() {
    // 開始移動小球
    maze.startMove();

    // 禁用開始按鈕
    elStartGame.classList.add("disabled");
    elStartGame.classList.remove("pulse");

    // 判斷設備是否支持重力傳感器
    var accelerometer = null;
    var detectError = false;
    try {
        accelerometer = new Accelerometer({ referenceFrame: 'device' });
        accelerometer.addEventListener('error', event => {
            // Handle runtime errors.
            if (event.error.name === 'NotAllowedError') {
                // Branch to code for requesting permission.
            } else if (event.error.name === 'NotReadableError' ) {
                // alert('錯誤：未能檢測到傳感器！');
                detectError = true;
            }
        });
        accelerometer.addEventListener('reading', () => reloadOnShake(accelerometer));
        accelerometer.start();
    } catch (error) {
        // Handle construction errors.
        if (error.name === 'SecurityError') {
            // See the note above about feature policy.
            // alert('錯誤：傳感器構造被功能策略阻止！');
            detectError = true;
        } else if (error.name === 'ReferenceError') {
            // alert('錯誤：用戶代理不支持傳感器！');
            detectError = true;
        } else {
            throw error;
        }
    }

    if (typeof DeviceMotionEvent === "undefined") {
        M.toast({
            html: `<span class="red-text">
                     該瀏覽器不支持重力感應器！<br>
                     <span class="red-text text-lighten-3">
                       請使用方向鍵移動小球
                     </span>
                   </span>
                   `,
            displayLength: 2000,
        });
    } else {
        if (detectError) {
            M.toast({
                html: `<span class="teal-text text-accent-2">
                         遊戲開始！<br>
                         當前設備可能<span class="red-text text-lighten-3"
                         >不支持</span>重力感應器或<span class="red-text text-lighten-3"
                         >檢測失敗</span>，<br>
                         請嘗試晃動手機，或者使用方向鍵移動小球<br>
                       </span>`,
                displayLength: 5000,
            });
        } else {
            M.toast({
                html: `<span class="teal-text text-accent-2">
                         遊戲開始！<br>
                         請晃動手機，或使用方向鍵移動小球
                       </span>`,
                displayLength: 2000,
            });
        }
    }

    // 一定時間後顯示提示按鈕
    setTimeout(() => {
        elGameHint.classList.remove("scale-out");
        elGameHint.classList.add("scale-in");
    }, 5000);
}

// 生成迷宮
function genMaze(options) {
    var _options = Object.assign(
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

    return new Maze(_options);
}

// 點擊提示後繪制迷宮的解
function drawHintPath() {
    // 隱藏提示按鈕
    elGameHint.classList.remove("scale-in");
    elGameHint.classList.add("scale-out");

    // 繪制迷宮的出路
    maze.drawCorrectPath(maze.exit.x, maze.exit.y);
}

var elMaze = document.querySelector("#maze-map"),
    elBall = document.querySelector("#maze-ball"),
    elMazeWrapper = document.querySelector(".maze"),
    elControl = document.querySelector(".control"),
    elStartGame = document.querySelector(".start-game"),
    elGameLevel = document.querySelector(".game-level"),
    elMazeSize = document.querySelector(".maze-size"),
    elGameHint = document.querySelector(".game-hint");

var maze = genMaze();

// 監聽地圖尺寸調整
elMazeSize.addEventListener("change", function () {
    maze = genMaze({
        width: +this.value,
        height: +this.value,
        gameLevel: +elGameLevel.value,
    });

    elMazeWrapper.style.width = maze.w * maze.step + "px";
    elMazeWrapper.style.zoom = elControl.clientWidth / (maze.w * maze.step);
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
elMazeWrapper.style.width = maze.w * maze.step + "px";
elMazeWrapper.style.zoom = elControl.clientWidth / (maze.w * maze.step);
