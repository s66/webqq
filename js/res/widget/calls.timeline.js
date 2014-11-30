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

