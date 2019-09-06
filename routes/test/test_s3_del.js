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

            var options = {
                Bucket    : s3_config.source.bucket,
                Key    : '90/image_Screenshot_20190131-093447_Gallery.jpg',
            };

            let read_steam = s3_source.deleteObject(options, function(err, data) {
                if ( err ) {
                    console.log(err)
                }
                console.log(data);
                res.send("completed");
            })
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