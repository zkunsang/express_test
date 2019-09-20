var fs = require('fs');

let s3_config = require('../../App/s3_config');
let path_util = require("../../custom_util/path_util");

test_execute_script = {
    before: function() {
        return [{db_name:"game", db_transaction: false}]
    },
    route: async function( req, res) {
        try {
            let db_game = this.db_list["game"].con;
            let log_object = this.log_object;

            var AWS = require('aws-sdk');

            AWS.config.region = 'ap-northeast-2';

            var s3_source = new AWS.S3(s3_config.source);
            var s3_target = new AWS.S3(s3_config.target);

            let version = await get_version(db_game, log_object);

            // 임시 안드로이드
            let device_type = "android"
            let version_flag = 'v' + String(pad(version,6));
            

            let version_key = device_type + "/" + version_flag + "/";
            
            // 임시 
            let base_dir = process.env.ROOT_PATH + '/output_folder/export_resource/' + version_key;

            let file_list = [];
            path_util.get_file_list(file_list, base_dir);
            
            

            for (var i in file_list) {
                
                let file = file_list[i];

                let file_full_path  = file.filename;
                let file_split_list = file_full_path.split('\\');
                let file_name = file_split_list[file_split_list.length - 1];

                let relative_path = path_util.relative(base_dir, file_full_path);

                // if ( !(file_split_list.length <= 7) )
                //     continue;

                let s3_url = version_key + relative_path
                s3_url = s3_url.replace('\\', '/');

                var param = {
                    Bucket: s3_config.target.bucket,
                    Key: s3_url,
                    Body:fs.createReadStream(file_full_path),
                }

                const result = await s3_target.putObject(param).promise();
                console.log(result);
            }

            res.send("completed");
        }
        catch( err ) {
            console.error( err );
        }
    }
}

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

async function get_version(db_game, log_object) {
    let version = 0;
    try { 
        let version_query = 'SELECT * FROM SYSTEM_PROP WHERE PROP_KEY = "PATCH_VERSION"';
    
        let version_list = (await db_game.query(version_query))[0];
        
        if ( version_list != null && version_list.length != 0 ) {
            let version_row = version_list[0];
            version = version_row.PROP_VAL;
            
        }
    }
    catch (err) {
        log_object.archive_log("get_version_errror:", err);
    }

    return version
}

module.exports = test_execute_script;