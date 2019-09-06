var event_emitter = require('events');
class my_emitter extends event_emitter{}
var fs = require('fs');

let s3_config = require('../../App/s3_config');

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
            let resource_list = (await db_game.query('select * from RESOURCE'))[0];
            let resource_arranged_map = resource_list.$toMap("name");

            for ( var i = 0 ; i < 100 ; i ++ ) {
                let list_object_emitter = new event_emitter();
                let list_object = s3_source.listObjects({Bucket: s3_config.source.bucket, Prefix: String(i) + String('/')}, async function(err, data) {
                    if( err ) {
                        log_object.archive_log("list_object error", err, err.stack);
                    }
                    else {
                        for(var name in data.Contents){
                            log_object.archive_log("list_object content", data.Contents[name].Key);
                            var options = {
                                Bucket    : s3_config.source.bucket,
                                Key    : data.Contents[name].Key,
                            };
                            
                            let key_split_list = data.Contents[name].Key.split("/");
                            let file_name = key_split_list[key_split_list.length - 1];
                            var write_stream = fs.createWriteStream(process.env.ROOT_PATH + '/output_folder/cdn_data/' + file_name);
                            let read_steam = s3_source.getObject(options).createReadStream()

                            let file_promise = new Promise(function(resolve, reject) {
                                write_stream.on('finish', function() {
                                    resolve();
                                });
                            }) 

                            read_steam.pipe(write_stream);

                            try {
                                await file_promise;
                                
                            }
                            catch (err) {
                                console.log(err);
                            }
                        }
                        list_object_emitter.emit("file_down_end", 1234);
                    }
                })

                let list_object_promise = new Promise(function(resolve, reject) {
                    list_object_emitter.on("file_down_end", resolve);
                })

                try {
                    let result = await list_object_promise
                    console.log(result);
                }
                catch( err ) {
                    log_object.archive_log()
                }

                
                
            }
            res.send("completed");
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