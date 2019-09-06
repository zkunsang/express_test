var mysqldump = require('mysqldump');

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
            let result = await mysqldump({
                connection: {
                    host: source_game_config.host,
                    user: source_game_config.user,
                    password: source_game_config.password,
                    database: source_game_config.database,
                },
                dump: {
                    schema : {
                        autoIncrement: false,
                        table : {
                            ifNotExist: false,
                            dropIfExist: true,
                        }
                    }
                },

                dumpToFile: process.env.ROOT_PATH + '\\output_folder\\export_mysql\\' + game_export_name,
            });
            
            this.log_object.archive_log(result);
            res.send("completed");
        }
        catch( err ) {
            console.error(err);
            res.send("failed");
        }
    }
}

module.exports = test_mysql_export;