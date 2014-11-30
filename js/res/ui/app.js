/* app.js v1.02 App(应用）模块
 * 
 * 对外接口：
 * id 应用的id，即appid
 * 
 * 
 * */

function App(){
    var apps = {};
    
    function self(appid){
        //给App.agent(app)创建快捷方式，使用App(app)即可
        if(appid.constructor == self){
            return self.agent(appid);
        }
        //从缓存中获取
        if(apps[appid]){
            return apps[appid];
        }
        apps[this.id = appid] = this;
        
        /*
            this.id = null; //应用的id，即appid
            this._waitOpen = false; //是否正在打开
            this.window = null; //应用窗口
            this.windowPlace = null; //应用窗口所在的容器引用
            this.iconElem = null; //图标节点引用
            this.iconPlace = null; //图标所在容器的引用
            this.iconIndex = null; //图标在容器中的位置
        */
        
        this._setHtml();
        this._setContextmenu();
        this._setDrag();
    }
    App = self;
    self.temp = {};
    
    Calls('App')
    //加载图片素材
    .call(Common.loadImgs, ['appbutton_mouseover_bg3.png', 'appbutton_mouseover_bg4.png'])
    .add([
    
    //绑定接口
    //绑定静态接口
    function(){ ///API.static
        Common.mix(self, {
            
            //设置app代理，使得app的某些操作通过App来传递
            agent: function(app){
                self.app = app;
                return self;
            },
            
            rebuidIconIndex: function(apps){
                Z.each(apps, function(app, index){
                    app.iconIndex = index;
                }); 
            },
            
            hasAdd: function(appid){
                return apps[appid]
            }
        });
        //添加监听者API
        Event.extendTo(self);
    },
    //绑定公共接口
    function(){ ///API.public
        
        Common.mix(self.prototype, {
            
            constructor: self,
            
            //从数据中心获取App对应字段的数据
            data: function(key){
                return Data.getApp(this.id, key);
            },
            
            //获取icon图标地址
            iconUrl: function(){
                //return 'apps/icon/'+this.id+'.png';
                //return 'http://0.web.qstatic.com/webqqpic/pubapps/'+(~~(this.id/1000))+'/'+this.id+'/images/big.png';
                return 'http://'+(~~(Math.random()*10))+'.web.qstatic.com/webqqpic/pubapps/'+(~~(this.id/1000))+'/'+this.id+'/images/big.png';
            },
            
            open: function(){

                if(Z('.showAppManagerPanel')){ //管理模式禁止打开
                    return;
                }
                var that = this;
                if(that.data('isReady')){
                    var exinfo = that.data('exinfo');
                    if(!that.window){

                        self(that).fire('openWindow', {
                            title: that.data('name'),
                            size: [exinfo.width, exinfo.height],
                            content: that.data('url'),
                            resizeable : exinfo.resizeable === 0 ? false : true,
                            closed: function(){
                                self(that).fire('closeWindow');
                            },
                            focused: function(){
                                self(that).fire('focusWindow');
                            }
                        });
                    }else{
                        that.window.show();
                    }
                }else{
                    if(that._waitOpen){ //等待打开中
                        return;   
                    }
                    that._waitOpen = true;
                    Data.saveApp(that.id, that.data('ver'), function(result){
                        if(result){
                            that.open();
                        }else{
                            alert('打开失败');
                        }
                        that._waitOpen = false;
                    }); 
                }
                
            },
            
            focus: function(){
                
                self(this).fire('focusWindow');
                this.window.show(); 
                
            },
            
            end: 0
            
        });
        
    },
    //绑定私有接口
    function(){ ///API.private
    
        Common.mix(self.prototype, {
            
            //创建图标html
            _setHtml: function(){
                this.iconElem = Z.elem('<div class="app-icon"><img onerror="this.onerror=null;this.src=\'css/imgs/default.png\';" src="'+this.iconUrl()+'"/><span>'+this.data('name')+'</span></div>').click(this.open, this);
            },
            
            //右键菜单
            _setContextmenu: function(){
                var 
                submenuItems = [ //子菜单内容数据引用，独立引用便于操作
                    {text: '桌面1', command: 'moveAppTo1'},
                    {text: '桌面2', command: 'moveAppTo2'},
                    {text: '桌面3', command: 'moveAppTo3'},
                    {text: '桌面4', command: 'moveAppTo4'},
                    {text: '桌面5', command: 'moveAppTo5'}
                ],
                contextmenuItems = [ //右键菜单内容数据
                    {text: '打开应用', icon:'1', command: 'openApp'},
                    '-',
                    {text: '移动应用', submenu: submenuItems},
                    {text: '卸载应用', command: 'removeApp'}
                ],
                contextmenu = new Contextmenu;
                
                return function(that){
                    that = this;
                    that.iconElem.on('contextmenu', function(evt){
                        evt.preventDefault();
                        evt.stopPropagation();
                        
                        Z.each(submenuItems, function(menuitem, i){
                            menuitem.status = '';
                        });
                        
                        self(that).fire('contextmenu', submenuItems); //触发右键菜单事件，某些模块会影响submenu的属性
                        contextmenu.render(contextmenuItems).show(evt.clientX, evt.clientY, that);
                    }).on('mousedown', function(){ //drag阻止事件冒泡，这里添加菜单隐藏逻辑
                        contextmenu.hide();
                    });
                }
            }(),
            
            //设置拖动
            _setDrag: function(){
                var 
                that = this,
                iconElem = that.iconElem;
                
                iconElem.Drag({
                    before:function(){
                        if(Z.browser.ie && Z.browser.ie < 9){ //修正ie下的hover bug，鼠标离开还处于over状态
                            iconElem.cls('+fixhover');
                        }                    
                        iconElem.opacity(.6);
                        self(that).fire('dragBefore');
                    },
                    after: function(evt){
                        if(Z.browser.ie && Z.browser.ie < 9){ //修正ie下的hover bug，鼠标离开还处于over状态
                            iconElem.on('mouseover', fixhover);
                            function fixhover(){
                                iconElem.un('mouseover', fixhover);
                                iconElem.cls('-fixhover');
                            }
                        }  
                        
                        iconElem.opacity(null);
                        self(that).fire('drop', { //获取放置的位置
                            x: evt.clientX,
                            y: evt.clientY
                        });
                    },
                    runing: function(evt){
                        self(that).fire('draging', evt.clientX, evt.clientY);
                        
                    },
                    clone:1,
                    range:0
                });
                
            },
            
            end: 0
        });
        
    },
    
    //图标状态改变监听器
    function(){ ///listener
        
        //图标添加时触发
        self.on('add', function(iconPlace, iconIndex){
            var app = this.app;
            if(app.iconPlace){
                app.iconPlace.removeApp(app);
            }
            app.iconPlace = iconPlace;
            app.iconIndex = iconIndex;
            self.fire('change', 'add');
        });
        
        self.on('remove', function(clearCache){
            var app = this.app;
            app.iconPlace.removeApp(app);
            app.iconElem.remove();
            if(clearCache){
                app.iconElem = null;
                app.window && app.window.close();//关闭已经打开的窗口
                delete apps[app.id];
                
            }
            self.fire('change', 'remove');
        });
        
        self.on('change', function(type){
            //console.info(type,apps);
        });
        
        
    },
    
    //初始化右键菜单指令
    function(){ ///setContextmenu
        Command.add({
            openApp: function(){
                this.open();
            },
            removeApp: function(){
                self(this).fire('remove', true);
            },
            moveAppTo1: function(){
                self(this).fire('addTo', 0);
            },
            moveAppTo2: function(){
                self(this).fire('addTo', 1);
            },
            moveAppTo3: function(){
                self(this).fire('addTo', 2);
            },
            moveAppTo4: function(){
                self(this).fire('addTo', 3);
            },
            moveAppTo5: function(){
                self(this).fire('addTo', 4);
            }
        });
    },
    
    //初始化应用管理层
    function(){ ///appManage
        self.appManagePanel = Z.elem('<div class="appManagerPanel"><a href="#" class="aMg_close"></a></div>');
        self.appManage_Sidebar = Z.elem('<div class="aMg_dock_container"></div>');
        self.appManage_Desktop = Z.elem('<div class="aMg_folder_container"></div>');
        self.appManagePanel.append(self.appManage_Sidebar);
        self.appManagePanel.append('<div class="aMg_line_x"></div>');
        self.appManagePanel.append(self.appManage_Desktop);
        
        self.appManagePanel.find('a').click(closeManager);
        
        Z(window).on('resize', function(){
            self.appManage_Desktop.height(Body.getHeight() - 80);
        });
        
        Body.add(self.appManagePanel);
        
        function closeManager(evt){
            evt && evt.preventDefault();
            Sidebar.closeManager();
            Desktop.closeManager();
            Z('body').cls('-showAppManagerPanel');
            App.appManage_Desktop.cls('-folderItem_turn')
        }
    },
    
    //结束
    function(){ ///end
        delete self.temp;
        
    },
        
    ])
    .done(this.ready);
}

