var fs = require('fs');

let s3_config = require('../../App/s3_config');

test_export_chapter = {
    before: function() {
        return [
            {db_name:"game", db_transaction: true}
        ]
    },
    route: async function( req, res) {
        try {
            var AWS = require('aws-sdk');

            AWS.config.region = 'ap-northeast-2';

            var s3_source = new AWS.S3(s3_config.source);
            var s3_target = new AWS.S3(s3_config.s3_target);

            for ( var i = 0 ; i < 100 ; i ++ ) {
                s3_source.listObjects({Bucket: s3_config.source.bucket, Prefix: String(i) + String('/')}, function(err, data) {
                    if( err ) {
                        console.log(err, err.stack);
                    }
                    else {
                        for(var name in data.Contents){
                            console.log(data.Contents[name].Key);
                            var options = {
                                Bucket    : s3_config.source.bucket,
                                Key    : data.Contents[name].Key,
                            };
                        
                            let key_split_list = data.Contents[name].Key.split("/");
                            let file_name = key_split_list[key_split_list.length - 1];
                            var file = fs.createWriteStream(process.env.ROOT_PATH + '/cdn_data/' + file_name);
                            s3_source.getObject(options).createReadStream().pipe(file)
                            // 파일 다운로드
                        }
                    }
                })
            }
            
            
            res.send("completed");
        }
        catch( err ) {
            console.error(err);
            res.send("failed");
        }
    }
}

module.exports = test_export_chapter;