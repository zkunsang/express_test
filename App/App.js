let App = {};

App.Aop = require('./Aop');
App.db_manager = require('./manager/db_manager');

App.db_manager.initialize(App.Aop);

module.exports = App;