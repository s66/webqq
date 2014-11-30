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

