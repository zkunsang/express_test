var event_emitter = require('events');
var fs = require('fs');
var fsPromises = fs.promises;
let s3_config = require('../../App/s3_config');

class my_emitter extends event_emitter{}

/**
 * 리소스 관리 되기전거를 정리하기 위해 만든 api
 */

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

            AWS.config.region = 'ap-northeast-2';

            var s3_source = new AWS.S3(s3_config.source);
            var s3_target = new AWS.S3(s3_config.s3_target);

            // 일반 리소스
            let delete_file_list = [];
            //let resource_result = await del_resource(db_game, log_object, s3_source);
            //delete_file_list = delete_file_list.concat(resource_result.delete_file_list);
            
            // 타이틀 릴소스( 이거는 따로 할 필요가 없음, 단일 파일 원칙)
            let title_backup_folder = process.env.ROOT_PATH + '/output_folder/cdn_unused_backup/title/';
            let title_asset_backup_folder = process.env.ROOT_PATH + '/output_folder/cdn_unused_backup/title_asset/';
            
            await fsPromises.mkdir(title_backup_folder, { recursive: true });
            await fsPromises.mkdir(title_asset_backup_folder, { recursive: true });
            
            let title_resource_result = await del_common_resource(db_game, log_object, s3_source, {
                table_query: 'select * from TITLE',
                backup_folder: '/output_folder/cdn_unused_backup/title/',
                table_map_key: 'thumb',
                prefix: 'title/'
            });
            delete_file_list = delete_file_list.concat(title_resource_result.delete_file_list);

            // 타이틀 어셋 리소스
            let title_asset_resource_result = await del_common_resource(db_game, log_object, s3_source, {
                table_query: 'select * from RESOURCE_OF_TITLE',
                backup_folder: '/output_folder/cdn_unused_backup/title_asset/',
                table_map_key: 'url',
                prefix: 'title_asset/'
            });
            delete_file_list = delete_file_list.concat(title_asset_resource_result.delete_file_list);
            // 일반 리소스
            res.send({delete_file_list: delete_file_list});
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

async function del_resource(db_game, log_object, s3_source) {
    let resource_list = (await db_game.query('select * from RESOURCE'))[0];
    let resource_arranged_map = resource_list.$toMap("url");

    let delete_file_list = [];

    for ( var i = 0 ; i < 100 ; i ++ ) {
        let list_object_emitter = new event_emitter();
        s3_source.listObjects({Bucket: s3_config.source.bucket, Prefix: String(i) + String('/')}, async function(err, data) {
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

                    var write_stream = fs.createWriteStream(process.env.ROOT_PATH + '/output_folder/cdn_unused_backup/' + file_name);
                    let read_steam = s3_source.getObject(options).createReadStream()

                    let backup_file_promise = new Promise(function(resolve, reject) {
                        write_stream.on('finish', function() {resolve();});
                    }) 

                    read_steam.pipe(write_stream);

                    try {await backup_file_promise;}catch (err) {console.log(err);}
                    
                    s3_source.deleteObject(options, function(err, data) {
                        if ( err ) {console.log(err)}
                        console.log(data);
                    })
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

                //''
                var write_stream = fs.createWriteStream(process.env.ROOT_PATH + backup_folder + file_name);
                let read_steam = s3_source.getObject(options).createReadStream()

                let backup_file_promise = new Promise(function(resolve, reject) {
                    write_stream.on('finish', function() {resolve();});
                }) 

                read_steam.pipe(write_stream);

                try {await backup_file_promise;}catch (err) {console.log(err);}
                
                s3_source.deleteObject(options, function(err, data) {
                    if ( err ) {console.log(err)}
                    console.log(data);
                })
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