/* command.js v1.01 指令类
 * 
 * 对外接口：
 * 
 * add(items) //添加指令
 * call(name) //调用指令
 * */

function Command(){ ///Command
    var commands = {};
    Command = function(name, context){
        commands[name].call(context);
    }
    
    Command.add = function(items){
        Z.each(items, function(fn, name){
            commands[name] = fn;
        });
    };
    Command.call = function(name, context){
        var args = arguments;
        if(args.length > 2){
            commands[name].apply(context, [].slice.call(args, 2));
        }else{
            commands[name].call(context);
        }
        
    };
}

