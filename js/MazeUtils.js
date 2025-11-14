/**
 * @file 迷宮工具類
 * @description 提供純函數工具方法，用於迷宮相關的計算邏輯
 */

/**
 * 迷宮工具類
 * 所有方法均為靜態純函數，無副作用
 *
 * @class MazeUtils
 */
class MazeUtils {
    /**
     * 計算前方格子的坐標
     * 根據前一個格子和當前格子的位置，計算相同方向上的下一個格子
     *
     * @param {number} x1 - 前一個格子的 x 坐標
     * @param {number} y1 - 前一個格子的 y 坐標
     * @param {number} x2 - 當前格子的 x 坐標
     * @param {number} y2 - 當前格子的 y 坐標
     * @returns {object}  - 前方格子的坐標 {x, y}
     * @static
     */
    static calculateFrontGrid(x1, y1, x2, y2) {
        return {
            x: 2 * x2 - x1,
            y: 2 * y2 - y1
        };
    }

    /**
     * 計算左前方格子的坐標
     *
     * @param {number} x1 - 前一個格子的 x 坐標
     * @param {number} y1 - 前一個格子的 y 坐標
     * @param {number} x2 - 當前格子的 x 坐標
     * @param {number} y2 - 當前格子的 y 坐標
     * @returns {object}  - 左前方格子的坐標 {x, y}
     * @static
     */
    static calculateFrontLeftGrid(x1, y1, x2, y2) {
        // 先計算前方格子
        let x = 2 * x2 - x1;
        let y = 2 * y2 - y1;

        // 再計算左前方偏移
        if (x2 - x1 === 0) {
            // 垂直移動
            if (y2 - y1 > 0) {
                x += 1; // 向下移動時，左前方在右邊
            } else {
                x -= 1; // 向上移動時，左前方在左邊
            }
        }

        if (y2 - y1 === 0) {
            // 水平移動
            if (x2 - x1 > 0) {
                y -= 1; // 向右移動時，左前方在上邊
            } else {
                y += 1; // 向左移動時，左前方在下邊
            }
        }

        return { x, y };
    }

    /**
     * 計算右前方格子的坐標
     *
     * @param {number} x1 - 前一個格子的 x 坐標
     * @param {number} y1 - 前一個格子的 y 坐標
     * @param {number} x2 - 當前格子的 x 坐標
     * @param {number} y2 - 當前格子的 y 坐標
     * @returns {object}  - 右前方格子的坐標 {x, y}
     * @static
     */
    static calculateFrontRightGrid(x1, y1, x2, y2) {
        // 先計算前方格子
        let x = 2 * x2 - x1;
        let y = 2 * y2 - y1;

        // 再計算右前方偏移
        if (x2 - x1 === 0) {
            // 垂直移動
            if (y2 - y1 > 0) {
                x -= 1; // 向下移動時，右前方在左邊
            } else {
                x += 1; // 向上移動時，右前方在右邊
            }
        }

        if (y2 - y1 === 0) {
            // 水平移動
            if (x2 - x1 > 0) {
                y += 1; // 向右移動時，右前方在下邊
            } else {
                y -= 1; // 向左移動時，右前方在上邊
            }
        }

        return { x, y };
    }

    /**
     * 檢查格子是否存在於迷宮網格中
     *
     * @param {number} x         - 格子的 x 坐標
     * @param {number} y         - 格子的 y 坐標
     * @param {Array}  mazeGrids - 迷宮網格數據
     * @returns {boolean}        - 格子是否存在
     * @static
     */
    static isGridExists(x, y, mazeGrids) {
        return !!mazeGrids[y] && !!mazeGrids[y][x];
    }

    /**
     * 檢查格子是否為路徑
     *
     * @param {number} x         - 格子的 x 坐標
     * @param {number} y         - 格子的 y 坐標
     * @param {Array}  mazeGrids - 迷宮網格數據
     * @returns {boolean}        - 格子是否為路徑
     * @static
     */
    static isGridPath(x, y, mazeGrids) {
        return (
            mazeGrids[y] &&
            mazeGrids[y][x] &&
            mazeGrids[y][x].isPath
        );
    }

    /**
     * 檢查格子是否為圍牆
     *
     * @param {number} x         - 格子的 x 坐標
     * @param {number} y         - 格子的 y 坐標
     * @param {Array}  mazeGrids - 迷宮網格數據
     * @returns {boolean}        - 格子是否為圍牆
     * @static
     */
    static isGridWall(x, y, mazeGrids) {
        return (
            mazeGrids[y] &&
            mazeGrids[y][x] &&
            mazeGrids[y][x].isWall
        );
    }

    /**
     * 檢查格子是否為出口
     *
     * @param {number} x         - 格子的 x 坐標
     * @param {number} y         - 格子的 y 坐標
     * @param {Array}  mazeGrids - 迷宮網格數據
     * @returns {boolean}        - 格子是否為出口
     * @static
     */
    static isGridExit(x, y, mazeGrids) {
        return (
            mazeGrids[y] &&
            mazeGrids[y][x] &&
            mazeGrids[y][x].isExit
        );
    }

    /**
     * 判斷候選方向是否有效
     * 有效條件：
     * 1. 格子是出口，或
     * 2. 格子不是圍牆、不是路徑、且前方格子也不是路徑
     *
     * @param {object} candidateGrid - 候選方向的格子對象 {x, y}
     * @param {object} currentGrid   - 當前格子對象 {x, y}
     * @param {Array}  mazeGrids     - 迷宮網格數據
     * @returns {boolean}            - 候選方向是否有效
     * @static
     */
    static isValidDirection(candidateGrid, currentGrid, mazeGrids) {
        const x = candidateGrid.x;
        const y = candidateGrid.y;
        const currentX = currentGrid.x;
        const currentY = currentGrid.y;

        // 格子不存在，無效
        if (!MazeUtils.isGridExists(x, y, mazeGrids)) {
            return false;
        }

        // 是出口，有效
        if (MazeUtils.isGridExit(x, y, mazeGrids)) {
            return true;
        }

        // 計算前方格子的坐標
        const frontCoord = MazeUtils.calculateFrontGrid(currentX, currentY, x, y);

        // 前方格子不存在，無效
        if (!MazeUtils.isGridExists(frontCoord.x, frontCoord.y, mazeGrids)) {
            return false;
        }

        // 檢查候選格子和前方格子是否都不是牆且不是路
        const isWall = MazeUtils.isGridWall(x, y, mazeGrids);
        const isPath = MazeUtils.isGridPath(x, y, mazeGrids);
        const isFrontPath = MazeUtils.isGridPath(frontCoord.x, frontCoord.y, mazeGrids);

        return !isWall && !isPath && !isFrontPath;
    }

    /**
     * 獲取四個基本方向的候選格子坐標
     *
     * @param {number} x - 當前格子的 x 坐標
     * @param {number} y - 當前格子的 y 坐標
     * @returns {Array}  - 四個方向的候選格子數組 [{x, y}, ...]
     * @static
     */
    static getFourDirections(x, y) {
        return [
            { x: x, y: y - 1 },      // 上
            { x: x, y: y + 1 },      // 下
            { x: x - 1, y: y },      // 左
            { x: x + 1, y: y }       // 右
        ];
    }

    /**
     * 判斷第三個格子相對於第二個格子的方位
     *
     * @param {object} grid1                    - 第一個格子對象 {x, y}
     * @param {object} grid2                    - 第二個格子對象 {x, y}
     * @param {object} grid3                    - 第三個格子對象 {x, y}
     * @returns {string='front'|'left'|'right'} - 相對方位
     * @static
     */
    static getRelativeDirection(grid1, grid2, grid3) {
        const x1 = grid1.x;
        const y1 = grid1.y;
        const x2 = grid2.x;
        const y2 = grid2.y;
        const x3 = grid3.x;
        const y3 = grid3.y;

        // 判斷是否在正前方
        const isFront = (x3 - x2 === x2 - x1) || (y3 - y2 === y2 - y1);
        if (isFront) {
            return 'front';
        }

        // 水平移動時判斷左右
        if (y2 === y1) {
            if (x2 > x1) {
                // 向右移動
                if (x3 === x2 && y3 < y2) return 'left';  // 左方在上
                if (x3 === x2 && y3 > y2) return 'right'; // 右方在下
            } else {
                // 向左移動
                if (x3 === x2 && y3 > y2) return 'left';  // 左方在下
                if (x3 === x2 && y3 < y2) return 'right'; // 右方在上
            }
        }

        // 垂直移動時判斷左右
        if (x2 === x1) {
            if (y2 > y1) {
                // 向下移動
                if (y3 === y2 && x3 > x2) return 'left';  // 左方在右
                if (y3 === y2 && x3 < x2) return 'right'; // 右方在左
            } else {
                // 向上移動
                if (y3 === y2 && x3 < x2) return 'left';  // 左方在左
                if (y3 === y2 && x3 > x2) return 'right'; // 右方在右
            }
        }

        return null;
    }

    /**
     * 將小球的像素坐標轉換為迷宮網格坐標
     *
     * @param {number} pixelX - 像素 x 坐標
     * @param {number} pixelY - 像素 y 坐標
     * @param {number} step   - 單元格大小（像素）
     * @returns {object}      - 網格坐標 {x, y}
     * @static
     */
    static pixelToGrid(pixelX, pixelY, step) {
        return {
            x: ~~(pixelX / step),
            y: ~~(pixelY / step)
        };
    }

    /**
     * 將迷宮網格坐標轉換為像素坐標
     *
     * @param {number} gridX - 網格 x 坐標
     * @param {number} gridY - 網格 y 坐標
     * @param {number} step  - 單元格大小（像素）
     * @returns {object}     - 像素坐標 {x, y}
     * @static
     */
    static gridToPixel(gridX, gridY, step) {
        return {
            x: gridX * step,
            y: gridY * step
        };
    }

    /**
     * 計算小球四個角的網格坐標
     *
     * @param {number} ballX   - 小球左上角 x 坐標（像素）
     * @param {number} ballY   - 小球左上角 y 坐標（像素）
     * @param {number} ballDia - 小球直徑（像素）
     * @param {number} step    - 單元格大小（像素）
     * @returns {object}       - 四個角的網格坐標 {leftTop, leftBottom, rightTop, rightBottom}
     * @static
     */
    static getBallCornerGrids(ballX, ballY, ballDia, step) {
        return {
            leftTop: {
                x: ~~(ballX / step),
                y: ~~(ballY / step)
            },
            leftBottom: {
                x: ~~(ballX / step),
                y: ~~((ballY + ballDia) / step)
            },
            rightTop: {
                x: ~~((ballX + ballDia) / step),
                y: ~~(ballY / step)
            },
            rightBottom: {
                x: ~~((ballX + ballDia) / step),
                y: ~~((ballY + ballDia) / step)
            }
        };
    }

    /**
     * 檢查小球是否在迷宮邊界內
     *
     * @param {number} x       - 小球 x 坐標（像素）
     * @param {number} y       - 小球 y 坐標（像素）
     * @param {number} ballDia - 小球直徑（像素）
     * @param {number} width   - 迷宮寬度（格數）
     * @param {number} height  - 迷宮高度（格數）
     * @param {number} step    - 單元格大小（像素）
     * @returns {object}       - 調整後的坐標和速度 {x, y, needStopX, needStopY}
     * @static
     */
    static constrainToBounds(x, y, ballDia, width, height, step) {
        let needStopX = false;
        let needStopY = false;

        // 左邊界
        if (x <= 0) {
            x = 0;
            needStopX = true;
        }

        // 上邊界
        if (y <= 0) {
            y = 0;
            needStopY = true;
        }

        // 右邊界
        if (x >= width * step - ballDia) {
            x = width * step - ballDia;
            needStopX = true;
        }

        // 下邊界
        if (y >= height * step - ballDia) {
            y = height * step - ballDia;
            needStopY = true;
        }

        return { x, y, needStopX, needStopY };
    }

    /**
     * 打亂數組（Fisher-Yates 洗牌算法）
     *
     * @param {Array} array - 要打亂的數組
     * @returns {Array}     - 打亂後的新數組
     * @static
     */
    static shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    /**
     * 根據遊戲難度隨機選擇候選方向
     *
     * @param {Array}  directions - 所有候選方向
     * @param {number} gameLevel  - 遊戲難度等級
     * @param {number} maxRatio   - 多個候選方向出現的最大概率
     * @returns {Array}           - 選擇的候選方向
     * @static
     */
    static selectDirectionsByLevel(directions, gameLevel, maxRatio) {
        if (!directions || directions.length === 0) {
            return [];
        }

        const results = [];
        const shuffled = MazeUtils.shuffleArray(directions);
        const ratio = Math.random();

        for (let i = 0; i <= gameLevel; i++) {
            if (!shuffled[i]) {
                break;
            }

            // 第一個方向總是選擇，後續方向根據概率
            if (i > 0 && ratio > maxRatio) {
                break;
            }

            results.push(shuffled[i]);
        }

        return results;
    }
}
