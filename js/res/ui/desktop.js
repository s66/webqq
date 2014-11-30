/* desktop.js v1.02 Desktop（桌面）模块
 * 
 * 对外接口：
 * 
 * 
 * */
 
function Desktop(){
    var 
    
    GIRD_SIZE_SMALL = [90, 90], //小图标网格
    GIRD_SIZE_BIG = [142, 112], //大图标网格

    MARGIN_LAYOUT = 70, //各种布局桌面的margin值
    MARGIN_LEFT = 28,
    MARGIN_TOP = 46,
    MARGIN_BOTTOM = 28, //底部的margin
    
    
    
    grid_size = GIRD_SIZE_BIG, //当前选中的图标布局
    grid_rows = 0, //桌面行数
    grid_cols = 0, //列数
    
    layoutValue, //布局
    currentIndex = 2,
    currentDesk,
    self = {temp: {
        deskCount: 5,
        deskIndex: 0
    }},
    inManage = false,
    desks = [];
    
    Desktop = self;
    
    
    
    Calls('Desktop')
    
    //子桌面逻辑
    .call(function(){
        
        //子桌面类
        function Desk(data){
            this.index = self.temp.deskIndex++;
            this._apps = [];
            this._windows = []; //在当前桌面打开窗口的应用缓存
            this._hideWindows = []; //被以显示当前桌面方式隐藏窗口的应用缓存
            this._setHtml();
            this._addapps(data.apps);
            this._setAddButton(); //应用市场按钮
            this._setScroll(); //设置滚动条
        }
        
        //公用接口
        Common.mix(Desk.prototype, {
            
            name: 'Desk',
            
            //添加应用到桌面的指定位置
            addApp: function(app, index){
                var apps = this._apps;
                if(index == -1 || index >= apps.length){ //添加到最后
                    index = apps.length;
                }
                App(app).fire('add', this, index);
                apps.splice(index, 0, app);
                if(index != apps.length - 1){ //不是添加到最后，需要重新生成app.iconIndex
                    App.rebuidIconIndex(apps);
                }
                if(inManage){
                    this._folderInner.append(Z.elem('<div class="iconbox"><span>'+app.data('name')+'</span></div>').append(app.iconElem, 0), index);
                    this._manageScroll.reset();
                }else{
                    this._applist.append(app.iconElem, index);
                    this.refresh(true);
                }
                
            },
            
            //移除指定的应用
            removeApp: function(app){
                var 
                that = this,
                apps = this._apps;
                Z.each(apps, function(_app, i){
                    if(app == _app){
                        apps.splice(i, 1);
                        if(inManage){
                            app.iconElem.parent().remove();
                            that._manageScroll.reset();
                        }
                        if(i != apps.length){ //移除的不是最后一个，重构this._place.index
                            App.rebuidIconIndex(apps);
                            return true;
                        }
                    }
                });
                this.refresh(true);
            },
            
            //按指定方向切换移动当前桌面
            toggle: function(direction){
                var rootElem = this._rootElem; 
                
                if(this._isCurrent){ //已经是当前的，则切换成隐藏
                    if(direction == 'L'){
                        rootElem.Anim({left: -2000});
                        }else{
                        rootElem.Anim({left: 2000});
                    }
                    }else{
                    if(direction == 'R' && rootElem.left() > 0){
                        rootElem.left('-2000');//当右移显示的desk在左边时，则切换成-2000
                    }
                    rootElem.Anim({left: 0});
                }
                this._isCurrent = !this._isCurrent;
            },
            
            //刷新当前桌面
            refresh: function(compel){ //compel当为true时为强制刷新，一般在添加或者删除应用的时候使用
                if(!layoutValue){
                    return;
                }
                var
                width = this._rootElem.width(),
                height = this._rootElem.height(),
                grid_size_width = grid_size[0],
                grid_size_height = grid_size[1];
                if(!(width > 0 && height > 0)){ //当高度和宽度未就绪前调用refresh，则返回
                    return;
                }
                
                width -= MARGIN_LEFT;
                height -= MARGIN_TOP + MARGIN_BOTTOM;
                if(layoutValue == 'left' || layoutValue == 'right'){
                    width -= MARGIN_LAYOUT;
                    }else{
                    height -= MARGIN_LAYOUT;
                }
                grid_rows = Math.max(~~(height / grid_size_height), 1);
                grid_cols = ~~(width /  grid_size_width);
                
                if(this._rows != grid_rows //行改变
                || this._cols != grid_cols //列改变
                || this._grid_size != grid_size //图标设置改变
                || this._scroll.isVisible() && (grid_rows * grid_cols >= this._apps.length + 1)//当滚动条需要隐藏时
                || compel //强制刷新
                ){
                    //执行更新数据和重排图标

                    var 
                    self = this,
                    icons = this._apps.slice(0); //复制是为了假如市场应用的添加按钮
                    icons.push({iconElem: this._addButton});
                    
                    this._applistContainer.hide(); //隐藏桌面，完成更新后显示
                    
                    if(grid_rows * grid_cols < icons.length){ //显示滚动条
                        
                        //当前的容器不足以容纳所有图标，则出现滚动条并且重新计算网格，
                        grid_cols = Math.max(1, grid_cols); //至少一列
                        grid_rows = Math.ceil(icons.length / grid_cols); //这里始终以纵向滚动条为主，所以 行数 需要从重新计算
                        
                    }
                    this._applist.height(grid_size_height * grid_rows);
                    
                    this._rows = grid_rows;
                    this._cols = grid_cols;
                    this._grid_size = grid_size;
                    
                    Z.each(icons, function(app, i){ 
                        
                        var 
                        x = ~~(i / grid_rows) * grid_size_width,
                        y = (i % grid_rows) * grid_size_height;
                        
                        app.iconElem.css('left:'+x+';top:'+y);
                    });
                    
                    this._applistContainer.css({width:width,height:height}).show();
                    this._scroll.reset();
                }
                
            },
            
            openWindow: function(app, windowOptions){
                windowOptions.container = this._rootElem;
                app.windowPlace = this;

                app.window = Win(windowOptions);
                this._windows.push(app);
            },
            
            closeWindow: function(app){
                var windows = this._windows;
                
                Z.each(windows, function(_app, i){
                    if(_app == app){
                        windows.splice(i, 1);
                        return true;
                    }
                });
                app.windowPlace = null;
                app.window = null;
                
            },
            
            //显示桌面的逻辑
            show: function(){
                var 
                that = this,
                doshow = true;
                Z.each(that._windows, function(app){
                    if(app.window.isShow()){ //存在显示的窗口，执行的是隐藏操作
                        doshow = false; //设置显示标记为false
                        app.window.hide();
                        that._hideWindows.push(app); 
                    }
                });
                if(doshow){ //将被隐藏的窗口重新显示出来
                    Z.each(that._hideWindows, function(app){
                        //这里做判断是为了过滤掉已经被关闭的窗口
                        app.window && app.window.show();
                    });
                    that._hideWindows.length = 0;
                    
                }
            },
            
            end:0
        });
        
        //私有接口
        Common.mix(Desk.prototype, {
            
            //初始化桌面html
            _setHtml: function(){
                this._rootElem = Z.elem('<div index="'+ this.index +'" class="deskContainer"></div>');
                this._applistContainer = Z.elem('<div class="applistContainer"></div>');
                this._applist = Z.elem('<div class="applist"></div>');
                //this._scrollElem = Z.elem('<div class="scroll"></div>');
                self.temp.container.append(this._rootElem.append(this._applistContainer.append(this._applist)));
                
            },
            
            //初始化应用到桌面
            _addapps: function(appsdata){
                var that = this;
                Z.each(appsdata, function(appdata, index){
                    that.addApp(new App(appdata.id), index);
                });
            },
            
            //设置桌面滚动条
            _setScroll: function(){
                this._scroll = new Scroll({
                    outer: this._applistContainer,
                    inner: this._applist
                });
            },
            
            _setAddButton: function(){
                this._applist.append(this._addButton = self.temp.AppMarket.getDomIcon());
            }
        });
        
        self.temp.Desk = Desk;
    })
    
    //桌面初始化
    .call(function(){
        var
        rootElem,
        desksContainer,
        navbar,
        
        end;
        
        this.add([
        
        //创建html
        function(){ ///setHtml
            rootElem = Z.elem('<div class="DesktopWrapper"></div>');
            self.temp.container = desksContainer = Z.elem('<div class="desksContainer"></div>');
            self.temp.navbar = navbar = Z.elem('<div class="navbar"></div>');
            
            var indicators = [];
            indicators.push('<div class="header" cmd="user" title="请登录"><img src="css/imgs/avatar.png" alt="请登录"></div>');
            for(var i = 0; i < self.temp.deskCount; i++){
                indicators.push('<a href="#" class="indicator'+(i == currentIndex?' current':'')+'" index="'+ i +'"><span class="icon_bg"></span><span class="icon_'+(i+1)+'"></span></a>');
            }
            indicators.push('<a class="indicator indicator_manage" href="#" hidefocus="true" cmd="manage" title="全局视图"></a>');
            navbar.append('<div class="indicatorContainer">'+ indicators.join('') +'</div>');
            rootElem.append(desksContainer);
            desksContainer.append(navbar);
            Body.add(rootElem);
        },
        
        //设置navbar
        function(){ ///setNavbar
            navbar.Drag({rang: 1});
            navbar
            .on('mousedown', function(){
                Contextmenu.hide();
            })
            .find('.indicator').click(function(evt){
                evt.preventDefault();
                if(this.attr('index')){
                    self.toggle(+this.attr('index'));
                }else if(this.attr('cmd') == 'manage'){
                    
                    Sidebar.openManager();
                    Desktop.openManager();
                    Z('body').cls('+showAppManagerPanel');
                    App.appManage_Desktop.height(Body.getHeight() - 80);
                    Z.each(desks, function(desk){
                        desk._manageScroll.reset();
                    });
                    setTimeout(function(){
                        App.appManage_Desktop.cls('+folderItem_turn');
                        
                    });
                }
            });
            
            //窗口改变则刷新桌面
            Z(window).on('resize', function(){
                self.refresh(); 
            });
            
        },
        
        //设置右键菜单
        function(){ ///contextmenu 
            var 
            submenuItems = [
                {text: '大图标', command: 'desktop.bigicon'},
                {text: '小图标', command: 'desktop.smallicon'}
            ],
            submenuItems2 = [
                {text: '桌面1', command: 'desktop.toggle.1'},
                {text: '桌面2', command: 'desktop.toggle.2'},
                {text: '桌面3', command: 'desktop.toggle.3'},
                {text: '桌面4', command: 'desktop.toggle.4'},
                {text: '桌面5', command: 'desktop.toggle.5'}
            ],
            contextmenuItems = [
                
                {text: '显示桌面', command: 'Desktop.show'},
                {text: '切换桌面', submenu: submenuItems2},
                '-',
                {text: '系统设置', command: 'openDeskSetWin'},
                {text: '主题设置', command: 'openStyleWin'},
                {text: '图标设置', submenu: submenuItems},
                '-',
                {text: '关于', command: 'about'}
            ],
            contextmenu;
            
            contextmenu = new Contextmenu(contextmenuItems);
            rootElem.on('contextmenu', function(evt){
                evt.preventDefault();
                if(grid_size == GIRD_SIZE_BIG){
                    submenuItems[0].status = 'selected';
                    submenuItems[1].status = '';
                }else if(grid_size == GIRD_SIZE_SMALL){
                    submenuItems[0].status = '';
                    submenuItems[1].status = 'selected';
                }
                Z.each(submenuItems2, function(item, i){
                    if(currentIndex == i){
                        item.status = 'selected';
                    }else{
                        item.status = '';
                    }
                });
                
                contextmenu.render(contextmenuItems).show(evt.clientX, evt.clientY, self);
            });
            
            
            Command.add({
                'Desktop.show': function(){
                    currentDesk.show();
                },
                'desktop.toggle.1': function(){
                    self.toggle(0);
                },
                'desktop.toggle.2': function(){
                    self.toggle(1);
                },
                'desktop.toggle.3': function(){
                    self.toggle(2);
                },
                'desktop.toggle.4': function(){
                    self.toggle(3);
                },
                'desktop.toggle.5': function(){
                    self.toggle(4);
                },
                'desktop.bigicon': function(){
                    setIconSize('BIG');
                },
                'desktop.smallicon': function(){
                    setIconSize('SMALL');
                },
                'about': function(){
                    alert([
                    'WEB++是基于1kjs仿照WEBQQ开发的一款模拟桌面系统',   
                    '程序以文件和对象的方式进行管理，代码实现了流程控制和性能监控',   
                    '数据采用纯静态的JSON格式，在数据交互中实现了并行请求和串行处理',
                    '===========================================',
                    '感谢WEBQQ提供素材和交互模型，感谢Google App提供托管空间',
                    '本程序所有图片素材都来自网络，版权归原作者所有！',
                    '如有疑问请联系：zjfeihu@126.com',
                    ].join('\r\n\r\n'));
                    
                }
            });
            
            function setIconSize(value){
                if(value == 'BIG' && grid_size != GIRD_SIZE_BIG){
                    grid_size = GIRD_SIZE_BIG;
                    self.container.cls('-small-appicon').cls('+big-appicon');
                }else if(value == 'SMALL' && grid_size != GIRD_SIZE_SMALL){
                    grid_size = GIRD_SIZE_SMALL;
                    self.container.cls('-big-appicon').cls('+small-appicon');
                }
                self.refresh();
            }
            Command.add({
                Desktop_setIcon: setIconSize
                
            });
        },
        
        //设置应用市场按钮
        function(){ ///AppMarket
            var
            App_prop = App.prototype; //拷贝App的接口
            
            self.temp.AppMarket = {
                //模拟App接口，用于Taskbar控制
                data: function(){
                    return '应用市场';
                },
                iconUrl: function(){
                    return 'css/imgs/appmarket.png';
                },
                id: 'appmarket',
                focus: function(){
                    this.window.show();
                    if(this.windowPlace != currentDesk){
                        Desktop.toggle(this.windowPlace.index);
                    }
                    
                },
                
                //Desk中调用，用于生成按钮的html
                getDomIcon: function(){
                    var 
                    addButton = Z.elem('<div class="app-icon" style="left: 0px; top: 112px;"><img src="'+this.iconUrl()+'"><span>添加应用</span></div>')
                    .click(this._open, this)
                    .on('contextmenu', function(evt){
                        evt.preventDefault();
                        evt.stopPropagation();
                    })
                    .on('mousedown', function(evt){
                        evt.preventDefault();
                        evt.stopPropagation();
                    });
                    return addButton;
                },
                
                //窗口相关逻辑
                _open: function(){
                    var that = this;
                    if(!that.window){
                        Taskbar.add(that);
                        currentDesk.openWindow(that, {
                            title: '应用市场',
                            size: [570, 560],
                            content: 'appmarket.html',
                            resizeable : false,
                            closed: function(){
                                currentDesk.closeWindow(that);
                                Taskbar.remove(that);
                            },
                            focused: function(){
                                Taskbar.focus(that);
                            }
                        });
                        
                    }else{
                        that.focus();
                    }
                }
            };
        },
        
        ]);
        
    })
    
    
    .add([
    
    //公共接口
    function(){ ///API.public
        
        Common.mix(self, {
            
            container: self.temp.container,
            
            addApp: function(app, index){
                currentDesk.addApp(app, index);
            },
            
            refresh: function(){
                currentDesk.refresh();
            },
            
            //切换到指定下标的桌面
            toggle: function(navbar){
                return function(targetIndex){
                    if(currentDesk != desks[targetIndex]){
                        navbar.find('.current').cls('-current');
                        navbar.find('.indicator').eq(targetIndex).cls('+current');
                        
                        var direction;
                        if(targetIndex > currentIndex){ //左移
                            direction = 'L';
                        }else{
                            direction = 'R';
                        }
                        
                        if(currentDesk){
                            currentDesk.toggle(direction);
                        }
                        
                        currentDesk = desks[currentIndex = targetIndex];
                        currentDesk.toggle(direction);
                        self.refresh();
                    }
                };
                
            }(self.temp.navbar),
            
            currentDesk: function(){
                return currentDesk;
            },
            currentIndex: function(){
                return currentIndex;
            },
            
            openManager: function(){
                //在desktopManage模块中重写
            },
            
            closeManager: function(){
                //在desktopManage模块中重写
            },
            
            end: 0
        });
        
        Event.extendTo(self);
    },
    
    //添加子桌面
    function(){ ///initDesk
        var 
        Desk = self.temp.Desk;
        Z.each(Data.CONFIG.desktop.desks, function(deskdata, i){
            if(i >= self.temp.deskCount){
                return true;
            }
            desks[i] = new Desk(deskdata);
        });
        self.toggle(currentIndex);
    },
    
    //设置桌面监听
    function(){ ///listener
        //设置布局改变事件
        Body.on('layout', function(position){
            layoutValue = position;
            self.refresh();
        });
        App.on('drop', function(position){
            var 
            app = this.app,
            index = -1;
            if(inManage){
                Z.each(desks, function(desk){
                    if(Common.inPoint(desk._folderInner.parent(), position)){
                        index = 0|((position.y - desk._folderInner.offsetTop()) / 35);
                        desk.addApp(app, index);
                        return true;
                    }
                });
            }else{
                var applist = currentDesk._applist;
                if(Common.inPoint(applist, position)){
                    var 
                    x = position.x - applist.offsetLeft(),
                    y = position.y - applist.offsetTop(),
                    index = ~~(y / grid_size[1]) + (~~(x / grid_size[0])) * grid_rows;
                }
                if(index > -1){
                    this.stopEvent();
                    if(app.iconPlace != currentDesk  || app.iconIndex != Math.min(index, currentDesk._apps.length - 1)){   
                        self.addApp(app, index);
                    }
                } 
            }
            
        });
        
        var 
        btn = self.temp.navbar.find('.indicator'),
        toggleButtonX,
        toggleButtonY;
        App.on('dragBefore', function(){
            toggleButtonX = btn.offsetLeft();
            toggleButtonY = btn.offsetTop();
        });
        App.on('draging', function(x, y){
            //拖动图标时候的桌面切换检测，20为按钮高度，22为按钮宽度
            if(y > toggleButtonY //y在前面考虑高度小于宽度，减少运算量
            && y < toggleButtonY + 20
            && x > toggleButtonX
            && x < toggleButtonX + 110
            ){
                self.toggle(~~((x - toggleButtonX) / 22));
            }
        });
    
        App.on('contextmenu', function(submenu){
            if(this.app.iconPlace == currentDesk){
                submenu[currentIndex].status = 'disabled';
            }
        });
        
        App.on('addTo', function(index){
            desks[index].addApp(this.app, -1);
        });
        
        App.on('openWindow', function(windowOptions){
            currentDesk.openWindow(this.app, windowOptions);
        });
        App.on('focusWindow', function(){
            if(this.app.windowPlace != currentDesk){
                self.toggle(this.app.windowPlace.index);
            }
        })
        App.on('closeWindow', function(){
            currentDesk.closeWindow(this.app);
        });
    
    },
    
    //初始化桌面应用管理接口
    function(){ ///desktopManage

        Z.each(desks, function(desk, i){
            var folderItem = Z.elem('<div class="folderItem"><div class="folder_bg folder_bg'+(i+1)+'"></div><div class="folderOuter" index="'+i+'"><div class="folderInner"></div></div>'+(i?'<div class="aMg_line_y"></div>':'')+'</div>');
            desks[i]._manageScroll = new Scroll({
                outer: folderItem.find('.folderOuter'),
                inner: desks[i]._folderInner = folderItem.find('.folderInner')
            });
            
            App.appManage_Desktop.append(folderItem);
        });
        
        Z(window).on('resize', function(){
            if(inManage){
                Z.each(desks, function(desk){
                    desk._manageScroll.reset();
                });
            }
        });

        self.openManager = function(){
            inManage = true;
            Z.each(desks, function(desk){
                Z.each(desk._apps, function(app, index){
                   desk._folderInner.append(Z.elem('<div class="iconbox"><span>'+app.data('name')+'</span></div>').append(app.iconElem, 0), index);
               });
                
            });
        };
        self.closeManager = function(){
            inManage = false;
            Z.each(desks, function(desk, index){
                Z.each(desk._apps, function(app, index){
                    app.iconElem.parent().remove();
                    desk._applist.append(app.iconElem, index);
                    setTimeout(function(){
                        desk.refresh(true);
                    });
                });
            });
            
        };
        
    },
    
    //结束
    function(){ ///end
        delete self.temp;
        
    }
    
    ])
    .done(this.ready);
    
}

