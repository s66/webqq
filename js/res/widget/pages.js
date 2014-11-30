/*
 * Zw_Pages.js v1.01 分页组件
 * 
 * 使用：
 *      $1k.Pages(dom, totalPages, pageSize, currentPage) 
 *      dom 分页的容器，totalPages分页总数，pageSize分页大小，currentPage当前页
 * 开放接口
 *      setTotal(totalPages) 重新设置总页
 *      setSize(pageSize) 重新设置分页大小
 *      change(callback) 绑定当前页改变时的函数，callback的参数为当前页
 *      prev() 上一页
 *      next() 下一页
 *      index(current) 转向current页
 * author：zjfeihu@126.com
 * */

$1k.widget('Pages', function(Z){

return Z.Class({
    
    prev: function(){
        if(this._current > 1){
            this._current--;
            this.render();
            this._fireChange && this._fireChange(this._current);
        }
    },
    
    next: function(){
        if(this._current < this._TOTAL){
            this._current++;
            this.render();
            this._fireChange && this._fireChange(this._current);
        }
    },
    
    index: function(current){
        if(current > 0 && current <= this._TOTAL){
            this._current = current;
            this.render();
            this._fireChange && this._fireChange(this._current);
        }
        
    },
    
    setTotal: function(total){
        if(total > 0 && total != this._TOTAL){
            this._TOTAL = total;
            this._current = 1;
        }
        return this;
    },
    
    setSize: function(size){
        if(size > 6 && size != this._SIZE){
            this._SIZE = size;
            this._current = 1;
        }
        return this;
    },
    
    change: function(onchange){
        this._fireChange = onchange;
        return this;
    },
    
    render: function(){

        var 
        SIZE = this._SIZE,
        TOTAL = this._TOTAL,
        current = this._current,
        offset = (SIZE / 2),
        prev = '',
        next = '',
        header = '', //头部点
        tailer = '', //尾部点
        body = '',
        numSize = SIZE, //中间部分数字长度
        num,//中间开始页码
        i = 0;
        
        prev = current == 1 
            ? '<span class="prev disable">上一页</span>'
            : '<span class="prev" _cmd_="-1">上一页</span>';
        next = current == TOTAL
            ? '<span class="next disable">下一页</span>'
            : '<span class="next" _cmd_="+1">下一页</span>';
        
        if(TOTAL > SIZE){ //有左右点
            
            if(current > offset){ //有左dot
                header = '<span class="num" _cmd_="1">1</span><span class="dot">...</span>';
                numSize -= 2;
            }
            
            if(TOTAL - current > offset-1){ //有右dot
                tailer = '<span class="dot">...</span><span class="num" _cmd_="'+TOTAL+'">'+TOTAL+'</span>';
                numSize -= 2;
            }     
            
            }else{ //numSize只能小于总数
            numSize = Math.min(numSize, TOTAL); 
        }
        
        num = //中间部分数字
        header && tailer
            ? current - ~~(numSize/2)  //左右有点
            : tailer
                ? 1  //只有尾部有点
                : TOTAL + 1 - numSize; //只有头部有点
        
        while(numSize--){
            body += num == current //当前页面
                ? '<span class="num current">'+ num +'</span>'
                : '<span class="num" _cmd_="'+num+'">'+ (num) +'</span>';
            num++;
        }
        
        this._cntElem.html([prev, header, body, tailer, next]); 
        
    },
    
    init: function(container, totalPages, pageSize, currentPage){
        this._SIZE = Math.max(7, pageSize);
        this._TOTAL = totalPages;
        
        this._cntElem = Z.elem('<div class="cntbox"></div>');
        this._setEvent();
        this.index(currentPage || 1); //默认第一页
        container.appendChild(
            Z.elem('<div class="Zw_Pages"></div>').append(this._cntElem).elem
        );
    },

    _setEvent: function(){
        this._cntElem.click(function(evt){
            var cmd = Z(evt.target).attr('_cmd_');

            if(cmd == '+1'){
                this.next();  
            }else if(+cmd > 0){
                this.index(+cmd);
            }else if(cmd == '-1'){
                this.prev();
            }

        }, this);
    }
}, {ver: 1.01});

});

