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

