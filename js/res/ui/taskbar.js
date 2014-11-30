/* taskbar.js v1.02 Taskbar（任务栏）模块
 * 
 * 对外接口：主要开放给App模块使用
 * add(app) 添加一个任务按钮
 * remove(app) 移除一个任务按钮
 * focus(app) 激活一个任务按钮
 * 
 * */

function Taskbar(){ ///Taskbar
    var 
    self,
    rootElem, //容器根节点
    buttonWrap, //按钮容器
    apps = [], //应用对象缓存
    focusIndex = -1; //当前激活的按钮位置

    Taskbar = self = {
        
        add: function(app){
            apps.push(app);
			buttonWrap.append('<li class="itembox" appid="'+ app.id +'"><img src="'+ app.iconUrl() +'"/><span>'+ app.data('name') +'</span></li>');
        },
        
        remove: function(app){
            var index = self._getIndex(app.id);
            apps.splice(index, 1);
            buttonWrap.child(index).remove();
            if(focusIndex == index){
                focusIndex = -1;
            }
            
        },
        
        focus: function(app){
            var index = self._getIndex(app.id);

            if(index != focusIndex){
                if(focusIndex > -1){
                    buttonWrap.child(focusIndex) && buttonWrap.child(focusIndex).cls('-focus');
                }
                buttonWrap.child(focusIndex = index).cls('+focus');
            }
            
        },
        
        _click: function(app){
            if(app.window.isFocus() && app.windowPlace == Desktop.currentDesk()){
                app.window.toggle(); 
            }else{
                app.focus();
            }
		},
        
        //获取指定App在缓存apps中的位置
        _getIndex: function (appid){
            for(var i = 0; i < apps.length; i++){
                if(apps[i].id == appid){
                    return i;
                }
            }
        }
        
    };
        
    Calls('Taskbar')
    .call(Common.loadImgs, [
        'bg_task_b.png',
        'bg_task_nor.png',
        'bg_task_over.png'
    ])
    
    //初始化任务栏html
    .add(function(){ ///setHtml
        rootElem = Z.elem('<div class="Taskbar"><ul></ul></div>');
        buttonWrap = rootElem.find('ul');
        Body.add(rootElem);
    })
    
    //设置点击事件，用于绑定应用的切换
    .add(function(){ ///setEvent
        rootElem.click(function(evt){
            var tg = Z(evt.target);	
            var li = tg.tag('LI') ? tg : tg.parent('li');
            if(li){
                self._click(apps[self._getIndex(li.attr('appid'))]);
            }
        });
    })
    
    //绑定右键菜单
    .add(function(){ ///setContextmenu
        var
        contextmenu = new Contextmenu([
            {text: '最大化', command: 'app_maximize'},
            '-',
            {text: '最小化', command:'app_hide'},
            {text: '关闭', command:'app_close'}
        ]);
        
        Command.add({
            app_maximize: function(){
                this.window.maximize();
                this.focus();
            },
            app_hide: function(){
                this.window.hide();
            },
            app_close: function(){
                this.window.close();
            }
            
        });
        rootElem.on('contextmenu', function(evt){
            var 
            tg = Z(evt.target),
            li = tg.tag('LI') ? tg : tg.parent('li');
            if(li){
                contextmenu.show(evt.clientX, evt.clientY, apps[self._getIndex(li.attr('appid'))]);
            }
        });
    })
    
    //监听事件
    .add(function(){
        App.on('openWindow', function(){
            self.add(this.app);
        });
        App.on('focusWindow', function(){
            self.focus(this.app);
        }); 
        App.on('closeWindow', function(){
            self.remove(this.app);
        });
        
    })
    .done(this.ready);
    
}

