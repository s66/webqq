/*
**  ==================================================
**  1k.js v2.01
**  功能：js类库
**  示例：  
    --------------------------------------------------

        文档：http://lib.1kjs.com/doc/

    --------------------------------------------------
**  邮件：zjfeihu@126.com 
**  更新：2013/11/05
**  类库地址：http://lib.1kjs.com/
**  ==================================================
**/
$1k = function(){
    var $browser = function(){
        var 
        ua = navigator.userAgent.toLowerCase(),
        sys = {},
        s;
        (s = ua.match(/msie ([\d.]+)/)) ? sys.ie = s[1] :
        (s = ua.match(/firefox\/([\d.]+)/)) ? sys.firefox = s[1] :
        (s = ua.match(/(?:opera.|opr\/)([\d.]+)/)) ? sys.opera = s[1] :
        (s = ua.match(/chrome\/([\d.]+)/)) ? sys.chrome = s[1] :
        (s = ua.match(/version\/([\d.]+).*safari/)) ? sys.safari = s[1] : 0;
        return sys;
    }(),
    $isIE6 = /MSIE\s*6.0/i.test(navigator.appVersion),
    $scrollTop = function(){
        var tr,
            cr = $browser.chrome;
        return function(y, t, tp){
            var ds = cr ? $DOC.body : $DE;
            switch(arguments.length){
                case 0: return ds['scrollTop'];
                case 1: return ds['scrollTop'] = y;
                default:
                    var s0 = 0,
                        s1 = Math.ceil(t/15),
                        z0 = ds['scrollTop'],
                        tp = function(t,b,c,d){
                            return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
                        },
                        zc = y - z0;
                    clearTimeout(tr);
                    function run(){
                        tr = setTimeout(function(){
                            if(s0 < s1){ 
                                ds['scrollTop'] = tp(s0, z0, zc, s1);
                                run();
                            }else{
                                ds['scrollTop'] = y;
                                clearTimeout(tr);
                            }
                            s0 ++;
                        }, 15);
                    }
                    run();
            }
        
        };
    }(),
    $GUID = 1,
    $WIN = window,
    $DOC = document,
    $DE = $DOC.documentElement,
    $HEAD = $DOC.head || $query('head')[0],
    $DP = $Dom.prototype,
    $Class = function(){
        return{
            extend: extend
        };
        function extend(){
            function Class(args){
                if(this instanceof Class){ //已经实例化，调用init
                    if(this.init){ //自动new的情况，所有参数都会存在args.____中，否则取全部参数，注意args中不能传递args.____
                        this.init.apply(this, args && args.____ ? args.____ : arguments);
                    }
                }else{
                    return new Class({
                        ____: arguments
                    });
                }
            }
    
            Class.prototype = function(prop, source){
                empty.prototype = this.prototype;
                var 
                method,
                superMethod,
                superProp = new empty, //通过空函数实现只继承原型
                i;
                for(i in prop){
                    method = prop[i];
                    superMethod = superProp[i];
                    superProp[i] = //需要调用父类的方法，则使用闭包进行包装
                    $isFunction(method) 
                    && $isFunction(superMethod) 
                    && /\._super\(/.test(method) //函数体包含._super(      
                    ? pack(method, superMethod) : method;
                }
                if(source){
                    for(i in source){
                        Class[i] = source[i];
                    }
                }
                superProp.constructor = Class;
                superProp.superclass = this;
                return superProp;
                
                function empty(){}
                function pack(method, superMethod){
                    return function(){
                        this._super = superMethod;
                        var ret = method.apply(this, arguments);
                        this._super = null;
                        return ret;
                    };
                }
            }.apply(this, arguments);
            
            Class.extend = extend; //实现链式，执行Class.extend()时，this自动指向Class
            return Class;
        }
    }(),
    $EventHook = {},
    $addEvent = function(){
        ($addEvent = $DOC.addEventListener ? function(node, type, fn){
            node.addEventListener(type == 'mousewheel' && $DOC.mozHidden !== undefined ? 'DOMMouseScroll' : type, fn, false); 
        } : function(node, type, fn){
            node.attachEvent('on' + type,fn); 
        }).apply(null, arguments);
    
    },
    $XHR = function(){
        return $WIN.XMLHttpRequest || function(){ //ie6下使用遍历来获得最高版本的xmlhttp
            var xhrProgid = [0, 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP', 'Msxml2.XMLHTTP.6.0'],
                i = 4,
                xhr;
            while(--i){
                try{
                    new ActiveXObject(xhr = xhrProgid[i]);
                    return function(){return new ActiveXObject(xhr)};
                }catch(e){}
            }
        }();
    }(),
    $Easing = {
        Linear: function(p) {
            return p;
        },
        slowIn: function(p) {
            return p * p;
        },
        slowOut: function(p) {
            return p * (2 - p);
        },
        slowBoth: function(p) {
            if ((p /= 0.5) < 1) return 1 / 2 * p * p;
            return -1 / 2 * ((--p) * (p - 2) - 1);
        },
        In: function(p) {
            return p * p * p * p;
        },
        Out: function(p) {
            return -((p -= 1) * p * p * p - 1);
        },
        Both: function(p) {
            if ((p /= 0.5) < 1) return 1 / 2 * p * p * p * p;
            return -1 / 2 * ((p -= 2) * p * p * p - 2);
        },
        fastIn: function(p) {
            return p * p * p * p * p * p;
        },
        fastOut: function(p) {
            return -((p -= 1) * p * p * p * p * p - 1);
        },
        fastBoth: function(p) {
            if ((p /= 0.5) < 1) return 1 / 2 * p * p * p * p * p * p;
            return -1 / 2 * ((p -= 2) * p * p * p * p * p - 2);
        },
        elasticIn: function(p) {
            if (p == 0) return 0;
            if (p == 1) return 1;
            var x = 0.3,
            //y = 1,
            z = x / 4;
            return -(Math.pow(2, 10 * (p -= 1)) * Math.sin((p - z) * (2 * Math.PI) / x));
        },
        elasticOut: function(p) {
            if (p == 0) return 0;
            if (p == 1) return 1;
            var x = 0.3,
            //y = 1,
            z = x / 4;
            return Math.pow(2, -10 * p) * Math.sin((p - z) * (2 * Math.PI) / x) + 1;
        },
        elasticBoth: function(p) {
            if (p == 0) return 0;
            if ((p /= 0.5) == 2) return 1;
            var x = 0.3 * 1.5,
            //y = 1,
            z = x / 4;
            if (p < 1) return -0.5 * (Math.pow(2, 10 * (p -= 1)) * Math.sin((p - z) * (2 * Math.PI) / x));
            return Math.pow(2, -10 * (p -= 1)) * Math.sin((p - z) * (2 * Math.PI) / x) * 0.5 + 1;
        },
        backIn: function(p) {
            var s = 1.70158;
            return p * p * ((s + 1) * p - s);
        },
        backOut: function(p) {
            var s = 1.70158;
            return ((p = p - 1) * p * ((s + 1) * p + s) + 1);
        },
        backBoth: function(p) {
            var s = 1.70158;
            if ((p /= 0.5) < 1) return 1 / 2 * (p * p * (((s *= (1.525)) + 1) * p - s));
            return 1 / 2 * ((p -= 2) * p * (((s *= (1.525)) + 1) * p + s) + 2);
        },
        bounceIn: function(p) {
            return 1 - $Easing.bounceOut(1 - p);
        },
        bounceOut: function(p) {
            if (p < (1 / 2.75)) {
                return (7.5625 * p * p);
            } else if (p < (2 / 2.75)) {
                return (7.5625 * (p -= (1.5 / 2.75)) * p + 0.75);
            } else if (p < (2.5 / 2.75)) {
                return (7.5625 * (p -= (2.25 / 2.75)) * p + 0.9375);
            }
            return (7.5625 * (p -= (2.625 / 2.75)) * p + 0.984375);
        },
        bounceBoth: function(p) {
            if (p < 0.5) return $Easing.bounceIn(p * 2) * 0.5;
            return $Easing.bounceOut(p * 2 - 1) * 0.5 + 0.5;
        }
    },
    $AnimHook = {},
    $DragHook = {},
    $Drag = $Class.extend({
        init: function(elem, options){
            this.elem = elem;
            this.time = 0;
            var config = {
                before: 0,//拖动前
                after: 0,//拖动完成
                runing: 0,//拖动中
                clone: 0,//是否clone节点
                lockx: 0,//锁定x方向
                locky: 0,//锁定y方向
                range: -1//拖动范围控制
            };
            
            for(var ex in config){
                this['_'+ ex] = (ex in options ? options : config)[ex];
            }
    
            this.addHand(options.hand || elem);
            
        },
        
        addHand: function(hand){
            $bind(hand, 'mousedown', this._beforeDrag, this);
        },
        
        rmvHand: function(hand){
            $bind(hand, 'mousedown', this._beforeDrag, this);
        },
        _init: function(evt){
            this._hasInit = 1;
            var elem = this.elem, box = elem,
                offset = $offset(elem),
                marginLeft = $cssnum(elem, 'marginLeft'),
                marginTop = $cssnum(elem, 'marginTop');
            
            if(this._clone){
                var clone = $clone(elem, true);
                $css(clone, {
                    position: 'absolute',
                    zIndex: 9999,
                    left: offset.left - marginLeft,
                    top: offset.top - marginTop,
                    width: $cssnum(elem, 'width'),
                    height: $cssnum(elem, 'height')
                });
                $append($DOC.body, clone);
                box = this._clone = clone;
            }
            this._style = box.style;
            
            this._offsetX = evt.clientX - box.offsetLeft + marginLeft;
            this._offsetY = evt.clientY - box.offsetTop + marginTop;
            this._before && this._before.call(this, evt);
            if(this._range == -1){//限制在窗口内
                this._minX = 0;
                this._minY = 0;
                this._maxX = $DE.clientWidth - box.offsetWidth - marginLeft - $cssnum(box, 'marginRight');
                this._maxY = $DE.clientHeight - box.offsetHeight - marginTop - $cssnum(box, 'marginBottom');
            }else if(this._range){
                var range = $query(this._range),
                    ro = $offset(range),
                    rw = range.offsetWidth,
                    rh = range.offsetHeight,
                    bl = $cssnum(range, 'borderLeftWidth'),
                    br = $cssnum(range, 'borderRightWidth'),
                    bt = $cssnum(range, 'borderTopWidth'),
                    bb = $cssnum(range, 'borderBottomWidth');
                this._minX = ro.left + bl;
                this._minY = ro.top + bt;
                this._maxX = ro.left + rw - br - box.offsetWidth - marginLeft - $cssnum(box, 'marginRight');
                this._maxY = ro.top + rh - bb - box.offsetHeight - marginTop- $cssnum(box, 'marginBottom');
                
                
            }
            
        },
        
        _beforeDrag: function(evt){
            if(evt.mouseKey != 'L' || (this._lockx && this._locky)){
                return;
            }
            
            evt.stopPropagation();
            evt.preventDefault();
            this._hasInit = 0;
            
            if($browser.ie){
                this._focusHand = evt.target;
                $bind(this._focusHand, 'losecapture', this._drop, this);
                this._focusHand.setCapture(false);
            }else{
                $bind($WIN, 'blur', this._drop, this);
            }
            
            $bind($DOC, 'mousemove', this._draging, this);
            $bind($DOC, 'mouseup', this._drop, this);
        },
        
        _draging: function(evt){
            
            ///*进行过滤
            var now = +new Date;
            if(now - this.time > 15){
                this.time = now;
            }else{
                return;
            }
            //*/
    
            $WIN.getSelection ? $WIN.getSelection().removeAllRanges() : $DOC.selection.empty();
            !this._hasInit && this._init(evt);
            
            var left = evt.clientX - this._offsetX,
                top = evt.clientY - this._offsetY;
            if(this._range){
    
                left = Math.max(this._minX, Math.min(left, this._maxX));
                top = Math.max(this._minY, Math.min(top, this._maxY));
            }
            
            !this._lockx && (this._style.left = left +'px');
            !this._locky && (this._style.top = top +'px');
            this._runing && this._runing.call(this, evt);
        },
        _drop:function(evt){
            $unbind($DOC, 'mousemove', this._draging, this);
            $unbind($DOC, 'mouseup', this._drop, this);
            
            if($browser.ie){
                $unbind(this._focusHand, 'losecapture', this._drop, this);
                this._focusHand.releaseCapture();
            }else{
                $unbind($WIN, 'blur', this._drop, this);
            }
            this._after && this._after.call(this, evt);
            if(this._clone && this._clone.parentNode){
                $remove(this._clone);
            }
            
        },
        set: function(options){
            for(var e in options){
                this[e] = options[e];
            }  
        },
        lock: function(){
            this._lockx = true;
            this._locky = true;
        },
        unlock: function(){
            this._lockx = false;
            this._locky = false;
        }
        
    
    });
    function $cookie(name, value, options){
        if(typeof name == 'object'){ //setCookies
            for(var e in name){
                $cookie(e, name[e], value);
            }
        }else{
            if(typeof value != 'undefined'){ //setCookie or deleteCookie
            
                var str = name + "=" + encodeURIComponent(value);
                if(value === null){ //value === null ,则设置cookie为过期
                    options.expires = -1;
                }else if(typeof options == 'number'){
                    options = {expires: options};
                }else{
                    options = options || {};
                }
                if(options.expires){
                    var exp = new Date;
                    exp.setTime(+exp + options.expires * 60 * 1000); //以分钟为单位
                    str += "; expires=" + exp.toUTCString();
                }
                if(options.path){
                    str += "; path=" + options.path;
                }
                if(options.domain){
                    str += "; domain=" + options.domain;
                }
                $DOC.cookie = str;
            }else{ //getCookie
                return (v = $DOC.cookie.match('(?:^|;)\\s*' + name + '=([^;]*)'))
                    ? decodeURIComponent(v[1]) : null;
            }
        }
    }
    function $noop(){}
    function $ready(fn){
        var 
        isReady = false, //判断是否触发onDOMReady
        readyList = [], //把需要执行的方法先暂存在这个数组里
        ready = function(fn) {
            isReady ? fn($1k) : readyList.push(fn);
        },
        onReady = function(){
            if(isReady)return;
            isReady = true;
            for(var i = 0, lg = readyList.length; i < lg; i++){
                readyList[i]($1k);
            } 
            if($DOC.removeEventListener){
                $DOC.removeEventListener('DOMContentLoaded', onReady, false);
            }else if($DOC.attachEvent){
                $DOC.detachEvent('onreadystatechange', onReady);
                if(timer){
                    clearInterval(timer);
                    timer = null;
                }
            }
            readyList = null;
            onReady = null;
        };
        if($DOC.readyState == 'complete'){
            onReady();
        }else if($DOC.addEventListener){
            $DOC.addEventListener('DOMContentLoaded', onReady, false);
        }else if($DOC.attachEvent){
            $DOC.attachEvent('onreadystatechange', function(){
                /loaded|complete/.test($DOC.readyState) && onReady && onReady();
            });
            
            try {
                var toplevel = $WIN.frameElement == null;
            }catch(e){}
            
            if(toplevel){
                var timer = setInterval(function(){
                    try{
                        isReady || $DOC.documentElement.doScroll('left'); //在IE下用能否执行doScroll判断dom是否加载完毕
                        //http://javascript.nwbox.com/IEContentLoaded/
                    }catch(e){
                        return;
                    }
                    onReady();
                }, 16);
            }
        }
        ($ready = ready)(fn);
    };
    function $Evt(evt){
        var _evt = {
            origin: evt,
            type: evt.type,
            keyCode: evt.keyCode,
            clientX: evt.clientX,
            clientY: evt.clientY,
            target: evt.target || evt.srcElement,
            fromTarget: evt.fromElement || (evt.type == 'mouseover' ? evt.relatedTarget : null),
            toTarget: evt.toElement || (evt.type == 'mouseout' ? evt.relatedTarget : null),
            stopPropagation: function(){
                evt.stopPropagation 
                    ? evt.stopPropagation() 
                    : (evt.cancelBubble = true);
            },
            mouseKey: ($browser.ie ? {1: 'L', 4: 'M', 2: 'R'} : {0: 'L', 1: 'M', 2: 'R'})[evt.button],
            preventDefault: function(){
                evt.preventDefault 
                    ? evt.preventDefault()
                    : (evt.returnValue = false);
            },
            delta: evt.type == 'mousewheel' 
                ? evt.wheelDelta
                : evt.type == 'DOMMouseScroll'
                    ? evt.detail * -40
                    : null
        };
        return _evt;
    }
    function $bind(node, type, func, context){
        if(!node.__EVENTID__){//没有有事件队列
            $EventHook[node.__EVENTID__ = ++$GUID] = [];
        }
        var EQ = $EventHook[node.__EVENTID__];
        if(!EQ[type]){//无该类型的事件队列
            EQ[type] = [];
            $addEvent(node, type, function(evt){
                var Q = EQ[type].slice(0);
                while(Q[0]){
                    Q[0].func.call(Q[0].context, $Evt(evt));
                    Q.shift();
                }
            });
        }
        EQ[type].push({
            func: func,
            context: context || node
        });
        return this;
    }
    function $unbind(node, type, func, context){
        var Q = $EventHook[node.__EVENTID__][type], i = 0;
        while(Q[i]){
            if(Q[i].func == func && (Q[i].context == (context || node) || (context.__DOM__ && context.elem == Q[i].context.elem))){
                Q.splice(i, 1);
                break;
            }
            i++;
        }
        return this;
    }
    function $1k(selector, context){
        switch($type(selector)){
            case 'function':
                return $ready(selector);
            case 'element':    
            case 'window':    
            case 'document':    
            case 'array':
                return new $Dom(selector);
            case 'string':
                if(selector.indexOf('<') == 0){ //html
                    return $1k($elem(selector));
                }
                return $1k($query(selector, context));
            
        }
        return null;
    }
    function $Dom(elements){
        //$DP
        if($isArray(elements)){
            this.elems = elements;
            this.elem = elements[0];
        }else{
            this.elem = elements;
        }
        this.__DOM__ = 1;
    }
    function $box(func, arg1, arg2, arg3){
        var result = func.call(this, this.elem, arg1, arg2, arg3);
        if(this.elems && result == this){
            var i = 1;
            while(this.elems[i]){
                func.call(this, this.elems[i], arg1, arg2, arg3);
                i++;
            }
            return this;
        }else{
            return result;
        }
    }
    function $elem(node){
        if($isElement(node))return node;
        if($isDom(node))return node.elem;
        
        if(~node.indexOf('<')){ //非标准创建节点
            var prarent = $DOC.createElement('div');
            prarent.innerHTML = $tirm(node);
            return prarent.firstChild;
        }else{
            return $DOC.createElement(node);
        }
    }
    function $parent(node, selector){
        if(selector == undefined){
            return node.parentNode;
        }else if(selector > 0){
            selector++;
            while(selector--){
                node = node.parentNode;
            }
            return node;
        }else{
            selector = selector.match(/^(?:#([\w\-]+))?\s*(?:(\w+))?(?:.([\w\-]+))?(?:\[(.+)\])?$/);
            if(selector){
                var id = selector[1],
                    tag = selector[2],
                    cls = selector[3],
                    attr = selector[4];
                tag = tag && tag.toUpperCase();
                attr = attr && attr.split('=');
            }else{
                return null;
            }
            
            while(node = node.parentNode){
                if(
                    (!id || node.id == id)
                    && (!cls || cls && $hcls(node, cls))
                    && (!tag || node.nodeName == tag)
                    && (!attr || $attr(node, attr[0]) == attr[1])
                ){
                    return node;
                }
            }    
            
        }
        return null;
    }
    function $offset(node){
        var top = 0, left = 0;
        if ('getBoundingClientRect' in $DE){
            //jquery方法
            var 
            box = node.getBoundingClientRect(), 
            body = $DOC.body, 
            clientTop = $DE.clientTop || body.clientTop || 0, 
            clientLeft = $DE.clientLeft || body.clientLeft || 0,
            top  = box.top  + ($WIN.pageYOffset || $DE && $DE.scrollTop  || body.scrollTop ) - clientTop,
            left = box.left + ($WIN.pageXOffset || $DE && $DE.scrollLeft || body.scrollLeft) - clientLeft;
        }else{
            do{
                top += node.offsetTop || 0;
                left += node.offsetLeft || 0;
                node = node.offsetParent;
            } while (node);
        }
        return {left: left, top: top, width: node.offsetWidth, height: node.offsetHeight};
    }
    function $cssnum(node, attr){
        var val = +$rmvpx($css(node, attr)) || 0;
        if(/^width|height|left|top$/.test(attr)){
            switch(attr){
                case 'left': return val || node.offsetLeft - $cssnum(node, 'marginLeft');
                case 'top': return val || node.offsetTop - $cssnum(node, 'marginTop');
                case 'width': return val
                    || (node.offsetWidth
                        - $cssnum(node, 'paddingLeft')
                        - $cssnum(node, 'paddingRight')
                        - $cssnum(node, 'borderLeftWidth')
                        - $cssnum(node, 'borderRightWidth')
                    );
                case 'height': return val
                    || (node.offsetHeight
                        - $cssnum(node, 'paddingTop')
                        - $cssnum(node, 'paddingBottom')
                        - $cssnum(node, 'borderTopWidth')
                        - $cssnum(node, 'borderBottomWidth')
                    );
            }
        }
        return val;
    }
    function $left(node, value){
        if(value != undefined){
            $css(node, 'left', value);
            return this;
        }
        return $cssnum(node, 'left');
    }
    function $top(node, value){
        if(value != undefined){
            $css(node, 'top', value);
            return this;
        }
        return $cssnum(node, 'top');
    }
    function $width(node, value){
        if(value != undefined){
            $css(node, 'width', value);
            return this;
        }
        return $cssnum(node, 'width');
    }
    function $height(node, value){
        if(value != undefined){
            $css(node, 'height', value);
            return this;
        }
        return $cssnum(node, 'height');
    }
    function $tag(node, nodeName){
        if(typeof nodeName != 'undefined'){
            return nodeName == node.nodeName;
        }
        return node.nodeName;
    }
    function $val(node, val){
        if(val == undefined)return node.value.replace(/^\s+|\s+$/g, '');
        node.value = val;
        return this;
    }
    function $clone(node, flag){
        node = node.cloneNode(flag);
        return node;
    }
    function $replace(node, newNode){
        node.parentNode.replaceChild($elem(newNode), node);
        return this;
    }
    function $append(node, newNode, index){
        if($isArray(newNode)){
            var root = $DOC.createDocumentFragment();
            $each(newNode, function(elem){
                root.appendChild($elem(elem));
            });
            newNode = root;
        }else{
            newNode = $elem(newNode);
        }
        if(index == undefined){
            node.appendChild(newNode);
            return this;
        }
        var child = node.children;
        if(index > -1){
            child = child[index];
        }else if(index < 0){
            child = child[Math.max(child.length + index + 1, 0)];
        }
        if(child){
            child.parentNode.insertBefore(newNode, child);
        }else{
            node.appendChild(newNode);
        }
        return this;
    }
    function $html(node, html){
        var type = typeof html,
            _html = '';
        if(type == 'undefined'){
            return node.innerHTML;
        }else if(type == 'function'){
            _html = html();
        }else if(type == 'object'){
            $each(html, function(html){
                _html += html;
            });
        }else{
            _html = html;
        }
        if(node.nodeName == 'SELECT' && type != 'undefined' && $browser.ie){
            var s = document.createElement('span');
            s.innerHTML = '<select>' + _html + '</select>';
            node.innerHTML = '';
            $each($query('option', s), function(option){
                node.appendChild(option);
            });
        }else{
            node.innerHTML = _html;
        }
        return this;
    }
    function $remove(node){
        node.parentNode.removeChild(node);
        return this;
    }
    function $attr(node, name, value){
        if(value === null){
            node.removeAttribute(name);
        }else if(value != undefined){
            if(typeof name == 'object'){
                for(var attr in name){
                    $attr(node, attr, name[attr]);
                }
            }else{
                if(name == 'style'){
                    node.style.cssText = value;
                }else{
                    if(node[name] != undefined){//优先设置js属性
                        node[name] = value;
                    }else{
                        node.setAttribute(name, value, 2);
                    }
                }
            }
        }else{
            if(name == 'style'){
                return node.style.cssText;
            }else{
                if(name == 'href' && node.nodeName == 'A'){
                    return node.getAttribute(name, 2);
                }else{    
                    if(node[name] != undefined){//优先获取js属性
                        return node[name];
                    }else{
                        var val = node.getAttribute(name);
                        return val == null ? void(0) : val;
                    }
                }
            }
        }
        return this;
    }
    function $contains(pnode, cnode){
        if(cnode == pnode)return 1;
        return pnode.contains 
            ? pnode.contains(cnode) 
                ? 2 : 0
            : pnode.compareDocumentPosition(cnode)
                ? 2 : 0;
        /*
        if(pnode.contains){//ie下判断是不是属于contains容器中的节点
            console.info(pnode,cnode);
            if(pnode.contains(cnode)){
                return 2;
            }
        }else if(pnode.compareDocumentPosition){//非ie下判断
            if(pnode.compareDocumentPosition(cnode) == 20){
                return 2;
            }
        }//*/
        return 0;
    }
    function $query(){
        var
        rQuickExpr = /^([#.])?([\w\-]+|\*)$/,
        rChildExpr = /^(?:#([\w\-]+))|([\w-]+)?(?:\.([\w\-]+))?(?:\[(.+)\])?$/, //[id,tag,cls,attr]
        rChildExpr2 = /(?:[\w\-]+)?(?:\.[\w\-]+)?(?:\[.+\])?/.source,
        rAllExpr = RegExp('^(#[\\w\\-]+|'+rChildExpr2+')(?:\\s+('+rChildExpr2+'))$'),
        suportSel = $DOC.querySelectorAll,
        uid = 0;
        return ($query = query).apply(null, arguments);
        function query(selector, context){
            var
            result,
            elems,
            match = rQuickExpr.exec(selector),
            m1, m2;
            if(match){ //快速匹配 #id,.cls,tag
                m1 = match[1];
                m2 = match[2];
                if(m1 == '#'){
                    return $DOC.getElementById(m2);
                }
                if(m1 == '.'){
                    if($DOC.getElementsByClassName){
                        return makeArray((context || $DOC).getElementsByClassName(m2));
                    }else{
                       return filterByClassName(query('*', context), m2);
                    }
                }
                return makeArray((context || $DOC).getElementsByTagName(m2));
            }
            if(suportSel){
                
                if(context && context.nodeType != 9 ){
                    var 
                    oldid = context.id,
                    fixid = '_queryFix_';
                    selector = '#' + (context.id = fixid) + ' '+ selector;
                }
                
                (elems = (context || $DOC).querySelectorAll(selector)) && (elems = unique(elems));
                fixid && (oldid ? (context.id = oldid) : context.removeAttribute('id'));
                return elems.length ? elems : null;
            }else{
                
                if(~selector.indexOf(',')){
                    result = [];
                    forEach(selector.split(','), function(selector){
                        (elems = query(selector, context)) && (elems.length ? (result = result.concat(elems)) : result.push(elems));
                    });
                    return result.length ? unique(result) : null;
                }else{
                    match = rAllExpr.exec(selector);
    
                    if(match){ //#id tag
                        m1 = match[1];
                        m2 = match[2];
                        elems = query(m1, context);
                        
                        if(elems){
                            if(m2){ //=> #id tag.cls[attr=val] 
                                result = [];
                                var ret;
                                forEach(elems.length ? elems : [elems], function(context){
                                    (ret = query(m2, context)) && (ret.length ? (result = result.concat(ret)) : result.push(ret));
                                });
                                
                                return result.length ? unique(result) : null;
                            }else{
                                return elems;
                            }
                        }
                        return null; 
                    }else{
                        match = rChildExpr.exec(selector);
                        if(match){
                            var 
                            id = match[1],
                            tag = match[2],
                            cls = match[3],
                            attr = match[4];
                            if(id){
                                return query(id);
                            }
                            elems = query(tag || '*', context);
                            cls && (elems = filterByClassName(elems, cls));
                            attr && (elems = filterByAttr(elems, attr));
                            return elems;
                        }
                        return null;
                    } 
                }
            }
        }
        function forEach(arr, fn){
            if(arr && arr.length){
                for(var i = 0, lg = arr.length; i < lg; i++){
                    fn(arr[i], i);
                }
            }
        }
        function makeArray(elems){
            if(!elems){
                return null;
            }
            var result = [];
            if(+[1,]){
                result = [].slice.call(elems, 0);
            }else{
                forEach(elems, function(elem){
                    result.push(elem);
                });
            }
            return result.length ? result : null;
        }
        function unique(elems){
            ++uid;
            var result = [];
            forEach(elems, function(elem){
                if(elem._forUnique_ != uid){
                    elem._forUnique_ = uid;
                    result.push(elem);
                }
            });
            return result;
        }
        function filterByClassName(elems, className){
            var
            rClassName = RegExp('(^|\\s+)'+ className +'($|\\s+)'),
            result = [];
            forEach(elems, function(elem){
                rClassName.test(elem.className) && result.push(elem); 
            });
            return result.length ? result : null;
        }
        function filterByAttr(elems, attr){
            var 
            result = [],
            key, val;
            attr = attr.split('=');
            if(attr.length == 2){
                key = attr[0];
                val = attr[1] || '';
            }
            forEach(elems, function(elem){
                if(val){
                    (elem.getAttribute(key) == val) && result.push(elem);
                }else{
                    elem.hasAttribute(attr) && result.push(elem);
                }
                
            });
            return result.length ? result : null;  
        }
    }
    function $prev(node){
        while(node = node.previousSibling){
            if(node.nodeType == 1){
                return node;
            }
        }
    }
    function $next(node){
        while(node = node.nextSibling){
            if(node.nodeType == 1){
                return node;
            }
        }
    }
    function $child(node, index){
        var child = node.children;
        if(index > -1){
            child = child[index];
        }else if(index < 0){
            child = child[child.length + index];
        }else if(typeof index == 'string'){
            var returns = [];
            $each($query(index, node) || returns, function(elem){
                (elem.parentNode == node) && returns.push(elem);
            });
            return returns.length ? returns : null;
        }
        return child;
    }
    function $show(node){
        node.style.display = 'block';
        return this;
    }
    function $hide(node){
        node.style.display = 'none';
        return this;
    }
    function $opacity(node, opacity){
        if($browser.ie && $browser.ie < 9){
            var 
            filter = node.currentStyle.filter,
            hasAlpha = filter && /alpha/i.test(filter),
            filterStr;
            if(opacity === undefined){
                if(hasAlpha){
                    return +filter.match(/opacity[\s:=]+(\d+)/i)[1]/100;
                }
                return 1;
            }
            
            if(opacity >= 1 || opacity == null){
                // IE6-8设置alpha(opacity=100)会造成文字模糊
                filterStr = filter.replace(/alpha[^\)]+\)/i, '');
            }else{
                opacity = Math.round(opacity * 100);//必须转成整数
                if(hasAlpha){
                    filterStr = filter.replace(/(opacity\D+)\d+/i, 'opacity='+ opacity);
                }else{
                    filterStr = filter +' '+ 'alpha(opacity=' + opacity + ')';
                }
            } 
            node.style.filter = filterStr;
        }else{
            if(opacity === undefined){
                return (opacity = +$css(node, 'opacity')) > -1 ? opacity : 1;
            }
            node.style.opacity = opacity;
        }
        return this;
    }
    function $hcls(node, cls){
        return RegExp('(^|\\s)' + cls + '($|\\s)').test(node.className);
    }
    function $cls(node, cls, cls2){
        
        if(cls2){
            if(node.className){
                node.className = (' ' + node.className + ' ')
                    .replace(RegExp('\\s+(' + cls2 + ')(?=\\s+)'), cls)
                    .replace(/^\s+|\s+$/g, '');//清除头尾空格;
            }
            
        }else if(cls){
            var _exp = cls.charAt(0),
                _cls = cls.substr(1);
            if(/[+~-]/.test(_exp)){
                var 
                ncls = node.className;
                _cls = _cls.split(',');
                switch(_exp){
                    case '+':
                        if(ncls){//假如不为空，需要判断是否已经存在
                        
                            $each(_cls, function(val, i){
                                if(!$hcls(node, val)){
                                    node.className += ' ' + val;
                                }
                            });
                        }else{
                            node.className = _cls.join(' ');
                        }
                        break;
                    case '-':
                        if(ncls){
                            node.className = (' ' + ncls + ' ')
                                .replace(RegExp('\\s+(' + _cls.join('|') + ')(?=\\s+)', 'g'), '')//替换存在的className
                                .replace(/^\s+|\s+$/g, '');//清除头尾空格
                        }
                        break;
                    case '~':
                        if(ncls){
                            $each(_cls, function(val, i){
                                if(!$hcls(node, val)){
                                    node.className += ' ' + val;
                                }else{
                                    $cls(node, '-'+ val);
                                }
                            });
                        }else{
                            node.className = _cls.join(' ');
                        }
                        break;
                }
            }else if(_exp == '='){
                node.className = _cls;
                return this;
            }else{
                _cls = cls.split(',');
                var ret = true;
                $each(_cls, function(val, i){
                    return !(ret = ret && $hcls(node, val));
                });
                return ret;
            }
        }else{
            return node.className;
        }
        return this;
    }
    function $rmvpx(val){
        return /px$/.test(val) ? parseFloat(val) : val;
    }
    function $fixStyleName(name){
        if(name == 'float'){
            return $WIN.getComputedStyle ? 'cssFloat' : 'styleFloat';
        }
        return name.replace(/-(\w)/g, function(_, $1){
            return $1.toUpperCase();
        });
    }
    function $css(node, name, value){
        if(value !== undefined){
            
            name == 'opacity' && $browser.ie < 9
                ? $opacity(node, value)
                : (node.style[name = $fixStyleName(name)] = 
                    value < 0 && /width|height|padding|border/.test(name) 
                        ? 0 //修正负值
                        : value + (/width|height|left|top|right|bottom|margin|padding/.test(name) && /^[\-\d.]+$/.test(value) 
                            ? 'px'  //增加省略的px
                            : '')
                );        
        }else if(typeof name == 'object'){
            for(var key in name){
                $css(node, key, name[key]);
            }
        }else{
            if(~name.indexOf(':')){ //存在:,比如'background:red'
                $each(name.replace(/;$/, '').split(';'), function(cssText){      
                    cssText = cssText.split(':');
                    $css(node, cssText.shift(), cssText.join(':'));
                    //?$css(node,cssText[0],cssText[1]);//background:url(http://www....)bug
                });
            }else{
                return name == 'opacity' && $browser.ie < 9
                    ? $opacity(node)
                    : node.style && node.style[name = $fixStyleName(name)]
                        || (node.currentStyle || getComputedStyle(node, null))[name];
            }
        }
        return this;
    }
    function $each(obj, fn, context){
        if($isArray(obj)){
            for(var i = 0, lg = obj.length; i < lg; i++){
                if(fn.call(context, obj[i], i)){
                    break;
                }
            }
        }else{
            for(var i in obj){
                if(fn.call(context, obj[i], i)){
                    break;
                }
            }
        }
    }
    function $toJson(obj){
        switch(typeof obj){
            case 'object':
                if(obj == null){
                    return obj;
                }
                var E, _json = [];
                if(Object.prototype.toString.apply(obj) == '[object Array]'){
                    for(var e = 0, L = obj.length; e < L; e++){
                        _json[e] = arguments.callee(obj[e]);
                    }
                    return '[' + _json.join(',') + ']';
                }
                for(e in obj){
                    _json.push('"' + e + '":' + arguments.callee(obj[e]));
                }
                return '{' + _json.join(',') + '}';
            case 'function':
                obj = '' + obj;
            case 'string':
                return '"' + obj.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n') + '"';
            case 'number':
            case 'boolean':
            case 'undefined':
                return obj;
        }    
        return obj;
    }
    function $param(obj, nocache){
        var query = [];
        if(typeof obj == 'object'){
            for(var E in obj){
                if(/^e_/.test(E)){
                    query.push(E.substr(2) + '=' + $encodeURL(obj[E]));
                }else{
                    query.push(E + '=' + obj[E]);
                }
            }
        }
        if(nocache)query.push('t=' + (+new Date));
        return query.join('&');
    }
    function $mix(target, source){
        for(var key in source){
            target[key] = source[key];
        }
    }
    function $isArray(obj){
        return $type(obj) == 'array';
    }
    function $isFunction(obj){
        return typeof obj == 'function';
    }
    function $isElement(obj){
        return $type(obj) == 'element';
    }
    function $isDom(obj){
        return obj && obj.__DOM__;
    }
    function $isObject(obj){
        return $type(obj) == 'object';
    }
    function $type(obj){
        var type = typeof obj;      
        if(type == 'object'){
            if(obj === null ){
                return 'null';
            }else if(obj == $WIN || obj == obj.window){
                return 'window';
            }else if(obj == $DOC || obj.nodeType === 9){
                return 'document';
            }
            type = {}.toString.call(obj).match(/\w+(?=\])/)[0].toLowerCase();
            if(~type.indexOf('element') || type == 'object' && obj.nodeType === 1){
                return 'element';
            }
        }
        return type;
    }
    /*
        alert($type(/a/));
        alert($type(document.getElementsByTagName('div')[0]));
        alert($type(null));
        alert($type(void 0));
        alert($type(new Date));
        alert($type(function(){}));
        alert($type([]));
        alert($type(2121));
        alert($type(true));
        alert($type(window));
        alert($type(document));
    */
    function $ajax(options){
        var 
        t1 = +new Date,
        xhr = new $XHR,
        callback = options.callback,
        headers = options.headers,
        key;
        xhr.open(options.type || 'get', options.url, options.async || true);
        for(key in headers) { //设置发送的头
            xhr.setRequestHeader(key, headers[key]);
        }
        xhr.onreadystatechange = function(){
            xhr.readyState == 4 && callback && callback(
                xhr.status == 200 
                ? options.responseType 
                    ? xhr[options.responseType] 
                    : xhr
                : null
            );
        };
        xhr.send(options.data || null);
    }
    function $post(url, callback, data){ //post经典版封装
        $ajax({
            url: url,
            type: 'post',
            data: $isObject(data) ? $param(data) : data,
            callback: function(responseText){
                //try{
                    callback($parseJson(responseText));
                //}catch(e){
                  //  callback(null);
               // }
            },
            responseType: 'responseText',
            headers: { //post必须给http头设置Content-Type
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
    }
    function $get(url, callback, data){ //get经典版封装
        $ajax({
            url: url + (data ? '?'+ ($isObject(data) ? $param(data) : data) : ''),
            callback: function(responseText){
                
                //try{
                    callback($parseJson(responseText));
                //}catch(e){
                    //console.info(e.message);
                    //callback(null);
                //}
            },
            responseType: 'responseText'
        });
    }
    ;;;;
    function $img(url, callback){
        var img = new Image;
        img.src = url;
        
        if(img.complete){
            return done(img);
        }
        img.onload = function () {
            done(img);
        };
        img.onerror = function(){
            done(null);
        };
        function done(result){
            img.onload = img.onerror = null;
            callback && callback(result, result);
        }
        return this;
    }
    function $js(url, callback, data, charset){
        var script = $DOC.createElement('script');
        data && (url += '?' + (typeof data == 'object' ? $param(data) : data));
        charset && (script.charset = charset);
        script.src = url;
        script.readyState
            ? script.onreadystatechange = function(){
                /loaded|complete/.test(script.readyState) && done();
            }
            : script.onload = done;
        $HEAD.appendChild(script);
        return this;
        function done(){
            callback && callback();
            $HEAD.removeChild(script);
            script.onload = script.onreadystatechange = null;
        }
    }
    function $style(cssText){
        $isArray(cssText) && (cssText = cssText.join(''));
        if(/{[\w\W]+?}/.test(cssText)){ //cssText
            var style = $DOC.createElement('style');
            style.type = 'text/css';
            style.styleSheet && (style.styleSheet.cssText = cssText) || style.appendChild($DOC.createTextNode(cssText));    
        }else{
            style = $DOC.createElement('link');
            style.rel = 'stylesheet';
            style.href = arg1;
        }
        $HEAD.appendChild(style);
        return this;
    }
    function $jsonp2(url, callback, charset, timeout){
        var s = $DOC.createElement('script'),
            callbackName = 'json' + (++$GUID),
            tr = setTimeout(function(){//超时则放弃请求
                $HEAD.removeChild(s);
                delete $WIN[callbackName];
            }, timeout || 10000);
        
        $WIN[callbackName] = function(result){
            clearTimeout(tr);
            callback(result);
        };
        s.src = 'http://jsonp2.1kjs.com/?' + $param({
            charset: charset || 'utf-8',
            callback: callbackName,
            e_url: url
        }, true);
        charset && (s.charset = charset);
        $HEAD.appendChild(s);
        if(s.readyState){
            s.onreadystatechange = function(){
                if(s.readyState == 'loaded' || s.readyState == 'complete'){
                    //callback&&callback();
                    $HEAD.removeChild(s);
                }
            };
        }else{
            s.onload = function(){
                //callback&&callback();
                $HEAD.removeChild(s);
            };
        }
        return this;
    }
    function $encodeHTML(str){
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function $decodeHTML(str){
        return str.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    }
    function $encodeURL(str){
        return str
            .replace(/%/g, '%25')
            .replace(/ /g, '%20')
            .replace(/#/g, '%23')
            .replace(/&/g, '%26')
            .replace(/=/g, '%3D')
            .replace(/\//g, '%2F')
            .replace(/\?/g, '%3F')
            .replace(/\+/g, '%2B');
    }
    function $tirm(str){
        return str.replace(/^\s+|\s+$/g, '');
    }
    function $parseJson(str){
        try{
            str = $tirm(str);
            if(!str.replace(/"(?:\\\\|\\\"|[^"])*"|[\s{}\[\]:\d.,]+|true|false/g, '')){ //说明JSON数据符合要求
                return Function('return ' + str)();
            }
        }catch(e){}
        throw new SyntaxError('JSON.parse');
    }
    function $Anim(elem, attrs, options){
        
        var drawId;
        var onstop;
        play(attrs, options || {});
        
        return {
            play: play,
            stop: function(){
                stop();
                onstop && onstop();
            }
        };
        
        function play(attrs, options){
            if(typeof options == 'number'){
                options = {
                    dur: options
                };
            }
            options.onbefore && options.onbefore();
            onstop = options.onstop;
            
            var style = elem.style;
            var easing = $Easing[options.easing] || $Easing.Both;
            var onplay = options.onplay;
            var ondone = options.ondone;
            var dur = options.dur || 800;
            var time0 = +new Date;
            var per;
            var cache_per = 0;
            var attrsObj = fromatAttrs(attrs);
            var attrs = attrsObj.attrs;
            var from = attrsObj.from;
            var by = attrsObj.by;
            var fixAttrs = attrsObj.fixAttrs;
            var ceil = Math.ceil;
            drawId = $draw(function(){
                
                per = (+new Date - time0) / dur;
                if(per >= 1){ //完成进度，则清除draw
                    per = 1;
                    stop();
                }else{
                    per = ~~(easing(per) *10000)/10000; //精确保留4位小数
                }
                
                if(cache_per != per){ //由于定时器存在精度问题，所以在下一帧中per未必发生改变
                    cache_per = per;
                    
                    var attr, i = 0;
                    while(attr = attrs[i]){
                        style[attr] = ceil(from[i] + per * by[i++]) + 'px';
                    }
                    if(attr = fixAttrs.opacity){
                        $opacity(elem, attr.from + per * attr.by);
                    }
                    onplay && onplay();
                    if(per == 1){
                        ondone && ondone();
                    }
                }
                
            });
        }
        
        function fromatAttrs(attrsIn){
            var attrs = [];
            var from = [];
            var by = [];
            var fixAttrs = {};
            var value; //传入参数
            var fromValue; //起始位置
            var byValue; //改变量
            var isRelative; //是否是相对改变
            
            for(var attr in attrsIn){
                value = attrsIn[attr];
                if(typeof value != 'number'){
                    value = parseInt(value);
                }
    
                if(isRelative = attr.indexOf('x') == 0){
                    attr = attr.substr(1);
                    fromValue = $cssnum(elem, attr);
                    byValue = value;
                }else{
                    fromValue = $cssnum(elem, attr);
                    byValue = value - fromValue;
    
                }
                
                if(/opacity/.test(attr)){
                    var fromValue = $opacity(elem);
                    fixAttrs['opacity'] = {
                        from: fromValue,
                        by: isRelative ? byValue : value - fromValue
                    };
                }else{
                    attrs.push(attr);
                    from.push(fromValue);
                    by.push(byValue);
                }
                
            }
            return{
                attrs: attrs,
                from: from,
                by: by,
                fixAttrs: fixAttrs
            };
        }
    
        function stop(){
            $draw.clear(drawId);
        }
    
    }
    function $draw(fn, hook){
        var list = [], //函数列表
            ids = {}, //hooks
            tr, //定时器句柄
            fpsClick = [], //帧打点
            info = { //监控数据
                execTime: 0,
                list: [],
                fps: 0
            };
            
        $draw = draw;
        draw.clear = clear;
        draw.info = getInfo;
        
        return draw(fn, hook);
        
        function draw(fn, hook){
            clear(hook);
            
            var id = ++$GUID;
            ids[id] = 1;
            list.push({
                id: id,
                fn: fn
            });
            if(list.length == 1){
                start();
            }
            return id;
        }
        
        function clear(hook){
            if(ids[hook]){
                delete ids[hook];
                var item, i = 0;
                while(item = list[i++]){
                    if(item.id == hook){
                        list.splice(i-1, 1);
                        break;
                    }
                }
    
                if(list.length == 0){
                    stop();
                }
            }
        }
        
        function start(){
    
            function fns(){
    
                for(var i = 0, lg = list.length; i < lg; i++){
                    var item = list[i]; //由于在item.fn中可能会执行clear操作，所以list[i]可能已经不存在了
                    item && item.fn();
                }
                
            }
            function run(){
                var t0 = +new Date;
                fns();
                var t1 = +new Date;
                
                //取15ms是因为ie浏览器16ms精度问题,基本上达到60fps，差不多需要40fps+动画才能流畅
                //t1 - t0 为程序执行时间，进行相应的修正
                tr = setTimeout(run, Math.max(0, 15 - (t1 - t0)));                       
                return;
                var fpsItem, i = 0;
                while(fpsItem = fpsClick[i++]){ //更新帧数
                    if(t1 - fpsItem < 1000){ //清除已经过期的打点
                        break;
                    }
                    fpsClick.shift();
                }
                
                fpsClick.push(t1);
                info.execTime = t1 - t0;
                info.fps = fpsClick.length;
                info.list = list;
            }
            
            run();
        }
        
        function stop(){
            clearTimeout(tr);
        }
        
        function getInfo(){
            return info;
        }
    }
    $draw.clear = $noop;
    function $anim(elem, cssAttr, callback){
        
        var 
        property,
        cssAttrCache = {};
        
        for(property in cssAttr){
            cssAttrCache[property] = $cssnum(elem, property);
        }
        if(cssAttr.opacity > -1){
            cssAttr.opacity = Math.round(cssAttr.opacity * 100);
            cssAttrCache.opacity = Math.round(cssAttrCache.opacity * 100);
        }
        clearInterval(elem._animTimer_);
        elem._animTimer_ = setInterval(function(){
            var
            complete = 1,
            property,
            speed;
            for(property in cssAttr){
                if(cssAttr[property] != cssAttrCache[property]){
                    complete = 0;
                    speed = (cssAttr[property] - cssAttrCache[property]) / 8;
                    cssAttrCache[property] += speed > 0 ? Math.ceil(speed) : Math.floor(speed);
                    $css(elem, property, property == 'opacity' ? cssAttrCache[property] / 100 : cssAttrCache[property]);
                }
            }
            if(complete){
                clearInterval(elem._animTimer_);
                callback && callback();
            }
        }, 15);
        
    }
    $1k.Class = function(prop, source){
        return $Class.extend(prop, source);
    };
    $1k.widget = function(name, fn, source){
        if(typeof fn == 'function'){
            return $1k[name] = fn($1k);
        }else if(typeof fn == 'object'){
            return $1k[name] = $Class.extend(fn, source);
        }
    };
    $1k.query = $query;
    $DP.eq = function(i){
        if(i < 0)i = this.elems.length + i;
        return $1k(this.elems[i]);
    };
    $DP.find = function(selector){
        return $1k(selector, this.elem);
    };
    $DP.parent = function(index){
        return $1k($parent(this.elem, index));
    };
    $DP.child = function(index){
        return $1k($child(this.elem, index));
    };
    $DP.prev = function(){
        return $1k($prev(this.elem));
    };
    $DP.next = function(){
        return $1k($next(this.elem));
    };
    $DP.filter = function(fn){
        if(this.elems){
            var elems = [];
            $each(this.elems, function(elem, i){
                var Zelem = $1k(elem);
                if(fn.call(null, Zelem, i)){
                    elems.push(elem);
                }
            });
            if(elems.length){
                return $1k(elems);
            }
            return null;
        }else{
            if(!fn.call(null, this, 0)){
                return null;
            }
            return $1k(this.elem);
        }
    };
    $1k.elem = function(html){
            return $1k($elem(html));
        };
    $DP.append = function(newNode, index){
        return $box.call(this, $append, newNode, index);
    };
    $DP.insert = function(newNode, insertAfter){
        return $box.call(this, $insert, newNode, insertAfter);
    };
    $DP.remove = function(){
        return $box.call(this, $remove);
    };
    $DP.clone = function(deepCopy){
        return $1k($clone(this.elem, deepCopy));
    };
    $DP.replace = function(newNode){
        return $box.call(this, $replace, newNode);
    };
    $DP.each = function(func){
        if(this.elems){
            $each(this.elems, function(elem, i){
                return func.call($1k(elem), i);
            });
        }else if(this.elem){
            func.call(this, 0);
        }
        return this;
    };
    $DP.cls = function(cls1, cls2){
        return $box.call(this, $cls, cls1, cls2);
    };
    $DP.css = function(name, value){
        return $box.call(this, $css, name, value);
    };
    $DP.px = function(name){
        return $cssnum(this.elem, name);
    };
    $DP.left = function(value){
        return $box.call(this, $left, value);
    };
    $DP.top = function(value){
        return $box.call(this, $top, value);
    };
    $DP.width = function(value){
        return $box.call(this, $width, value);
    };
    $DP.height = function(value){
        return $box.call(this, $height, value);
    };
    $DP.offset = function(){
        return $offset(this.elem);
    };
    $DP.offsetLeft = function(){
        return $offset(this.elem).left;
    };
    $DP.offsetTop = function(){
        return $offset(this.elem).top;
    };
    $DP.offsetWidth = function(){
        return this.elem.offsetWidth;
    };
    $DP.offsetHeight = function(){
        return this.elem.offsetHeight;
    };
    $DP.opacity = function(opacity){
        return $box.call(this, $opacity, opacity);
    };
    $DP.show = function(){
        return $box.call(this, $show);
    };
    $DP.hide = function(){
        return $box.call(this, $hide);
    };
    $1k.ready = function(fn){
            $ready(fn);
        };
    $DP.on = function(type, func, context){
        var result = $bind.call(this, this.elem, type, func, context || this);
        if(this.elems && result == this){
            var i = 1;
            while(this.elems[i]){
                $bind.call(this, this.elems[i], type, func, context || this.eq(i));
                i++;
            }
            return this;
        }else{
            return result;
        }
    };
    $DP.un = function(type, func, context){
        var result = $unbind.call(this, this.elem, type, func, context || this);
        if(this.elems && result == this){
            var i = 1;
            while(this.elems[i]){
                $unbind.call(this, this.elems[i], type, func, context || this.eq(i));
                i++;
            }
            return this;
        }else{
            return result;
        }
    };
    $DP.click = function(func, context){
        var result = $bind.call(this, this.elem, 'click', func, context || this);
        if(this.elems && result == this){
            var i = 1;
            while(this.elems[i]){
                $bind.call(this, this.elems[i], 'click', func, context || this.eq(i));
                i++;
            }
            return this;
        }else{
            return result;
        }
    };
    $DP.hover = function(hover, out, context){
        var elem,
        self = this;
        if(this.elems){
            var i = 0;
            while(elem = this.elems[i]){
                !function(_who){
                    var elem = _who.elem;
                    $bind(elem, 'mouseover', function(evt){
                        if(evt.fromTarget && !$contains(elem, evt.fromTarget) || !evt.fromTarget)hover.call(context || _who, evt);
                    }, context || _who);
                    $bind(elem, 'mouseout', function(evt){
                        if(!evt.toTarget || !$contains(elem, evt.toTarget))out.call(context || _who, evt);
                    }, context || _who);
                }(this.eq(i));
                i++;
            }
        }else{
            elem = this.elem;
            $bind(elem, 'mouseover', function(evt){
                if(evt.fromTarget && !$contains(elem, evt.fromTarget) || !evt.fromTarget)hover.call(context || self, evt);
            }, context || self);
            $bind(elem, 'mouseout', function(evt){
                if(!evt.toTarget || !$contains(elem, evt.toTarget))out.call(context || self, evt);
            }, context || self);
        }
        return this;
    };
    $DP.attr = function(name, value){
        return $box.call(this, $attr, name, value);
    };
    $DP.html = function(html){
        return $box.call(this, $html, html);    
    };
    $DP.tag = function(nodeName){
        return $tag(this.elem, nodeName);
    };
    $DP.contains = function(elem){
        return $contains(this.elem, elem);
    };
    $DP.val = function(value){
        return $box.call(this, $val, value);
    };
    $DP.length = function(){
        return this.elems.length || 1;
    };
    $1k.browser = $browser;
    $1k.isIE6 = $isIE6;
    $1k.cookie = $cookie;
    $1k.scrollTop = function(){
        return $scrollTop.apply(this, arguments);
    };
    $1k.scrollLeft = function(){
        return $DE.scrollLeft + $DOC.body.scrollLeft;
    };
    $1k.docWidth = function(){
        return $DE.clientWidth;
    };
    $1k.docHeight = function(){
        return $DE.clientHeight;
    };
    $1k.scrollWidth = function(){
        return $DE.scrollWidth;
    };
    $1k.scrollHeight = function(){
        return Math.max($DE.scrollHeight, $DOC.body.scrollHeight);
    };
    $1k.ajax = $ajax;
    $1k.post = $post;
    $1k.get = $get;
    $1k.img = $img;
    $1k.js = $js;
    $1k.jsonp2 = $jsonp2;
    $1k.style = $style;
    $1k.type = $type;
    $1k.isArray = $isArray;
    $1k.isFunction = $isFunction;
    $1k.echo = function(){};
    $1k.each = $each;
    $1k.toJson = function(obj){
        if($WIN.JSON && JSON.stringify){
            return JSON.stringify(obj);
        }
        return $toJson(obj);
    };
    $1k.param = $param;
    $1k.mix = $mix;
    $1k.tirm = $tirm;
    $1k.parseJson = function(str){
        if($WIN.JSON && JSON.parse){
            return JSON.parse(str);
        }
        return $parseJson(str);
    };
    $1k.encodeURL = $encodeURL;
    $1k.encodeHTML = $encodeHTML;
    $1k.decodeHTML = $decodeHTML;
    $DP.Anim = function(attrs, options){
        $each(this.elems || [this.elem], function(elem, i){
            var animId = elem.__ANIMID__;
            if(!animId){
                animId = elem.__ANIMID__ = ++$GUID
            }else{
                $AnimHook[animId].stop();
            }
            $AnimHook[animId] = $Anim(elem, attrs, options);
        });
        return this;
    };
    $DP.Drag = function(options){
        if(!this.elem.__DRAGID__){
            $DragHook[this.elem.__DRAGID__ = ++$GUID] = $Drag(this.elem, options || {});
        }
        return $DragHook[this.elem.__DRAGID__];
    };
    $DP.anim = function(cssAttr, callback){
        //console.info(cssAttr);
        $anim(this.elem, cssAttr, callback)
        //return $box.call(this, $anim, cssAttr, callback);
    };
    return $1k;
}();