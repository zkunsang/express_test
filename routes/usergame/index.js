var fs = require('fs');
var path = require('path');
let routerMap = new Map();

class UserGame {
    constructor() {
        console.log("UserGame constructor");
    }
}


UserGame.prototype.listen = async function(app) {
    // 해당 폴더 내에 있는 파일들을 다 불러옴
    let files = fs.readdirSync(__dirname);
    
    console.log(files);

    for ( var i in files ) {
        let file = files[i];

        if ( file =='index.js') continue;
        let mod = require(__dirname + '/' + file);
        console.log(mod);
        mod();
    }
    path.join('')

    let route_key = routerMap.keys();
    for ( var i in route_key ) {
        
        let route = route_key[i];
        app.get(route, (req, res) =>{ 
            commonRoutes(routerMap.fn, req, res);
        });
    }
}

UserGame.prototype.commonRoutes = function (logic, req, res) {
    // before
    // dbManager.getConnection();
    try {
        logic(req, res);
        // dbManager.commit();
    } 
    catch (error) {
        // dbManager.rollback();
    }
    // after
}

module.exports.UserGame = UserGame;