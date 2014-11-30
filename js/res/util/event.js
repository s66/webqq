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

