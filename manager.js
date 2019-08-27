var Manager = {};
Manager.util_manager = require('./custom_util');

console.log(__dirname + "\\routes");
Manager.util_manager.path_util.from_dir(__dirname + "/routes/" ,".js")