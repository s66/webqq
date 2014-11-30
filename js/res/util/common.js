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

