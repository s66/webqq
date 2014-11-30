/* sidebar.js v1.02 Sidebar（侧边）模块
 * 
 * 对外接口：
 * addApp(app, index) 添加一个应用图标到指定位置
 * 
 * */
function Sidebar(){
    var 
    MAX_COUNT = 7, //最大应用个数
    inManage = false,
    self = {
        temp: {
            //appsbox
        }
    };
    
    Sidebar = self;
    
    Calls('Sidebar')
    .call(Common.loadImgs, ['dock_l.png', 'dock_r.png', 'dock_t.png', 'portal_all_png.png'])
    //初始化
    .call(function(){
        var
        rootElem, //容器根节点
        sidebox, //侧边定位容器
        sidebar, //侧边内容容器
        appsbox, //应用图标容器
        dragMasklayer, //拖动遮罩层
        layoutValue; //布局;
        
        this.add([
        
        //创建html
        function(){ ///setHtml
            rootElem = Z.elem('\
            <div class="SidebarWrapper">\
            <div class="guides">\
            <div class="top"></div>\
            <div class="left"></div>\
            </div>\
            <div class="sidebox">\
            <div class="top"></div>\
            <div class="left"></div>\
            <div class="right"></div>\
            </div>\
            </div>\
            ');
            sidebox = rootElem.find('.sidebox');
            sidebar = Z.elem('<div class="sidebar clearfix"><ul class="appsbox clearfix"></ul>'+ toollistHtml() +'</div>');
            self.temp.appsbox = appsbox = sidebar.find('.appsbox');
            dragMasklayer = Z.elem('<div class="Sidebar-masklayer"></div>');
            Body.add(rootElem);
            Body.add(dragMasklayer);
            function toollistHtml(){
                return '\
                <div class="toollist">\
                <div class="item">\
                <span class="pinyin" title="QQ云输入法" cmd="pinyin"></span>\
                <span class="sound" title="静音" cmd="sound"></span>\
                </div>\
                <div class="item">\
                <span class="setting" title="系统设置" cmd="setting"></span>\
                <span class="theme" title="主题设置" cmd="theme"></span>\
                </div>\
                <div class="item2"><span title="开始"></span></div>\
                </div>';
            }
        },
        
        //添加布局逻辑
        //设置布局监听事件
        function(){ ///setLayout.listener
            //设置布局改变事件
            Body.on('layout', function(position){
                sidebox.find('.'+ (layoutValue = position)).append(sidebar);
            });  
            
        },
        //设置布局拖动
        function(){ ///setLayout.drag
            var 
            isDrag, //是否已经激活拖动
            focusPosition, //当前激活的位置
            width,
            height,
            delay; //拖动做延迟处理
            
            sidebar.on('mousedown', function(evt){
                if(evt.mouseKey != 'L')return;
                evt.preventDefault();
                delay = setTimeout(function(){
                    Z(document).on('mousemove', drag).on('mouseup', drop);
                }, 200);
            });
            
            Z(document).on('mouseup', function(){
                clearTimeout(delay);
            });
            
            function drag(evt){
                evt.preventDefault();
                if(!isDrag){
                    isDrag = true;
                    width = Body.getWidth();
                    height = Body.getHeight();
                    showGuides(layoutValue);
                    dragMasklayer.show();
                }  
                
                if(evt.clientY < height * .2){ //上
                    showGuides('top');
                }else if(evt.clientX < width * .5){//左边
                    showGuides('left');
                }else{
                    showGuides('right');
                } 
            }
            
            function drop(evt){
                isDrag = false;
                if(focusPosition != layoutValue){
                    Body.layout(focusPosition);
                }
                focusPosition = '';
                dragMasklayer.hide();
                hideGuides();
                Z(document).un('mousemove', drag).un('mouseup', drop);
            }
            
            function showGuides(positon){
                if(focusPosition != positon){
                    hideGuides();
                    rootElem.cls('+focus-'+ (focusPosition = positon));
                }
            }
            function hideGuides(){
                rootElem.cls('-focus-top,focus-left,focus-right');
            }
            
        },
        //设置布局右键菜单控制
        function(){ ///setLayout.Contextmenu
            var 
            contextmenuItems = [
                {text: '向左停靠', command: 'layout_left'},
                {text: '向上停靠', command: 'layout_top'},
                {text: '向右停靠', command: 'layout_right'}
            ],
            contextmenu = new Contextmenu;
            
            Command.add({
                layout_left: function(){
                    Body.layout('left');
                },
                layout_top: function(){
                    Body.layout('top');
                },
                layout_right: function(){
                    Body.layout('right');
                }
            });
            
            rootElem.on('contextmenu', function(evt){
                evt.preventDefault();
                contextmenuItems[0].status = '';
                contextmenuItems[1].status = '';
                contextmenuItems[2].status = '';
                if(layoutValue == 'left'){
                    contextmenuItems[0].status = 'selected';
                }else if(layoutValue == 'top'){
                    contextmenuItems[1].status = 'selected';
                }else{
                    contextmenuItems[2].status = 'selected';
                }
                contextmenu.render(contextmenuItems).show(evt.clientX, evt.clientY, self);
            });
            
        },
        
        //设置功能按钮事件
        function(){ ///setToollist
            sidebar.click(function(evt){
                var 
                target = Z(evt.target),
                cmd = target.attr('cmd');
                
                if(cmd == 'sound'){
                    target.cls('~mute');
                }else if(cmd == 'theme'){
                    Command.call('openStyleWin');
                }else if(cmd == 'setting'){
                    Command.call('openDeskSetWin');
                }
            });
            
            
            
        },
        
        //桌面设置逻辑
        function(){ ///DeskSet
            var
            app = {name:'DeskSetWin'},
            content = Z.elem('<div>\
                <div class="desktopSettingHeader">默认桌面(登录后默认显示)</div>\
                <div class="desktopSettingBody default_desktop_setting" id="defaultDesktopRadioSet">\
                    <label><input type="radio" value="1" name="defaultDesktop" id="defaultDesktop_1">第1屏桌面</label>\
                    <label><input type="radio" value="2" name="defaultDesktop" id="defaultDesktop_2">第2屏桌面</label>\
                    <label><input type="radio" value="3" name="defaultDesktop" id="defaultDesktop_3" checked>第3屏桌面</label>\
                    <label><input type="radio" value="4" name="defaultDesktop" id="defaultDesktop_4">第4屏桌面</label>\
                    <label><input type="radio" value="5" name="defaultDesktop" id="defaultDesktop_5">第5屏桌面</label>\
                </div>\
                <div class="desktopSettingHeader">桌面图标设置</div>\
                <div class="desktopSettingBody dsektop_icon_style_setting" id="desktopIconStyle">\
                    <label><input type="radio" value="1" name="desktopIconStyle" id="desktopIconStyle_1">小图标</label>\
                    <label><input type="radio" value="0" name="desktopIconStyle" id="desktopIconStyle_0" checked>大图标</label>\
                </div>\
                <div class="desktopSettingHeader">应用码头位置</div>\
                <div class="desktopSettingBody dock_location_preview_contaienr">\
                <div class="dock_location_preview dock_location_left" id="dockLocationPreview">\
                    <div class="dock_set_btn dock_set_left"><label class="dock_set_btn_label"><input type="radio" class="dock_set_btn_radio" value="left" name="dockLocation" id="dockSetLeft">左部</label></div>\
                    <div class="dock_set_btn dock_set_right"><label class="dock_set_btn_label"><input type="radio" class="dock_set_btn_radio" value="right" name="dockLocation" id="dockSetRight">右部</label></div>\
                    <div class="dock_set_btn dock_set_top"><label class="dock_set_btn_label"><input type="radio" class="dock_set_btn_radio" value="top" name="dockLocation" id="dockSetTop" checked>顶部</label></div>\
                </div>\
                </div>\
            </div>').click(function(evt){
                var
                target = Z(evt.target);
                switch(target.attr('name')){
                    case 'defaultDesktop':
                        Desktop.toggle(target.val() - 1);
                        break;
                    case 'desktopIconStyle':
                        Command.call('Desktop_setIcon', null, ['BIG', 'SMALL'][target.val()]);
                        break;
                    case 'dockLocation':
                        Body.layout(target.val());
                        Z('#dockLocationPreview').cls('=dock_location_preview dock_location_'+target.val());
                        break;
                }
 
            });
            Command.add({
                'openDeskSetWin': function(){
                    if(!app.window){
                        Desktop.currentDesk().openWindow(app, {
                            title: '桌面设置',
                            content: content.elem,
                            size: [580, 560],
                            resizeable: false,
                            minimizeable: false,
                            closed: function(){
                                Desktop.currentDesk().closeWindow(app);
                            }
                        });
                    }else{ //已经显示，则判断位置。不在当前桌面，则切到目标桌面
                        if(app.windowPlace != Desktop.currentDesk()){
                            Desktop.toggle(app.windowPlace.index);
                        }
                    }
                    app.window.show();
                }
            });
            
        },

        //设置图标拖放监听事件
        function(){ ///listener
            App.on('drop', function(position){
                var index = -1;
                if(inManage){
                    if(Common.inPoint(App.appManage_Sidebar, position)){
                        index = 0|((position.x - appsbox.offsetTop())/63);
                    }
                    
                }else{
                    if(Common.inPoint(appsbox, position)){
                        switch(layoutValue){
                            case 'left':
                            case 'right':
                            index = 0|((position.y - appsbox.offsetTop())/63);
                            break;
                            case 'top':
                            index = 0|((position.x - appsbox.offsetLeft())/63);
                        }
                    }
                }
                if(index > -1){
                    this.stopEvent();
                    if(this.app.iconPlace != self  || this.app.iconIndex != Math.min(index, self.appCount() - 1)){   
                        self.addApp(this.app, index);
                    }
                } 
                
            });
        },

        ]);
        
    })
    .add([

    //绑定公共接口
    function(){ ///API.public
        var 
        apps = [], //存放图标在侧边栏的应用
        appsbox = self.temp.appsbox,

        managebox = App.appManage_Sidebar;
        Common.mix(self, {
            
            //添加一个应用图标到指定位置
            addApp: function(app, index){
                
                if(index == -1 || index >= apps.length){ //添加到最后
                    index = apps.length;
                }
                App(app).fire('add', self, index);
                if(apps.length == MAX_COUNT){
                    Desktop.addApp(apps[MAX_COUNT - 1], -1);
                }
                
                apps.splice(index, 0, app);
                
                if(index != apps.length - 1){ //不是添加到最后，需要重新生成app.iconIndex
                    App.rebuidIconIndex(apps);
                }
                
                if(inManage){
                    managebox.append(Z.elem('<div class="iconbox"></div>').append(app.iconElem), index);
                }else{
                    appsbox.append(Z.elem('li').append(app.iconElem), index);
                }
                
                
            },
            
            //移除指定的应用
            removeApp: function(app){
                
                Z.each(apps, function(_app, i){
                    if(app == _app){
                        apps.splice(i, 1);
                        app.iconElem.parent().remove();
                        if(i != apps.length){ //移除的不是最后一个，重构this._place.index
                            App.rebuidIconIndex(apps);
                            return true;
                        }
                    }
                });
            },
            
            appCount: function(){
                return apps.length;
            },
            
            openManager: function(){
                inManage = true;
                Z.each(apps, function(app, index){
                    app.iconElem.parent().remove();
                    managebox.append(Z.elem('<div class="iconbox"></div>').append(app.iconElem), index);
                    
                });
            },
            
            closeManager: function(){
                inManage = false;
                Z.each(apps, function(app, index){
                    app.iconElem.parent().remove();
                    appsbox.append(Z.elem('li').append(app.iconElem), index);
                });
            }
            
        });

    }, 
    
    //添加应用图标到容器中
    function(){ ///addApps
        Z.each(Data.CONFIG.sidebar.apps, function(appdata, index){
            self.addApp(new App(appdata.id), index);
        });
    },
    
    //结束
    function(){ ///end
        delete self.temp;
        
    },
    
    ])
    .done(this.ready);
}

