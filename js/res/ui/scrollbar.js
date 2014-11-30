/* 滚动条 v1.02 scroll.js
 * 
 * 
 * */
function Scroll(options){
    var
    outer = options.outer,
    inner = options.inner,
    scrollbar = Z.elem('<div class="scrollbar"></div>'),
    scrollTop,
    viewportHeight,
    contentHeight,
    scrollHeight,
    paddingHeight,
    visible = false,
    offsetY;
    
    this.reset = function(){
                            
        viewportHeight = outer.height();
        contentHeight = inner.offsetHeight();

        if(contentHeight > viewportHeight){ //显示滚动条
            scrollHeight = viewportHeight * viewportHeight / contentHeight;
            paddingHeight = viewportHeight - scrollHeight; 
            scrollbar.height(scrollHeight);
            scrollTop = scrollbar.top();
            if(visible){
                doScroll(scrollTop);
            }else{
                visible = true;
                scrollbar.show();
            }
        }else{
            visible = false;
            scrollbar.hide().top(scrollTop = 0);
            inner.top(0);
        }
    };
    
    this.isVisible = function(){
        return visible;
    };
    outer.append(scrollbar),
    scrollbar.on('mousedown', function(evt){
        offsetY = evt.clientY - scrollTop;
        Z(document).on('mouseup', stopDrag);
        Z(document).on('mousemove', startDrag);
    });
    outer.on('mousewheel', function(evt){
        if(visible){
            doScroll(scrollTop -= evt.delta/12);
        }
    });
    function stopDrag(){
        Z(document).un('mouseup', stopDrag);
        Z(document).un('mousemove', startDrag);
    }
    function startDrag(evt){
        window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty();
        doScroll(evt.clientY - offsetY);
    }
    function doScroll(top){
        scrollbar.top(scrollTop = Math.max(0, Math.min(top, paddingHeight)));
        inner.top(-scrollTop * contentHeight / viewportHeight);
    }
}
