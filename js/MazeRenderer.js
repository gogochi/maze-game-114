/**
 * @file 迷宮渲染器類
 * @description 負責迷宮的所有繪製邏輯，包括牆壁、路徑、小球等
 */

/**
 * 迷宮渲染器類
 * 負責所有與 Canvas 繪製相關的操作
 *
 * @class MazeRenderer
 */
class MazeRenderer {
    /**
     * @constructor
     * @param {Element} elMaze    - 承載迷宮的 canvas 元素
     * @param {number}  step      - 單元格大小（像素）
     * @memberof MazeRenderer
     */
    constructor(elMaze, step) {
        this.elMaze = elMaze;
        this.step = step;
        this.canvasContext = elMaze.getContext("2d");
    }

    /**
     * 調整 Canvas 尺寸
     *
     * @param {number} width  - 迷宮寬度（格數）
     * @param {number} height - 迷宮高度（格數）
     * @memberof MazeRenderer
     */
    resizeCanvas(width, height) {
        const step = this.step;
        this.elMaze.width = width * step;
        this.elMaze.height = height * step;
    }

    /**
     * 設置 Canvas 背景色
     *
     * @param {string} color - 背景顏色
     * @memberof MazeRenderer
     */
    setBackground(color) {
        this.elMaze.style.background = color;
    }

    /**
     * 封裝的畫格子方法
     *
     * @param {number} x     - 左上角的 x 坐標（格數）
     * @param {number} y     - 左上角的 y 坐標（格數）
     * @param {string} color - 格子顏色
     * @memberof MazeRenderer
     */
    fillGrid(x, y, color) {
        const canvasContext = this.canvasContext;
        const step = this.step;

        canvasContext.fillStyle = color;
        canvasContext.fillRect(x * step, y * step, step, step);
    }

    /**
     * 繪畫四周的圍牆，以及出入口
     *
     * @param {Array}  mazeGrids   - 迷宮網格數據
     * @param {string} wallColor   - 圍牆的顏色
     * @param {string} tunnelColor - 出入口的顏色
     * @memberof MazeRenderer
     */
    drawWalls(mazeGrids, wallColor, tunnelColor) {
        mazeGrids.forEach((row) => {
            row.forEach((grid) => {
                // 畫牆
                if (grid.isWall) {
                    this.fillGrid(grid.x, grid.y, wallColor);
                }

                // 畫出入口
                if (grid.isEntrance) {
                    this.fillGrid(grid.x, grid.y, tunnelColor);
                }
                if (grid.isExit) {
                    this.fillGrid(grid.x, grid.y, tunnelColor);
                }
            });
        });
    }

    /**
     * 繪制迷宮的正確出路
     *
     * @param {Array}  mazeGrids - 迷宮網格數據
     * @param {object} entrance  - 入口坐標 {x, y}
     * @param {number} exitX     - 出口 x 坐標
     * @param {number} exitY     - 出口 y 坐標
     * @memberof MazeRenderer
     */
    drawCorrectPath(mazeGrids, entrance, exitX, exitY) {
        // 從出口開始，從後往前找，到入口為止
        // 利用每個子節點只有一個父節點的特性

        this.fillGrid(exitX, exitY, "#ffe0b2");

        if (exitX === entrance.x && exitY === entrance.y) {
            return;
        }

        const preX = mazeGrids[exitY][exitX].preGrid.x;
        const preY = mazeGrids[exitY][exitX].preGrid.y;

        this.drawCorrectPath(mazeGrids, entrance, preX, preY);
    }

    /**
     * 畫出走迷宮的小球
     *
     * @param {Element} elBall   - 用於繪制小球的元素
     * @param {number}  diameter - 小球的直徑
     * @param {object}  entrance - 入口坐標 {x, y}
     * @returns {object}         - 小球的初始坐標 {x, y}（像素）
     * @memberof MazeRenderer
     */
    drawBall(elBall, diameter, entrance) {
        const step = this.step;

        // 計算初始化小球坐標（像素）
        const ballX = entrance.x * step;
        const ballY = entrance.y * step;

        // 初始化位置、大小、顏色
        elBall.style.width = diameter + "px";
        elBall.style.height = diameter + "px";
        elBall.style.left = ballX + "px";
        elBall.style.top = ballY + "px";

        return { x: ballX, y: ballY };
    }

    /**
     * 更新小球位置
     *
     * @param {Element} elBall - 用於繪制小球的元素
     * @param {number}  x      - 小球 x 坐標（像素）
     * @param {number}  y      - 小球 y 坐標（像素）
     * @memberof MazeRenderer
     */
    updateBallPosition(elBall, x, y) {
        elBall.style.left = x + "px";
        elBall.style.top = y + "px";
    }
}
