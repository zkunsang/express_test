var event_emitter = require('events');
class my_emitter extends event_emitter{}
var fs = require('fs');

let s3_config = require('../../App/s3_config');

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
            let resource_result = await check_resource(db_game, log_object, s3_source);

            // 타이틀 릴소스( 이거는 따로 할 필요가 없음, 단일 파일 원칙)
            let title_resource_result = await check_title_resource(db_game, log_object, s3_source);

            // 타이틀 어셋 리소스
            let title_asset_resource_result = await check_title_asset_resource(db_game, log_object, s3_source);
            
            res.send({"test": 1234});
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

async function check_resource(db_game, log_object, s3_source) {
    let resource_list = (await db_game.query('select * from RESOURCE'))[0];
    let resource_arranged_map = resource_list.$toMap("url");

    let unlinked_resource_list = [];
    let missing_resource_list = [];
    for ( var i = 0 ; i < 100 ; i ++ ) {
        let list_object_emitter = new event_emitter();
        s3_source.listObjects({Bucket: s3_config.source.bucket, Prefix: String(i) + String('/')}, async function(err, data) {
            if( err ) {
                log_object.archive_log("list_object error", err, err.stack);
            }
            else {
                for(var name in data.Contents){
                    let key_split_list = data.Contents[name].Key.split("/");
                    let file_name = key_split_list[key_split_list.length - 1];

                    if ( resource_arranged_map.get(data.Contents[name].Key) != null ) {
                        resource_arranged_map.delete(data.Contents[name].Key);
                        continue;
                    }

                    log_object.archive_log("list_object content", data.Contents[name].Key);    
                    unlinked_resource_list.push(data.Contents[name].Key);
                }
                
                list_object_emitter.emit("file_down_end", 1234);
            }
        })

        let list_object_promise = new Promise(function(resolve, reject) {
            list_object_emitter.on("file_down_end", resolve);
        })

        try {let result = await list_object_promise} catch( err ) {log_object.archive_log()}
    }

    // cdn 서버에 없는거
    if ( resource_arranged_map.length > 0 ) {
        for( var i in resource_arranged_map ) {
            let missing_resource = resource_arranged_map[i];
            missing_resource_list.push(missing_resource.key);
        }
    }
    
    let result = {
        unlinked_resource_list : unlinked_resource_list,
        missing_resource_list: missing_resource_list
    }

    return result;
}

async function check_title_resource(db_game, log_object, s3_source) {
    let unlinked_resource_list = [];
    let missing_resource_list = [];
    
    // 디비에 있는 타이틀 이미지
    let title_list = (await db_game.query('select * from TITLE'))[0];
    let title_arranged_map = title_list.$toMap("thumb");

    let list_object_emitter = new event_emitter();

    // 타이틀 리소르를 확인
    s3_source.listObjects({Bucket: s3_config.source.bucket, Prefix: String('title/')}, async function(err, data) {
        if( err ) {
            log_object.archive_log("list_object error", err, err.stack);
        }
        else {
            for(var name in data.Contents){
                let key_split_list = data.Contents[name].Key.split("/");

                if ( title_arranged_map.get(data.Contents[name].Key) != null ) {
                    title_arranged_map.delete(data.Contents[name].Key);
                    continue;
                }

                log_object.archive_log("list_object content", data.Contents[name].Key);    
                unlinked_resource_list.push(data.Contents[name].Key);
            }
            
            list_object_emitter.emit("file_down_end", 1234);
        }
    });

    let list_object_promise = new Promise(function(resolve, reject) {
        list_object_emitter.on("file_down_end", resolve);
    })

    try {let result = await list_object_promise} catch( err ) {log_object.archive_log("")}

    let result = {
        unlinked_resource_list : unlinked_resource_list,
        missing_resource_list: missing_resource_list
    }

    return result;
}

async function check_title_asset_resource(db_game, log_object, s3_source) {
    let unlinked_resource_list = [];
    let missing_resource_list = [];
    
    // 디비에 있는 타이틀 이미지
    let title_asset_list = (await db_game.query('select * from RESOURCE_OF_TITLE'))[0];
    let title_asset_arranged_map = title_asset_list.$toMap("url");

    let list_object_emitter = new event_emitter();

    // 타이틀 리소르를 확인
    s3_source.listObjects({Bucket: s3_config.source.bucket, Prefix: String('title_asset/')}, async function(err, data) {
        if( err ) {
            log_object.archive_log("list_object error", err, err.stack);
        }
        else {
            for(var name in data.Contents){
                let key_split_list = data.Contents[name].Key.split("/");

                if ( title_asset_arranged_map.get(data.Contents[name].Key) != null ) {
                    title_asset_arranged_map.delete(data.Contents[name].Key);
                    continue;
                }

                log_object.archive_log("list_object content", data.Contents[name].Key);    
                unlinked_resource_list.push(data.Contents[name].Key);
            }
            
            list_object_emitter.emit("file_down_end", 1234);
        }
    });

    let list_object_promise = new Promise(function(resolve, reject) {
        list_object_emitter.on("file_down_end", resolve);
    })

    try {let result = await list_object_promise} catch( err ) {log_object.archive_log("")}

    let result = {
        unlinked_resource_list : unlinked_resource_list,
        missing_resource_list: missing_resource_list
    }

    return result;
}




module.exports = test_export_chapter;