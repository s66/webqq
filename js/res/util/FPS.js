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

