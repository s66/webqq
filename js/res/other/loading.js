
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

