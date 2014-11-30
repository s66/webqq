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
 
