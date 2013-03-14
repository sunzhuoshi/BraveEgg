TAG_ENEMY = 1;

ZORDER_LAZY = 0;
ZORDER_BACKGROUND = 0;
ZORDER_SPRITE = 1;
ZORDER_MENU = 255;

EggSprite = cc.Sprite.extend({
    dead: false,
    picked: false,
    onGameOver: function() {
        this.die();
    },
    hide: function() {
        this.setVisible(false);
    },
    respawn: function(x, y) {
        this.picked = false;
        this.dead = false;
        this.stopAllActions();
        this.initWithFile('res/Egg.png');
        this.setVisible(true);
        this.setPosition(cc.p(x, y));
    },
    die: function() {
        this.dead = true;
        this.picked = false;
        var animation = cc.Animation.create();
        var frameFileName;
        for (var i=0; i<4; ++i) {
            frameFileName = 'res/Explosion' + i + '.png';
            animation.addSpriteFrameWithFile(frameFileName);
        }
        animation.setDelayPerUnit(0.15);
        animation.setRestoreOriginalFrame(true);
        var actionExplosion = cc.Animate.create(animation);
        var actionHide = cc.CallFunc.create(this.hide, this, null);
        this.runAction(cc.Sequence.create(actionExplosion, actionHide));
        cc.AudioEngine.getInstance().playEffect('res/EggExplosion.wav');
    },
    onTouchesBegan:function (touches, event) {
        for (var i=0; i<touches.length; ++i) {
            if (cc.Rect.CCRectContainsPoint(this.getBoundingBoxToWorld(), touches[i].getLocation())) {
                if (!this.dead) {
                    this.picked = true;
                    cc.AudioEngine.getInstance().playEffect('res/BirdSelect.wav');
                }
                break;
            }
        }
    },
    onTouchesMoved:function (touches, event) {
        if (this.picked) {
            this.setPosition(cc.p(touches[0].getLocation().x, touches[0].getLocation().y));
        }
    },
    onTouchesEnded:function (touches, event) {
        this.picked = false;
    },
    onTouchesCancelled:function (touches, event) {
        this.picked = false;
    }
});

EggSprite.create = function() {
    var sprite = new EggSprite();
    if (sprite.initWithFile('res/Egg.png')) {
        sprite.setScale(0.5);
        return sprite;
    }
    else {
        return null;
    }
}

PigSprite = cc.Sprite.extend({
    onGameOver: function() {
        this.stopAllActions();
        this.laugh();
    },
    laugh: function() {
        var animation = cc.Animation.create();
        var $MIN_JUMP_HEIGHT = 10;
        var $DELTA_JUNP_HEIGHT = 10;
        var $MIN_JUMP_TIMES = 6;
        var $DELTA_JUMP_TIMES = 4;

        var jumpHeight = Math.floor(Math.random() * $DELTA_JUNP_HEIGHT) + $MIN_JUMP_HEIGHT;
        var jumpTimes = Math.floor(Math.random() * $DELTA_JUMP_TIMES) + $MIN_JUMP_TIMES;

        animation.addSpriteFrameWithFile('res/PigOpenEyes.png');
        animation.addSpriteFrameWithFile('res/PigLaugh.png');
        animation.setDelayPerUnit(0.5);
        var actionLaugh = cc.Animate.create(animation);
        var actionJump = cc.JumpBy.create(5, cc.p(0, 0), jumpHeight, jumpTimes);
        var actionScale = cc.ScaleTo.create(1, 1, 1);
        this.runAction(cc.Sequence.create(actionScale, actionLaugh, actionJump));
    }
});

PigSprite.create = function() {
    var sprite = new PigSprite();
    if (sprite.initWithFile('res/PigCloseEyes.png')) {
        sprite.setTag(TAG_ENEMY);
        sprite.setScale(0.2);
        return sprite;
    }
    else {
        return null;
    }
}

var BraveEgg = cc.Layer.extend({
    isMouseDown: false,
    egg: null,
    pigs: [],
    startMenuItem: null,
    tryAgainMenuItem: null,

    init:function () {
        var selfPointer = this;
        //////////////////////////////
        // 1. super init first
        this._super();

        /////////////////////////////
        // 2. add a menu item with "X" image, which is clicked to quit the program
        //    you may modify it.
        // ask director the window size
        var size = cc.Director.getInstance().getWinSize();

        // add a "close" icon to exit the progress. it's an autorelease object
        var closeItem = cc.MenuItemImage.create(
            "res/CloseNormal.png",
            "res/CloseSelected.png",
            function () {
                cc.AudioEngine.getInstance().playEffect('res/Menu.wav');
                history.back();
            },
            this);
        closeItem.setPosition(cc.p(size.width - 20, 20));

        this.startMenuItem = cc.MenuItemFont.create(
            'Start',
            function () {
                cc.AudioEngine.getInstance().playEffect('res/Menu.wav');
                this.startMenuItem.setVisible(false);
                this.gameStart();
            },
            this
        );
        this.startMenuItem.setPosition(cc.p(size.width/2, size.height/2));
        // NOTE: interesting spelling bug
        //startItem.setPosition(cc.p(size.width/2), size.height/2);
        this.tryAgainMenuItem = cc.MenuItemFont.create(
            'Try again',
            function () {
                cc.AudioEngine.getInstance().playEffect('res/Menu.wav');
                this.tryAgainMenuItem.setVisible(false);
                this.gameStart();
            },
            this
        );
        this.tryAgainMenuItem.setPosition(cc.p(size.width/2, size.height/2));
        this.tryAgainMenuItem.setVisible(false);

        var menu = cc.Menu.create(this.startMenuItem, this.tryAgainMenuItem, closeItem);
        menu.setPosition(cc.PointZero());
        this.addChild(menu, ZORDER_MENU);
        var lazyLayer = new cc.LazyLayer();
        this.addChild(lazyLayer, ZORDER_LAZY);

        var sprite = cc.Sprite.create("res/Background.png");
        sprite.setPosition(cc.p(size.width / 2, size.height / 2));

        lazyLayer.addChild(sprite, ZORDER_BACKGROUND);

        sprite = EggSprite.create();
        this.addChild(sprite, ZORDER_SPRITE);
        this.egg = sprite;
        this.setTouchEnabled(true);
        this.adjustSizeForWindow();
        lazyLayer.adjustSizeForCanvas();
        window.addEventListener("resize", function (event) {
            selfPointer.adjustSizeForWindow();
        });
        cc.AudioEngine.getInstance().playMusic('res/StartBackgroundMusic.mp3', true);
        return true;
    },
    tick: function() {
        var eggBoundBox = this.egg.getBoundingBoxToWorld();
        for (var i=0; i<this.getChildrenCount(); ++i) {
            var child = this.getChildren()[i];
            if (TAG_ENEMY == child.getTag()) {
                var enemyBoundBox = child.getBoundingBoxToWorld();
                if (cc.Rect.CCRectIntersectsRect(eggBoundBox, enemyBoundBox)) {
                    this.gameOver();
                    break;
                }
            }
        }
    },
    gameStart: function() {
        var size = cc.Director.getInstance().getWinSize();
        for (var i=0; i<this.pigs.length; ++i) {
            this.pigs[i].removeFromParent();
        }
        this.pigs = [];
        this.schedule(this.tick, 1/60);
        this.schedule(this.spawnOneWavePig, 2);
        this.egg.respawn(size.width/2, size.height/2);
        cc.AudioEngine.getInstance().playMusic('res/CombatBackgroundMusic.mp3');
    },
    gameOver: function() {
        this.unschedule(this.tick);
        this.unschedule(this.spawnOneWavePig);
        for (var i=0; i<this.getChildrenCount(); ++i) {
            var child = this.getChildren()[i];
            if (child.onGameOver) {
                child.onGameOver();
            }
        }
        this.scheduleOnce(function() {
            this.tryAgainMenuItem.setVisible(true);
        }, 7);
        this.scheduleOnce(function() {
            cc.AudioEngine.getInstance().playMusic('res/LevelFailedBackgroundMusic.mp3', false);
        }, 1.5);
    },
    spawnOneWavePig: function() {
        var $SAFE_DISTANCE = 20;
        var $MOVE_DURATION = 10;
        var $MAX_PIGS_PER_WAVE = 20;
        var pigNumber = Math.floor(Math.random() * $MAX_PIGS_PER_WAVE);
        var winSize = cc.Director.getInstance().getWinSize();
        var size = cc.size(winSize.width+$SAFE_DISTANCE*2, winSize.height+$SAFE_DISTANCE*2);
        for (var i=0; i< pigNumber; ++i) {
            var sprite = PigSprite.create();
            var edge = Math.floor(Math.random() * 10 % 4);
            var positionOnEdge = Math.random();
            var positionX, positionY, dstPositionX, dstPositionY;
            switch (edge) {
                case 0:
                    positionX = size.width * positionOnEdge;
                    positionY = 0;
                    break;
                case 1:
                    positionX = size.width;
                    positionY = size.height * positionOnEdge;
                    break;
                case 2:
                    positionX = size.width * positionOnEdge;
                    positionY = size.height;
                    break;
                case 3:
                default:
                    positionX = 0;
                    positionY = size.height * positionOnEdge;
                    break;
            }
            positionX -= $SAFE_DISTANCE;
            positionY -= $SAFE_DISTANCE;
            var eggPosition = this.egg.getPosition();
            var distance = Math.sqrt((eggPosition.x-positionX) * (eggPosition.x-positionX) + (eggPosition.y-positionY) * (eggPosition.x-positionY));
            var maxDistance = Math.sqrt(size.width*size.width + size.height*size.height);
            dstPositionX = positionX + (eggPosition.x-positionX) * maxDistance / distance;
            dstPositionY = positionY + (eggPosition.y-positionY) * maxDistance / distance;
            sprite.setPosition(cc.p(positionX, positionY))
            sprite.runAction(cc.Sequence.create(
                cc.MoveTo.create($MOVE_DURATION, cc.p(dstPositionX, dstPositionY)),
                cc.CallFunc.create(sprite.removeFromParent, sprite, null)
            ));
            this.addChild(sprite, ZORDER_SPRITE);
            this.pigs.push(sprite);
        }
    },
    adjustSizeForWindow:function () {
        var margin = document.documentElement.clientWidth - document.body.clientWidth;
        if (document.documentElement.clientWidth < cc.originalCanvasSize.width) {
            cc.canvas.width = cc.originalCanvasSize.width;
        } else {
            cc.canvas.width = document.documentElement.clientWidth - margin;
        }
        if (document.documentElement.clientHeight < cc.originalCanvasSize.height) {
            cc.canvas.height = cc.originalCanvasSize.height;
        } else {
            cc.canvas.height = document.documentElement.clientHeight - margin;
        }

        var xScale = cc.canvas.width / cc.originalCanvasSize.width;
        var yScale = cc.canvas.height / cc.originalCanvasSize.height;
        if (xScale > yScale) {
            xScale = yScale;
        }
        cc.canvas.width = cc.originalCanvasSize.width * xScale;
        cc.canvas.height = cc.originalCanvasSize.height * xScale;
        var parentDiv = document.getElementById("Cocos2dGameContainer");
        if (parentDiv) {
            parentDiv.style.width = cc.canvas.width + "px";
            parentDiv.style.height = cc.canvas.height + "px";
        }
        cc.renderContext.translate(0, cc.canvas.height);
        cc.renderContext.scale(xScale, xScale);
        cc.Director.getInstance().setContentScaleFactor(xScale);
    },
    onTouchesBegan:function (touches, event) {
        this.isMouseDown = true;
        this.egg.onTouchesBegan(touches, event);
    },
    onTouchesMoved:function (touches, event) {
        if (this.isMouseDown) {
            if (touches) {
                this.egg.onTouchesMoved(touches, event);
            }
        }
    },
    onTouchesEnded:function (touches, event) {
        this.isMouseDown = false;
        this.egg.onTouchesEnded(touches, event);
    },
    onTouchesCancelled:function (touches, event) {
        this.egg.onTouchesCancelled(touches, event);
    }
});

var GameScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var layer = new BraveEgg();
        layer.init();
        this.addChild(layer);
    }
});
