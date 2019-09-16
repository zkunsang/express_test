var builder = require('xmlbuilder');
var fs = require('fs');

let s3_config = require('../../App/s3_config');
let path_util = require("../../custom_util/path_util");

test_export_chapter = {
    before: function() {
        return [
            {db_name:"game", db_transaction: false}
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

            
            let file_name_list = [];
            for (var i in file_list) {
                let file = file_list[i];

                let file_split_list = file.filename.split('/');
                let file_name = file_split_list[file_split_list.length - 1];
                file_name_list.push({key: file_name});
            }

            let arranged_file_name = file_name_list.$toMap('key');

            const fs = require('fs');
            


            for (var i = 0; i < 100; i++) {

            
            s3_source.listObjects({Bucket: s3_config.source.bucket, Prefix: String(i) + '/'}, function(err, data) {
                if( err ) {
                    console.log(err, err.stack);
                }
                else {

                    fs.appendFile(process.env.ROOT_PATH + "/temp/test_file.txt", data.Prefix + " : " + data.Contents.length + "\n", function(err) {
                        if(err) {
                            return console.log(err);
                        }
                    }); 
                    
                    for(var name in data.Contents){
                        
                        var options = {
                            Bucket    : s3_config.source.bucket,
                            Key    : data.Contents[name].Key,
                        };
                    
                        let key_split_list = data.Contents[name].Key.split("/");
                        let file_name = key_split_list[key_split_list.length - 1];

                        let found_file = arranged_file_name.get(file_name);
                        if ( found_file == null ) {
                            console.log("found_file", found_file);
                        }
                        else {
                            found_file.checked = true;
                        }

                        
                    }
                }
            })
            }

            setTimeout(function () {
                for ( var i in file_name_list) {
                    let file = file_name_list[i];
                    if (file.checked == undefined) {
                        console.log(file);
                    }
                }
            }, 1000);
            
            res.send("completed");
        }
        catch( err ) {
            console.error(err);
            res.send("failed");
        }
    }
}

module.exports = test_export_chapter;