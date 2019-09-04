var mysql_import = require('mysql-import');

var fs = require('fs');

test_mysql_export = {
    
    before: function() {
        return [
            {db_name:"game", db_transaction: true}
        ]
    },
    route: async function( req, res) {

        let date = new Date();

        let node_env = process.env.NODE_ENV;
        let source_game_config = null;
        let target_game_config = null;
        if ( node_env == "local" ) {
            source_game_config = require(process.env.ROOT_PATH + '\\App\\db_config\\local').game;
            target_game_config = require(process.env.ROOT_PATH + '\\App\\db_config\\debug').game;
        }
        else if ( node_env == "debug") {

        }
    
        let game_export_name = 'game_' + date.$getDateFormat() + "_" + date.$getTimeFormat() + ".sql";
        try {
            mysql_import.config(
                {
                    host: source_game_config.host,
                    user: source_game_config.user,
                    password: source_game_config.password,
                    database: source_game_config.database,
                    onerror: function(err) {
                        
                        console.log(err.message)
                    }
                }                
            ).import(process.env.ROOT_PATH + "\\game_20190904_130022.sql").then(()=> {
                console.log('all statements have been executed')
            })
            
            
            res.send("hello!")
        }
        catch( err ) {
            console.error(err);
            res.send("failed");
        }
    }
}

module.exports = test_mysql_export;