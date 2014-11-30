/* data.js v1.01 数据中心
 * 为各模块提供数据
 * 
 * 参数说明：
 * appid 应用id
 * appver 应用版本号
 * ready 异步就绪的回调
 * 
 * 对外接口：
 * CONFIG 用户配置信息 
 * loadApp(appid, appver, ready) 从服务器获取应用的数据
 * saveApp(appid, appver, ready) 从服务器获取应用的数据并且添加到缓存中
 * getApp(appid, key) 获取指定app的数据，key为数据字段名
 * 
 * */

function Data(){ ///Data
    
    //数据缓存
    var 
    self,
    appsdata = {};
    
    //对外接口
    Data = self = {
        
        CONFIG: {},
        
        loadApp: function(appid, appver, ready){
            Z.get('apps/data/'+ Math.ceil(appid/1000) +'/'+ appid +'.json?' + appver, ready);
        },
        
        saveApp: function(appid, appver, ready){
            this.loadApp(appid, appver || '', function(appdata){
                if(appdata){
                    appdata.isReady = true;
                    appsdata[appid] = appdata;
                }
                ready(true); 
            });
        },
        
        getApp: function(appid, key){
            return appsdata[appid][key];
        }
    };
    
   
    //初始化
    Calls('Data')
        //加载配置数据
        .wait(function(ready){ ///loadConfig

            Z.get('apps/getconfig.json', function(result){
                if(result){
                    self.CONFIG  = result;
                    ready();
                }
            });
        })
        //初始化数据
        .add(function(){ ///laodAppsdata
            var 
            sidebarApps = self.CONFIG.sidebar.apps,
            desks = self.CONFIG.desktop.desks;
            
            Z.each(sidebarApps, function(app, i){
                appsdata[app.id] = app;
            });

            Z.each(desks, function(desk, i){
                var deskApps = desk.apps;
                Z.each(deskApps, function(app, i){
                    appsdata[app.id] = app;
                });
            });
        })
        .done(this.ready);

}

