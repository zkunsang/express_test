let Router = {} 

Router.route = function(_App) {
    var App = _App;
    
    return {
        set_route: function(_mod) {
            let mod_object = _mod;

            // 로그 처리
            App.Aop.around("mod", App.log_manager.route_advice, mod_object);

            // 세선 처리
            //App.Aop.around("mod", App.log_manager.route_advice, mod_object);

            App.Aop.around("before", App.db_manager.before, mod_object);
            
            // 디비 처리
            App.Aop.around("mod", App.db_manager.advice, mod_object);

            return {
                route: async function(req, res) {
                    mod_object.req = req;
                    mod_object.res = res;
                    
                    return await mod_object.mod(req,res);
                }
            }    
        }
    }
}

Router.service = function(_App, _route){
    var App = _App;
    var Router = _route;

    return {
        listen: function() {
            let file_list = [];
            let base_dir = __dirname;

            App.custom_util.path_util.get_file_list(file_list, base_dir);

            let route_list = App.custom_util.path_util.get_route_url_from_file_list(base_dir, file_list);

            route_list.forEach((route) => {

                let mod = require(route.filename);

                let mod_object = {};
                mod_object.mod = mod.route;
                mod_object.before = mod.before;

                let _route = Router.set_route(mod_object);
                
                let url = route.route_url = route.route_url.replace(/\\/g, '/');

                App.app.post(url, _route.route);

            });
        }
    }
}

module.exports.Router = Router;