/**
 * @file 走迷宫游戏的实现. (https://github.com/knightyun/maze-game)
 * @copyright 2020 knightyun. <https://raw.githubusercontent.com/knightyun/maze-game/master/maze.js>
 * @license MIT License. <https://raw.githubusercontent.com/knightyun/maze-game/master/LICENSE>
 */

/**
 * 迷宫类实现
 *
 * @class Maze
 */
class Maze {
    /**
     * @constructor
     * @param {object}   options
     * @param {Element}  options.elMaze        - 承载迷宫的 canvas 元素
     * @param {Element}  options.elBall        - 绘制小球的元素
     * @param {number}   [options.ballDia=6]   - 小球的直径（像素）
     * @param {number}   [options.width=31]    - 迷宫宽度（格数）
     * @param {number}   [options.height=31]   - 迷宫高度（格数）
     * @param {number}   [options.step=10]     - 单元格大小
     * @param {number}   [options.gameLevel=0] - 游戏难度等级
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

        this.ballSpeedX = 0; // 小球 x 轴方向的移动速度；
        this.ballSpeedY = 0; // 小球 y 轴方向的移动速度；
        this.G = 9.8; // 重力加速度
        this.time = null; // 时间戳，用于设置重力加速度
        this.curKey = ''; // 当前按键控制的方向 'up' | 'left' | 'right' | 'down'
        this.int = null; // 按键后触发的 setInterval 的返回值

        // 游戏难度等级：简单 -> 困难 -> 复杂
        //   0 - 简单：随机返回一个候选方向；
        //   1 - 复杂：随机返回两个候选方向；（难度最大）
        //   2 - 困难：随机返回三个候选方向；（全部）

        this.cvsCtx = this.elMaze.getContext("2d");

        // 包含所有格子的二维数组
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
     * 初始化迷宫
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

        // 调整 canvas 元素尺寸
        elMaze.width = w * step;
        elMaze.height = h * step;

        // 移除移动操作监听
        window.removeEventListener('keydown', this.keyDownHandler);
        window.removeEventListener('keyup', this.keyUpHandler);
        window.removeEventListener('devicemotion', this.motionHandler);

        // 绘画初始迷宫，包括围墙，出入口，
        // 并初始化每个单元格的信息
        for (var y = 0; y < h; y++) {
            mazeGrids[y] = [];

            for (var x = 0; x < w; x++) {
                // 每个单元格的信息，包括坐标，是否为墙，是否为路
                mazeGrids[y][x] = {
                    // 格子坐标
                    x: x,
                    y: y,
                    // 判断是否是围墙
                    isWall: x === 0 || y === 0 || x === w - 1 || y === h - 1,
                    // 是否为入口
                    isEntrance: x === entrance.x && y === entrance.y,
                    // 是否为出口
                    isExit: x === exit.x && y === exit.y,
                    // 判断是否为路：后期画路时置为 true
                    isPath: false,
                    // 链接上一个格子，用于搜索迷宫的解
                    preGrid: null,
                };
            }
        }

        // 画墙和出入口
        this.drawWall("#004d40", "white");

        // 内部墙的颜色
        elMaze.style.background = "#4D4040";

        // 挖路
        this.drawPath(entrance, { x: 1, y: -1 }, "#e0f2f1");

        // 画小球
        this.drawBall(elBall, ballDia);
    }

    /**
     * 封装的画格子方法
     *
     * @param {number} x     - 左上角的 x 坐标
     * @param {number} y     - 左上角的 y 坐标
     * @param {string} color - 格子颜色
     * @memberof Maze
     */
    fillGrid(x, y, color) {
        var ctx = this.cvsCtx;

        ctx.fillStyle = color;
        ctx.fillRect(x * this.step, y * this.step, this.step, this.step);
    }

    /**
     * 获取当前格子的“前面”一个格子（相对）
     *
     * @param   {number} x1 - 前一个格子的 x 坐标
     * @param   {number} y1 - 前一个格子的 y 坐标
     * @param   {number} x2 - 当前格子的 x 坐标
     * @param   {number} y2 - 当前格子的 y 坐标
     * @returns {object}    - 迷宫格子对象
     * @memberof Maze
     */
    getFrontGrid(x1, y1, x2, y2) {
        var x = 2 * x2 - x1,
            y = 2 * y2 - y1;

        // 判断该格子是否存在；
        var isExist = !!this.mazeGrids[y] && !!this.mazeGrids[y][x];

        return isExist ? this.mazeGrids[y][x] : null;
    }

    /**
     * 获取当前格子的左前方一个格子（相对）
     *
     * @param   {number} x1 - 前一个格子的 x 坐标
     * @param   {number} y1 - 前一个格子的 y 坐标
     * @param   {number} x2 - 当前格子的 x 坐标
     * @param   {number} y2 - 当前格子的 y 坐标
     * @returns {object}    - 迷宫格子对象
     * @memberof Maze
     */
    getFrontLeftGrid(x1, y1, x2, y2) {
        // 先获取前方格子
        var x = 2 * x2 - x1,
            y = 2 * y2 - y1;

        // 再判断左前方
        if (x2 - x1 === 0) {
            if (y2 - y1 > 0) x += 1;
            else x -= 1;
        }

        if (y2 - y1 === 0) {
            if (x2 - x1 > 0) y -= 1;
            else y += 1;
        }

        // 判断该格子是否存在；
        var isExist = !!this.mazeGrids[y] && !!this.mazeGrids[y][x];

        return isExist ? this.mazeGrids[y][x] : null;
    }

    /**
     * 获取当前格子的右前方一个格子（相对）
     *
     * @param   {number} x1 - 前一个格子的 x 坐标
     * @param   {number} y1 - 前一个格子的 y 坐标
     * @param   {number} x2 - 当前格子的 x 坐标
     * @param   {number} y2 - 当前格子的 y 坐标
     * @returns {object}    - 迷宫格子对象
     * @memberof Maze
     */
    getFrontRightGrid(x1, y1, x2, y2) {
        // 先获取前方格子
        var x = 2 * x2 - x1,
            y = 2 * y2 - y1;

        // 再判断右前方
        if (x2 - x1 === 0) {
            if (y2 - y1 > 0) x -= 1;
            else x += 1;
        }

        if (y2 - y1 === 0) {
            if (x2 - x1 > 0) y += 1;
            else y -= 1;
        }

        // 判断该格子是否存在；
        var isExist = !!this.mazeGrids[y] && !!this.mazeGrids[y][x];

        return isExist ? this.mazeGrids[y][x] : null;
    }

    /**
     * 获取当前格子的所有有效候选方向
     *
     * @param   {*} x   - 当前格子 x 坐标
     * @param   {*} y   - 当前格子 y 坐标
     * @returns {Array} - 有效的候选方向（格子对象）
     * @memberof Maze
     */
    getValidDirections(x, y) {
        // 格子周围有上右下左四个方向,
        // 索引 0, 1, 2, 3，
        // 无效方向：
        //   格子为围墙；
        //   格子前面是路；
        // 如果领居数为 0，则寻路结束；

        var mazeGrids = this.mazeGrids,
            directions = [];

        // 4 个方向
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

        // 过滤掉无效方向
        directions = directions.filter((item) => {
            // 候选方向的 x, y 坐标
            var _x = item.x,
                _y = item.y;

            // 判断是否到达出口

            // 判断是否为有效方向（按顺序判断）：
            //     格子存在；
            //     格子是出口；
            //     格子不是围墙；
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

        // 转换为迷宫格子对象
        directions = directions.map((item) => {
            return mazeGrids[item.y][item.x];
        });

        return directions;
    }

    /**
     * 判断第三个格子相对于第二个格子的方位
     *
     * @param   {object} grid1                  - 格子对象
     * @param   {object} grid2                  - 格子对象
     * @param   {object} grid2                  - 格子对象
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
     * 随机返回一个候选方向
     *
     * @param   {Array} directions - 包含候选方向的数组
     * @returns {object[]}         - 一个包含随机的候选方向的数组
     * @memberof Maze
     */
    getRandomDirection(directions) {
        var results = [];

        // 打乱数组
        directions.sort(() => 0.5 - Math.random());

        // 根据游戏难度返回候选方向
        //   gameLevel = 0：一条；
        //   gameLevel = 1：两条；
        //   gameLevel = 2：三条；
        //
        // 需要返回的候选方向个数大于 1 时，
        // 如果每次都返回一条以上，会导致迷宫规律化，
        // 所以需要控制生成多个候选方向时的概率，如 40%

        // 多个候选方向可以出现的最大概率
        var maxRatio = 0.3;

        // 当前的随机概率
        var ratio = Math.random();

        for (let i = 0; i <= this.gameLevel; i++) {
            // 如果候选方向个数少于相应游戏难度的，
            // 则直接中断
            if (!directions[i]) break;

            // 如果当前概率大于最大概率，
            // 则只返回第一个候选方向
            if (i > 0 && ratio > maxRatio) break;

            results.push(directions[i]);
        }

        return results;
    }

    /**
     * 处理当前格子下一步路径分叉的问题
     *
     * @param   {object}   grid1      - 前一个格子对象
     * @param   {object}   grid2      - 当前格子对象
     * @param   {object[]} directions - 候选方向的格子对象
     * @returns {object[]}            - 返回确定要挖的格子对象
     * @memberof Maze
     */
    forkPath(grid1, grid2, directions) {
        // 判断是否需要路径分叉：（按顺序）
        //   前方是围墙（分左、右）；
        //   前方的前方是路（分左、右）；
        //   左前方的左前方是路（分前、左）；
        //   右前方的右前方是路（分前、右）；
        //   左右前方的前方都是路（分前、左、右）；
        // 前方是围墙、或前方的前方是路、或左右前方的前方都是路，
        // 则所有候选方向都要挖；
        // 左右前方的前方其中一个为路时，只能挖前方和左或右；
        // 以上情况都不是，则使用随机选择；

        var isFrontWall, isFrontPath, isFrontLeftPath, isFrontRightPath;

        // 标记每个候选方向的方位
        var _directions = {
            front: null,
            left: null,
            right: null,
        };

        // 处理随机获取候选方向的东西情况
        var randomDirections = [],
            flagRandom = false;

        // 最后汇总返回的方向
        var returnDirections = [];

        // 遍历判断 directions 的方位
        directions.forEach((grid) => {
            var direction = this.getDirection(grid1, grid2, grid);

            _directions[direction] = grid;
        });

        // 现获取前面的格子
        // 前面一定存在有效格子
        // 不存在是路的情况
        // 如果是围墙直接返回全部方向，不用继续判断
        var frontGrid = this.getFrontGrid(grid1.x, grid1.y, grid2.x, grid2.y);
        isFrontWall = frontGrid.isWall;

        if (isFrontWall) return directions;

        // 获取前面的前面的格子
        // 此时前面的前面也一定存在有效格子
        // 不存在是围墙的情况
        // 如果是路直接返回全部对象，不判断左右
        var frontFrontGrid = this.getFrontGrid(
            grid2.x,
            grid2.y,
            frontGrid.x,
            frontGrid.y
        );
        isFrontPath = frontFrontGrid.isPath;

        if (isFrontPath) return directions;

        // 此时前方的前方不是路，也不会是围墙，
        // 只会是待挖的路，所以需要返回 front 方位的候选方向
        // 并考虑获取随机方向的情况
        returnDirections.push(_directions["front"]);
        randomDirections.push(_directions["front"]);

        // 获取左前方的左前方的格子
        // 左前方一定存在有效格子
        var frontLeftGrid = this.getFrontLeftGrid(
            grid1.x,
            grid1.y,
            grid2.x,
            grid2.y
        );
        if (!frontLeftGrid.isWall && !!_directions["left"]) {
            // 如果左前方是围墙，或者左边没有候选方向，
            // 则跳过；

            // 否则继续判断左前方的左前方
            // 此时左前方的左前方一定不会是围墙
            var frontFrontLeftGrid = this.getFrontLeftGrid(
                grid2.x,
                grid2.y,
                frontLeftGrid.x,
                frontLeftGrid.y
            );

            if (frontFrontLeftGrid.isPath) {
                // 如果是路，则需要返回 left 方位的候选方向
                returnDirections.push(_directions["left"]);
                isFrontLeftPath = true;
            } else {
                // 如果不是，就要考虑随机选择 front, left
                randomDirections.push(_directions["left"]);
                isFrontLeftPath = false;
            }
        } else {
            // 标记为不是路，方便处理另外两个方向可能出现随机的情况
            isFrontLeftPath = false;
        }

        // 获取右前方的左前方的格子
        // 右前方一定存在有效格子
        var frontRightGrid = this.getFrontRightGrid(
            grid1.x,
            grid1.y,
            grid2.x,
            grid2.y
        );
        if (!frontRightGrid.isWall && !!_directions["right"]) {
            // 如果右前方也是墙（很难出现）且存在右侧候选方向，
            // 则跳过

            // 否则继续判断右前方的左前方
            // 此时右前方的右前方一定不会是围墙
            var frontFrontRightGrid = this.getFrontRightGrid(
                grid2.x,
                grid2.y,
                frontRightGrid.x,
                frontRightGrid.y
            );

            if (frontFrontRightGrid.isPath) {
                // 如果也是路，则需要返回 right 方位的候选方向
                returnDirections.push(_directions["right"]);
                isFrontRightPath = true;
            } else {
                // 如果不是，就要考虑随机选择 front, right
                // 如果 left 方位也要考虑随机，则随机选择 front, left, right
                randomDirections.push(_directions["right"]);
                isFrontRightPath = false;
            }
        } else {
            isFrontRightPath = false;
        }

        // 使用随机的情况：
        //   前方的前方不是路（可以挖）；
        //   左右前方的前方只有一个是路时，选择前面和另一个不是路的方位；
        //   左右前方的前方都不是路时，randomDirections 中随机选一个；
        // 否则返回全部方向
        flagRandom = !isFrontLeftPath && !isFrontRightPath;

        if (flagRandom) return this.getRandomDirection(randomDirections);
        else return returnDirections;
    }

    /**
     * 绘画四周的围墙，以及出入口
     *
     * @param {string} wallColor   - 围墙的颜色
     * @param {string} tunnelColor - 出入口的颜色
     * @memberof Maze
     */
    drawWall(wallColor, tunnelColor) {
        this.mazeGrids.forEach((y) => {
            y.forEach((x) => {
                // 画墙
                x.isWall && this.fillGrid(x.x, x.y, wallColor);

                // 画出入口
                x.isEntrance && this.fillGrid(x.x, x.y, tunnelColor);
                x.isExit && this.fillGrid(x.x, x.y, tunnelColor);
            });
        });
    }

    /**
     * 挖路实现函数，递归地绘制有效路径
     * 从 this.start 开始，到无路后结束
     *
     * @param {object} grid      - 当前格子对象（要挖的路）
     * @param {object} preGrid   - 前一个格子对象，用于获取前进两格需要的方向
     * @param {string} pathColor - 路的颜色
     * @param {object} ctx       - 保存当前类的上下文，方便使用计时器时获取上下文
     * @memberof Maze
     */
    drawPath(grid, preGrid, pathColor, ctx) {
        var x = grid.x,
            y = grid.y,
            preX = preGrid.x,
            preY = preGrid.y;

        ctx = ctx || this;

        var mazeGrids = ctx.mazeGrids;

        // 链接上一个格子
        mazeGrids[y][x].preGrid = {
            x: preX,
            y: preY,
        };

        // 如果是出口直接绘制后停止
        if (mazeGrids[y][x].isExit) {
            ctx.fillGrid(x, y, pathColor);
            mazeGrids[y][x].isPath = true;

            return;
        }

        // 获取前面方向的格子
        var frontGrid = ctx.getFrontGrid(preX, preY, x, y);
        var fx = frontGrid.x,
            fy = frontGrid.y;

        // 先判断当前绘制的路是否有效：
        //   当前格子不是路；
        //   当前格子前面不是路；
        // 无效直接返回
        if (mazeGrids[y][x].isPath || mazeGrids[fy][fx].isPath) return;

        // 绘制路（第一格）
        ctx.fillGrid(x, y, pathColor);
        mazeGrids[y][x].isPath = true;

        // 画同方向第二格路
        ctx.fillGrid(fx, fy, pathColor);
        mazeGrids[fy][fx].isPath = true;

        // 第二格链接到第一格
        mazeGrids[fy][fx].preGrid = {
            x: x,
            y: y,
        };

        // 获取候选方向（第二格的）
        var directions = ctx.getValidDirections(fx, fy);

        // 递归挖路结束
        if (directions.length === 0) return;

        // 处理分叉情况，获取最终要挖的所有方向
        directions = ctx.forkPath(grid, frontGrid, directions);

        for (let i = 0; i < directions.length; i++) {
            // 使用计时器可以利用事件队列的特性，同时挖多个候选方向
            // 使用同步方式递归会导致一条路挖到头，剩下候选方向无效
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
     * 绘制迷宫的正确出路
     *
     * @param {number} x - 要绘制的格子 x 坐标
     * @param {number} y - 要绘制的格子 y 坐标
     * @memberof Maze
     */
    drawCorrectPath(x, y) {
        // 从出口开始，从后往前找，到入口为止
        // 利用每个子节点只有一个父节点的特性

        // 标记使用提示
        this.useHint = this.useHint || true;

        this.fillGrid(x, y, "#ffe0b2");

        if (x === this.entrance.x && y === this.entrance.y) return;

        var preX = this.mazeGrids[y][x].preGrid.x,
            preY = this.mazeGrids[y][x].preGrid.y;

        this.drawCorrectPath(preX, preY);
    }

    /**
     * 画出走迷宫的小球
     *
     * @param {Element} elBall - 用于绘制小球的元素
     * @param {number}  d      - 小球的直径
     * @memberof Maze
     */
    drawBall(elBall, d) {
        // 初始化小球坐标
        this.ballX = this.entrance.x * this.step;
        this.ballY = this.entrance.y * this.step;

        // debug
        // this.ballX = this.exit.x * this.step;
        // this.ballY = (this.exit.y - 1) * this.step;

        // 初始化位置、大小、颜色
        elBall.style.width = d + "px";
        elBall.style.height = d + "px";
        elBall.style.left = this.ballX + "px";
        elBall.style.top = this.ballY + "px";
    }

    /**
     * 实现移动控制小球
     *
     * @param {number}  x      - x 轴方向的重力加速度比率，10 >= x >= -10
     *                         - 值的绝对值越大，越接近重力加速度
     * @param {number}  y      - y 轴方向的重力加速度比率，10 >= y >= -10
     *                         - 值的绝对值越大，越接近重力加速度
     * @param {boolean} useAcc - 是否使用重力加速度移动
     * @memberof Maze
     */
    moveBall(x, y, useAcc) {
        var elBall = this.elBall;

        // 未移动时的坐标
        var bx = this.ballX,
            by = this.ballY;

        if (useAcc) {
            // 应用重力加速度：
            // 每秒速度增加量等于重力加速度；
            // 加速度的大小与倾斜角度（近似为 x，y 的值）成正比；
            // 时间戳单位为 1/1000 秒，
            // 重力加速度则为 G / 1000；

            // 不同轴方向换算后的加速度
            var gX = (this.G / 1000) * (x / 10),
                gY = (this.G / 1000) * (y / 10);

            // 当前时间戳
            var time = Date.now();

            // 每次调用根据时间戳确定要移动的距离
            if (!this.time) {
                this.time = time;
            } else {
                // 两次调用的时间间隔
                var timeDur = time - this.time;

                // 时间间隔阈值，超过这个值判断为小球停止后重新移动，
                // 此时速度需要置 0
                var timeout = 50;

                // 根据重力加速度增加速度
                if (!x || timeDur > timeout) {
                    // 如果该方向没有移动，则速度置为 0
                    this.ballSpeedX = 0;
                } else {
                    // 否则速度加上一个加速度值
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
            // 不使用加速度移动
            // x, y 判断为各自方向上的移动速度
            this.ballSpeedX = x;
            this.ballSpeedY = y;
        }

        // 移动后的坐标
        (bx += this.ballSpeedX), (by += this.ballSpeedY);

        // 把小球变换后的坐标限制在路内（防止穿墙）
        var validPos = this.getBallValidPosition(bx, by);

        // 保存变换后的坐标
        this.ballX = validPos.x;
        this.ballY = validPos.y;

        // 判断是否到达出口
        if (
            this.ballX >= this.exit.x * this.step &&
            this.ballY >= this.exit.y * this.step
        ) {
            this.arriveExit();
        }
        // 移动小球
        elBall.style.left = this.ballX + "px";
        elBall.style.top = this.ballY + "px";
    }

    /**
     * 限制小球移动范围，返回限制后的有效坐标
     *
     * @param   {number} x - 变换后的小球 x 坐标
     * @param   {number} y - 变换后的小球 y 坐标
     * @returns {object}   - 限制后的 x，y 坐标
     * @memberof Maze
     */
    getBallValidPosition(x, y) {
        // 限制小球在迷宫范围内
        if (x <= 0) (x = 0), (this.ballSpeedX = 0);
        if (y <= 0) y = 0;

        if (x >= this.w * this.step - this.ballDia)
            (x = this.w * this.step - this.ballDia), (this.ballSpeedX = 0);

        if (y >= this.h * this.step - this.ballDia)
            y = this.h * this.step - this.ballDia;

        // 小球四个角的坐标转换为迷宫坐标，
        // 即除以单元格长度后去掉小数部分
        // 刚好接触墙判断为路
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

        // 判断每个角对应的迷宫格子是否是路
        // 格子不存在就视作墙
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

        // 小球穿墙的情况：
        //   1. 只有一个角穿墙，需要考虑移动方向；
        //   2. 只有两个角穿墙，一定在同一侧；
        //   3. 三个角同时穿墙（暂时不考虑）；

        // 1. 一个角穿墙，向坐标值更大的一个轴方向移动
        // 1.1. 左上角
        if (
            !isGridPath(leftTop) &&
            isGridPath(leftBottom) &&
            isGridPath(rightTop) &&
            isGridPath(rightBottom)
        ) {
            // 向左穿墙
            if (x - leftTop.x * this.step > y - leftTop.y * this.step)
                (x = (leftTop.x + 1) * this.step), (this.ballSpeedX = 0);
            // 向上穿墙
            else (y = (leftTop.y + 1) * this.step), (this.ballSpeedY = 0);
        }
        // 1.2. 左下角
        if (
            !isGridPath(leftBottom) &&
            isGridPath(leftTop) &&
            isGridPath(rightBottom) &&
            isGridPath(rightTop)
        ) {
            // 向左穿墙
            if (
                (leftBottom.x + 1) * this.step - x <
                y + this.ballDia - leftBottom.y * this.step
            )
                (x = (leftBottom.x + 1) * this.step), (this.ballSpeedX = 0);
            // 向下穿墙
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
            // 向右穿墙
            if (
                y + this.ballDia - rightBottom.y * this.step >
                x + this.ballDia - rightBottom.x * this.step
            )
                (x = rightBottom.x * this.step - this.ballDia),
                    (this.ballSpeedX = 0);
            // 向下穿墙
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
            // 向右穿墙
            if (
                (rightTop.y + 1) * this.step - y >
                x + this.ballDia - rightTop.x * this.step
            )
                (x = rightTop.x * this.step - this.ballDia),
                    (this.ballSpeedX = 0);
            // 向上穿墙
            else (y = (rightTop.y + 1) * this.step), (this.ballSpeedY = 0);
        }

        // 2. 同侧两个角穿墙
        // 2.1. 左侧
        if (!isGridPath(leftTop) && !isGridPath(leftBottom))
            (x = (leftTop.x + 1) * this.step), (this.ballSpeedX = 0);
        // 2.2. 下侧
        if (!isGridPath(leftBottom) && !isGridPath(rightBottom))
            (y = leftBottom.y * this.step - this.ballDia),
                (this.ballSpeedY = 0);
        // 2.3. 右侧
        if (!isGridPath(rightTop) && !isGridPath(rightBottom))
            (x = rightTop.x * this.step - this.ballDia), (this.ballSpeedX = 0);
        // 2.4. 上侧
        if (!isGridPath(leftTop) && !isGridPath(rightTop))
            (y = (leftTop.y + 1) * this.step), (this.ballSpeedY = 0);

        return { x, y };
    }

    /**
     * 开始移动，添加事件监听
     *
     * @memberof Maze
     */
    startMove() {
        // 监控键盘移动事件
        window.addEventListener('keydown', this.keyDownHandler);
        window.addEventListener('keyup', this.keyUpHandler);

        // 监控移动端重力感应器事件
        window.addEventListener('devicemotion', this.motionHandler);
    }

    /**
     * 小球到达出口后的操作
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
            // 最大地图无提示通关
            M.toast({
                html: `<span class="orange-text text-accent-4">
                        ✨🎉恭喜通关最大地图🎉✨<br>
                        你拥有百折不挠的毅力和持之以恒的耐心！<br>
                        请重新开始游戏
                       </span>`,
                displayLength: 5000,
            });
        } else {
            // 正常提示
            M.toast({
                html: `<span class="orange-text text-accent-4">
                        ✨✨恭喜抵达出口🎉🎉请重新开始游戏
                       </span>`,
                displayLength: 3000,
            });
        }
    }

    /**
     * 处理移动端重力感应移动事件的回调
     *
     * @param {Event} evt - 传入的事件对象
     */
    motionHandler(evt) {
        var acc = evt.accelerationIncludingGravity;

        // 右翻 x 为负，后翻 y 为正
        // 不同方向的重力加速度比率，范围 [-10, 10]
        var aX = -acc.x,
            aY = acc.y;

        this.moveBall(aX, aY, true);
    }

    /**
     * 处理键盘移动事件的回调函数
     *
     * @param {Event} evt - 传入的事件对象
     */
    keyDownHandler(evt) {
        // 上      左        下        右
        // w       a         s         d
        // ArrowUp ArrowLeft ArrowDown ArrowRight

        // 阻止默认移动行为
        evt.preventDefault();

        // 不同方向的加速度
        var step = 5;
        // 每次移动小球的延时
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

    // 按键松开事件
    keyUpHandler(evt) {
        evt.preventDefault();
        this.curKey = '';
        window.clearInterval(this.int);
    }
}

// 重新开始游戏
function reGenMaze() {
    // 重新生成迷宫并移动小球
    maze = genMaze({
        width: +elMazeSize.value,
        height: +elMazeSize.value,
        gameLevel: +elGameLevel.value,
    });
}

// 开始游戏
function startGame() {
    // 开始移动小球
    maze.startMove();

    // 禁用开始按钮
    elStartGame.classList.add("disabled");
    elStartGame.classList.remove("pulse");

    // 判断设备是否支持重力传感器
    var accelerometer = null;
    var detectError = false;
    try {
        accelerometer = new Accelerometer({ referenceFrame: 'device' });
        accelerometer.addEventListener('error', event => {
            // Handle runtime errors.
            if (event.error.name === 'NotAllowedError') {
                // Branch to code for requesting permission.
            } else if (event.error.name === 'NotReadableError' ) {
                // alert('错误：未能检测到传感器！');
                detectError = true;
            }
        });
        accelerometer.addEventListener('reading', () => reloadOnShake(accelerometer));
        accelerometer.start();
    } catch (error) {
        // Handle construction errors.
        if (error.name === 'SecurityError') {
            // See the note above about feature policy.
            // alert('错误：传感器构造被功能策略阻止！');
            detectError = true;
        } else if (error.name === 'ReferenceError') {
            // alert('错误：用户代理不支持传感器！');
            detectError = true;
        } else {
            throw error;
        }
    }

    if (typeof DeviceMotionEvent === "undefined") {
        M.toast({
            html: `<span class="red-text">
                     该浏览器不支持重力感应器！<br>
                     <span class="red-text text-lighten-3">
                       请使用方向键移动小球
                     </span>
                   </span>
                   `,
            displayLength: 2000,
        });
    } else {
        if (detectError) {
            M.toast({
                html: `<span class="teal-text text-accent-2">
                         游戏开始！<br>
                         当前设备可能<span class="red-text text-lighten-3"
                         >不支持</span>重力感应器或<span class="red-text text-lighten-3"
                         >检测失败</span>，<br>
                         请尝试晃动手机，或者使用方向键移动小球<br>
                       </span>`,
                displayLength: 5000,
            });
        } else {
            M.toast({
                html: `<span class="teal-text text-accent-2">
                         游戏开始！<br>
                         请晃动手机，或使用方向键移动小球
                       </span>`,
                displayLength: 2000,
            });
        }
    }

    // 一定时间后显示提示按钮
    setTimeout(() => {
        elGameHint.classList.remove("scale-out");
        elGameHint.classList.add("scale-in");
    }, 5000);
}

// 生成迷宫
function genMaze(options) {
    var _options = Object.assign(
        {
            elMaze: elMaze,
            elBall: elBall,
        },
        options
    );

    // 启用开始按钮
    elStartGame.classList.remove("disabled");
    elStartGame.classList.add("pulse");

    // 隐藏提示按钮
    elGameHint.classList.remove("scale-in");
    elGameHint.classList.add("scale-out");

    return new Maze(_options);
}

// 点击提示后绘制迷宫的解
function drawHintPath() {
    // 隐藏提示按钮
    elGameHint.classList.remove("scale-in");
    elGameHint.classList.add("scale-out");

    // 绘制迷宫的出路
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

// 监听地图尺寸调整
elMazeSize.addEventListener("change", function () {
    maze = genMaze({
        width: +this.value,
        height: +this.value,
        gameLevel: +elGameLevel.value,
    });

    elMazeWrapper.style.width = maze.w * maze.step + "px";
    elMazeWrapper.style.zoom = elControl.clientWidth / (maze.w * maze.step);
});

// 监听游戏难度调整
elGameLevel.addEventListener("change", function () {
    maze = genMaze({
        width: +elMazeSize.value,
        height: +elMazeSize.value,
        gameLevel: +this.value,
    });
});

// 缩放迷宫地图以适应页面
elMazeWrapper.style.width = maze.w * maze.step + "px";
elMazeWrapper.style.zoom = elControl.clientWidth / (maze.w * maze.step);
