class UserGame {
    constructor() {
        console.log("UserGame constructor");
    }
}

UserGame.prototype.listen = async function(App) {
    let file_list = [];
    let base_dir = __dirname + "\\.."

    App.custom_util.path_util.get_file_list(file_list, base_dir);

    let route_list = App.custom_util.path_util.get_route_url_from_file_list(base_dir, file_list);
    
    route_list.forEach((route) => {
        let mod = require(route.filename);

        let url = route.route_url = route.route_url.replace(/\\/g, '/');

        App.Aop.around("initialize", function(target_info) {
            let route = App.Aop.next(target_info);

            //route.set_db_manager(db_manager);
            //route.set_log_manager(log_manager);

            App.Aop.around("route", App.db_manager.advice, route);
            //App.Aop.around("route", App.log_manager.advice, route);

            App.app.post(url, route.route);
            
        }, mod)

        mod.initialize();
    });

}

UserGame.prototype.commonRoutes = function (logic, req, res) {
    // before
    // dbManager.getConnection();
    try {
        //logic(req, res);
        // dbManager.commit();
    } 
    catch (error) {
        // dbManager.rollback();
    }
    // after
}

module.exports.UserGame = UserGame;