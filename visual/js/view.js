/**
 * The pathfinding visualization.
 * It uses raphael.js to show the grids./
 */
var View = {
    nodeSize: 30, // width and height of a single node, in pixel
    nodeStyle: {
        normal: {
            fill: 'white',
            'stroke-opacity': 0.2, // the border
        },
        blocked: {
            fill: 'grey',
            'stroke-opacity': 0.2,
        },
        start: {
            fill: 'pink',
            'stroke-opacity': 0.2, // 
        },
        end: {
            fill: '#0d0',
            'stroke-opacity': 0.2,
        },
        fire: {
            fill: 'red',
            'stroke-opacity': 0.2,
        },
        carrefour: {
            fill: 'darkblue',
            'stroke-opacity': 0.2,
        },
        apple: {
            fill: 'black',
            'stroke-opacity': 0.2,
        },
        macdonald: {
            fill: 'yellow',
            'stroke-opacity': 0.2,
        },
        starbucks: {
            fill: 'darkgreen',
            'stroke-opacity': 0.2,
        },
        muji: {
            fill: 'darkred',
            'stroke-opacity': 0.2,
        },
        adidas: {
            fill: 'skyblue',
            'stroke-opacity': 0.2,
        },
        nike: {
            fill: 'black',
            'stroke-opacity': 0.2,
        },
        uniqlo: {
            fill: 'lightcoral',
            'stroke-opacity': 0.2,
        },
        burger: {
            fill: 'orange',
            'stroke-opacity': 0.2,
        },
        opened: {
            fill: '#98fb98',
            'stroke-opacity': 0.2,
        },
        closed: {
            fill: '#afeeee',
            'stroke-opacity': 0.2,
        },
        failed: {
            fill: '#ff8888',
            'stroke-opacity': 0.2,
        },
        tested: {
            fill: '#e5e5e5',
            'stroke-opacity': 0.2,
        },
    },
    nodeColorizeEffect: {
        duration: 50,
    },
    nodeZoomEffect: {
        duration: 200,
        transform: 's1.2', // scale by 1.2x
        transformBack: 's1.0',
    },
    pathStyle: {
        stroke: 'yellow',
        'stroke-width': 3,
    },
    supportedOperations: ['opened', 'closed', 'tested'],
    init: function(opts) {
        this.numCols      = opts.numCols;
        this.numRows      = opts.numRows;
        this.paper        = Raphael('draw_area');
        this.$stats       = $('#stats');
    },
    /**
     * Generate the grid asynchronously.
     * This method will be a very expensive task.
     * Therefore, in order to not to block the rendering of browser ui,
     * I decomposed the task into smaller ones. Each will only generate a row.
     */
    generateGrid: function(callback) {
        var i, j, x, y,
            rect,
            normalStyle, nodeSize,
            createRowTask, sleep, tasks,
            nodeSize    = this.nodeSize,
            normalStyle = this.nodeStyle.normal,
            numCols     = 20,//this.numCols,
            numRows     = 25,//this.numRows,
            paper       = this.paper,
            rects       = this.rects = [],
            $stats      = this.$stats;

        paper.setSize(numCols * nodeSize, numRows * nodeSize);

        createRowTask = function(rowId) {
            return function(done) {
                rects[rowId] = [];
                for (j = 0; j < numCols; ++j) {
                    x = j * nodeSize;
                    y = rowId * nodeSize;

                    rect = paper.rect(x, y, nodeSize, nodeSize);
                    rect.attr(normalStyle);
                    rects[rowId].push(rect);
                }
                $stats.text(
                    'generating grid ' +
                    Math.round((rowId + 1) / numRows * 100) + '%'
                );
                done(null);
            };
        };

        sleep = function(done) {
            setTimeout(function() {
                done(null);
            }, 0);
        };

        tasks = [];
        for (i = 0; i < numRows; ++i) {
            tasks.push(createRowTask(i));
            tasks.push(sleep);
        }

        async.series(tasks, function() {
            if (callback) {
                callback();
            }
        });
    },
    setStartPos: function(gridX, gridY) {
    var coord = this.toPageCoordinate(gridX, gridY);
    // 創建或更新startNode
    if (!this.startNode) {
        // 如果startNode不存在，則創建一個新的startNode
        this.startNode = this.paper.rect(
            coord[0],
            coord[1],
            this.nodeSize,
            this.nodeSize
        ).attr(this.nodeStyle.start);
    } else {
        // 如果startNode已存在，則更新其位置
        this.startNode.attr({ x: coord[0], y: coord[1] }).toFront();
    }
},


    setEndPos: function(gridX, gridY) {
        var coord = this.toPageCoordinate(gridX, gridY);
        if (!this.endNode) {
            this.endNode = this.paper.rect(
                coord[0],
                coord[1],
                this.nodeSize,
                this.nodeSize
            ).attr(this.nodeStyle.normal)
             .animate(this.nodeStyle.end, 10);
        } else {
            this.endNode.attr({ x: coord[0], y: coord[1] }).toFront();
        }
    },
    setFirePos: function(gridX, gridY) {
        var coord = this.toPageCoordinate(gridX, gridY);
        if (!this.fireNode) {
            this.fireNode = this.paper.rect(
                coord[0],
                coord[1],
                this.nodeSize,
                this.nodeSize
            ).attr(this.nodeStyle.normal)
             .animate(this.nodeStyle.fire, 10);
        } else {
            this.fireNode.attr({ x: coord[0], y: coord[1] }).toFront();
        }
    },
    setCarrefourPos: function(gridX, gridY) {
        var coord = this.toPageCoordinate(gridX, gridY);
        if (!this.carrefourNode) {
            this.carrefourNode = this.paper.rect(
                coord[0],
                coord[1],
                this.nodeSize,
                this.nodeSize
            ).attr(this.nodeStyle.normal)
             .animate(this.nodeStyle.carrefour, 10);
        } else {
            this.carrefourNode.attr({ x: coord[0], y: coord[1] }).toFront();
        }
    },
    setApplePos: function(gridX, gridY) {
        var coord = this.toPageCoordinate(gridX, gridY);
        if (!this.appleNode) {
            this.appleNode = this.paper.rect(
                coord[0],
                coord[1],
                this.nodeSize,
                this.nodeSize
            ).attr(this.nodeStyle.normal)
             .animate(this.nodeStyle.apple, 10);
        } else {
            this.appleNode.attr({ x: coord[0], y: coord[1] }).toFront();
        }
    },
    setMacdonaldPos: function(gridX, gridY) {
        var coord = this.toPageCoordinate(gridX, gridY);
        if (!this.macdonaldNode) {
            this.macdonaldNode = this.paper.rect(
                coord[0],
                coord[1],
                this.nodeSize,
                this.nodeSize
            ).attr(this.nodeStyle.normal)
             .animate(this.nodeStyle.macdonald, 10);
        } else {
            this.macdonaldNode.attr({ x: coord[0], y: coord[1] }).toFront();
        }
    },
    setStarbucksPos: function(gridX, gridY) {
        var coord = this.toPageCoordinate(gridX, gridY);
        if (!this.starbucksNode) {
            this.starbucksNode = this.paper.rect(
                coord[0],
                coord[1],
                this.nodeSize,
                this.nodeSize
            ).attr(this.nodeStyle.normal)
             .animate(this.nodeStyle.starbucks, 10);
        } else {
            this.starbucksNode.attr({ x: coord[0], y: coord[1] }).toFront();
        }
    },
    setMujiPos: function(gridX, gridY) {
        var coord = this.toPageCoordinate(gridX, gridY);
        if (!this.mujiNode) {
            this.mujiNode = this.paper.rect(
                coord[0],
                coord[1],
                this.nodeSize,
                this.nodeSize
            ).attr(this.nodeStyle.normal)
             .animate(this.nodeStyle.muji, 10);
        } else {
            this.mujiNode.attr({ x: coord[0], y: coord[1] }).toFront();
        }
    },
    setAdidasPos: function(gridX, gridY) {
        var coord = this.toPageCoordinate(gridX, gridY);
        if (!this.adidasNode) {
            this.adidasNode = this.paper.rect(
                coord[0],
                coord[1],
                this.nodeSize,
                this.nodeSize
            ).attr(this.nodeStyle.normal)
             .animate(this.nodeStyle.adidas, 10);
        } else {
            this.adidasNode.attr({ x: coord[0], y: coord[1] }).toFront();
        }
    },
    setNikePos: function(gridX, gridY) {
        var coord = this.toPageCoordinate(gridX, gridY);
        if (!this.nikeNode) {
            this.nikeNode = this.paper.rect(
                coord[0],
                coord[1],
                this.nodeSize,
                this.nodeSize
            ).attr(this.nodeStyle.normal)
             .animate(this.nodeStyle.nike, 10);
        } else {
            this.nikeNode.attr({ x: coord[0], y: coord[1] }).toFront();
        }
    },
    setUniqloPos: function(gridX, gridY) {
        var coord = this.toPageCoordinate(gridX, gridY);
        if (!this.uniqloNode) {
            this.uniqloNode = this.paper.rect(
                coord[0],
                coord[1],
                this.nodeSize,
                this.nodeSize
            ).attr(this.nodeStyle.normal)
             .animate(this.nodeStyle.uniqlo, 10);
        } else {
            this.uniqloNode.attr({ x: coord[0], y: coord[1] }).toFront();
        }
    },
    setBurgerPos: function(gridX, gridY) {
        var coord = this.toPageCoordinate(gridX, gridY);
        if (!this.burgerNode) {
            this.burgerNode = this.paper.rect(
                coord[0],
                coord[1],
                this.nodeSize,
                this.nodeSize
            ).attr(this.nodeStyle.normal)
             .animate(this.nodeStyle.burger, 10);
        } else {
            this.burgerNode.attr({ x: coord[0], y: coord[1] }).toFront();
        }
    },
    /**
     * Set the attribute of the node at the given coordinate.
     */
    setAttributeAt: function(gridX, gridY, attr, value) {
        var color, nodeStyle = this.nodeStyle;
        switch (attr) {
        case 'walkable':
            color = value ? nodeStyle.normal.fill : nodeStyle.blocked.fill;
            this.setWalkableAt(gridX, gridY, value);
            break;
        case 'opened':
            this.colorizeNode(this.rects[gridY][gridX], nodeStyle.opened.fill);
            this.setCoordDirty(gridX, gridY, true);
            break;
        case 'closed':
            this.colorizeNode(this.rects[gridY][gridX], nodeStyle.closed.fill);
            this.setCoordDirty(gridX, gridY, true);
            break;
        case 'tested':
            color = (value === true) ? nodeStyle.tested.fill : nodeStyle.normal.fill;

            this.colorizeNode(this.rects[gridY][gridX], color);
            this.setCoordDirty(gridX, gridY, true);
            break;
        case 'parent':
            // XXX: Maybe draw a line from this node to its parent?
            // This would be expensive.
            break;
        default:
            console.error('unsupported operation: ' + attr + ':' + value);
            return;
        }
    },
    colorizeNode: function(node, color) {
        node.animate({
            fill: color
        }, this.nodeColorizeEffect.duration);
    },
    zoomNode: function(node) {
        node.toFront().attr({
            transform: this.nodeZoomEffect.transform,
        }).animate({
            transform: this.nodeZoomEffect.transformBack,
        }, this.nodeZoomEffect.duration);
    },
    setWalkableAt: function(gridX, gridY, value) {
        var node, i, blockedNodes = this.blockedNodes;
        if (!blockedNodes) {
            blockedNodes = this.blockedNodes = new Array(this.numRows);
            for (i = 0; i < this.numRows; ++i) {
                blockedNodes[i] = [];
            }
        }
        node = blockedNodes[gridY][gridX];
        if (value) {
            // clear blocked node
            if (node) {
                this.colorizeNode(node, this.rects[gridY][gridX].attr('fill'));
                this.zoomNode(node);
                setTimeout(function() {
                    node.remove();
                }, this.nodeZoomEffect.duration);
                blockedNodes[gridY][gridX] = null;
            }
        } else {
            // draw blocked node
            if (node) {
                return;
            }
            node = blockedNodes[gridY][gridX] = this.rects[gridY][gridX].clone();
            this.colorizeNode(node, this.nodeStyle.blocked.fill);
            this.zoomNode(node);
        }
    },
    clearFootprints: function() {
        var i, x, y, coord, coords = this.getDirtyCoords();
        for (i = 0; i < coords.length; ++i) {
            coord = coords[i];
            x = coord[0];
            y = coord[1];
            this.rects[y][x].attr(this.nodeStyle.normal);
            this.setCoordDirty(x, y, false);
        }
    },
    clearBlockedNodes: function() {
        var i, j, blockedNodes = this.blockedNodes;
        if (!blockedNodes) {
            return;
        }
        for (i = 0; i < this.numRows; ++i) {
            for (j = 0 ;j < this.numCols; ++j) {
                if (blockedNodes[i][j]) {
                    blockedNodes[i][j].remove();
                    blockedNodes[i][j] = null;
                }
            }
        }
    },
    drawPath: function(path) {
        if (!path.length) {
            return;
        }
        var svgPath = this.buildSvgPath(path);
        this.path = this.paper.path(svgPath).attr(this.pathStyle);
    },
    /**
     * Given a path, build its SVG represention.
     */
    buildSvgPath: function(path) {
        var i, strs = [], size = this.nodeSize;

        strs.push('M' + (path[0][0] * size + size / 2) + ' ' +
                  (path[0][1] * size + size / 2));
        for (i = 1; i < path.length; ++i) {
            strs.push('L' + (path[i][0] * size + size / 2) + ' ' +
                      (path[i][1] * size + size / 2));
        }

        return strs.join('');
    },
    clearPath: function() {
        if (this.path) {
            this.path.remove();
        }
    },
    /**
     * Helper function to convert the page coordinate to grid coordinate
     */
    toGridCoordinate: function(pageX, pageY) {
        return [
            Math.floor(pageX / this.nodeSize),
            Math.floor(pageY / this.nodeSize)
        ];
    },
    /**
     * helper function to convert the grid coordinate to page coordinate
     */
    toPageCoordinate: function(gridX, gridY) {
        return [
            gridX * this.nodeSize,
            gridY * this.nodeSize
        ];
    },
    showStats: function(opts) {
        var texts = [
            'length: ' + Math.round(opts.pathLength * 100) / 100,
            'time: ' + opts.timeSpent + 'ms',
            'operations: ' + opts.operationCount
        ];
        $('#stats').show().html(texts.join('<br>'));
    },
    setCoordDirty: function(gridX, gridY, isDirty) {
        var x, y,
            numRows = this.numRows,
            numCols = this.numCols,
            coordDirty;

        if (this.coordDirty === undefined) {
            coordDirty = this.coordDirty = [];
            for (y = 0; y < numRows; ++y) {
                coordDirty.push([]);
                for (x = 0; x < numCols; ++x) {
                    coordDirty[y].push(false);
                }
            }
        }

        this.coordDirty[gridY][gridX] = isDirty;
    },
    getDirtyCoords: function() {
        var x, y,
            numRows = this.numRows,
            numCols = this.numCols,
            coordDirty = this.coordDirty,
            coords = [];

        if (coordDirty === undefined) {
            return [];
        }

        for (y = 0; y < numRows; ++y) {
            for (x = 0; x < numCols; ++x) {
                if (coordDirty[y][x]) {
                    coords.push([x, y]);
                }
            }
        }
        return coords;
    },
};
//此為view.js
