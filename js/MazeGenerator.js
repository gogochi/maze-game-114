/**
 * @file 迷宮生成器類
 * @description 負責迷宮生成算法，使用遞歸回溯法生成迷宮路徑
 */

/**
 * 迷宮生成器類
 * 負責生成迷宮的核心算法邏輯
 *
 * @class MazeGenerator
 */
class MazeGenerator {
    /**
     * @constructor
     * @param {number} width      - 迷宮寬度（格數）
     * @param {number} height     - 迷宮高度（格數）
     * @param {number} gameLevel  - 遊戲難度等級 (0: 簡單, 1: 複雜, 2: 困難)
     * @param {object} entrance   - 入口坐標 {x, y}
     * @param {object} exit       - 出口坐標 {x, y}
     * @memberof MazeGenerator
     */
    constructor(width, height, gameLevel, entrance, exit) {
        this.width = width;
        this.height = height;
        this.gameLevel = gameLevel;
        this.entrance = entrance;
        this.exit = exit;
        
        // 包含所有格子的二維數組
        this.mazeGrids = [];
    }

    /**
     * 初始化迷宮網格數據結構
     * 創建二維數組並設置每個格子的初始狀態
     *
     * @memberof MazeGenerator
     */
    initMazeGrids() {
        const mazeGrids = this.mazeGrids;
        const width = this.width;
        const height = this.height;
        const entrance = this.entrance;
        const exit = this.exit;

        for (let y = 0; y < height; y++) {
            mazeGrids[y] = [];

            for (let x = 0; x < width; x++) {
                // 每個單元格的信息，包括坐標，是否為牆，是否為路
                mazeGrids[y][x] = {
                    // 格子坐標
                    x: x,
                    y: y,
                    // 判斷是否是圍牆
                    isWall: x === 0 || y === 0 || x === width - 1 || y === height - 1,
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
    }

    /**
     * 生成迷宮路徑
     * 使用遞歸回溯算法挖掘路徑
     *
     * @param {object}   grid     - 當前格子對象（要挖的路）
     * @param {object}   preGrid  - 前一個格子對象
     * @param {function} callback - 繪製路徑的回調函數
     * @memberof MazeGenerator
     */
    generatePath(grid, preGrid, callback) {
        const x = grid.x;
        const y = grid.y;
        const preX = preGrid.x;
        const preY = preGrid.y;

        const mazeGrids = this.mazeGrids;

        // 鏈接上一個格子
        mazeGrids[y][x].preGrid = {
            x: preX,
            y: preY,
        };

        // 如果是出口直接繪制後停止
        if (mazeGrids[y][x].isExit) {
            callback(x, y);
            mazeGrids[y][x].isPath = true;
            return;
        }

        // 獲取前面方向的格子
        const frontGrid = this.getFrontGrid(preX, preY, x, y);
        const frontX = frontGrid.x;
        const frontY = frontGrid.y;

        // 先判斷當前繪制的路是否有效：
        //   當前格子不是路；
        //   當前格子前面不是路；
        // 無效直接返回
        if (mazeGrids[y][x].isPath || mazeGrids[frontY][frontX].isPath) {
            return;
        }

        // 繪制路（第一格）
        callback(x, y);
        mazeGrids[y][x].isPath = true;

        // 畫同方向第二格路
        callback(frontX, frontY);
        mazeGrids[frontY][frontX].isPath = true;

        // 第二格鏈接到第一格
        mazeGrids[frontY][frontX].preGrid = {
            x: x,
            y: y,
        };

        // 獲取候選方向（第二格的）
        let directions = this.getValidDirections(frontX, frontY);

        // 遞歸挖路結束
        if (directions.length === 0) {
            return;
        }

        // 處理分叉情況，獲取最終要挖的所有方向
        directions = this.forkPath(grid, frontGrid, directions);

        for (let i = 0; i < directions.length; i++) {
            // 使用計時器可以利用事件隊列的特性，同時挖多個候選方向
            // 使用同步方式遞歸會導致一條路挖到頭，剩下候選方向無效
            setTimeout(
                this.generatePath.bind(this),
                0,
                directions[i],
                mazeGrids[frontY][frontX],
                callback
            );
        }
    }

    /**
     * 獲取當前格子的"前面"一個格子（相對）
     *
     * @param   {number} x1 - 前一個格子的 x 坐標
     * @param   {number} y1 - 前一個格子的 y 坐標
     * @param   {number} x2 - 當前格子的 x 坐標
     * @param   {number} y2 - 當前格子的 y 坐標
     * @returns {object}    - 迷宮格子對象
     * @memberof MazeGenerator
     */
    getFrontGrid(x1, y1, x2, y2) {
        const x = 2 * x2 - x1;
        const y = 2 * y2 - y1;

        // 判斷該格子是否存在
        const isExist = !!this.mazeGrids[y] && !!this.mazeGrids[y][x];

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
     * @memberof MazeGenerator
     */
    getFrontLeftGrid(x1, y1, x2, y2) {
        // 先獲取前方格子
        let x = 2 * x2 - x1;
        let y = 2 * y2 - y1;

        // 再判斷左前方
        if (x2 - x1 === 0) {
            if (y2 - y1 > 0) {
                x += 1;
            } else {
                x -= 1;
            }
        }

        if (y2 - y1 === 0) {
            if (x2 - x1 > 0) {
                y -= 1;
            } else {
                y += 1;
            }
        }

        // 判斷該格子是否存在
        const isExist = !!this.mazeGrids[y] && !!this.mazeGrids[y][x];

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
     * @memberof MazeGenerator
     */
    getFrontRightGrid(x1, y1, x2, y2) {
        // 先獲取前方格子
        let x = 2 * x2 - x1;
        let y = 2 * y2 - y1;

        // 再判斷右前方
        if (x2 - x1 === 0) {
            if (y2 - y1 > 0) {
                x -= 1;
            } else {
                x += 1;
            }
        }

        if (y2 - y1 === 0) {
            if (x2 - x1 > 0) {
                y += 1;
            } else {
                y -= 1;
            }
        }

        // 判斷該格子是否存在
        const isExist = !!this.mazeGrids[y] && !!this.mazeGrids[y][x];

        return isExist ? this.mazeGrids[y][x] : null;
    }

    /**
     * 獲取當前格子的所有有效候選方向
     *
     * @param   {number} x - 當前格子 x 坐標
     * @param   {number} y - 當前格子 y 坐標
     * @returns {Array}    - 有效的候選方向（格子對象）
     * @memberof MazeGenerator
     */
    getValidDirections(x, y) {
        const mazeGrids = this.mazeGrids;
        let directions = [];

        // 4 個方向
        const top = {
            x: x,
            y: y - 1,
        };
        const bottom = {
            x: x,
            y: y + 1,
        };
        const left = {
            x: x - 1,
            y: y,
        };
        const right = {
            x: x + 1,
            y: y,
        };

        directions.push(top, bottom, left, right);

        // 過濾掉無效方向
        directions = directions.filter((item) => {
            // 候選方向的 x, y 坐標
            const _x = item.x;
            const _y = item.y;

            let isExist;
            let isExit;
            let isWall;
            let isPath;
            let isFrontExist;
            let isFrontPath;

            // 是出口直接返回
            isExit = mazeGrids[_y][_x].isExit;

            if (isExit) {
                return true;
            }

            isExist = !!mazeGrids[_y] && !!mazeGrids[_y][_x];
            isFrontExist = !!this.getFrontGrid(x, y, _x, _y);

            // 格子不存在直接排除
            if (!isExist || !isFrontExist) {
                return false;
            }

            isWall = mazeGrids[_y][_x].isWall;
            isPath = mazeGrids[_y][_x].isPath;
            isFrontPath = this.getFrontGrid(x, y, _x, _y).isPath;

            const isValidDirection = isExit || (!isWall && !isPath && !isFrontPath);

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
     * @param   {object} grid3                  - 格子對象
     * @returns {string='front'|'left'|'right'} - 方位
     * @memberof MazeGenerator
     */
    getDirection(grid1, grid2, grid3) {
        const directions = ["front", "left", "right"];

        const x1 = grid1.x;
        const y1 = grid1.y;
        const x2 = grid2.x;
        const y2 = grid2.y;
        const x3 = grid3.x;
        const y3 = grid3.y;

        let isFront;
        let isLeft;
        let isRight;

        isFront = x3 - x2 === x2 - x1 || y3 - y2 === y2 - y1;

        if (y2 === y1) {
            if (x2 > x1) {
                if (x3 === x2 && y3 < y2) {
                    isLeft = true;
                }
                if (x3 === x2 && y3 > y2) {
                    isRight = true;
                }
            } else {
                if (x3 === x2 && y3 > y2) {
                    isLeft = true;
                }
                if (x3 === x2 && y3 < y2) {
                    isRight = true;
                }
            }
        }

        if (x2 === x1) {
            if (y2 > y1) {
                if (y3 === y2 && x3 > x2) {
                    isLeft = true;
                }
                if (y3 === y2 && x3 < x2) {
                    isRight = true;
                }
            } else {
                if (y3 === y2 && x3 < x2) {
                    isLeft = true;
                }
                if (y3 === y2 && x3 > x2) {
                    isRight = true;
                }
            }
        }

        if (isFront) {
            return directions[0];
        }
        if (isLeft) {
            return directions[1];
        }
        if (isRight) {
            return directions[2];
        }
    }

    /**
     * 隨機返回一個候選方向
     *
     * @param   {Array} directions - 包含候選方向的數組
     * @returns {object[]}         - 一個包含隨機的候選方向的數組
     * @memberof MazeGenerator
     */
    getRandomDirection(directions) {
        const results = [];

        // 打亂數組
        directions.sort(() => 0.5 - Math.random());

        // 根據遊戲難度返回候選方向
        //   gameLevel = 0：一條
        //   gameLevel = 1：兩條
        //   gameLevel = 2：三條

        // 多個候選方向可以出現的最大概率
        const maxRatio = GAME_CONSTANTS.FORK_MAX_RATIO;

        // 當前的隨機概率
        const ratio = Math.random();

        for (let i = 0; i <= this.gameLevel; i++) {
            // 如果候選方向個數少於相應遊戲難度的，則直接中斷
            if (!directions[i]) {
                break;
            }

            // 如果當前概率大於最大概率，則只返回第一個候選方向
            if (i > 0 && ratio > maxRatio) {
                break;
            }

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
     * @memberof MazeGenerator
     */
    forkPath(grid1, grid2, directions) {
        let isFrontWall;
        let isFrontPath;
        let isFrontLeftPath;
        let isFrontRightPath;

        // 標記每個候選方向的方位
        const _directions = {
            front: null,
            left: null,
            right: null,
        };

        // 處理隨機獲取候選方向的情況
        const randomDirections = [];

        // 最後匯總返回的方向
        const returnDirections = [];

        // 遍歷判斷 directions 的方位
        directions.forEach((grid) => {
            const direction = this.getDirection(grid1, grid2, grid);
            _directions[direction] = grid;
        });

        // 現獲取前面的格子
        // 前面一定存在有效格子且不存在是路的情況
        // 如果是圍牆直接返回全部方向，不用繼續判斷
        const frontGrid = this.getFrontGrid(grid1.x, grid1.y, grid2.x, grid2.y);
        isFrontWall = frontGrid.isWall;

        if (isFrontWall) {
            return directions;
        }

        // 獲取前面的前面的格子
        // 此時前面的前面也一定存在有效格子且不存在是圍牆的情況
        // 如果是路直接返回全部對象，不判斷左右
        const frontFrontGrid = this.getFrontGrid(
            grid2.x,
            grid2.y,
            frontGrid.x,
            frontGrid.y
        );
        isFrontPath = frontFrontGrid.isPath;

        if (isFrontPath) {
            return directions;
        }

        // 此時前方的前方不是路，也不會是圍牆，只會是待挖的路
        // 所以需要返回 front 方位的候選方向並考慮獲取隨機方向的情況
        returnDirections.push(_directions["front"]);
        randomDirections.push(_directions["front"]);

        // 處理左前方的情況
        const frontLeftGrid = this.getFrontLeftGrid(
            grid1.x,
            grid1.y,
            grid2.x,
            grid2.y
        );

        // 如果左前方是圍牆，或者左邊沒有候選方向，跳過
        if (frontLeftGrid.isWall || !_directions["left"]) {
            isFrontLeftPath = false;
        } else {
            // 否則繼續判斷左前方的左前方
            const frontFrontLeftGrid = this.getFrontLeftGrid(
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
        }

        // 處理右前方的情況
        const frontRightGrid = this.getFrontRightGrid(
            grid1.x,
            grid1.y,
            grid2.x,
            grid2.y
        );

        // 如果右前方是圍牆，或者右邊沒有候選方向，跳過
        if (frontRightGrid.isWall || !_directions["right"]) {
            isFrontRightPath = false;
        } else {
            // 否則繼續判斷右前方的右前方
            const frontFrontRightGrid = this.getFrontRightGrid(
                grid2.x,
                grid2.y,
                frontRightGrid.x,
                frontRightGrid.y
            );

            if (frontFrontRightGrid.isPath) {
                // 如果是路，則需要返回 right 方位的候選方向
                returnDirections.push(_directions["right"]);
                isFrontRightPath = true;
            } else {
                // 如果不是，就要考慮隨機選擇 front, right
                randomDirections.push(_directions["right"]);
                isFrontRightPath = false;
            }
        }

        // 使用隨機的情況：左右前方的前方都不是路時，從 randomDirections 中隨機選一個
        // 否則返回全部確定的方向
        const shouldUseRandom = !isFrontLeftPath && !isFrontRightPath;

        if (shouldUseRandom) {
            return this.getRandomDirection(randomDirections);
        }

        return returnDirections;
    }

    /**
     * 獲取迷宮網格數據
     *
     * @returns {Array} - 迷宮網格二維數組
     * @memberof MazeGenerator
     */
    getMazeGrids() {
        return this.mazeGrids;
    }
}
