var cocos2dApp = cc.Application.extend({
    config: document['ccConfig'],
    ctor:function (scene) {
        this._super();
        this.startScene = scene;
        cc.COCOS2D_DEBUG = this.config['COCOS2D_DEBUG'];
        cc.initDebugSetting();
        cc.setup(this.config['tag']);
        cc.AudioEngine.getInstance().init();
        if (cc.Loader.preload) {
            cc.AppController.shareAppController().didFinishLaunchingWithOptions();
        }
        else { // older API
            cc.Loader.getInstance().onloading = function () {
                cc.LoaderScene.getInstance().draw();
            };
            cc.Loader.getInstance().onload = function () {
                cc.AppController.shareAppController().didFinishLaunchingWithOptions();
            };
            cc.Loader.getInstance().preload(PreloadResources);
        }
    },
    applicationDidFinishLaunching:function () {
        // initialize director
        var director = cc.Director.getInstance();
        // turn on/off display FPS
        director.setDisplayStats(this.config['showFPS']);

        // set FPS. the default value is 1.0/60 if you don't call this
        director.setAnimationInterval(1.0 / this.config['frameRate']);

        // create a scene, and run
        if (cc.Loader.preload) {
            cc.Loader.preload(PreloadResources, this.runStartScene, this);
        }
        else { // older API
            this.runStartScene();
        }
        return true;
    },
    runStartScene: function() {
        cc.Director.getInstance().replaceScene(new this.startScene());
    }
});
var myApp = new cocos2dApp(GameScene);
