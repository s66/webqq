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

