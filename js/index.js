/*
 * WEB++ v1.02
 * 模拟WEBQQ，尝试面向对象编程，实现代码异步流程控制和性能监测。
 * 
 * author：zjfeihu@126.com
 * 
 * 兼容 firefox, chrome, safari, opera, ie6+(ie6-7不完美支持)
 * 
 * */

!function(Z){

//程序入口
function main(debug){
    
    if(/debug=1/.test(location.search)){
        Calls.timeline(); //开启瀑布图
        debug = 1;
    }else if(!/debug=2/.test(location.search)){
        Calls.debug = false;
        debug = 2;
    }
    
    loading()
        .wait([
            Data, //数据中心，各模块数据来源
            Calls.async(Event), //观察者模型
            Calls.async(Body), //Body模块，需要使用Event
            Calls.async(Contextmenu), //右键菜单
            Calls.async(Command), //指令类
            Calls.async(Theme), //主题模块
            Calls.async(FPS), //页面性能监测工具
            App, //应用模块
        ])
        .wait([
            
            Sidebar, //侧边模块
            Taskbar, //任务栏模块
            Desktop, //桌面模块
        
        ])
        //所有任务都完成，最后进行页面渲染等操作
        .wait(function(){ ///complete
            Body.render();
            Body.layout(Data.CONFIG.layout);
            
            debug == 1 && FPS.start(); //开启性能监控
            
            
            window.WEBJJ = {
                version: 1.02,
                appmarket: { //对appmarket页面开放接口
                    Desktop: Desktop,
                    Data: Data,
                    App: App,
                    Calls: Calls 
                }
            };
            this.ready();
            
            //释放无用句柄
            FPS = null;
            Event = null;

            main = null;
            loading = null;
            
        })
        .done();
}


<?

$inc('res/util/event.js');
$inc('res/util/calls.js');
$inc('res/util/FPS.js');
$inc('res/util/common.js');

$inc('res/other/loading.js');
$inc('res/other/data.js');

$inc('res/widget/calls.timeline.js');
$inc('res/widget/Zw_Win.js');

$inc('res/ui/body.js');
$inc('res/ui/theme.js');
$inc('res/ui/app.js');
$inc('res/ui/sidebar.js');
$inc('res/ui/desktop.js');
$inc('res/ui/taskbar.js');
$inc('res/ui/win.js');
$inc('res/ui/scrollbar.js');


$inc('res/class/contextmenu.js');
$inc('res/class/command.js');

?>
main();

}($1k);
