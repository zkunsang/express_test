var fs = require('fs');
fsPromises = fs.promises;

var event_emitter = require('events');
class my_emitter extends event_emitter{}

let s3_config = require('../../App/s3_config');

test_execute_script = {
    before: function() {
        return [{db_name:"game", db_transaction: false}]
    },
    
    route: async function( req, res) {
        try {
            let db_game = this.db_list["game"].con;
            let log_object = this.log_object;

            let device_type = "android"
            let version = await get_version(db_game, log_object);

            let date = new Date();
            let backup_date = date.$getDateFormat() + "_" + date.$getTimeFormat()

            let backup_base_folder = '/output_folder/cdn_unused_backup/' + backup_date + '/';
            backup_base_folder += device_type;
            backup_base_folder += '/';

            let resource_backup_folder = process.env.ROOT_PATH + backup_base_folder;
            
            var AWS = require('aws-sdk');

            var s3_source = new AWS.S3(s3_config.source);

            // 'android'
            let prefix = device_type;
            let params = { prefix: prefix};
            let resource_list = [];
            let s3_object_list = await get_object_list(s3_source, s3_config, params, resource_list);
            let db_object_list = await get_using_resource_list(db_game, log_object);

            await del_and_backup_resource(s3_object_list, db_object_list, s3_source, resource_backup_folder)
            
            // 일반 리소스
            res.send({result: "complete"});
        }
        catch( err ) {
            console.log(err);
        }
    }
}

module.exports = test_execute_script;

async function get_object_list(s3_source, s3_config, params) {
    let resource_list = [];

    let list_param = {
        Bucket: s3_config.source.bucket, 
        Prefix: params.prefix, 
        MaxKeys: 2000
    };

    if ( params.ContinuationToken != undefined ) {
        
    }

    while ( true ) {
        let result = await s3_source.listObjectsV2(list_param).promise();
        resource_list = resource_list.concat(result.Contents);
        if ( result.IsTruncated == false ) {
            break;
        }
        list_param.ContinuationToken = result.NextContinuationToken;
    }
    

    return resource_list;
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

async function get_using_resource_list(db_game, log_object) {
    let device_type = 'android';
    device_type += '/';

    let resource_list = (await db_game.query(`select concat('${device_type}', url) as url from RESOURCE`))[0];
    let title_list = (await db_game.query(`select concat('${device_type}', thumb) as url from TITLE`))[0];
    let title_asset_list = (await db_game.query(`select concat('${device_type}', url) as url from RESOURCE_OF_TITLE`))[0];

    resource_list = resource_list.concat(title_list);
    resource_list = resource_list.concat(title_asset_list);
    
    return resource_list;
}

async function del_and_backup_resource(s3_object_list, db_object_list, s3_source, backup_path) {
    let db_object_arranged_map = db_object_list.$toMap('url')

    for (var i in s3_object_list) {
        let s3_object = s3_object_list[i];
        let s3_url = s3_object.Key;
        
        if ( db_object_arranged_map.get(s3_url) != null ) {
            continue;
        }
        
        let split_url = s3_url.split("/");

        let url_path = "";
        for ( let i = 0; i < split_url.length - 1 ; i++ ) {
            url_path += split_url[i];
            url_path += "/"
        }
        
        await fsPromises.mkdir(backup_path + url_path, { recursive: true });

        let file_name = split_url[split_url.length - 1]
        
        console.log(s3_url);
        
        var options = {
            Bucket    : s3_config.source.bucket,
            Key    : s3_url,
        };

        // null이면 백업 삭제
        // var write_stream = fs.createWriteStream(backup_path + url_path + file_name);

        // let read_steam = s3_source.getObject(options).createReadStream();

        // let backup_file_promise = new Promise(function(resolve, reject) {
        //     write_stream.on('finish', function() {resolve();});
        // }) 

        // read_steam.pipe(write_stream);

        // try {await backup_file_promise;}catch (err) {console.log(err);}

        console.log("write finish");
        
        // s3_source.deleteObject(options, function(err, data) {
        //     if ( err ) {console.log(err)}
        //     console.log(data);
        // })
    }
}
async function del_common_resource(db_game, log_object, s3_source, options) {
    if ( options.table_query == undefined ) { throw new Error("options.table_query") };
    if ( options.backup_folder == undefined ) { throw new Error("options.backup_folder") };
    if ( options.table_map_key == undefined ) { throw new Error("options.table_map_key") };
    if ( options.prefix == undefined ) { throw new Error("options.prefix") };

    let table_query = options.table_query;
    let table_map_key = options.table_map_key;
    let backup_folder = options.backup_folder;
    let prefix = options.prefix;
    
    let resource_list = (await db_game.query(table_query))[0];
    let resource_arranged_map = resource_list.$toMap(table_map_key);

    let delete_file_list = [];

    let list_object_emitter = new event_emitter();
    let list_object = s3_source.listObjects({Bucket: s3_config.source.bucket, Prefix: prefix}, async function(err, data) {
        if( err ) {
            log_object.archive_log("list_object error", err, err.stack);
        }
        else {
            for(var name in data.Contents){
                var options = {
                    Bucket    : s3_config.source.bucket,
                    Key    : data.Contents[name].Key,
                };
                
                let key_split_list = data.Contents[name].Key.split("/");
                let file_name = key_split_list[key_split_list.length - 1];

                if ( resource_arranged_map.get(data.Contents[name].Key) != null ) {
                    continue;
                }

                log_object.archive_log("list_object content", data.Contents[name].Key);    

                delete_file_list.push(data.Contents[name].Key);
            }
            
            list_object_emitter.emit("file_down_end", 1234);
        }
    })

    let list_object_promise = new Promise(function(resolve, reject) {
        list_object_emitter.on("file_down_end", resolve);
    })

    try {let result = await list_object_promise}catch( err ) {log_object.archive_log()}

    return { 
        delete_file_list: delete_file_list 
    }
}