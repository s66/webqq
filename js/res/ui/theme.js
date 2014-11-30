/* theme.js v1.02 系统主题模块
 * 
 * 
 * */

function Theme(){ ///Theme
    var
    self,
    BGPIC = [
        'bg_01.jpg',
        'bg_02.jpg',
        'bg_03.jpg',
        'bg_04.jpg',
        'bg_05.jpg',
        'bg_06.jpg',
        'bg_07.jpg',
        'bg_08.jpg',
        'bg_09.jpg',
        'bg_10.jpg',
        'bg_11.jpg',
        'bg_12.jpg'
    ];
  
    
    //对外接口
    Theme = self = {
        deskbg: function(imgsrc){
            Z('body').css('background:url(css/bgpic/big/'+imgsrc+') center center');
        }
        
    };
    
    //初始化
    !function(){

        self.deskbg(BGPIC[(Math.random()*12)|0]);

        var 
        styleElem = function(){
            var 
            html = [];
            html.push('<div class="Style-bigpic-list"><ul>');
            Z.each(BGPIC, function(imgname){
                html.push('<li imgname="'+imgname+'"><img src="css/bgpic/small/'+imgname+'"/></li>');
            })
            html.push('</ul></div>');
            return Z.elem(html.join(''));
        }(),
        app = {name:'Theme'};
        
        
        styleElem.find('li').click(function(){
            self.deskbg(this.attr('imgname'));
        });
       
        Command.add({
            openStyleWin: function(){
                if(!app.window){
                    Desktop.currentDesk().openWindow(app, {
                        title: '设置主题',
                        content: styleElem.elem,
                        size: [674, 430],
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

        
    }();

    
}

