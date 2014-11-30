/*
 * WEB++ v1.02
 * 模拟WEBQQ，尝试面向对象编程，实现代码异步流程控制和性能监测。
 * 
 * author：zjfeihu@126.com
 * 
 * 兼容 firefox, chrome, safari, opera, ie6+(ie6-7不完美支持)
 * 
 * */

!function(Z){

//程序入口
function main(debug){
    
    if(/debug=1/.test(location.search)){
        Calls.timeline(); //开启瀑布图
        debug = 1;
    }else if(!/debug=2/.test(location.search)){
        Calls.debug = false;
        debug = 2;
    }
    
    loading()
        .wait([
            Data, //数据中心，各模块数据来源
            Calls.async(Event), //观察者模型
            Calls.async(Body), //Body模块，需要使用Event
            Calls.async(Contextmenu), //右键菜单
            Calls.async(Command), //指令类
            Calls.async(Theme), //主题模块
            Calls.async(FPS), //页面性能监测工具
            App, //应用模块
        ])
        .wait([
            
            Sidebar, //侧边模块
            Taskbar, //任务栏模块
            Desktop, //桌面模块
        
        ])
        //所有任务都完成，最后进行页面渲染等操作
        .wait(function(){ ///complete
            Body.render();
            Body.layout(Data.CONFIG.layout);
            
            debug == 1 && FPS.start(); //开启性能监控
            
            
            window.WEBJJ = {
                version: 1.02,
                appmarket: { //对appmarket页面开放接口
                    Desktop: Desktop,
                    Data: Data,
                    App: App,
                    Calls: Calls 
                }
            };
            this.ready();
            
            //释放无用句柄
            FPS = null;
            Event = null;

            main = null;
            loading = null;
            
        })
        .done();
}


/* event.js v1.01 观察者模式事件模型
 * 用于给模块添加自定义事件接口，通过事件监听实现数据更新
 * 
 * 对外接口：
 * Event.extendTo(target) 扩展Event的接口到目标模块
 * 
 * 被扩展的模块拥有接口：
 * on(type, fn) 添加一个事件
 * un(type, fn) 移除一个事件
 * fire(type) 触发指定的事件
 * 
 * */

function Event(){
    
    Event = function(){
        //这里不采用原型模式是为了保护queue变量不被外部访问
        var
        stop = false,
        queue = {};
        
        this.on = function(type, fn){
            if(!queue[type]){
                queue[type] = [fn];
            }else{
                queue[type].push(fn);
            }
            return this;
        };
        
        this.un = function(type, fn){
            forEach(queue[type], function(iFn, i){
                if(iFn == fn){
                    iQueue.slice(i, 1); 
                }
            }, this);
            return this;
        };
        
        this.fire = function(type){
            var args = [].slice.call(arguments, 1);
            forEach(queue[type], function(fn){
                fn.apply(this, args);
                return stop;
            }, this);
            stop = false;
            return this;
        };
        
        this.stopEvent = function(){
            stop = true;
        };
    };

    //扩展接口到指定模块
    Event.extendTo = function(target){
        var 
        key,
        source = new Event;
        for(key in source){
            target[key] = source[key];
        }
    };
    
    function forEach(arr, fn, context){
        if(arr && arr.length){
            var item, i = 0;
            while(item = arr[i]){
                if(fn.call(context, item, i++)){
                    break; 
                }                    
            }                
        }
    }
    
}

/*
 * Calls.js v1.02
 * 程序流程控制模型
 * author: zjfeihu@126.com 
 * 
 *  异步串行： 
 *      Calls()
 *          .wait(f1)
 *          .wait(f2)
 *          .wait(f3)
 *          .done()
 * 
 *  异步并行：
 *      Calls()
 *          .wait(f1, f2, f3)
 *          .done()
 * 
 *  异步函数需要传递ready回调
 * 
 *  同步串行：
 *      Calls()
 *          .add(f1)
 *          .add(f2)
 *          .add(f3)
 *          .done()
 *      或者
 *      Calls()
 *          .add(f1, f2, f3)
 *          .done()
 *  接口：
 * 
 *      totalCount 队列中模块的个数
 *      
 *      readyCount 已经完成的模块个数
 *      
 *      add(fn, async, serial, name) 添加一个模块到队列，
 *          async设置异步，默认同步，
 *          serial设置并行， 默认串行，
 *          name当前函数显示名，默认是一个累加的数字
 *      比如：  add(fn) //添加一个匿名同步模块
 *              add(fn, true, false, 'fx') //添加一个异步并行模块
 *              add(f1, true, true, f2, true, true) //添加2个异步串行模块
 *      
 *      wait(fn, name) 添加异步模块
 *          name当前函数显示名，默认是一个累加的数字
 *      比如：  wait(fn) //添加一个匿名异步串行模块
 *              wait(f1, f2) //添加2个异步并行模块
 *              wait(f1).wait(f2) //添加2个串行模块      
 *      
 *      done(fn) 添加onDone函数并且启动Calls
 *       
 *      onReady(fn) 添加ready回调函数
 *          
 *      onEnd(fn) 添加end回调函数
 *         
 * 
 *  静态接口：
 * 
 *      async(fn, delay) 同步模块转异步模块 delay为延迟时间，delay >= 0时则实现延迟
 *      
 * */

function Calls(cname, debug){
    var 
    self,
    begintime = now(), //模块初始化开始时间
    takentime = 0, //模块线程阻塞时间
    
    cid = ++Calls.PID, //当前模块id
    modules = [],
    index, //当前队列位置
    thread = 0, //当前正在等待响应的并行异步线程数量
    lock = false, //串行线程锁
    
    onend, //模块被终止的回调函数
    ondone, //模块执行完成的回调函数
    onready; //单个模块完成的回调函数
    
    if(typeof cname != 'string'){
        cname = null;
    }
    
    if(!(cname === false || debug === false)){ //默认debug
        debug = Calls.debug;
        var 
        debug_onFire = debug.onFire,
        debug_onWait = debug.onWait,
        debug_onReady = debug.onReady,
        debug_onDone = debug.onDone;
        debug = null;
    }
    
    return self = {
        totalCount: 0,
        readyCount: 0,
        
        add: add,        
        wait: wait,    
        call: call,
        
        done: done,
        stop: stop,
        restart: restart,
        
        onReady: onReady,
        onEnd: onEnd
    };
    
    
    //添加模块
    function add(fn){
        var 
        args = /Array/.test({}.toString.call(fn)) ? fn : arguments,
        module = {};
        
        if(!+[1,] && args.length && args[args.length - 1] === undefined){ //需要手动忽视数组最后的空格,一般是ie浏览器
            args.length--;
        }

        forEach(args, function(arg){
            var type = typeof arg; 
            if(type == 'function'){ //添加fn
                if(arg === wait){
                    modules.push('LOCK');
                }else{
                    modules.push(module = {
                        fn: arg,
                        index: self.totalCount,
                        async: false, //默认同步
                        serial: true //默认串行
                    });
                    self.totalCount++;
                }
            }else if(arg === true){
                if(module.async == false){  //设置为异步模块
                    module.async = true;
                }
            }else if(arg === false){ 
                if(module.async == true){ //设置为并行模块
                    module.serial = false;
                }
            }else if(type == 'string'){ //添加info
                module.name = arg;
            }else if(type == 'undefined'){ //跳过
                if(!module.skip){
                    module.skip = true;
                    self.totalCount--;
                }
                
            }
            
        });
        return self;
    }
    
    function wait(fn){
        var 
        args = /Array/.test({}.toString.call(fn)) ? fn : arguments,
        fns = [];
        
        if(!+[1,] && args.length && args[args.length - 1] === undefined){
            args.length--;
        }
        
        forEach(args, function(arg){
            if(typeof arg == 'function'){
                fns.push(arg, true, false);
            }else if(/undefined|string/.test(typeof arg)){
                fns.push(arg);
            }
        });
        
        fns.push(wait); //并行异步线程，在最后添加wait作为阻断线程的标记

        add(fns);
        return self;
    }
    
   
    function call(fn){
        fn.apply(self, [].slice.call(arguments, 1));
        return self;
    }
    
    //启动Calls。并且添加完成的回调
    function done(callback){
        ondone = callback;
        
        if(self.readyCount > 0){
            forEach(modules, function(module){
                if(module.runtimes){
                    module.runtimes.length = 0;
                }
            });
            
        }
        self.readyCount = index = 0;

        if(self.totalCount == 0){
            fireDone();   
        }else{
            
            fireNext();
        }
    }
    
    function fireDone(){ 
        if(index == -1){ //被终止，无需执行ondone
            return;
        }
        
        debug_onDone && debug_onDone({
            begintime: begintime, //开始时间
            takentime: takentime, //阻塞时间
            cid: cid,
            cname: cname
        });
        ondone && ondone();
    }
    
    //调用下一个模块
    function fireNext(){
        var module = modules[index];
        
        if(module){
            if(module.skip){ //被跳过的模块
                index++;
                fireNext();
            }else if(module == 'LOCK'){ //锁定线程
                index++;
                if(thread){
                    lock = true;
                }
            }else if(!lock){
                fire(module);
            }
        }
    }
    
    function fire(module){
        index++;
        if(debug_onFire){
            
            module.cid = cid;
            module.cname = cname;
            module.fire = now();
            debug_onFire(module);
        }
        
        var context = {
            stop: stop,
            totalCount: self.totalCount,
            readyCount: self.readyCount
        };
        if(module.async){ //异步模块
            var isWait = true; //模块是否处于等待
            if(module.serial){ //串行的执行锁定
                lock = true;
            }else{
                ++thread;
            }
            context.ready = function(){
                if(module.serial || !module.serial && --thread == 0){ //完成串行或者无并行线程，则实现解锁
                    lock = false; 
                }
                
                if(isWait){
                    isWait = false;
                }else{
                    complete(module);  
                }
            };
            context.time = debug_onReady
                ? function(title){
                    if(!module.runtimes){
                        module.runtimes = [];
                    }
                    module.runtimes.push({
                        title: title,
                        value: now()
                    });
                }
                : noop;

            module.fn.call(context, context.ready);
            
            if(isWait){ //需要等待异步回调
                isWait = false;
                if(debug_onWait){
                    module.wait = now();
                    debug_onWait(module);
                }
            }else{ //无需回调即可完成
                complete(module);  
            }
            
            if(!module.serial){
                fireNext();
            }
        }else{ //同步模块，无需传递回调
            module.fn.call(context);
            complete(module);
        }
        
    }
    
    function complete(module){
        self.readyCount++;
        onready && onready();
        
        if(debug_onReady){
            
            module.ready = now();
            takentime += (module.wait || module.ready) - module.fire;
            debug_onReady(module);
            
        }

        if(self.totalCount == self.readyCount){
            fireDone();
        }else{
            fireNext();
        }
        
    }
    
    function stop(){
        index = -1; 
    }
    
    
    function restart(){
        
        done(ondone);
        return self;
    }
    
    function onEnd(callback){
        onend = callback;
    }
    
    function onReady(callback){
        onready = callback;
    }
    
    //like Array with forEach
    function forEach(arr, item){
        for(var i = 0, lg = arr.length; i < lg; i++){
            if(item.call(null, arr[i], i)){
                break;
            }
        }
    }
    
    function now(){
        return +new Date;
    }
    
    function noop(){
        
    }
    
}

Calls.PID = 0;
Calls.async = function(fn, delay){
    var fnWrapper = delay > -1
        ? function(){ //延迟
            var self = this;
            setTimeout(function(){
                self.time();
                fn.call(self);
                self.ready();
            }, delay);
        }
        : function(){
            fn.call(this);
            this.ready();
        };
    fnWrapper.__origin__ = fn;
    return fnWrapper; 
};
Calls.debug = {
    
    //调用模块时候的回调
    onFire: function(module){
        
    },
    
    //异步进入等待的回调
    onWait: function(module){
                
    },
    
    //模块就绪的回调
    onReady: function(module){
        
    },
    
    //所有模块都就绪的回调
    onDone: function(module){
          
    }
    
};

Calls.console = function(){ //console控制台模式调试
    var log = window.console && console.info ? function(msg){return console.info(msg);} : function(){};
    var log2 = function(str, id, time){
        var args = arguments;
        if(args.length > 1){
            log(str.replace(/%(\d+)/g, function(match, i){
                return args[i];
            }));
        }else{
            log(str);
        }
    };
    
    function getName(data){
        return (data.cname || data.cid) +'.'+ (data.name || data.index);
        
    }
    var inf = [];
    Calls.debug = {
        onFire: function(data){
            log2('%1.fire', getName(data));
        },
        onReady: function(data){
            log2('%1.ready %2ms', getName(data), data.ready - data.fire);
        },
        onDone: function(data){
            log2('%1.done %2ms', data.cname || data.cid, data.takentime);   
        }
    };
};

if(!/#/.test(function(){/*#*/})){
    Calls.debug = false;
}else{
    Calls.console();
}

/* FPS.js v1.01 页面性能监测
 * 
 * 对外接口：
 * start() 开始监测
 * stop() 停止监测
 * 
 * */

function FPS(){ ///FPS
    var
    TIME_INTERVAL = 15, //时间间隔
    DEFAULT_FPS = ~~(1000 / TIME_INTERVAL), //默认最大帧
    before,
    dots = [], //记录时间点
    thook, //定时器句柄
    showline = false,
    isrun = false,
    showHook,
    rootElem,
    fpsText,
    fpsBar,
    linebox,
    
    record = function(){
        var
        now = +new Date,
        begin = now - 1000,
        dot;
        while(dot = dots[0]){
            if(dot.time < begin){ //过滤掉1000ms之前的数据
                dots.shift();
            }else{
                break;
            }
        }

        dots.push({
            time: now,
            fps: 0|(1000/Math.max(TIME_INTERVAL, now - before))
        });
        before = now;

    },
    end;
    
    FPS = {
        start: function(){
            
            if(isrun){
                return;
            }
            if(!showHook){
                rootElem.show();
            }
            rootElem.css('border-color:');
            before = +new Date;
            thook = setInterval(record, 15);
            isrun = true;
            
            this._render();
            showHook = setInterval(this._render, 1000); 
            
        },
        
        stop: function(){
            rootElem.css('borderColor:red');
            clearInterval(thook);
            dots = [];
            isrun = false;
            
            clearInterval(showHook);
            linebox.innerHTML = '';
        },
        
        _render: function(){
            
            fpsText.innerHTML = dots.length+' FPS';
            fpsBar.innerHTML = '<div style="width:'+dots.length*2+'px"></div>';
            
            if(!showline){
                return;  
            }
            
            var 
            lineHtml = [],
            lineItem,
            i = 0;
            while(lineItem = dots[i++]){
                lineHtml.push('<div style="width:'+ (lineItem.fps * 2) +'px;"></div>');
            }
            linebox.innerHTML = lineHtml.join('');

        }
    };
    
    !function(FPS){
        Z.style([
            '.Zw_FPS{position:absolute;display:none;left:10px;top:10px;width:140px;line-height:12px;padding:8px;border:1px dashed #000;background:#eee;z-index:29999;}',
            '.Zw_FPS .fpsText{cursor:pointer;}',
            '.Zw_FPS .fpsBar{width:136px;height:6px;margin-top:4px;border:1px solid #ccc;cursor:pointer;overflow:hidden;}',
            '.Zw_FPS .fpsBar div{height:4px;margin:1px;background:#55a0ff;overflow:hidden;}',
            '.Zw_FPS .linebox{position:relative;}',
            '.Zw_FPS .linebox div{background:#999;margin:2px 0;height:4px;font-size:12px;;overflow:hidden;color:#eee;}',
        ]);
        rootElem = Z.elem('<div class="Zw_FPS"></div>')
        .append(fpsText = Z.elem('<span class="fpsText" title="点击切换状态"></span>').on('mousedown', function(evt){
            evt.stopPropagation();
            FPS[isrun ? 'stop' : 'start']();
        }).elem)
        .append(fpsBar = Z.elem('<div class="fpsBar"></div>').on('mousedown', function(evt){
            evt.stopPropagation();
            showline = !showline;
            linebox.innerHTML = '';
        }).elem)
        .append(linebox = Z.elem('<div class="linebox"></div>').elem) 
        rootElem.Drag();
        Z('body').append(rootElem);

    }(FPS);

}

/* common.js v1.02 一些通用的方法
 * 
 * 
 * */
 
var Common = {
    //简单处理鼠标滚轮事件
    /*
    mousewheel: function(el, fn){
        
        this.mousewheel = window.addEventListener 
            ? function(el, fn) {
                el.addEventListener(document.mozHidden !== undefined ? 'DOMMouseScroll' : 'mousewheel', function(evt) {
                    
                    evt.delta = evt.wheelDelta  //delta正值为向上滚动
                    ? evt.wheelDelta
                    : -evt.detail; //firefox 取detail
                    fn.call(this, evt);
                }, false);
            }
            : function(el, fn){
                el.attachEvent('onmousewheel', function(evt) {
                    evt = window.event;
                    evt.delta = evt.wheelDelta;
                    fn.call(el, evt);
                });  
            };
        this.mousewheel(el, fn);
    },
    */
    //将source数据拷贝到target上
    mix: function (target, source){
        for(var key in source){
            target[key] = source[key];
        }
    },
    
    //异步加载图标，必须通过Calls工具调用
    loadImgs: function (imgs){
        var calls = this;
        Z.each(imgs, function(img){
            calls.add(function(){
                //Z.img('css/imgs/'+ img, this.ready);
                Z.img('css/imgs/'+ img); this.ready();
            }, true, false, 'loadImgs.'+ img);
        });
    },
    
    //碰撞检测，检测坐标[x,y]是否落在panel里面
    inPoint: function(panel, position){
        var pl, pt, x = position.x, y = position.y;
        return !(
        x < (pl = panel.offsetLeft())
        || y < (pt = panel.offsetTop())
        || x > pl + panel.offsetWidth()
        || y > pt + panel.offsetHeight()
        );
    }
    
};


//loading.js v1.02 程序入口
function loading(){
    var
    calls = Calls('Main'),
    totalCount, //总任务数
    ondone;
   
    calls
        .wait(function(ready){ ///initLoading
            
            var
            rootElem = Z.elem('<div class="loading"><div class="loading-box"><div class="loading-bar"></div><span>loading...</span></div></div>'),        
            loadbar = rootElem.find('.loading-bar'),
            text = rootElem.find('span'),
            totalWidth, //进度条总宽度
            readyCount = 0; //当前完成的任务数
            
            calls.onReady(function(){
                var rate = 0;
                loadbar.Anim({width: totalWidth * ++readyCount / totalCount}, {
                    
                    onplay: function(){
                        rate = loadbar.width()*100 / totalWidth;
                        text.html(rate.toFixed(2) +'%');
                        
                    },
                    
                    ondone: function(){
                        if(rate == 100){ //全部加载完成
                            text.html('');
                            rootElem.Anim({opacity: 0}, {
                                ondone: function(){
                                    rootElem.remove();
                                    ondone && ondone();
                                }
                            }); 
                        }
                    }
                    
                });
            });
            
            
            Z(function(){
                Z('body').append(rootElem);
                totalWidth = loadbar.parent().width();
                ready();
            });
        });
   
   
    return {
        
        init: function(fns){
            var args = [];
            Z.each(fns, function(fn){
                if(typeof fn == 'function'){
                    args.push(fn);
                    args.push(getName(fn));
                }else if(typeof fn == 'string'){
                    args.push(fn);
                }else if(typeof fn == 'undefined'){
                    args.push(fn);  
                }
            });
            
            calls.wait(args);
            
            function getName(fn){
                var name = (''+ fn.__origin__ || fn).match(/^\w+\s+(\w+)/);
                return name ? name[1] +'.init' : '';
            }
            
            return this;
        },
        wait: function(){
            calls.wait.apply(calls, arguments);
            return this;
        },
        done: function(fireDone){
            totalCount = calls.totalCount;
            ondone = fireDone;
            calls.done();
        }
    };
}

/* data.js v1.01 数据中心
 * 为各模块提供数据
 * 
 * 参数说明：
 * appid 应用id
 * appver 应用版本号
 * ready 异步就绪的回调
 * 
 * 对外接口：
 * CONFIG 用户配置信息 
 * loadApp(appid, appver, ready) 从服务器获取应用的数据
 * saveApp(appid, appver, ready) 从服务器获取应用的数据并且添加到缓存中
 * getApp(appid, key) 获取指定app的数据，key为数据字段名
 * 
 * */

function Data(){ ///Data
    
    //数据缓存
    var 
    self,
    appsdata = {};
    
    //对外接口
    Data = self = {
        
        CONFIG: {},
        
        loadApp: function(appid, appver, ready){
            Z.get('apps/data/'+ Math.ceil(appid/1000) +'/'+ appid +'.json?' + appver, ready);
        },
        
        saveApp: function(appid, appver, ready){
            this.loadApp(appid, appver || '', function(appdata){
                if(appdata){
                    appdata.isReady = true;
                    appsdata[appid] = appdata;
                }
                ready(true); 
            });
        },
        
        getApp: function(appid, key){
            return appsdata[appid][key];
        }
    };
    
   
    //初始化
    Calls('Data')
        //加载配置数据
        .wait(function(ready){ ///loadConfig

            Z.get('apps/getconfig.json', function(result){
                if(result){
                    self.CONFIG  = result;
                    ready();
                }
            });
        })
        //初始化数据
        .add(function(){ ///laodAppsdata
            var 
            sidebarApps = self.CONFIG.sidebar.apps,
            desks = self.CONFIG.desktop.desks;
            
            Z.each(sidebarApps, function(app, i){
                appsdata[app.id] = app;
            });

            Z.each(desks, function(desk, i){
                var deskApps = desk.apps;
                Z.each(deskApps, function(app, i){
                    appsdata[app.id] = app;
                });
            });
        })
        .done(this.ready);

}

/*
 * Calls.timeline.js v1.01，异步编程流程控制瀑布图
 * 用于生成程序执行流程和监控异步线程的执行情况和性能数据
 * 
 * 初始化：
 *      Calls.timeline();
 * 
 * 公共接口：
 *      Calls.timeline.clear() 清除瀑布图
 * 
 * 引用依赖：
 *      Calls.js v1.01
 *      1k.js v1.01
 * 
 * 样式文件：
 *      Calls.css v1.01
 * 
 * author：zjfeihu@126.com
 * 
 * */

!function(Z){
    
    Calls.timeline = function(){
        var
        rootElem,
        bodyElem,
        modules = [],
        tempCalls = {}, //模块主体临时引用
        calls = {}, //模块引用
        end;
        
        Calls('create Calls.timeline', false)
            .add([
                //初始化html结构
                function(){ ///setHtml
                    rootElem = Z.elem('\
                    <div id="Calls_timeline">\
                        <div class="wrapper">\
                            <ul class="head">\
                                <li class="title">模块名称</li>\
                                <li class="clear">清除</li>\
                                <li class="toggle">隐藏</li>\
                                <li class="close">关闭</li>\
                            </ul>\
                            <ul class="body"></ul>\
                        </div>\
                        <div class="tips"></div>\
                    </div>');
                    bodyElem = rootElem.find('.body');
                },
                
                //绑定事件
                function(){ ///setEvent
                
                    //给功能按钮绑定事件
                    rootElem.find('.head').click(function(evt){
                        var
                        target = evt.target,
                        clsName = target.className;
                        
                        if(clsName == 'clear'){
                            clear();
                        }else if(clsName == 'toggle'){
                            if(target.innerHTML == '隐藏'){
                                target.innerHTML = '显示';
                            }else{
                                evt.target.innerHTML = '隐藏';
                            }
                            rootElem.cls('~hide');
                        }else if(clsName == 'close'){
                            rootElem.remove();
                        }
                        
                    });
                
                    //绑定控制提示层的事件
                    var 
                    tips = rootElem.find('.tips');
                    rootElem.on('mousemove', function(evt){
                        delayRun('mousemove', function(){
                            var module = function(){
                                var li = Z(evt.target).parent('li');
                                if(li){
                                    return modules[li.attr('index')];
                                }
                            }();
                            tips.hide(); 
                            if(module){

                                
                                var 
                                top = evt.clientY + 4 - rootElem.offsetTop(),
                                left = evt.clientX + 4,
                                tipsHtml = [];
                                
                                if(module.index > -1){ //子模块就绪信息
                                    tipsHtml.push('<div class="title">【加载模块'+(module.cid + '.' + module.index)+'】</div>');
                                    Z.each(module.timesCache, function(time){
                                        if(time.runtime > -1){
                                            tipsHtml.push('<div class="runtime">执行代码：'+ time.runtime +'ms'+(time.title ? '【'+time.title+'】' : '')+'</div>');
                                        }else if(time.waittime > -1){
                                            tipsHtml.push('<div class="waittime">等待响应：'+ time.waittime +'ms'+(time.title ? '【'+time.title+'】' : '')+'</div>');
                                        }
                                        
                                    });
                                    
                                    if(module.ready){ 
                                        tipsHtml.push('<div class="">总计耗时：'+(module.ready - module.fire)+'ms</div>');
                                    }else{ //异步的ready未触发
                                        tipsHtml.push('<div>加载中...</div>');
                                        
                                    }
                                }else{
                                    
                                    tipsHtml.push('<div class="title">【模块'+(module.cid)+'加载完成】</div>\
                                    <div>线程阻塞：'+(module.runtime)+'ms</div>\
                                    <div>加载时间：'+(module.ready - module.fire)+'ms</div>');
                                    
                                }
                                
                                tips.html(tipsHtml);
                                tips.show();
                                
                                left = Math.min(left, rootElem.offsetWidth() - tips.offsetWidth() - 8);
                                top = Math.min(top, rootElem.offsetHeight() - tips.offsetHeight() -8);
                                
                                tips.css({left: left, top: top});
                                
                            }
                        }, 50);
                    });
                
                },
                
                //重写debug接口
                function(){ ///setDebug
                    Calls.debug = {
                        
                        onFire: function(module){
                            delayRun('onReady');
                            modules.push(module);
                            module.positionIndex = modules.length - 1; //在modules中的位置 
                            if(!tempCalls[module.cid]){
                                tempCalls[module.cid] = {
                                    fire: module.fire,
                                    cid: module.cid,
                                    cname: module.cname,
                                    moduleIndexs: [],
                                    runtime: 0
                                }; 
                                
                            }
                        },
                        
                        onWait: function(module){
                              
                        },
                        
                        onReady: function(module){

                            if(!module.name){
                                var 
                                fnStr = (module.fn.__origin__ || module.fn).toString(),
                                name = fnStr.match(/(?:^.+?\/\/\/([\w.]+)|^function\s+([\w$]+))/);
                                
                                if(name){
                                    module.name = name[1] || name[2];
                                }
                            }

                            var nowModule = modules[module.positionIndex] = { //与module断开
                                cid: module.cid,
                                cname: module.cname,
                                name: module.name,
                                index: module.index,
                                fire: module.fire,
                                ready: module.ready
                                
                            };
                            if(module.runtimes){
                                nowModule.runtimes = module.runtimes;
                                module.runtimes = [];
                            }
                            if(module.wait){
                                nowModule.wait = module.wait;
                            }
                 
                            delayRun('onReady', renderLine, 15);
                        },
                        
                        onDone: function(calls){
                            var 
                            nowCalls = tempCalls[calls.cid];
                            nowCalls.ready = now();
                            modules.push(calls[modules.length - 1] = nowCalls);
                            //tempCalls[calls.cid] = null; //从临时队列中清除
                            
                            
                            delayRun('onReady', renderLine, 15);
                        }
                        
                    };
                
                }
                
            
            ])
            .wait(function(ready){ ///render
                Z(function(){
                   Z('body').append(rootElem);
                   ready(); 
                });
            })
            .done();
        
        
        Calls.timeline.clear = clear;
        function clear(){
            bodyElem.html('');
            modules = [];
            tempCalls = {};
            calls = {};
            Calls.PID = 0;
        }
        
        //自动清理time时间内的回调
        function delayRun(name, fn, time){
            var list = delayRun.list;
            if(!list){
                list = delayRun.list = {};
            }
            
            if(list[name]){
                clearTimeout(list[name].hook);
            }
            
            if(!fn){
                return;
            }
            list[name] = {
                hook: setTimeout(function(){
                    fn();
                    list[name] = null;
                }, time)
            };
            
        }
        
        function renderLine(){

            var
            datas = modules,
            module,
            i = 0,
            title,
            lineHtmls = [], //时间线html容器 
            beginTime = datas[0].fire, //模块开始执行的时间
            totalTime = Math.max(1, (datas[datas.length-1].ready || now()) - beginTime) * 1.01, //总花费时间
            marginLeft, //时间线起点
            minWidth = 1 / (rootElem.offsetWidth() - 300), //时间线的最小宽度
            timesCache,
            prevtime,
            moduleWait,
            moduleReady,
            hasWaitTime, //判断是否已经生成等待时间
            htmls = [],
            end;
            while(module = datas[i]){
                //tempCalls
                
                marginLeft = 100 * (module.fire - beginTime) / totalTime;
                module.timesCache = timesCache = [];
                if(module.index > -1){ //模块时间线，通过index属性来识别
                    
                    moduleWait = module.wait;
                    moduleReady = module.ready;
                    
                    
                    
                    prevtime = module.fire;
                    if(moduleWait){ //异步模块，有等待响应的时间线

                        
                        if(module.runtimes){
                            hasWaitTime = false;

                            if(moduleWait < module.runtimes[0].value){
                                timesCache.push({
                                    runtime: moduleWait - module.fire
                                    
                                });
                                prevtime = moduleWait;
                            }
                            
                            //分析模块的执行时间，runtimes为调用self.time('标题')打点所得
                            Z.each(module.runtimes, function(runtime){
                                
                                var value = runtime.value;
                                if(value < moduleWait || hasWaitTime){
                                    timesCache.push({
                                        title: runtime.title,
                                        runtime: value - prevtime
                                    });
                                }else{
                                    timesCache.waittime = value - moduleWait;
                                    timesCache.push({
                                        waittime: timesCache.waittime
                                    });
                                     
                                    hasWaitTime = true;
                                }
                                prevtime = value;
                            });
                            if(moduleReady){
                                timesCache.push({ runtime: moduleReady - prevtime });
                                
                            }
                            
                        }else{
                            
                            timesCache.waittime = moduleWait - module.fire;
                            
                            timesCache.push({
                                runtime: timesCache.waittime
                            }); 
                            if(moduleReady){
                                timesCache.push({ waittime: moduleReady - moduleWait });
                                
                            }
                            
                        }
                    }else{ //同步模块，无需处理等待时间   

                        if(module.runtimes){
                            Z.each(module.runtimes, function(runtime){
                                var value = runtime.value;
                                timesCache.push({
                                    title: runtime.title,
                                    runtime: value - prevtime
                                });
                                prevtime = value;
                            });
                        }else{                            
                            
                            timesCache.push({ 
                                runtime: moduleReady - prevtime
                            }); 
  
                        }
                        
                    }
                
                
                    title = [module.cname || module.cid, module.name || module.index].join('.');
                    
                    htmls.push('<li index="'+ i +'">');
                    htmls.push('<div class="title">'+ (Array(module.cid).join('&nbsp;&nbsp;'))+ title +'</div>');
                    htmls.push('<div class="wrapper"><div class="linebox">');
                    
                    

                    htmls.push('<span class="runtime" style="margin-left:'+ marginLeft +'%;width:'+ percentWidth(timesCache[0].runtime) +'"></span>');
                    

                    var nowCalls = tempCalls[module.cid];
                    

                    var clsName, time, value;
                    for(var j = 0; j < timesCache.length; j++){
                        time = timesCache[j];
                        
                        if(time.runtime > -1 || time.readytime > -1 || j == 0){
                            clsName = 'runtime';
                            value = time.runtime;
                            if(nowCalls){
                                if(!nowCalls.moduleIndexs[module.index]){
                                    nowCalls.moduleIndexs[module.index] = {};
                                    
                                }
                                if(!nowCalls.moduleIndexs[module.index][j]){
                                    nowCalls.moduleIndexs[module.index][j] = true;
                                    nowCalls.runtime += value
                                }
                                
                            }
                            if(j ==0){
                                continue;
                            }

                        }else if(time.waittime > -1){
                            clsName = 'waittime';
                            value = time.waittime;

                        }else{
                            continue; 
                        }
                         
                        htmls.push('<span class="'+ clsName +'" style="width:'+ percentWidth(value) +'"></span>');
                        
                    }

               
                    
                    if(moduleReady){
                        htmls.push('<span class="takentime">'+ (moduleReady - module.fire) +'ms</span>');
                        
                        
                       
                        
                    }else{
                        htmls.push('<span class="takentime">loading...</span>');
                    }
                    
                    htmls.push('</div></div>');
                    htmls.push('</li>');
                
                    
                    
                
                
                }else{ //模块总时间线
                

                    htmls.push('<li index="'+ i +'">');
                    htmls.push('<div class="title" style="color:#d18b7c">'+ (Array(module.cid).join('&nbsp;&nbsp;'))+ (module.cname||module.cid) +'.done</div>');
                    htmls.push('<div class="wrapper"><div class="linebox">');

                    htmls.push('<span class="blocktime" style="width:'+percentWidth(module.runtime)+';margin-left:'+ marginLeft +'%"></span>');
                    htmls.push('<span class="loadtime" style="width:'+percentWidth(module.ready - module.fire - module.runtime)+'"></span>');
                    htmls.push('<span class="takentime">'+(module.ready - module.fire)+'ms</span>');
                    
                    htmls.push('</div></div>');
                    htmls.push('</li>');
                    tempCalls[module.cid] = null; //用完了清除
                }
                i++;
              
                
            }
            //渲染时间线
            bodyElem.html(htmls);

            function percentWidth(time){
                return 100 * Math.max(time / totalTime, minWidth) + '%';
            }
        }
        
        
        function now(){
            return +new Date;
        }
    };
    
}($1k);

/*
 * Zw_Win.js v1.01 窗口组件 
 * 
 * 公共接口： 
 * title(text) 设置标题
 * content(html) 设置内容
 * size(width, height) 设置尺寸,比如.size(0, 100)只支持单位px，并且必须大于0，百分比意义不大
 * position(x, y) 设置位置 .position(100, 100)
 * left(x) 单独设置left
 * top(y) 单独设置top
 * show() 显示
 * hide() 隐藏
 * focus() 激活为最上层窗口
 * toggle() 切换
 * close() 销毁窗口
 * maximize() 最大化
 * normal() 最小化
 * isFocus() 判断是否为最上层窗口
 * 
 * 
 * */

!function(Z){
    
Z.widget('Win', {
    _MAX_WIDTH: -1,
    _MIN_WIDTH: 160,
    _MAX_HEIGHT: -1,
    _MIN_HEIGHT: 26,
    _CONFIG: {
        title: 'noName',
        content: 'noContent',
        width: 800,
        height: 400,
        resizeable: true, //是否可改变大小
        minimizeable: true, //是否可最小化
        dragable: true, //是否可改拖动
        parent: null, //窗口的父容器
        closeEvent: null, //关闭回调
        maximizeEvent: null, //最大化回调
        minimizeEvent: null, //最小化回调
        focusEvent: null, //窗口获得焦点回调
        masklayer: null, //当容器内容中存在iframe且设置为可拖动或者可改变大小时，自动添加遮罩层
        end: null
    },
    
    //公共接口，title,content,size,position,show,hide,focus,toggle,close,maximize,normal,isFocus
    
    init: function(options){
        options = options || {};
        //将配置数据复制到对象的私有属性中，根据_CONFIG进行过滤
        Z.each(this._CONFIG, function(val, key){
            this['_'+ key] = key in options ? options[key] : val;
        }, this);
        

        
        /*私有属性
            this._rootElem = null; //根节点
            this._titlebarElem = null; //标题栏
            this._titleElem = null; //标题容器
            this._btnElem = null; //功能按钮容器
            this._contentElem = null; //内容容器
            //this._EventFns = null; //储存用于绑定的事件函数
            this._visible = null; //是否可见状态
            this._drag = null; //拖动句柄
            this._lockMasklayer = null; //拖动和改变大小时锁定masklayer显示
        */
        
        this._setHtml();
        this._setEvent();
        this._setResize();
        this._setDrag();
        this.size(this._width, this._height);
        this.content(this._content);
        Z(this._parent || document.body).append(this._rootElem);
        this.show();

    },

    _setHtml: function(){
            
        this._rootElem = Z.elem('<div class="Zw_Win"></div>');
        this._titlebarElem = Z.elem('<div class="titlebar"></div>');
        this._titleElem = Z.elem('<h4>'+ this._title +'</h4>');
        this._btnElem = Z.elem('<ul><li class="close"></li>'+(this._minimizeable? '<li class="minimize"></li>':'')+'</ul>');
        this._contentBoxElem = Z.elem('<div class="contentbox"></div>');
        this._contentElem = Z.elem('<div class="content"></div>');
        
        if(this._masklayer){
            this._masklayer = Z.elem('<div class="masklayer"></div>');
            this._contentBoxElem.append(this._masklayer);
        }
        
        this._contentBoxElem.append(this._contentElem);
        
        this._titlebarElem
            .append(this._titleElem)
            .append(this._btnElem);
        this._rootElem
            .append(this._titlebarElem)
            .append(this._contentBoxElem);
            
    },
    
    //绑定标题栏按钮事件
    _setEvent: function(){
        var 
        self = this,
        isMaximize = false;
        
        this._rootElem.on('mousedown', function(){
            self.focus();
        });
        
        if(this._masklayer){
            this._rootElem.hover(function(){
                if(!self._lockMasklayer && self == self.constructor._focusWin){
                    self._masklayer.hide();
                }
                
            }, function(){
                self._masklayer.show();
            });
            self._masklayer.click(function(){
                self._masklayer.hide();
            });
            
        }
        
        this._titlebarElem.on('mousedown', function(){
            self.focus();
        }).on('dblclick', function(){
            
            if(!self._resizeable){
                return;
            }

            if(isMaximize){
                isMaximize = false;
                self.normal();
            }else{
                isMaximize = true;
                self.maximize();
            }
            
        });

        this._btnElem.on('click', function(evt){
            
            evt.target.className.replace(/(close)|(minimize)|(maximize)|(normal)/, function(match, $1, $2, $3, $4){
                switch(!1){
                    case !$1: self.close();break;
                    case !$2: self.hide();break;
                    case !$3: self.maximize();break;
                    case !$4: self.normal();break; 
                }
            });

        }).on('mousedown',function(evt){
            self.focus(); 
            evt.stopPropagation();
        });
        
    },
    
    _setResize: function(){
        if(!this._resizeable){
            return;
        }
        
        var
        self = this,
        rootElem = this._rootElem,
        minWidth = this._MIN_WIDTH,
        minHeight = this._MIN_HEIGHT,
        resizebox, //拖动句柄容器
        direction, //拖动方向
        resize, //拖动函数
        clientX,
        clientY,
        
        //容器初始数据
        top0,
        left0,
        width0,
        height0,
        
        end;
        
        
        this._rootElem.append(resizebox = Z.elem('<ul class="resizebox"><li class="n"></li><li class="w"></li><li class="e"></li><li class="s"></li><li class="nw"></li><li class="ne"></li><li class="sw"></li><li class="se"></li></ul>'));
        this._btnElem.append([
            '<li class="maximize"></li>',
            '<li class="normal"></li>'
        ], 1);
        
        resizebox.on('mousedown', function(evt){

            evt.preventDefault(); //chrome下禁止文本选择
            self.focus();
            
            clientX = evt.clientX;
            clientY = evt.clientY;
            direction = evt.target.className;
            
            top0 = rootElem.top();
            left0 = rootElem.left();
            width0 = rootElem.width();
            height0 = rootElem.height();
            
            self._masklayer && self._masklayer.show() && (self._lockMasklayer = true);
            
            Z(document).on('mousemove', resizing);
            Z(document).on('mouseup', unresize);
            
        });
        
        resize = {
            n: function(e){
                var 
                top = top0 + e.clientY - clientY,
                height = height0 - (e.clientY - clientY);
                if(top < 0){
                    height += top;
                    top = 0;
                }else if(height < minHeight){
                    top += height - minHeight;
                    height = minHeight;
                }
                rootElem.top(top);
                rootElem.height(height);
            },
            w: function(e){
                var 
                left = left0 + e.clientX - clientX,
                width = width0 - (e.clientX - clientX);
                if(width < minWidth){
                    left += width - minWidth;
                    width = minWidth;
                }
                rootElem.left(left);
                rootElem.width(width);
            },
            e: function(e){
                var width = width0 + (e.clientX - clientX);
                if(width < minWidth){
                    width = minWidth;
                }
                rootElem.width(width);
            },
            s: function(e){
                var height = height0 + (e.clientY - clientY);
                if(height < minHeight){
                    height = minHeight;
                }
                rootElem.height(height);
            },
            nw: function(e){this.n(e); this.w(e);},
            ne: function(e){this.n(e); this.e(e);},
            sw: function(e){this.s(e); this.w(e);},
            se: function(e){this.s(e); this.e(e);}
        };
        
        function resizing(evt){
           
            window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty();
            resize[direction](evt);
        }
        function unresize(){
            Z(document).un('mousemove', resizing);
            Z(document).un('mouseup', unresize);
            self._masklayer && self._masklayer.hide() && (self._lockMasklayer = false);
            
        }

        
    },
    
    _setDrag: function(){
        
        if(!this._dragable){
            return;
        }
        var 
        self = this,
        rootElem = self._rootElem,
        docHeight;

        self._drag = rootElem.Drag({
            hand: self._titlebarElem.elem,
            range: 0,
            before: function(){
                self._masklayer && self._masklayer.show() && (self._lockMasklayer = true);
                
                docHeight = Z('body').offsetHeight();

            },
            runing: function(){
                var
                offsetTop = rootElem.offsetTop(),
                top;
                
                if(offsetTop < 0 || offsetTop > docHeight - 26){
                    top = rootElem.top() - offsetTop;
                    if(offsetTop > 0){ //超出界面底部
                        top += docHeight - 26;
                    }
                    rootElem.top(top);
                }
            },
            after: function(){
               self._masklayer && self._masklayer.hide() && (self._lockMasklayer = false);
            }
        });
        
    },
    
    title: function(text){
        if(text){
            this._title = text;
            this._titleElem.html(text);
        }else{   
            return this._title;
        }
    },
    
    content: function(html){ 
        if(typeof html != 'undefined'){
            this._content = html;
            if(typeof html == 'object' && html.nodeType == 1){
                this._contentElem.append(html);
            }else{
                this._contentElem.html(html);
            }
        }else{
            return this._content;
        }
    },
    
    size: function(width, height){
        if(width > 0){
            this._rootElem.width(Math.max(width, this._MIN_WIDTH));
        }else if(typeof width == 'string'){
            this._rootElem.width(width);
        }
        
        if(height > 0){
            this._rootElem.height(Math.max(height, this._MIN_HEIGHT));
        }else if(typeof height == 'string'){
            this._rootElem.height(height);
        }
 
    },
    
    position: function(x, y){
        if(x || x === 0){
            this._rootElem.left(x);
        }
        if(y || y === 0){
            this._rootElem.top(y);
        }
    },
    
    left: function(x){
        this._rootElem.left(x);
    },
    
    top: function(y){
        this._rootElem.top(y);
    },
    
    show: function(){
        if(!this._visible){
            this._visible = true;
            this._rootElem.show();
        }
        this.focus();
    },

    hide: function(){
        if(this._visible){
            this._visible = false;
            this._rootElem.hide();
            this._minimizeEvent && this._minimizeEvent();
        }
    },
    
    focus: function(){
        if(!this.isFocus()){
            this.constructor._focusWin = this;
            this._rootElem.css('zIndex', ++this.constructor._zIndex);
            this._focusEvent && this._focusEvent.call(this);
        }
    },
    
    close: function(){
        this._unFoucs();
        this._closeEvent && this._closeEvent.call(this);
        this._rootElem.remove();
    },
    maximize: function(){
        this._rootElem.cls('+status_maximize');
        this._drag && this._drag.lock();
        this._maximizeEvent && this._maximizeEvent();
    },
    normal: function(){
        this._rootElem.cls('-status_maximize');
        this._drag && this._drag.unlock();
    },
    
    toggle: function(){
        this._visible ? this.hide() : this.show();
    },
    
    isFocus: function(){
        return this.constructor._focusWin == this;
    },
    
    isShow: function(){
        return this._visible;
    },
    
    _unFoucs: function(){
        if(this.isFocus()){
            this.constructor._focusWin == null;
        }
    },
    
    
    VERSION: 1.01
}, 
//静态读写属性，类公用
{
    ver: 1.02,
    _zIndex: 1000, //窗口起始zIndex
    _focusWin: null //当前激活的窗口
});    
    

}($1k); 
 
/* body.js v1.02 程序body封装
 * 
 * 对外接口：
 * 注：elem为$1k的包装节点
 * 
 * layout(position) //调用页面布局
 * add(elem, flag) //添加节点到body中，flag为true时为立即添加，否则为添加到缓存池中
 * addNow(elem) //立刻添加节点到body中
 * render() //输出缓存池中的节点
 * getWidth() //获取Body宽度
 * getHeight() //获取Body高度
 * 
 */

function Body(){
    var 
    elems = [],
    ZBody = Z('body'),
    layoutValue;
    Body = {
        
        layout: function(position){
            if(!position){
                return layoutValue;
            }else if(layoutValue == position){
                return;
            }
            ZBody.cls('-layout-'+layoutValue).cls('+layout-'+ (layoutValue = position) );
            Body.fire('layout', position); //触发body的layout事件
        },
        
        add: function(elem, flag){
            elem = elem.rootElem ? elem.rootElem : elem;
            if(flag){
                ZBody.append(elem);
            }else{
                elems.push(elem);
            }
            return this;
        },
        
        addNow: function(elem){
            this.add(elem, true);
            return this;
        },
        
        render: function(){
            if(elems.length){
                var fragment = document.createDocumentFragment();
                Z.each(elems, function(item){
                    fragment.appendChild(item.elem);
                });
                document.body.appendChild(fragment);
                elems.length = 0;
            }

        },

        getWidth: function(){
            return ZBody.width();
        },
        
        getHeight: function(){
            return ZBody.height();
        }
    };
    Event.extendTo(Body);
    
}

/* theme.js v1.02 系统主题模块
 * 
 * 
 * */

function Theme(){ ///Theme
    var
    self,
    BGPIC = [
        'bg_01.jpg',
        'bg_02.jpg',
        'bg_03.jpg',
        'bg_04.jpg',
        'bg_05.jpg',
        'bg_06.jpg',
        'bg_07.jpg',
        'bg_08.jpg',
        'bg_09.jpg',
        'bg_10.jpg',
        'bg_11.jpg',
        'bg_12.jpg'
    ];
  
    
    //对外接口
    Theme = self = {
        deskbg: function(imgsrc){
            Z('body').css('background:url(css/bgpic/big/'+imgsrc+') center center');
        }
        
    };
    
    //初始化
    !function(){

        self.deskbg(BGPIC[(Math.random()*12)|0]);

        var 
        styleElem = function(){
            var 
            html = [];
            html.push('<div class="Style-bigpic-list"><ul>');
            Z.each(BGPIC, function(imgname){
                html.push('<li imgname="'+imgname+'"><img src="css/bgpic/small/'+imgname+'"/></li>');
            })
            html.push('</ul></div>');
            return Z.elem(html.join(''));
        }(),
        app = {name:'Theme'};
        
        
        styleElem.find('li').click(function(){
            self.deskbg(this.attr('imgname'));
        });
       
        Command.add({
            openStyleWin: function(){
                if(!app.window){
                    Desktop.currentDesk().openWindow(app, {
                        title: '设置主题',
                        content: styleElem.elem,
                        size: [674, 430],
                        resizeable: false,
                        minimizeable: false,
                        closed: function(){
                            Desktop.currentDesk().closeWindow(app);
                        }
                    });

                }else{ //已经显示，则判断位置。不在当前桌面，则切到目标桌面
                    if(app.windowPlace != Desktop.currentDesk()){
                        Desktop.toggle(app.windowPlace.index);
                        
                    }
                }
                app.window.show();
                
            }
        });

        
    }();

    
}

/* app.js v1.02 App(应用）模块
 * 
 * 对外接口：
 * id 应用的id，即appid
 * 
 * 
 * */

function App(){
    var apps = {};
    
    function self(appid){
        //给App.agent(app)创建快捷方式，使用App(app)即可
        if(appid.constructor == self){
            return self.agent(appid);
        }
        //从缓存中获取
        if(apps[appid]){
            return apps[appid];
        }
        apps[this.id = appid] = this;
        
        /*
            this.id = null; //应用的id，即appid
            this._waitOpen = false; //是否正在打开
            this.window = null; //应用窗口
            this.windowPlace = null; //应用窗口所在的容器引用
            this.iconElem = null; //图标节点引用
            this.iconPlace = null; //图标所在容器的引用
            this.iconIndex = null; //图标在容器中的位置
        */
        
        this._setHtml();
        this._setContextmenu();
        this._setDrag();
    }
    App = self;
    self.temp = {};
    
    Calls('App')
    //加载图片素材
    .call(Common.loadImgs, ['appbutton_mouseover_bg3.png', 'appbutton_mouseover_bg4.png'])
    .add([
    
    //绑定接口
    //绑定静态接口
    function(){ ///API.static
        Common.mix(self, {
            
            //设置app代理，使得app的某些操作通过App来传递
            agent: function(app){
                self.app = app;
                return self;
            },
            
            rebuidIconIndex: function(apps){
                Z.each(apps, function(app, index){
                    app.iconIndex = index;
                }); 
            },
            
            hasAdd: function(appid){
                return apps[appid]
            }
        });
        //添加监听者API
        Event.extendTo(self);
    },
    //绑定公共接口
    function(){ ///API.public
        
        Common.mix(self.prototype, {
            
            constructor: self,
            
            //从数据中心获取App对应字段的数据
            data: function(key){
                return Data.getApp(this.id, key);
            },
            
            //获取icon图标地址
            iconUrl: function(){
                //return 'apps/icon/'+this.id+'.png';
                //return 'http://0.web.qstatic.com/webqqpic/pubapps/'+(~~(this.id/1000))+'/'+this.id+'/images/big.png';
                return 'http://'+(~~(Math.random()*10))+'.web.qstatic.com/webqqpic/pubapps/'+(~~(this.id/1000))+'/'+this.id+'/images/big.png';
            },
            
            open: function(){

                if(Z('.showAppManagerPanel')){ //管理模式禁止打开
                    return;
                }
                var that = this;
                if(that.data('isReady')){
                    var exinfo = that.data('exinfo');
                    if(!that.window){

                        self(that).fire('openWindow', {
                            title: that.data('name'),
                            size: [exinfo.width, exinfo.height],
                            content: that.data('url'),
                            resizeable : exinfo.resizeable === 0 ? false : true,
                            closed: function(){
                                self(that).fire('closeWindow');
                            },
                            focused: function(){
                                self(that).fire('focusWindow');
                            }
                        });
                    }else{
                        that.window.show();
                    }
                }else{
                    if(that._waitOpen){ //等待打开中
                        return;   
                    }
                    that._waitOpen = true;
                    Data.saveApp(that.id, that.data('ver'), function(result){
                        if(result){
                            that.open();
                        }else{
                            alert('打开失败');
                        }
                        that._waitOpen = false;
                    }); 
                }
                
            },
            
            focus: function(){
                
                self(this).fire('focusWindow');
                this.window.show(); 
                
            },
            
            end: 0
            
        });
        
    },
    //绑定私有接口
    function(){ ///API.private
    
        Common.mix(self.prototype, {
            
            //创建图标html
            _setHtml: function(){
                this.iconElem = Z.elem('<div class="app-icon"><img onerror="this.onerror=null;this.src=\'css/imgs/default.png\';" src="'+this.iconUrl()+'"/><span>'+this.data('name')+'</span></div>').click(this.open, this);
            },
            
            //右键菜单
            _setContextmenu: function(){
                var 
                submenuItems = [ //子菜单内容数据引用，独立引用便于操作
                    {text: '桌面1', command: 'moveAppTo1'},
                    {text: '桌面2', command: 'moveAppTo2'},
                    {text: '桌面3', command: 'moveAppTo3'},
                    {text: '桌面4', command: 'moveAppTo4'},
                    {text: '桌面5', command: 'moveAppTo5'}
                ],
                contextmenuItems = [ //右键菜单内容数据
                    {text: '打开应用', icon:'1', command: 'openApp'},
                    '-',
                    {text: '移动应用', submenu: submenuItems},
                    {text: '卸载应用', command: 'removeApp'}
                ],
                contextmenu = new Contextmenu;
                
                return function(that){
                    that = this;
                    that.iconElem.on('contextmenu', function(evt){
                        evt.preventDefault();
                        evt.stopPropagation();
                        
                        Z.each(submenuItems, function(menuitem, i){
                            menuitem.status = '';
                        });
                        
                        self(that).fire('contextmenu', submenuItems); //触发右键菜单事件，某些模块会影响submenu的属性
                        contextmenu.render(contextmenuItems).show(evt.clientX, evt.clientY, that);
                    }).on('mousedown', function(){ //drag阻止事件冒泡，这里添加菜单隐藏逻辑
                        contextmenu.hide();
                    });
                }
            }(),
            
            //设置拖动
            _setDrag: function(){
                var 
                that = this,
                iconElem = that.iconElem;
                
                iconElem.Drag({
                    before:function(){
                        if(Z.browser.ie && Z.browser.ie < 9){ //修正ie下的hover bug，鼠标离开还处于over状态
                            iconElem.cls('+fixhover');
                        }                    
                        iconElem.opacity(.6);
                        self(that).fire('dragBefore');
                    },
                    after: function(evt){
                        if(Z.browser.ie && Z.browser.ie < 9){ //修正ie下的hover bug，鼠标离开还处于over状态
                            iconElem.on('mouseover', fixhover);
                            function fixhover(){
                                iconElem.un('mouseover', fixhover);
                                iconElem.cls('-fixhover');
                            }
                        }  
                        
                        iconElem.opacity(null);
                        self(that).fire('drop', { //获取放置的位置
                            x: evt.clientX,
                            y: evt.clientY
                        });
                    },
                    runing: function(evt){
                        self(that).fire('draging', evt.clientX, evt.clientY);
                        
                    },
                    clone:1,
                    range:0
                });
                
            },
            
            end: 0
        });
        
    },
    
    //图标状态改变监听器
    function(){ ///listener
        
        //图标添加时触发
        self.on('add', function(iconPlace, iconIndex){
            var app = this.app;
            if(app.iconPlace){
                app.iconPlace.removeApp(app);
            }
            app.iconPlace = iconPlace;
            app.iconIndex = iconIndex;
            self.fire('change', 'add');
        });
        
        self.on('remove', function(clearCache){
            var app = this.app;
            app.iconPlace.removeApp(app);
            app.iconElem.remove();
            if(clearCache){
                app.iconElem = null;
                app.window && app.window.close();//关闭已经打开的窗口
                delete apps[app.id];
                
            }
            self.fire('change', 'remove');
        });
        
        self.on('change', function(type){
            //console.info(type,apps);
        });
        
        
    },
    
    //初始化右键菜单指令
    function(){ ///setContextmenu
        Command.add({
            openApp: function(){
                this.open();
            },
            removeApp: function(){
                self(this).fire('remove', true);
            },
            moveAppTo1: function(){
                self(this).fire('addTo', 0);
            },
            moveAppTo2: function(){
                self(this).fire('addTo', 1);
            },
            moveAppTo3: function(){
                self(this).fire('addTo', 2);
            },
            moveAppTo4: function(){
                self(this).fire('addTo', 3);
            },
            moveAppTo5: function(){
                self(this).fire('addTo', 4);
            }
        });
    },
    
    //初始化应用管理层
    function(){ ///appManage
        self.appManagePanel = Z.elem('<div class="appManagerPanel"><a href="#" class="aMg_close"></a></div>');
        self.appManage_Sidebar = Z.elem('<div class="aMg_dock_container"></div>');
        self.appManage_Desktop = Z.elem('<div class="aMg_folder_container"></div>');
        self.appManagePanel.append(self.appManage_Sidebar);
        self.appManagePanel.append('<div class="aMg_line_x"></div>');
        self.appManagePanel.append(self.appManage_Desktop);
        
        self.appManagePanel.find('a').click(closeManager);
        
        Z(window).on('resize', function(){
            self.appManage_Desktop.height(Body.getHeight() - 80);
        });
        
        Body.add(self.appManagePanel);
        
        function closeManager(evt){
            evt && evt.preventDefault();
            Sidebar.closeManager();
            Desktop.closeManager();
            Z('body').cls('-showAppManagerPanel');
            App.appManage_Desktop.cls('-folderItem_turn')
        }
    },
    
    //结束
    function(){ ///end
        delete self.temp;
        
    },
        
    ])
    .done(this.ready);
}

/* sidebar.js v1.02 Sidebar（侧边）模块
 * 
 * 对外接口：
 * addApp(app, index) 添加一个应用图标到指定位置
 * 
 * */
function Sidebar(){
    var 
    MAX_COUNT = 7, //最大应用个数
    inManage = false,
    self = {
        temp: {
            //appsbox
        }
    };
    
    Sidebar = self;
    
    Calls('Sidebar')
    .call(Common.loadImgs, ['dock_l.png', 'dock_r.png', 'dock_t.png', 'portal_all_png.png'])
    //初始化
    .call(function(){
        var
        rootElem, //容器根节点
        sidebox, //侧边定位容器
        sidebar, //侧边内容容器
        appsbox, //应用图标容器
        dragMasklayer, //拖动遮罩层
        layoutValue; //布局;
        
        this.add([
        
        //创建html
        function(){ ///setHtml
            rootElem = Z.elem('\
            <div class="SidebarWrapper">\
            <div class="guides">\
            <div class="top"></div>\
            <div class="left"></div>\
            </div>\
            <div class="sidebox">\
            <div class="top"></div>\
            <div class="left"></div>\
            <div class="right"></div>\
            </div>\
            </div>\
            ');
            sidebox = rootElem.find('.sidebox');
            sidebar = Z.elem('<div class="sidebar clearfix"><ul class="appsbox clearfix"></ul>'+ toollistHtml() +'</div>');
            self.temp.appsbox = appsbox = sidebar.find('.appsbox');
            dragMasklayer = Z.elem('<div class="Sidebar-masklayer"></div>');
            Body.add(rootElem);
            Body.add(dragMasklayer);
            function toollistHtml(){
                return '\
                <div class="toollist">\
                <div class="item">\
                <span class="pinyin" title="QQ云输入法" cmd="pinyin"></span>\
                <span class="sound" title="静音" cmd="sound"></span>\
                </div>\
                <div class="item">\
                <span class="setting" title="系统设置" cmd="setting"></span>\
                <span class="theme" title="主题设置" cmd="theme"></span>\
                </div>\
                <div class="item2"><span title="开始"></span></div>\
                </div>';
            }
        },
        
        //添加布局逻辑
        //设置布局监听事件
        function(){ ///setLayout.listener
            //设置布局改变事件
            Body.on('layout', function(position){
                sidebox.find('.'+ (layoutValue = position)).append(sidebar);
            });  
            
        },
        //设置布局拖动
        function(){ ///setLayout.drag
            var 
            isDrag, //是否已经激活拖动
            focusPosition, //当前激活的位置
            width,
            height,
            delay; //拖动做延迟处理
            
            sidebar.on('mousedown', function(evt){
                if(evt.mouseKey != 'L')return;
                evt.preventDefault();
                delay = setTimeout(function(){
                    Z(document).on('mousemove', drag).on('mouseup', drop);
                }, 200);
            });
            
            Z(document).on('mouseup', function(){
                clearTimeout(delay);
            });
            
            function drag(evt){
                evt.preventDefault();
                if(!isDrag){
                    isDrag = true;
                    width = Body.getWidth();
                    height = Body.getHeight();
                    showGuides(layoutValue);
                    dragMasklayer.show();
                }  
                
                if(evt.clientY < height * .2){ //上
                    showGuides('top');
                }else if(evt.clientX < width * .5){//左边
                    showGuides('left');
                }else{
                    showGuides('right');
                } 
            }
            
            function drop(evt){
                isDrag = false;
                if(focusPosition != layoutValue){
                    Body.layout(focusPosition);
                }
                focusPosition = '';
                dragMasklayer.hide();
                hideGuides();
                Z(document).un('mousemove', drag).un('mouseup', drop);
            }
            
            function showGuides(positon){
                if(focusPosition != positon){
                    hideGuides();
                    rootElem.cls('+focus-'+ (focusPosition = positon));
                }
            }
            function hideGuides(){
                rootElem.cls('-focus-top,focus-left,focus-right');
            }
            
        },
        //设置布局右键菜单控制
        function(){ ///setLayout.Contextmenu
            var 
            contextmenuItems = [
                {text: '向左停靠', command: 'layout_left'},
                {text: '向上停靠', command: 'layout_top'},
                {text: '向右停靠', command: 'layout_right'}
            ],
            contextmenu = new Contextmenu;
            
            Command.add({
                layout_left: function(){
                    Body.layout('left');
                },
                layout_top: function(){
                    Body.layout('top');
                },
                layout_right: function(){
                    Body.layout('right');
                }
            });
            
            rootElem.on('contextmenu', function(evt){
                evt.preventDefault();
                contextmenuItems[0].status = '';
                contextmenuItems[1].status = '';
                contextmenuItems[2].status = '';
                if(layoutValue == 'left'){
                    contextmenuItems[0].status = 'selected';
                }else if(layoutValue == 'top'){
                    contextmenuItems[1].status = 'selected';
                }else{
                    contextmenuItems[2].status = 'selected';
                }
                contextmenu.render(contextmenuItems).show(evt.clientX, evt.clientY, self);
            });
            
        },
        
        //设置功能按钮事件
        function(){ ///setToollist
            sidebar.click(function(evt){
                var 
                target = Z(evt.target),
                cmd = target.attr('cmd');
                
                if(cmd == 'sound'){
                    target.cls('~mute');
                }else if(cmd == 'theme'){
                    Command.call('openStyleWin');
                }else if(cmd == 'setting'){
                    Command.call('openDeskSetWin');
                }
            });
            
            
            
        },
        
        //桌面设置逻辑
        function(){ ///DeskSet
            var
            app = {name:'DeskSetWin'},
            content = Z.elem('<div>\
                <div class="desktopSettingHeader">默认桌面(登录后默认显示)</div>\
                <div class="desktopSettingBody default_desktop_setting" id="defaultDesktopRadioSet">\
                    <label><input type="radio" value="1" name="defaultDesktop" id="defaultDesktop_1">第1屏桌面</label>\
                    <label><input type="radio" value="2" name="defaultDesktop" id="defaultDesktop_2">第2屏桌面</label>\
                    <label><input type="radio" value="3" name="defaultDesktop" id="defaultDesktop_3" checked>第3屏桌面</label>\
                    <label><input type="radio" value="4" name="defaultDesktop" id="defaultDesktop_4">第4屏桌面</label>\
                    <label><input type="radio" value="5" name="defaultDesktop" id="defaultDesktop_5">第5屏桌面</label>\
                </div>\
                <div class="desktopSettingHeader">桌面图标设置</div>\
                <div class="desktopSettingBody dsektop_icon_style_setting" id="desktopIconStyle">\
                    <label><input type="radio" value="1" name="desktopIconStyle" id="desktopIconStyle_1">小图标</label>\
                    <label><input type="radio" value="0" name="desktopIconStyle" id="desktopIconStyle_0" checked>大图标</label>\
                </div>\
                <div class="desktopSettingHeader">应用码头位置</div>\
                <div class="desktopSettingBody dock_location_preview_contaienr">\
                <div class="dock_location_preview dock_location_left" id="dockLocationPreview">\
                    <div class="dock_set_btn dock_set_left"><label class="dock_set_btn_label"><input type="radio" class="dock_set_btn_radio" value="left" name="dockLocation" id="dockSetLeft">左部</label></div>\
                    <div class="dock_set_btn dock_set_right"><label class="dock_set_btn_label"><input type="radio" class="dock_set_btn_radio" value="right" name="dockLocation" id="dockSetRight">右部</label></div>\
                    <div class="dock_set_btn dock_set_top"><label class="dock_set_btn_label"><input type="radio" class="dock_set_btn_radio" value="top" name="dockLocation" id="dockSetTop" checked>顶部</label></div>\
                </div>\
                </div>\
            </div>').click(function(evt){
                var
                target = Z(evt.target);
                switch(target.attr('name')){
                    case 'defaultDesktop':
                        Desktop.toggle(target.val() - 1);
                        break;
                    case 'desktopIconStyle':
                        Command.call('Desktop_setIcon', null, ['BIG', 'SMALL'][target.val()]);
                        break;
                    case 'dockLocation':
                        Body.layout(target.val());
                        Z('#dockLocationPreview').cls('=dock_location_preview dock_location_'+target.val());
                        break;
                }
 
            });
            Command.add({
                'openDeskSetWin': function(){
                    if(!app.window){
                        Desktop.currentDesk().openWindow(app, {
                            title: '桌面设置',
                            content: content.elem,
                            size: [580, 560],
                            resizeable: false,
                            minimizeable: false,
                            closed: function(){
                                Desktop.currentDesk().closeWindow(app);
                            }
                        });
                    }else{ //已经显示，则判断位置。不在当前桌面，则切到目标桌面
                        if(app.windowPlace != Desktop.currentDesk()){
                            Desktop.toggle(app.windowPlace.index);
                        }
                    }
                    app.window.show();
                }
            });
            
        },

        //设置图标拖放监听事件
        function(){ ///listener
            App.on('drop', function(position){
                var index = -1;
                if(inManage){
                    if(Common.inPoint(App.appManage_Sidebar, position)){
                        index = 0|((position.x - appsbox.offsetTop())/63);
                    }
                    
                }else{
                    if(Common.inPoint(appsbox, position)){
                        switch(layoutValue){
                            case 'left':
                            case 'right':
                            index = 0|((position.y - appsbox.offsetTop())/63);
                            break;
                            case 'top':
                            index = 0|((position.x - appsbox.offsetLeft())/63);
                        }
                    }
                }
                if(index > -1){
                    this.stopEvent();
                    if(this.app.iconPlace != self  || this.app.iconIndex != Math.min(index, self.appCount() - 1)){   
                        self.addApp(this.app, index);
                    }
                } 
                
            });
        },

        ]);
        
    })
    .add([

    //绑定公共接口
    function(){ ///API.public
        var 
        apps = [], //存放图标在侧边栏的应用
        appsbox = self.temp.appsbox,

        managebox = App.appManage_Sidebar;
        Common.mix(self, {
            
            //添加一个应用图标到指定位置
            addApp: function(app, index){
                
                if(index == -1 || index >= apps.length){ //添加到最后
                    index = apps.length;
                }
                App(app).fire('add', self, index);
                if(apps.length == MAX_COUNT){
                    Desktop.addApp(apps[MAX_COUNT - 1], -1);
                }
                
                apps.splice(index, 0, app);
                
                if(index != apps.length - 1){ //不是添加到最后，需要重新生成app.iconIndex
                    App.rebuidIconIndex(apps);
                }
                
                if(inManage){
                    managebox.append(Z.elem('<div class="iconbox"></div>').append(app.iconElem), index);
                }else{
                    appsbox.append(Z.elem('li').append(app.iconElem), index);
                }
                
                
            },
            
            //移除指定的应用
            removeApp: function(app){
                
                Z.each(apps, function(_app, i){
                    if(app == _app){
                        apps.splice(i, 1);
                        app.iconElem.parent().remove();
                        if(i != apps.length){ //移除的不是最后一个，重构this._place.index
                            App.rebuidIconIndex(apps);
                            return true;
                        }
                    }
                });
            },
            
            appCount: function(){
                return apps.length;
            },
            
            openManager: function(){
                inManage = true;
                Z.each(apps, function(app, index){
                    app.iconElem.parent().remove();
                    managebox.append(Z.elem('<div class="iconbox"></div>').append(app.iconElem), index);
                    
                });
            },
            
            closeManager: function(){
                inManage = false;
                Z.each(apps, function(app, index){
                    app.iconElem.parent().remove();
                    appsbox.append(Z.elem('li').append(app.iconElem), index);
                });
            }
            
        });

    }, 
    
    //添加应用图标到容器中
    function(){ ///addApps
        Z.each(Data.CONFIG.sidebar.apps, function(appdata, index){
            self.addApp(new App(appdata.id), index);
        });
    },
    
    //结束
    function(){ ///end
        delete self.temp;
        
    },
    
    ])
    .done(this.ready);
}

/* desktop.js v1.02 Desktop（桌面）模块
 * 
 * 对外接口：
 * 
 * 
 * */
 
function Desktop(){
    var 
    
    GIRD_SIZE_SMALL = [90, 90], //小图标网格
    GIRD_SIZE_BIG = [142, 112], //大图标网格

    MARGIN_LAYOUT = 70, //各种布局桌面的margin值
    MARGIN_LEFT = 28,
    MARGIN_TOP = 46,
    MARGIN_BOTTOM = 28, //底部的margin
    
    
    
    grid_size = GIRD_SIZE_BIG, //当前选中的图标布局
    grid_rows = 0, //桌面行数
    grid_cols = 0, //列数
    
    layoutValue, //布局
    currentIndex = 2,
    currentDesk,
    self = {temp: {
        deskCount: 5,
        deskIndex: 0
    }},
    inManage = false,
    desks = [];
    
    Desktop = self;
    
    
    
    Calls('Desktop')
    
    //子桌面逻辑
    .call(function(){
        
        //子桌面类
        function Desk(data){
            this.index = self.temp.deskIndex++;
            this._apps = [];
            this._windows = []; //在当前桌面打开窗口的应用缓存
            this._hideWindows = []; //被以显示当前桌面方式隐藏窗口的应用缓存
            this._setHtml();
            this._addapps(data.apps);
            this._setAddButton(); //应用市场按钮
            this._setScroll(); //设置滚动条
        }
        
        //公用接口
        Common.mix(Desk.prototype, {
            
            name: 'Desk',
            
            //添加应用到桌面的指定位置
            addApp: function(app, index){
                var apps = this._apps;
                if(index == -1 || index >= apps.length){ //添加到最后
                    index = apps.length;
                }
                App(app).fire('add', this, index);
                apps.splice(index, 0, app);
                if(index != apps.length - 1){ //不是添加到最后，需要重新生成app.iconIndex
                    App.rebuidIconIndex(apps);
                }
                if(inManage){
                    this._folderInner.append(Z.elem('<div class="iconbox"><span>'+app.data('name')+'</span></div>').append(app.iconElem, 0), index);
                    this._manageScroll.reset();
                }else{
                    this._applist.append(app.iconElem, index);
                    this.refresh(true);
                }
                
            },
            
            //移除指定的应用
            removeApp: function(app){
                var 
                that = this,
                apps = this._apps;
                Z.each(apps, function(_app, i){
                    if(app == _app){
                        apps.splice(i, 1);
                        if(inManage){
                            app.iconElem.parent().remove();
                            that._manageScroll.reset();
                        }
                        if(i != apps.length){ //移除的不是最后一个，重构this._place.index
                            App.rebuidIconIndex(apps);
                            return true;
                        }
                    }
                });
                this.refresh(true);
            },
            
            //按指定方向切换移动当前桌面
            toggle: function(direction){
                var rootElem = this._rootElem; 
                
                if(this._isCurrent){ //已经是当前的，则切换成隐藏
                    if(direction == 'L'){
                        rootElem.Anim({left: -2000});
                        }else{
                        rootElem.Anim({left: 2000});
                    }
                    }else{
                    if(direction == 'R' && rootElem.left() > 0){
                        rootElem.left('-2000');//当右移显示的desk在左边时，则切换成-2000
                    }
                    rootElem.Anim({left: 0});
                }
                this._isCurrent = !this._isCurrent;
            },
            
            //刷新当前桌面
            refresh: function(compel){ //compel当为true时为强制刷新，一般在添加或者删除应用的时候使用
                if(!layoutValue){
                    return;
                }
                var
                width = this._rootElem.width(),
                height = this._rootElem.height(),
                grid_size_width = grid_size[0],
                grid_size_height = grid_size[1];
                if(!(width > 0 && height > 0)){ //当高度和宽度未就绪前调用refresh，则返回
                    return;
                }
                
                width -= MARGIN_LEFT;
                height -= MARGIN_TOP + MARGIN_BOTTOM;
                if(layoutValue == 'left' || layoutValue == 'right'){
                    width -= MARGIN_LAYOUT;
                    }else{
                    height -= MARGIN_LAYOUT;
                }
                grid_rows = Math.max(~~(height / grid_size_height), 1);
                grid_cols = ~~(width /  grid_size_width);
                
                if(this._rows != grid_rows //行改变
                || this._cols != grid_cols //列改变
                || this._grid_size != grid_size //图标设置改变
                || this._scroll.isVisible() && (grid_rows * grid_cols >= this._apps.length + 1)//当滚动条需要隐藏时
                || compel //强制刷新
                ){
                    //执行更新数据和重排图标

                    var 
                    self = this,
                    icons = this._apps.slice(0); //复制是为了假如市场应用的添加按钮
                    icons.push({iconElem: this._addButton});
                    
                    this._applistContainer.hide(); //隐藏桌面，完成更新后显示
                    
                    if(grid_rows * grid_cols < icons.length){ //显示滚动条
                        
                        //当前的容器不足以容纳所有图标，则出现滚动条并且重新计算网格，
                        grid_cols = Math.max(1, grid_cols); //至少一列
                        grid_rows = Math.ceil(icons.length / grid_cols); //这里始终以纵向滚动条为主，所以 行数 需要从重新计算
                        
                    }
                    this._applist.height(grid_size_height * grid_rows);
                    
                    this._rows = grid_rows;
                    this._cols = grid_cols;
                    this._grid_size = grid_size;
                    
                    Z.each(icons, function(app, i){ 
                        
                        var 
                        x = ~~(i / grid_rows) * grid_size_width,
                        y = (i % grid_rows) * grid_size_height;
                        
                        app.iconElem.css('left:'+x+';top:'+y);
                    });
                    
                    this._applistContainer.css({width:width,height:height}).show();
                    this._scroll.reset();
                }
                
            },
            
            openWindow: function(app, windowOptions){
                windowOptions.container = this._rootElem;
                app.windowPlace = this;

                app.window = Win(windowOptions);
                this._windows.push(app);
            },
            
            closeWindow: function(app){
                var windows = this._windows;
                
                Z.each(windows, function(_app, i){
                    if(_app == app){
                        windows.splice(i, 1);
                        return true;
                    }
                });
                app.windowPlace = null;
                app.window = null;
                
            },
            
            //显示桌面的逻辑
            show: function(){
                var 
                that = this,
                doshow = true;
                Z.each(that._windows, function(app){
                    if(app.window.isShow()){ //存在显示的窗口，执行的是隐藏操作
                        doshow = false; //设置显示标记为false
                        app.window.hide();
                        that._hideWindows.push(app); 
                    }
                });
                if(doshow){ //将被隐藏的窗口重新显示出来
                    Z.each(that._hideWindows, function(app){
                        //这里做判断是为了过滤掉已经被关闭的窗口
                        app.window && app.window.show();
                    });
                    that._hideWindows.length = 0;
                    
                }
            },
            
            end:0
        });
        
        //私有接口
        Common.mix(Desk.prototype, {
            
            //初始化桌面html
            _setHtml: function(){
                this._rootElem = Z.elem('<div index="'+ this.index +'" class="deskContainer"></div>');
                this._applistContainer = Z.elem('<div class="applistContainer"></div>');
                this._applist = Z.elem('<div class="applist"></div>');
                //this._scrollElem = Z.elem('<div class="scroll"></div>');
                self.temp.container.append(this._rootElem.append(this._applistContainer.append(this._applist)));
                
            },
            
            //初始化应用到桌面
            _addapps: function(appsdata){
                var that = this;
                Z.each(appsdata, function(appdata, index){
                    that.addApp(new App(appdata.id), index);
                });
            },
            
            //设置桌面滚动条
            _setScroll: function(){
                this._scroll = new Scroll({
                    outer: this._applistContainer,
                    inner: this._applist
                });
            },
            
            _setAddButton: function(){
                this._applist.append(this._addButton = self.temp.AppMarket.getDomIcon());
            }
        });
        
        self.temp.Desk = Desk;
    })
    
    //桌面初始化
    .call(function(){
        var
        rootElem,
        desksContainer,
        navbar,
        
        end;
        
        this.add([
        
        //创建html
        function(){ ///setHtml
            rootElem = Z.elem('<div class="DesktopWrapper"></div>');
            self.temp.container = desksContainer = Z.elem('<div class="desksContainer"></div>');
            self.temp.navbar = navbar = Z.elem('<div class="navbar"></div>');
            
            var indicators = [];
            indicators.push('<div class="header" cmd="user" title="请登录"><img src="css/imgs/avatar.png" alt="请登录"></div>');
            for(var i = 0; i < self.temp.deskCount; i++){
                indicators.push('<a href="#" class="indicator'+(i == currentIndex?' current':'')+'" index="'+ i +'"><span class="icon_bg"></span><span class="icon_'+(i+1)+'"></span></a>');
            }
            indicators.push('<a class="indicator indicator_manage" href="#" hidefocus="true" cmd="manage" title="全局视图"></a>');
            navbar.append('<div class="indicatorContainer">'+ indicators.join('') +'</div>');
            rootElem.append(desksContainer);
            desksContainer.append(navbar);
            Body.add(rootElem);
        },
        
        //设置navbar
        function(){ ///setNavbar
            navbar.Drag({rang: 1});
            navbar
            .on('mousedown', function(){
                Contextmenu.hide();
            })
            .find('.indicator').click(function(evt){
                evt.preventDefault();
                if(this.attr('index')){
                    self.toggle(+this.attr('index'));
                }else if(this.attr('cmd') == 'manage'){
                    
                    Sidebar.openManager();
                    Desktop.openManager();
                    Z('body').cls('+showAppManagerPanel');
                    App.appManage_Desktop.height(Body.getHeight() - 80);
                    Z.each(desks, function(desk){
                        desk._manageScroll.reset();
                    });
                    setTimeout(function(){
                        App.appManage_Desktop.cls('+folderItem_turn');
                        
                    });
                }
            });
            
            //窗口改变则刷新桌面
            Z(window).on('resize', function(){
                self.refresh(); 
            });
            
        },
        
        //设置右键菜单
        function(){ ///contextmenu 
            var 
            submenuItems = [
                {text: '大图标', command: 'desktop.bigicon'},
                {text: '小图标', command: 'desktop.smallicon'}
            ],
            submenuItems2 = [
                {text: '桌面1', command: 'desktop.toggle.1'},
                {text: '桌面2', command: 'desktop.toggle.2'},
                {text: '桌面3', command: 'desktop.toggle.3'},
                {text: '桌面4', command: 'desktop.toggle.4'},
                {text: '桌面5', command: 'desktop.toggle.5'}
            ],
            contextmenuItems = [
                
                {text: '显示桌面', command: 'Desktop.show'},
                {text: '切换桌面', submenu: submenuItems2},
                '-',
                {text: '系统设置', command: 'openDeskSetWin'},
                {text: '主题设置', command: 'openStyleWin'},
                {text: '图标设置', submenu: submenuItems},
                '-',
                {text: '关于', command: 'about'}
            ],
            contextmenu;
            
            contextmenu = new Contextmenu(contextmenuItems);
            rootElem.on('contextmenu', function(evt){
                evt.preventDefault();
                if(grid_size == GIRD_SIZE_BIG){
                    submenuItems[0].status = 'selected';
                    submenuItems[1].status = '';
                }else if(grid_size == GIRD_SIZE_SMALL){
                    submenuItems[0].status = '';
                    submenuItems[1].status = 'selected';
                }
                Z.each(submenuItems2, function(item, i){
                    if(currentIndex == i){
                        item.status = 'selected';
                    }else{
                        item.status = '';
                    }
                });
                
                contextmenu.render(contextmenuItems).show(evt.clientX, evt.clientY, self);
            });
            
            
            Command.add({
                'Desktop.show': function(){
                    currentDesk.show();
                },
                'desktop.toggle.1': function(){
                    self.toggle(0);
                },
                'desktop.toggle.2': function(){
                    self.toggle(1);
                },
                'desktop.toggle.3': function(){
                    self.toggle(2);
                },
                'desktop.toggle.4': function(){
                    self.toggle(3);
                },
                'desktop.toggle.5': function(){
                    self.toggle(4);
                },
                'desktop.bigicon': function(){
                    setIconSize('BIG');
                },
                'desktop.smallicon': function(){
                    setIconSize('SMALL');
                },
                'about': function(){
                    alert([
                    'WEB++是基于1kjs仿照WEBQQ开发的一款模拟桌面系统',   
                    '程序以文件和对象的方式进行管理，代码实现了流程控制和性能监控',   
                    '数据采用纯静态的JSON格式，在数据交互中实现了并行请求和串行处理',
                    '===========================================',
                    '感谢WEBQQ提供素材和交互模型，感谢Google App提供托管空间',
                    '本程序所有图片素材都来自网络，版权归原作者所有！',
                    '如有疑问请联系：zjfeihu@126.com',
                    ].join('\r\n\r\n'));
                    
                }
            });
            
            function setIconSize(value){
                if(value == 'BIG' && grid_size != GIRD_SIZE_BIG){
                    grid_size = GIRD_SIZE_BIG;
                    self.container.cls('-small-appicon').cls('+big-appicon');
                }else if(value == 'SMALL' && grid_size != GIRD_SIZE_SMALL){
                    grid_size = GIRD_SIZE_SMALL;
                    self.container.cls('-big-appicon').cls('+small-appicon');
                }
                self.refresh();
            }
            Command.add({
                Desktop_setIcon: setIconSize
                
            });
        },
        
        //设置应用市场按钮
        function(){ ///AppMarket
            var
            App_prop = App.prototype; //拷贝App的接口
            
            self.temp.AppMarket = {
                //模拟App接口，用于Taskbar控制
                data: function(){
                    return '应用市场';
                },
                iconUrl: function(){
                    return 'css/imgs/appmarket.png';
                },
                id: 'appmarket',
                focus: function(){
                    this.window.show();
                    if(this.windowPlace != currentDesk){
                        Desktop.toggle(this.windowPlace.index);
                    }
                    
                },
                
                //Desk中调用，用于生成按钮的html
                getDomIcon: function(){
                    var 
                    addButton = Z.elem('<div class="app-icon" style="left: 0px; top: 112px;"><img src="'+this.iconUrl()+'"><span>添加应用</span></div>')
                    .click(this._open, this)
                    .on('contextmenu', function(evt){
                        evt.preventDefault();
                        evt.stopPropagation();
                    })
                    .on('mousedown', function(evt){
                        evt.preventDefault();
                        evt.stopPropagation();
                    });
                    return addButton;
                },
                
                //窗口相关逻辑
                _open: function(){
                    var that = this;
                    if(!that.window){
                        Taskbar.add(that);
                        currentDesk.openWindow(that, {
                            title: '应用市场',
                            size: [570, 560],
                            content: 'appmarket.html',
                            resizeable : false,
                            closed: function(){
                                currentDesk.closeWindow(that);
                                Taskbar.remove(that);
                            },
                            focused: function(){
                                Taskbar.focus(that);
                            }
                        });
                        
                    }else{
                        that.focus();
                    }
                }
            };
        },
        
        ]);
        
    })
    
    
    .add([
    
    //公共接口
    function(){ ///API.public
        
        Common.mix(self, {
            
            container: self.temp.container,
            
            addApp: function(app, index){
                currentDesk.addApp(app, index);
            },
            
            refresh: function(){
                currentDesk.refresh();
            },
            
            //切换到指定下标的桌面
            toggle: function(navbar){
                return function(targetIndex){
                    if(currentDesk != desks[targetIndex]){
                        navbar.find('.current').cls('-current');
                        navbar.find('.indicator').eq(targetIndex).cls('+current');
                        
                        var direction;
                        if(targetIndex > currentIndex){ //左移
                            direction = 'L';
                        }else{
                            direction = 'R';
                        }
                        
                        if(currentDesk){
                            currentDesk.toggle(direction);
                        }
                        
                        currentDesk = desks[currentIndex = targetIndex];
                        currentDesk.toggle(direction);
                        self.refresh();
                    }
                };
                
            }(self.temp.navbar),
            
            currentDesk: function(){
                return currentDesk;
            },
            currentIndex: function(){
                return currentIndex;
            },
            
            openManager: function(){
                //在desktopManage模块中重写
            },
            
            closeManager: function(){
                //在desktopManage模块中重写
            },
            
            end: 0
        });
        
        Event.extendTo(self);
    },
    
    //添加子桌面
    function(){ ///initDesk
        var 
        Desk = self.temp.Desk;
        Z.each(Data.CONFIG.desktop.desks, function(deskdata, i){
            if(i >= self.temp.deskCount){
                return true;
            }
            desks[i] = new Desk(deskdata);
        });
        self.toggle(currentIndex);
    },
    
    //设置桌面监听
    function(){ ///listener
        //设置布局改变事件
        Body.on('layout', function(position){
            layoutValue = position;
            self.refresh();
        });
        App.on('drop', function(position){
            var 
            app = this.app,
            index = -1;
            if(inManage){
                Z.each(desks, function(desk){
                    if(Common.inPoint(desk._folderInner.parent(), position)){
                        index = 0|((position.y - desk._folderInner.offsetTop()) / 35);
                        desk.addApp(app, index);
                        return true;
                    }
                });
            }else{
                var applist = currentDesk._applist;
                if(Common.inPoint(applist, position)){
                    var 
                    x = position.x - applist.offsetLeft(),
                    y = position.y - applist.offsetTop(),
                    index = ~~(y / grid_size[1]) + (~~(x / grid_size[0])) * grid_rows;
                }
                if(index > -1){
                    this.stopEvent();
                    if(app.iconPlace != currentDesk  || app.iconIndex != Math.min(index, currentDesk._apps.length - 1)){   
                        self.addApp(app, index);
                    }
                } 
            }
            
        });
        
        var 
        btn = self.temp.navbar.find('.indicator'),
        toggleButtonX,
        toggleButtonY;
        App.on('dragBefore', function(){
            toggleButtonX = btn.offsetLeft();
            toggleButtonY = btn.offsetTop();
        });
        App.on('draging', function(x, y){
            //拖动图标时候的桌面切换检测，20为按钮高度，22为按钮宽度
            if(y > toggleButtonY //y在前面考虑高度小于宽度，减少运算量
            && y < toggleButtonY + 20
            && x > toggleButtonX
            && x < toggleButtonX + 110
            ){
                self.toggle(~~((x - toggleButtonX) / 22));
            }
        });
    
        App.on('contextmenu', function(submenu){
            if(this.app.iconPlace == currentDesk){
                submenu[currentIndex].status = 'disabled';
            }
        });
        
        App.on('addTo', function(index){
            desks[index].addApp(this.app, -1);
        });
        
        App.on('openWindow', function(windowOptions){
            currentDesk.openWindow(this.app, windowOptions);
        });
        App.on('focusWindow', function(){
            if(this.app.windowPlace != currentDesk){
                self.toggle(this.app.windowPlace.index);
            }
        })
        App.on('closeWindow', function(){
            currentDesk.closeWindow(this.app);
        });
    
    },
    
    //初始化桌面应用管理接口
    function(){ ///desktopManage

        Z.each(desks, function(desk, i){
            var folderItem = Z.elem('<div class="folderItem"><div class="folder_bg folder_bg'+(i+1)+'"></div><div class="folderOuter" index="'+i+'"><div class="folderInner"></div></div>'+(i?'<div class="aMg_line_y"></div>':'')+'</div>');
            desks[i]._manageScroll = new Scroll({
                outer: folderItem.find('.folderOuter'),
                inner: desks[i]._folderInner = folderItem.find('.folderInner')
            });
            
            App.appManage_Desktop.append(folderItem);
        });
        
        Z(window).on('resize', function(){
            if(inManage){
                Z.each(desks, function(desk){
                    desk._manageScroll.reset();
                });
            }
        });

        self.openManager = function(){
            inManage = true;
            Z.each(desks, function(desk){
                Z.each(desk._apps, function(app, index){
                   desk._folderInner.append(Z.elem('<div class="iconbox"><span>'+app.data('name')+'</span></div>').append(app.iconElem, 0), index);
               });
                
            });
        };
        self.closeManager = function(){
            inManage = false;
            Z.each(desks, function(desk, index){
                Z.each(desk._apps, function(app, index){
                    app.iconElem.parent().remove();
                    desk._applist.append(app.iconElem, index);
                    setTimeout(function(){
                        desk.refresh(true);
                    });
                });
            });
            
        };
        
    },
    
    //结束
    function(){ ///end
        delete self.temp;
        
    }
    
    ])
    .done(this.ready);
    
}

/* taskbar.js v1.02 Taskbar（任务栏）模块
 * 
 * 对外接口：主要开放给App模块使用
 * add(app) 添加一个任务按钮
 * remove(app) 移除一个任务按钮
 * focus(app) 激活一个任务按钮
 * 
 * */

function Taskbar(){ ///Taskbar
    var 
    self,
    rootElem, //容器根节点
    buttonWrap, //按钮容器
    apps = [], //应用对象缓存
    focusIndex = -1; //当前激活的按钮位置

    Taskbar = self = {
        
        add: function(app){
            apps.push(app);
			buttonWrap.append('<li class="itembox" appid="'+ app.id +'"><img src="'+ app.iconUrl() +'"/><span>'+ app.data('name') +'</span></li>');
        },
        
        remove: function(app){
            var index = self._getIndex(app.id);
            apps.splice(index, 1);
            buttonWrap.child(index).remove();
            if(focusIndex == index){
                focusIndex = -1;
            }
            
        },
        
        focus: function(app){
            var index = self._getIndex(app.id);

            if(index != focusIndex){
                if(focusIndex > -1){
                    buttonWrap.child(focusIndex) && buttonWrap.child(focusIndex).cls('-focus');
                }
                buttonWrap.child(focusIndex = index).cls('+focus');
            }
            
        },
        
        _click: function(app){
            if(app.window.isFocus() && app.windowPlace == Desktop.currentDesk()){
                app.window.toggle(); 
            }else{
                app.focus();
            }
		},
        
        //获取指定App在缓存apps中的位置
        _getIndex: function (appid){
            for(var i = 0; i < apps.length; i++){
                if(apps[i].id == appid){
                    return i;
                }
            }
        }
        
    };
        
    Calls('Taskbar')
    .call(Common.loadImgs, [
        'bg_task_b.png',
        'bg_task_nor.png',
        'bg_task_over.png'
    ])
    
    //初始化任务栏html
    .add(function(){ ///setHtml
        rootElem = Z.elem('<div class="Taskbar"><ul></ul></div>');
        buttonWrap = rootElem.find('ul');
        Body.add(rootElem);
    })
    
    //设置点击事件，用于绑定应用的切换
    .add(function(){ ///setEvent
        rootElem.click(function(evt){
            var tg = Z(evt.target);	
            var li = tg.tag('LI') ? tg : tg.parent('li');
            if(li){
                self._click(apps[self._getIndex(li.attr('appid'))]);
            }
        });
    })
    
    //绑定右键菜单
    .add(function(){ ///setContextmenu
        var
        contextmenu = new Contextmenu([
            {text: '最大化', command: 'app_maximize'},
            '-',
            {text: '最小化', command:'app_hide'},
            {text: '关闭', command:'app_close'}
        ]);
        
        Command.add({
            app_maximize: function(){
                this.window.maximize();
                this.focus();
            },
            app_hide: function(){
                this.window.hide();
            },
            app_close: function(){
                this.window.close();
            }
            
        });
        rootElem.on('contextmenu', function(evt){
            var 
            tg = Z(evt.target),
            li = tg.tag('LI') ? tg : tg.parent('li');
            if(li){
                contextmenu.show(evt.clientX, evt.clientY, apps[self._getIndex(li.attr('appid'))]);
            }
        });
    })
    
    //监听事件
    .add(function(){
        App.on('openWindow', function(){
            self.add(this.app);
        });
        App.on('focusWindow', function(){
            self.focus(this.app);
        }); 
        App.on('closeWindow', function(){
            self.remove(this.app);
        });
        
    })
    .done(this.ready);
    
}

/* win.js窗口类，继承自Zw_Win.js
 * 
 * 
 * 
 * */

var Win = Z.Win.extend({
    
    init: function(options){
        options.size = options.size || []
        
        options.width = parseInt(options.size[0]) || 640;
        options.height = parseInt(options.size[1]) || 480;
        
        options.closeEvent = options.closed;
        options.focusEvent = options.focused;
        options.parent = options.container.elem;
        options.masklayer = true;
        options.content = this._formatContent(options.content);
        
        //随机生成窗口坐标
        var 
        offsetLeft =  Body.getWidth() - 26 - options.width,
        offsetTop =  Body.getHeight() -26 - options.height,
        left = Math.max(26, Math.min( offsetLeft, 0|( offsetLeft * Math.random() ) ) ),
        top = Math.max(26, Math.min( offsetTop, 0|( offsetTop * Math.random() ) ) );
        
        
        this._super(options);
        this.position(left, top);
        this._rootElem.on('contextmenu', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
        })
        .on('mousedown', function(evt){
            Contextmenu.hide();
        });
        this._titlebarElem.on('mousedown', function(){
            Contextmenu.hide();
        });
    },
    
    //自动格式化成iframe
    _formatContent: function(content){
        if(typeof content == 'string' && !/<\/(div|ul)>/.test(content)){
            if(!/^http|\.|\//i.test(content)){
                content = 'http://'+ content;
            }
            return '<iframe frameborder="0" src="'+ content +'" style="width:100%;height:100%;"></iframe>'
        }
        return content;
    },
    
    //应用市场的窗口需要这个接口，用于在不同的桌面之间切换
    setContainer: function(parent){
        if(parent != this._parent){
            this._parent = parent;
            Z(this._parent.elem).append(this._rootElem);
        }
        
    },
    
    //用于非销毁窗口重新打开
    open: function(parent){
        parent.append(this._rootElem);
        this.show();
    }
    
    
},
{
    _zIndex: 100, //窗口起始zIndex
    _focusWin: null //当前激活的窗口
});

/*  v1.02 scroll.js
 * 
 * 
 * */
function Scroll(options){
    var
    outer = options.outer,
    inner = options.inner,
    scrollbar = Z.elem('<div class="scrollbar"></div>'),
    scrollTop,
    viewportHeight,
    contentHeight,
    scrollHeight,
    paddingHeight,
    visible = false,
    offsetY;
    
    this.reset = function(){
                            
        viewportHeight = outer.height();
        contentHeight = inner.offsetHeight();

        if(contentHeight > viewportHeight){ //ʾ
            scrollHeight = viewportHeight * viewportHeight / contentHeight;
            paddingHeight = viewportHeight - scrollHeight; 
            scrollbar.height(scrollHeight);
            scrollTop = scrollbar.top();
            if(visible){
                doScroll(scrollTop);
            }else{
                visible = true;
                scrollbar.show();
            }
        }else{
            visible = false;
            scrollbar.hide().top(scrollTop = 0);
            inner.top(0);
        }
    };
    
    this.isVisible = function(){
        return visible;
    };
    outer.append(scrollbar),
    scrollbar.on('mousedown', function(evt){
        offsetY = evt.clientY - scrollTop;
        Z(document).on('mouseup', stopDrag);
        Z(document).on('mousemove', startDrag);
    });
    outer.on('mousewheel', function(evt){
        if(visible){
            doScroll(scrollTop -= evt.delta/12);
        }
    });
    function stopDrag(){
        Z(document).un('mouseup', stopDrag);
        Z(document).un('mousemove', startDrag);
    }
    function startDrag(evt){
        window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty();
        doScroll(evt.clientY - offsetY);
    }
    function doScroll(top){
        scrollbar.top(scrollTop = Math.max(0, Math.min(top, paddingHeight)));
        inner.top(-scrollTop * contentHeight / viewportHeight);
    }
}
/* contextmenu.js v1.01 右键菜单
 * 
 * 对外接口：
 * Contextmenu.hide() //隐藏当前显示的右键菜单
 * 
 * new Contextmenu(menuItems) //创建一个右键菜单
 * show() //显示
 * hide() //隐藏
 * render(menuItems) //重新生成菜单内容
 * 
 * */

function Contextmenu(){
    var 
    container, //menu容器
    current; //当前显示的menu

    Contextmenu = function(items){
        container.append(this.rootElem = 
            Z.elem('<div class="Contextmenu"></div>')
                .html(this._itemHtml(items))
        );
        this._setEvent();
    };
    
    Contextmenu.hide = function(){
        if(current){ //判断当前有没有已经显示的菜单
            current.rootElem.hide();
            current = null;
        }
    };
    
    Contextmenu.prototype = {
        
        //公共接口
        show: function(x, y, context){
            Contextmenu.hide();
            current = this;
            this._context = context;
            this.rootElem.show().css(this._revise(x, y));
        },

        hide: Contextmenu.hide,
        
        //重新生成菜单内容
        render: function(items){
            this.rootElem.html(this._itemHtml(items));
            return this;
        },
        
        //修正menu在边缘的显示坐标
        _revise: function(x, y){
            var 
            width = this.rootElem.offsetWidth(),
            height = this.rootElem.offsetHeight();
            if(x + width > Body.getWidth()){
                x -= width;
            }
            if(y + height > Body.getHeight()){
                y -= height;
            }
            return{left: x, top: y};
        },
        
        //私有接口
        _itemHtml: function(items){
            var 
            self = this,
            html = '<ul>';
            Z.each(items || [], function(item){
                var
                l_icon = '',
                text = '',
                r_icon = '',
                submenu = '';
                
                if(item == '-'){
                    html += '<li class="line"></li>';
                }else if(item.status == 'disabled'){
                    html += '<li class="item disabled"><span class="text">'+ item.text +'</span></li>';
                }else{
                    if(item.status == 'selected'){
                        l_icon = '<span class="l_icon selected"></span>';
                    }else if(item.icon){
                        l_icon = '<span class="l_icon '+ item.icon +'"></span>';
                    }
                    text = '<span class="text">'+ item.text +'</span>';
                    if(item.submenu){
                        submenu = self._itemHtml(item.submenu); 
                        r_icon = '<span class="r_icon showsubmenu"></span>';
                    }
                    html += '<li __command__="'+ (item.command || '') +'">'+ l_icon + text +r_icon + submenu +'</li>';
                }
            });
            return html +'</ul>';
        },
        
        //绑定菜单命令
        _setEvent: function(){
            var self = this;
            this.rootElem.on('mousedown', function(evt){
                evt.stopPropagation();
                var
                command,
                target = Z(evt.target);
                if(target.tag('LI')){
                    command = target.attr('__command__')
                }else{
                    command = target.parent().attr('__command__')
                }

                if(command){
                    self.rootElem.hide();
                    Command(command, self._context);
                    
                }
            }).on('Contextmenu',function(evt){
                evt.preventDefault();
                evt.stopPropagation();
            });
        }
    };

    Body.add(container = Z.elem('<div id="Contextmenu"></div>'));
    
    Z(document).on('contextmenu',function(evt){
        evt.preventDefault();
    }).on('mousedown',function(evt){
        Contextmenu.hide();
    });
}

/* command.js v1.01 指令类
 * 
 * 对外接口：
 * 
 * add(items) //添加指令
 * call(name) //调用指令
 * */

function Command(){ ///Command
    var commands = {};
    Command = function(name, context){
        commands[name].call(context);
    }
    
    Command.add = function(items){
        Z.each(items, function(fn, name){
            commands[name] = fn;
        });
    };
    Command.call = function(name, context){
        var args = arguments;
        if(args.length > 2){
            commands[name].apply(context, [].slice.call(args, 2));
        }else{
            commands[name].call(context);
        }
        
    };
}


main();

}($1k);
