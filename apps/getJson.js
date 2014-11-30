
function getJson(path){
    try{
        return JSON.parse(Fs.readText(path));
    }catch(e){
        return null;
    }
}

exports.getJson = getJson;
