var mysql = require('mysql2/promise');

var db_manager = {
    initialize: function(Aop) {
        db_manager.load_db();
        return {
            before: async function(target_info) {
                let db_list = Aop.next.call(this, target_info)
                this.db_list = {};

                for(var i in db_list) {
                    let db = db_list[i];
                    let db_name = db.db_name;
                    let db_transaction = db.db_transaction;
                    let db_pool = db_manager.db_pool[db_name];
                    let connection = await db_pool.getConnection();

                    this.db_list[db_name] = {con: connection, transaction: db_transaction};
                    
                    if (db_transaction) {
                        await this.db_list[db_name].con.beginTransaction();
                    }
                }
            },

            advice: async function(target_info) {
                await this.before();
                let result = await Aop.next.call(this, target_info);
                db_manager.after.call(this);
                return result;
            },
        }
    },

    load_db: function() {
        let db_locale = process.env.NODE_ENV;

        let db_config_path = "../db_config/" + db_locale;
        
        let db_config = require(db_config_path);

        this.db_pool = {};
        Object.keys(db_config).forEach( (key) => {
            this.db_pool[key] = mysql.createPool(db_config[key]);
        })
        
        console.log(this);
    },

    after: function() {
        if ( this.error == false || this.error == undefined ) {
            Object.keys(this.db_list).forEach(async(db) => {
                let connection = this.db_list[db].con;
                await connection.commit();
                connection.release();
            })
        }
        else {
            Object.keys(this.db_list).forEach(async(db) => {
                let connection = this.db_list[db].con;
                await connection.rollback();
                connection.release();
            })
        }
    },
};

module.exports = db_manager;