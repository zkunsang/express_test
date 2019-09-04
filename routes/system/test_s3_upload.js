var builder = require('xmlbuilder');
var fs = require('fs');

let s3_config = require('../../App/s3_config');
let path_util = require("../../custom_util/path_util");

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

            let base_dir = process.env.ROOT_PATH + '/cdn_data';
            let file_list = [];
            path_util.get_file_list(file_list, base_dir);

            for (var i in file_list) {
                let file = file_list[i];

                let file_full_path  = file.filename;
                let file_split_list = file_full_path.split('\\');
                let file_name = file_split_list[file_split_list.length - 1];

                var param = {
                    Bucket: s3_config.source.bucket,
                    Key: 'android/v000001/' + file_name,
                    Body:fs.createReadStream(file_full_path),
                    //'ACL':'public-read',
                    //'ContentType':'image/png'
                }
                s3_source.upload(param, function(err, data){
                    console.log(err);
                    console.log(data);
                });
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