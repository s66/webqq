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

