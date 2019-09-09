var fs = require('fs');

var fsPromises = fs.promises;

var event_emitter = require('events');
class my_emitter extends event_emitter{}

let s3_config = require('../../App/s3_config');

test_execute_script = {
    before: function() {
        return [{db_name:"game", db_transaction: false}]
    },
    
    route: async function( req, res) {
        try {
            // 해당 버젼의 리소스를 가져옴
            var AWS = require('aws-sdk');
            var s3_source = new AWS.S3(s3_config.source);

            let db_game = this.db_list["game"].con;
            let log_object = this.log_object;

            let device_type = "android"
            let version = await get_version(db_game, log_object);
            
            let version_flag = 'v' + String(pad(1,6));

            let version_path = device_type + "/" + version_flag + "/";
            let base_path = '/output_folder/export_resource/';
            
            let resource_folder = base_path + version_path;
            let title_folder = resource_folder + "/title/";
            let title_asset_folder = resource_folder + "/title_asset/";

            await fsPromises.mkdir(process.env.ROOT_PATH + title_folder, { recursive: true });
            await fsPromises.mkdir(process.env.ROOT_PATH + title_asset_folder, { recursive: true });

            let list_object_emitter = new event_emitter();

            s3_source.listObjectsV2({Bucket: s3_config.source.bucket, Prefix: version_path, MaxKeys: 2000}, async function(err, data) {
                if (err) {
                    log_object.archive_log(err);
                    return
                }

                console.log(data);


                let data_list = data.Contents;
                for (var i in data_list) {
                    let content = data_list[i];

                    var options = {
                        Bucket    : s3_config.source.bucket,
                        Key    : content.Key,
                    };

                    var write_stream = fs.createWriteStream(process.env.ROOT_PATH + base_path + content.Key);
                    let read_steam = s3_source.getObject(options).createReadStream()

                    let backup_file_promise = new Promise(function(resolve, reject) {
                        write_stream.on('finish', function() {resolve();});
                    }) 

                    read_steam.pipe(write_stream);

                    try {await backup_file_promise;}catch (err) {console.log(err);}
                }
                
                list_object_emitter.emit("file_down_end", 1234);
            });

            let list_object_promise = new Promise(function(resolve, reject) {
                list_object_emitter.on("file_down_end", resolve);
            })
    
            try {await list_object_promise}catch( err ) {log_object.archive_log()}

            res.send({result: "resource_export"})
        }
        catch( err ) {
            console.error(err);
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