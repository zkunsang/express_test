var fs = require('fs');
var mysql_import = require('mysql-import');

db_import = {
    before: function() {
        return []
    },
    
    route: async function( req, res) {
        let date = new Date();

        let node_env = process.env.NODE_ENV;
        let source_game_config = null;
        let target_game_config = null;
        if ( node_env == "local" ) {
            game_config = require(process.env.ROOT_PATH + '/App/db_config/local').game;
        }
        else if ( node_env == "debug") {
            game_config = require(process.env.ROOT_PATH + '/App/db_config/local').game;
        }
        else if ( node_env == "debug") {
            game_config = require(process.env.ROOT_PATH + '/App/db_config/local').game;
        }

        try {
            mysql_import.config(
                {
                    host: game_config.host,
                    user: game_config.user,
                    password: game_config.password,
                    database: game_config.database,
                    onerror: function(err) {
                        console.log(err.message)
                    }
                }                
            ).import(process.env.ROOT_PATH + "/output_folder/export_mysql/debug/game_20190909_121654.sql").then(()=> {
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

module.exports = db_import;