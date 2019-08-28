let App = {
    initialize: function () {
        if (process.env.NODE_ENV == undefined) {
            process.env.NODE_ENV = "local";
        }

        console.log("NODE_ENV : " + process.env.NODE_ENV );
    }
};

App.initialize();
App.Aop = require('./Aop');
App.db_manager = require('./manager/db_manager').initialize(App.Aop);
App.log_manager = require('./manager/log_manager').initialize(App.Aop);

module.exports = App;