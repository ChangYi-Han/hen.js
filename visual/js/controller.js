/**
 * The visualization controller will works as a state machine.
 * See files under the `doc` folder for transition descriptions.
 * See https://github.com/jakesgordon/javascript-state-machine
 * for the document of the StateMachine module./
 */
var Controller = StateMachine.create({
    initial: 'none',
    events: [
        {
            name: 'init',
            from: 'none',
            to:   'ready'
        },
        {
            name: 'search',
            from: 'starting',
            to:   'searching'
        },
        {
            name: 'pause',
            from: 'searching',
            to:   'paused'
        },
        {
            name: 'finish',
            from: 'searching',
            to:   'finished'
        },
        {
            name: 'resume',
            from: 'paused',
            to:   'searching'
        },
        {
            name: 'cancel',
            from: 'paused',
            to:   'ready'
        },
        {
            name: 'modify',
            from: 'finished',
            to:   'modified'
        },
        {
            name: 'reset',
            from: '*',
            to:   'ready'
        },
        {
            name: 'clear',
            from: ['finished', 'modified'],
            to:   'ready'
        },
        {
            name: 'start',
            from: ['ready', 'modified', 'restarting'],
            to:   'starting'
        },
        {
            name: 'restart',
            from: ['searching', 'finished'],
            to:   'restarting'
        },
        {
            name: 'dragStart',
            from: ['ready', 'finished'],
            to:   'draggingStart'
        },
        {
            name: 'dragEnd',
            from: ['ready', 'finished'],
            to:   'draggingEnd'
        },
        {
            name: 'drawWall',
            from: ['ready', 'finished'],
            to:   'drawingWall'
        },
        {
            name: 'eraseWall',
            from: ['ready', 'finished'],
            to:   'erasingWall'
        },
        {
            name: 'rest',
            from: ['draggingStart', 'draggingEnd', 'drawingWall', 'erasingWall'],
            to  : 'ready'
        },
    ],
});

$.extend(Controller, {
    gridSize: [64, 36], // number of nodes horizontally and vertically
    operationsPerSecond: 300,

    /**
     * Asynchronous transition from `none` state to `ready` state.
     */
    onleavenone: function() {
        var numCols = this.gridSize[0],
            numRows = this.gridSize[1];

        this.grid = new PF.Grid(numCols, numRows);

        View.init({
            numCols: numCols,
            numRows: numRows
        });
        View.generateGrid(function() {
            Controller.setDefaultStartEndPos();
            Controller.bindEvents();
            Controller.transition(); // transit to the next state (ready)
        });

        this.$buttons = $('.control_button');

        this.hookPathFinding();

        return StateMachine.ASYNC;
        // => ready
    },
    ondrawWall: function(event, from, to, gridX, gridY) {
        this.setWalkableAt(gridX, gridY, false);
        // => drawingWall
    },
    oneraseWall: function(event, from, to, gridX, gridY) {
        this.setWalkableAt(gridX, gridY, true);
        // => erasingWall
    },
    onsearch: function(event, from, to) {
        var grid,
            timeStart, timeEnd,
            finder = Panel.getFinder();

        timeStart = window.performance ? performance.now() : Date.now();
        grid = this.grid.clone();
        this.path = finder.findPath(
            this.startX, this.startY, this.endX, this.endY, grid
        );
        this.operationCount = this.operations.length;
        timeEnd = window.performance ? performance.now() : Date.now();
        this.timeSpent = (timeEnd - timeStart).toFixed(4);

        this.loop();
        // => searching
    },
    onrestart: function() {
        // When clearing the colorized nodes, there may be
        // nodes still animating, which is an asynchronous procedure.
        // Therefore, we have to defer the `abort` routine to make sure
        // that all the animations are done by the time we clear the colors.
        // The same reason applies for the `onreset` event handler.
        setTimeout(function() {
            Controller.clearOperations();
            Controller.clearFootprints();
            Controller.start();
        }, View.nodeColorizeEffect.duration * 1.2);
        // => restarting
    },
    onpause: function(event, from, to) {
        // => paused
    },
    onresume: function(event, from, to) {
        this.loop();
        // => searching
    },
    oncancel: function(event, from, to) {
        this.clearOperations();
        this.clearFootprints();
        // => ready
    },
    onfinish: function(event, from, to) {
        View.showStats({
            pathLength: PF.Util.pathLength(this.path),
            timeSpent:  this.timeSpent,
            operationCount: this.operationCount,
        });
        View.drawPath(this.path);
        // => finished
    },
    onclear: function(event, from, to) {
        this.clearOperations();
        this.clearFootprints();
        // => ready
    },
    onmodify: function(event, from, to) {
        // => modified
    },
    onreset: function(event, from, to) {
        setTimeout(function() {
            Controller.clearOperations();
            Controller.clearAll();
            Controller.buildNewGrid();
        }, View.nodeColorizeEffect.duration * 1.2);
        // => ready
    },

    /**
     * The following functions are called on entering states.
     */

    onready: function() {
        console.log('=> ready');
        this.setButtonStates({
            id: 1,
            text: 'Start Search',
            enabled: true,
            callback: $.proxy(this.start, this),
        }, {
            id: 2,
            text: 'Pause Search',
            enabled: false,
        }, {
            id: 3,
            text: 'Clear Walls',
            enabled: true,
            callback: $.proxy(this.reset, this),
        });
        // => [starting, draggingStart, draggingEnd, drawingStart, drawingEnd]
    },
    onstarting: function(event, from, to) {
        console.log('=> starting');
        // Clears any existing search progress
        this.clearFootprints();
        this.setButtonStates({
            id: 2,
            enabled: true,
        });
        this.search();
        // => searching
    },
    onsearching: function() {
        console.log('=> searching');
        this.setButtonStates({
            id: 1,
            text: 'Restart Search',
            enabled: true,
            callback: $.proxy(this.restart, this),
        }, {
            id: 2,
            text: 'Pause Search',
            enabled: true,
            callback: $.proxy(this.pause, this),
        });
        // => [paused, finished]
    },
    onpaused: function() {
        console.log('=> paused');
        this.setButtonStates({
            id: 1,
            text: 'Resume Search',
            enabled: true,
            callback: $.proxy(this.resume, this),
        }, {
            id: 2,
            text: 'Cancel Search',
            enabled: true,
            callback: $.proxy(this.cancel, this),
        });
        // => [searching, ready]
    },
    onfinished: function() {
        console.log('=> finished');
        this.setButtonStates({
            id: 1,
            text: 'Restart Search',
            enabled: true,
            callback: $.proxy(this.restart, this),
        }, {
            id: 2,
            text: 'Clear Path',
            enabled: true,
            callback: $.proxy(this.clear, this),
        });
    },
    onmodified: function() {
        console.log('=> modified');
        this.setButtonStates({
            id: 1,
            text: 'Start Search',
            enabled: true,
            callback: $.proxy(this.start, this),
        }, {
            id: 2,
            text: 'Clear Path',
            enabled: true,
            callback: $.proxy(this.clear, this),
        });
    },

    /**
     * Define setters and getters of PF.Node, then we can get the operations
     * of the pathfinding.
     */
    hookPathFinding: function() {

        PF.Node.prototype = {
            get opened() {
                return this._opened;
            },
            set opened(v) {
                this._opened = v;
                Controller.operations.push({
                    x: this.x,
                    y: this.y,
                    attr: 'opened',
                    value: v
                });
            },
            get closed() {
                return this._closed;
            },
            set closed(v) {
                this._closed = v;
                Controller.operations.push({
                    x: this.x,
                    y: this.y,
                    attr: 'closed',
                    value: v
                });
            },
            get tested() {
                return this._tested;
            },
            set tested(v) {
                this._tested = v;
                Controller.operations.push({
                    x: this.x,
                    y: this.y,
                    attr: 'tested',
                    value: v
                });
            },
        };

        this.operations = [];
    },
    bindEvents: function() {
        $('#draw_area').mousedown($.proxy(this.mousedown, this));
        $(window)
            .mousemove($.proxy(this.mousemove, this))
            .mouseup($.proxy(this.mouseup, this));
    },
    loop: function() {
        var interval = 1000 / this.operationsPerSecond;
        (function loop() {
            if (!Controller.is('searching')) {
                return;
            }
            Controller.step();
            
            setTimeout(loop, interval);
        })();
    },
    step: function() {
        var operations = this.operations,
            op, isSupported;

        do {
            if (!operations.length) {
                this.finish(); // transit to `finished` state
                return;
            }
            op = operations.shift();
            isSupported = View.supportedOperations.indexOf(op.attr) !== -1;
        } while (!isSupported);

        View.setAttributeAt(op.x, op.y, op.attr, op.value);
    },
    clearOperations: function() {
        this.operations = [];
    },
    clearFootprints: function() {
        View.clearFootprints();
        View.clearPath();
    },
    clearAll: function() {
        this.clearFootprints();
        View.clearBlockedNodes();
    },
    buildNewGrid: function() {
        this.grid = new PF.Grid(this.gridSize[0], this.gridSize[1]);
    },
    mousedown: function (event) {
        var coord = View.toGridCoordinate(event.pageX, event.pageY),
            gridX = coord[0],
            gridY = coord[1],
            grid  = this.grid;

        if (this.can('dragStart') && this.isStartPos(gridX, gridY)) {
            this.dragStart();
            return;
        }
        if (this.can('dragEnd') && this.isEndPos(gridX, gridY)) {
            this.dragEnd();
            return;
        }
        if (this.can('drawWall') && grid.isWalkableAt(gridX, gridY)) {
            this.drawWall(gridX, gridY);
            return;
        }
        if (this.can('eraseWall') && !grid.isWalkableAt(gridX, gridY)) {
            this.eraseWall(gridX, gridY);
        }
    },
    mousemove: function(event) {
        var coord = View.toGridCoordinate(event.pageX, event.pageY),
            grid = this.grid,
            gridX = coord[0],
            gridY = coord[1];

        if (this.isStartOrEndPos(gridX, gridY)) {
            return;
        }

        switch (this.current) {
        case 'draggingStart':
            if (grid.isWalkableAt(gridX, gridY)) {
                this.setStartPos(gridX, gridY);
            }
            break;
        case 'draggingEnd':
            if (grid.isWalkableAt(gridX, gridY)) {
                this.setEndPos(gridX, gridY);
            }
            break;
        case 'drawingWall':
            this.setWalkableAt(gridX, gridY, false);
            break;
        case 'erasingWall':
            this.setWalkableAt(gridX, gridY, true);
            break;
        }
    },
    mouseup: function(event) {
        if (Controller.can('rest')) {
            Controller.rest();
        }
    },
    setButtonStates: function() {
        $.each(arguments, function(i, opt) {
            var $button = Controller.$buttons.eq(opt.id - 1);
            if (opt.text) {
                $button.text(opt.text);
            }
            if (opt.callback) {
                $button
                    .unbind('click')
                    .click(opt.callback);
            }
            if (opt.enabled === undefined) {
                return;
            } else if (opt.enabled) {
                $button.removeAttr('disabled');
            } else {
                $button.attr({ disabled: 'disabled' });
            }
        });
    },
    /**
     * When initializing, this method will be called to set the positions
     * of start node and end node.
     * It will detect user's display size, and compute the best positions.
     */
    setDefaultStartEndPos: function() {
        var width, height,
            marginRight, availWidth,
            centerX, centerY,
            endX, endY,
            nodeSize = View.nodeSize;

        width  = $(window).width();
        height = $(window).height();

        marginRight = $('#algorithm_panel').width();
        availWidth = width - marginRight;

        centerX = Math.ceil(availWidth / 2 / nodeSize);
        centerY = Math.floor(height / 2 / nodeSize);

        this.setStartPos(3,4);//(centerX - 5, centerY);
        
        this.setWalkableAt(3, 1, false)
        this.setNikePos(4, 1)
        this.setWalkableAt(5, 1, false)
        
        this.setWalkableAt(3, 2, false)
        //this.setWalkableAt(4, 2, false)
        this.setWalkableAt(5, 2, false)
        
        this.setWalkableAt(3, 3, false)
        this.setWalkableAt(4, 3, false)
        this.setWalkableAt(5, 3, false)

        this.setWalkableAt(7, 1, false)
        this.setApplePos(8, 1)
        this.setWalkableAt(9, 1, false)

        this.setWalkableAt(7, 2, false)
        //this.setWalkableAt(8, 2, false)
        this.setWalkableAt(9, 2, false)

        this.setWalkableAt(7, 3, false)
        this.setWalkableAt(8, 3, false)
        this.setWalkableAt(9, 3, false)
        
        this.setWalkableAt(11, 1, false)
        this.setMujiPos(12, 1)
        this.setWalkableAt(13, 1, false)

        this.setWalkableAt(11, 2, false)
        //this.setWalkableAt(12, 2, false)
        this.setWalkableAt(13, 2, false)

        this.setWalkableAt(11, 3, false)
        this.setWalkableAt(12, 3, false)
        this.setWalkableAt(13, 3, false)

        this.setWalkableAt(3, 5, false)
        this.setAdidasPos(4, 5)
        this.setWalkableAt(5, 5, false)
        
        this.setWalkableAt(3, 6, false)
        //this.setWalkableAt(4, 6, false)
        this.setWalkableAt(5, 6, false)
        
        this.setWalkableAt(3, 7, false)
        this.setWalkableAt(4, 7, false)
        this.setWalkableAt(5, 7, false)

        this.setWalkableAt(7, 5, false)
        this.setCarrefourPos(8, 5)
        this.setWalkableAt(9, 5, false)

        this.setWalkableAt(7, 6, false)
        //this.setWalkableAt(8, 6, false)
        this.setWalkableAt(9, 6, false)

        this.setWalkableAt(7, 7, false)
        this.setWalkableAt(8, 7, false)
        this.setWalkableAt(9, 7, false)
        
        this.setWalkableAt(11, 5, false)
        this.setUniqloPos(12, 5)
        this.setWalkableAt(13, 5, false)

        this.setWalkableAt(11, 6, false)
        //this.setWalkableAt(12, 6, false)
        this.setWalkableAt(13, 6, false)

        this.setWalkableAt(11, 7, false)
        this.setWalkableAt(12, 7, false)
        this.setWalkableAt(13, 7, false)

        this.setWalkableAt(3, 9, false)
        this.setBurgerPos(4, 9)
        this.setWalkableAt(5, 9, false)
        
        this.setWalkableAt(3, 10, false)
        //this.setWalkableAt(4, 10, false)
        this.setWalkableAt(5, 10, false)
        
        this.setWalkableAt(3, 11, false)
        this.setWalkableAt(4, 11, false)
        this.setWalkableAt(5, 11, false)

        this.setWalkableAt(7, 9, false)
        this.setMacdonaldPos(8, 9)
        this.setWalkableAt(9, 9, false)

        this.setWalkableAt(7, 10, false)
        //this.setWalkableAt(8, 10, false)
        this.setWalkableAt(9, 10, false)

        this.setWalkableAt(7, 11, false)
        this.setWalkableAt(8, 11, false)
        this.setWalkableAt(9, 11, false)
        
        this.setWalkableAt(11, 9, false)
        this.setStarbucksPos(12, 9)
        this.setWalkableAt(13, 9, false)

        this.setWalkableAt(11, 10, false)
        //this.setWalkableAt(12, 10, false)
        this.setWalkableAt(13, 10, false)

        this.setWalkableAt(11, 11, false)
        this.setWalkableAt(12, 11, false)
        this.setWalkableAt(13, 11, false)
//room
        this.setWalkableAt(2, 4, false)
        this.setWalkableAt(2, 8, false)
        this.setWalkableAt(6, 0, false)
        this.setWalkableAt(10, 0, false)
        this.setWalkableAt(14, 4, false)
        this.setWalkableAt(14, 8, false)
        this.setWalkableAt(6, 12, false)
        this.setWalkableAt(10, 12, false)
//exit
    },
    setStartPos: function(gridX, gridY) {
        this.startX = gridX;
        this.startY = gridY;
        View.setStartPos(gridX, gridY);
    },
    setEndPos: function(gridX, gridY) {
        this.endX = gridX;
        this.endY = gridY;
        View.setEndPos(gridX, gridY);
    },
    setFirePos: function(gridX, gridY) {
        this.fireX = gridX;
        this.fireY = gridY;
        View.setFirePos(gridX, gridY);
    },
    setCarrefourPos: function(gridX, gridY) {
        this.carrefourX = gridX;
        this.carrefourY = gridY;
        View.setCarrefourPos(gridX, gridY);
    },
    setApplePos: function(gridX, gridY) {
        this.appleX = gridX;
        this.appleY = gridY;
        View.setApplePos(gridX, gridY);
    },
    setMacdonaldPos: function(gridX, gridY) {
        this.macdonaldX = gridX;
        this.macdonaldY = gridY;
        View.setMacdonaldPos(gridX, gridY);
    },
    setStarbucksPos: function(gridX, gridY) {
        this.starbucksX = gridX;
        this.starbucksY = gridY;
        View.setStarbucksPos(gridX, gridY);
    },
    setMujiPos: function(gridX, gridY) {
        this.mujiX = gridX;
        this.mujiY = gridY;
        View.setMujiPos(gridX, gridY);
    },
    setAdidasPos: function(gridX, gridY) {
        this.adidasX = gridX;
        this.adidasY = gridY;
        View.setAdidasPos(gridX, gridY);
    },
    setNikePos: function(gridX, gridY) {
        this.nikeX = gridX;
        this.nikeY = gridY;
        View.setNikePos(gridX, gridY);
    },
    setUniqloPos: function(gridX, gridY) {
        this.uniqloX = gridX;
        this.uniqloY = gridY;
        View.setUniqloPos(gridX, gridY);
    },
    setBurgerPos: function(gridX, gridY) {
        this.burgerX = gridX;
        this.burgerY = gridY;
        View.setBurgerPos(gridX, gridY);
    },
    
    setWalkableAt: function(gridX, gridY, walkable) {
        this.grid.setWalkableAt(gridX, gridY, walkable);
        View.setAttributeAt(gridX, gridY, 'walkable', walkable);
    },
    isStartPos: function(gridX, gridY) {
        return gridX === this.startX && gridY === this.startY;
    },
    isEndPos: function(gridX, gridY) {
        return gridX === this.endX && gridY === this.endY;
    },
    isFirePos: function(gridX, gridY) {
        return gridX === this.fireX && gridY === this.fireY;
    },
    isCarrefourPos: function(gridX, gridY) {
        return gridX === this.carrefourX && gridY === this.carrefourY;
    },
    isApplePos: function(gridX, gridY) {
        return gridX === this.appleX && gridY === this.appleY;
    },
    isMacdonaldPos: function(gridX, gridY) {
        return gridX === this.macdonaldX && gridY === this.macdonaldY;
    },
    isStarbucksPos: function(gridX, gridY) {
        return gridX === this.starbucksX && gridY === this.starbucksY;
    },
    isMujiPos: function(gridX, gridY) {
        return gridX === this.mujiX && gridY === this.mujiY;
    },
    isAdidasPos: function(gridX, gridY) {
        return gridX === this.adidasX && gridY === this.adidasY;
    },
    isNikePos: function(gridX, gridY) {
        return gridX === this.nikeX && gridY === this.nikeY;
    },
    isUniqloPos: function(gridX, gridY) {
        return gridX === this.uniqloX && gridY === this.uniqloY;
    },
    isBurgerPos: function(gridX, gridY) {
        return gridX === this.burgerX && gridY === this.burgerY;
    },
    isStartOrEndPos: function(gridX, gridY) {
        return this.isStartPos(gridX, gridY) || this.isEndPos(gridX, gridY) || this.isFirePos(gridX, gridY) || this.isCarrefourPos(gridX, gridY)|| this.isApplePos(gridX, gridY)|| this.isMacdonaldPos(gridX, gridY)|| this.isStarbucksPos(gridX, gridY)|| this.isMujiPos(gridX, gridY)|| this.isAdidasPos(gridX, gridY)|| this.isNikePos(gridX, gridY)|| this.isUniqloPos(gridX, gridY)|| this.isBurgerPos(gridX, gridY);
    },
    
          
    

});
//此為controller.js
