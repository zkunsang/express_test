var event_emitter = require('events');
var fs = require('fs');
var fsPromises = fs.promises;
let s3_config = require('../../App/s3_config');

class my_emitter extends event_emitter{}

/**
 * 리소스 관리 되기전거를 정리하기 위해 만든 api
 * android - v000001
 */

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

test_export_chapter = {
    before: function() {
        return [
            {db_name:"game", db_transaction: false}
        ]
    },
    route: async function( req, res) {
        try {
            let db_game = this.db_list["game"].con;
            let log_object = this.log_object;

            var AWS = require('aws-sdk');

            var s3_source = new AWS.S3(s3_config.source);

            let version = 'v' + String(pad(1,6));
            
            let resource_folder = '/output_folder/cdn_init_data/android/' + version + "/";
            let title_folder = '/output_folder/cdn_init_data/android/' + version + "/title/";
            let title_asset_folder = '/output_folder/cdn_init_data/android/' + version + "/title_asset/";

            await fsPromises.mkdir(process.env.ROOT_PATH + title_folder, { recursive: true });
            await fsPromises.mkdir(process.env.ROOT_PATH + title_asset_folder, { recursive: true });

            await make_resource(db_game, log_object, s3_source ,{
                table_query: 'select * from RESOURCE',
                backup_folder: resource_folder,
                table_map_key: 'url',
            });
            
            
            await make_common_resource(db_game, log_object, s3_source, {
                table_query: 'select * from TITLE',
                backup_folder: title_folder,
                table_map_key: 'thumb',
                prefix: 'title/'
            });
            
            // 타이틀 어셋 리소스

            /**
            await make_common_resource(db_game, log_object, s3_source, {
                table_query: 'select * from RESOURCE_OF_TITLE',
                backup_folder: title_asset_folder,
                table_map_key: 'url',
                prefix: 'title_asset/'
            });
             */
            // 일반 리소스
            res.send({success: "success"});
        }
        catch( err ) {
            console.error(err);
            res.send("failed");
        }
    },
    async_create_file: function(s3_source, file_name) {
        var file = fs.createWriteStream(process.env.ROOT_PATH + '/cdn_data/' + file_name);
        s3_source.getObject(options).createReadStream().pipe(file)
    }
}

module.exports = test_export_chapter;

async function make_resource(db_game, log_object, s3_source, options) {
    if ( options.table_query == undefined ) { throw new Error("options.table_query") };
    if ( options.backup_folder == undefined ) { throw new Error("options.backup_folder") };
    if ( options.table_map_key == undefined ) { throw new Error("options.table_map_key") };

    let table_query = options.table_query;
    let table_map_key = options.table_map_key;
    let backup_folder = options.backup_folder;
    

    let resource_list = (await db_game.query(table_query))[0];
    let resource_arranged_map = resource_list.$toMap(table_map_key);

    let delete_file_list = [];

    for ( var i = 0 ; i < 100 ; i ++ ) {
        let list_object_emitter = new event_emitter();
        s3_source.listObjects({Bucket: s3_config.source.bucket, Prefix: String(i) + String('/')}, async function(err, data) {
            if( err ) {
                log_object.archive_log("list_object error", err, err.stack);
            }
            else {
                for(var i in data.Contents){
                    var options = {
                        Bucket    : s3_config.source.bucket,
                        Key    : data.Contents[i].Key,
                    };
                    
                    let key_split_list = data.Contents[i].Key.split("/");
                    let file_name = key_split_list[key_split_list.length - 1];

                    if ( resource_arranged_map.get(data.Contents[i].Key) == null ) {
                        log_object.archive_log("list_object no exist!", data.Contents[i].Key);
                        continue;
                    }

                    log_object.archive_log("list_object content", data.Contents[i].Key);    

                    delete_file_list.push(data.Contents[i].Key);

                    var write_stream = fs.createWriteStream(process.env.ROOT_PATH + backup_folder + file_name);
                    let read_steam = s3_source.getObject(options).createReadStream()

                    let backup_file_promise = new Promise(function(resolve, reject) {
                        write_stream.on('finish', function() {resolve();});
                    }) 

                    read_steam.pipe(write_stream);

                    try {await backup_file_promise;}catch (err) {console.log(err);}
                }
                
                list_object_emitter.emit("file_down_end", 1234);
            }
        })

        let list_object_promise = new Promise(function(resolve, reject) {
            list_object_emitter.on("file_down_end", resolve);
        })

        try {let result = await list_object_promise}catch( err ) {log_object.archive_log()}
    }

    return { 
        delete_file_list: delete_file_list 
    }
}


async function make_common_resource(db_game, log_object, s3_source, options) {
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
    s3_source.listObjects({Bucket: s3_config.source.bucket, Prefix: prefix}, async function(err, data) {
        if( err ) {
            log_object.archive_log("list_object error", err, err.stack);
        }
        else {
            for(var i in data.Contents){
                var options = {
                    Bucket    : s3_config.source.bucket,
                    Key    : data.Contents[i].Key,
                };
                
                let key_split_list = data.Contents[i].Key.split("/");
                let file_name = key_split_list[key_split_list.length - 1];

                if ( resource_arranged_map.get(data.Contents[i].Key) == null) {
                    continue;
                }

                log_object.archive_log("list_object content", data.Contents[i].Key);    

                var write_stream = fs.createWriteStream(process.env.ROOT_PATH + backup_folder + file_name);
                let read_steam = s3_source.getObject(options).createReadStream()

                let backup_file_promise = new Promise(function(resolve, reject) {
                    write_stream.on('finish', function() {resolve();});
                }) 

                read_steam.pipe(write_stream);

                try {await backup_file_promise;}catch (err) {console.log(err);}
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