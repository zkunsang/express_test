var path = require('path')
var fs = require('fs');

var path_util = {}

path_util.get_file_list = function(file_list, startPath) {
    
    if (!fs.existsSync(startPath)) {
        console.log("no dir ", startPath);
        return;
    }

    var files = fs.readdirSync(startPath);
    for(var i = 0 ; i < files.length ; i++){
        var filename = path.join(startPath,files[i]);
        var stat = fs.lstatSync(filename);

        if (stat.isDirectory()){
            this.get_file_list(file_list, filename); //recurse
        }
        else {
            file_list.push({filename: filename});
            
        }
    };
};

path_util.get_route_url_from_file_list = function(base_dir, route_file_list) {
    let route_url = [];
    base_dir = path.normalize(base_dir);
    route_file_list.forEach((item) => {
        let filename = item.filename;
        let route_name =  filename.replace(base_dir, "");
        route_name = path.normalize(route_name);


        let parsed_file_obj = path.parse(route_name)
        let name = parsed_file_obj.name;
        let ext = parsed_file_obj.ext;

        if (name == "index") return;
        if (ext != ".js") return;

        route_url.push({
            filename: filename, 
            route_url: route_name.substr(0, route_name.length - 3)
        });
    })

    return route_url;
};

path_util.relative = function(base_dir, target_dir) {
    return path.relative(base_dir, target_dir)
}

module.exports = path_util;