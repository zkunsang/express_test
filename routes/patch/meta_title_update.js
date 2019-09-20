var builder = require('xmlbuilder');
var fs = require('fs');
var crc = require('crc');

let s3_config = require('../../App/s3_config');
var AWS = require('aws-sdk');
AWS.config.region = 'ap-northeast-2';

var event_emitter = require('events');
class my_emitter extends event_emitter{}

test_export_xml = {
    before: function() {
        return [
            {db_name:"game", db_transaction: false}
        ]
    },
    route: async function( req, res) {
        let db_game = this.db_list["game"].con;
        let log_object = this.log_object;

        let date = new Date();

        let version = await get_version(db_game);
        let version_path = 'v' + String(pad(version,6));

        let export_date = date.$getDateFormat() + "_" + date.$getTimeFormat();

        let export_date_folder = process.env.ROOT_PATH + '/output_folder/meta_data/' + export_date;
        
        await fsPromises.mkdir(export_date_folder, { recursive: true });
        
        var s3_source = new AWS.S3(s3_config.source);

        let s3_info = {
            s3_source: s3_source,
            s3_config: s3_config,
        }

        let chapter_result = await create_and_upload_chapter_json(export_date_folder, db_game, s3_info, version_path);
        let title_data_file = await create_and_upload_title_json(export_date_folder, db_game, s3_info, version_path, chapter_result);
        await create_and_upload_patch_file(export_date_folder, db_game, title_data_file, s3_info);
        
        res.send("completed");
    }
}

module.exports = test_export_xml;

async function create_and_upload_title_json(export_date_folder, db_game, s3_info, version_path, chapter_result) {
    let resource_version_list = (await db_game.query('select * from RESOURCE_VERSION'))[0];

    let resource_data = {};

    for ( var i in resource_version_list) {
        let resource_version = resource_version_list[i];
        let table_name = resource_version.table_name;
        let table_query = resource_version.query;
        
        let table_list = null;

        if (table_name == "KEYWORD") {
            table_list = (await db_game.query('select b.seq_title, a.name from KEYWORD a inner join TITLE_KEYWORD b on a.seq_keyword = b.seq_keyword'))[0];
            table_list = table_list.$toMapList("seq_title", ["name"]);
        }
        else if (table_name == "TAG") {
            table_list = (await db_game.query('select b.seq_title, a.name from TAG a inner join TITLE_TAG b on a.seq_tag = b.seq_tag'))[0];
            table_list = table_list.$toMapList("seq_title", ["name"]);
        }
        else if (table_name == "RESOURCE_OF_TITLE") {
            table_list = (await db_game.query('select seq_title, version, url, resource_type from RESOURCE_OF_TITLE ORDER BY RESOURCE_TYPE'))[0];
            table_list = table_list.$toMapList("seq_title", ["version", "url", "resource_type"]);
        }
        else if (table_name == "TITLE") {
            table_list = (await db_game.query('select seq_title,seq_category,name,label_type, thumb, ver_thumb, crc_thumb, possession_gem, discount_rate, total_turn, release_date, active_flag, title_color, full_length_novel,author,drawer,original,self_product,view_rating  from TITLE'))[0];
        }

        resource_data[table_name] = table_list
    }
    let title_list = resource_data["TITLE"];

    let tag_list = resource_data["TAG"];
    let keyword_list = resource_data["KEYWORD"];
    let resource_of_title_list = resource_data["RESOURCE_OF_TITLE"];

    let ret_json_data = [];
    let ret_xml_data = [];
    for ( var i in title_list ) {
        
        let title_data = title_list[i];
        let seq_title = title_data.seq_title;
        let title = {
            TITLE: seq_title,
        }

        title_data["TAG"] = tag_list.get(seq_title) == null ? [] : tag_list.get(seq_title);
        title_data["KEYWORD"] = keyword_list.get(seq_title) == null ? [] : keyword_list.get(seq_title);
        title_data["RESOURCE_OF_TITLE"] = resource_of_title_list.get(seq_title) == null ? [] : resource_of_title_list.get(seq_title);

        title.TITLE = title_data;
        let title_chapter_resource = chapter_result.get(seq_title);
        if ( title_chapter_resource != null && title_chapter_resource != undefined ) {
            title_data.chapter_resource_crc32 = title_chapter_resource.crc32;
            title_data.chapter_resource_path = title_chapter_resource.key;
        }
        
        ret_xml_data.push(title);
        ret_json_data.push(title_data);
    }

    let temp = {}
    temp.resource_version = 123;
    temp.resource = ret_json_data;
    
    
    let file_full_path = export_date_folder + '/title_data.json';
    fs.writeFileSync(file_full_path, JSON.stringify(temp,null,'\t'), 'utf8');

    let crc_title = crc.crc32(fs.readFileSync(file_full_path,'utf8')).toString(16);

    s3_info.key = 'meta_data/title_data.json';
    await s3_upload(s3_info, file_full_path);

    return { 
        key: s3_info.key, 
        crc: crc_title
    };
}

async function create_and_upload_patch_file(export_date_folder, db_game, title_data_file, s3_info) {
    let patch_info = {
        title_crc: title_data_file.crc,
        title_data_file: title_data_file.key
    }
    
    let file_full_path = export_date_folder + '/patch.json';

    fs.writeFileSync(file_full_path, JSON.stringify( patch_info, null,'\t'), 'utf8');   

    s3_info.key = 'meta_data/patch.json';
    await s3_upload(s3_info, file_full_path)
}
 
async function create_and_upload_chapter_json(export_date_folder, db_game, s3_info, version_path) {
    let resource_query = 'SELECT c.seq_title, c.turn, a.name, a.url, a.version,a.resource_type, a.size FROM RESOURCE AS a';
    resource_query += ' INNER JOIN CHAPTER_RESOURCE AS b ON a.seq_resource = b.seq_resource';
    resource_query += ' INNER JOIN CHAPTER AS c on b.seq_chapter = c.seq_chapter';
    
    // 타이틀 // 챕터
    let resource_list = (await db_game.query(resource_query))[0];
    let resource_arranged_map = resource_list.$toMapList("seq_title", ["turn","name","version","resource_type","size", "url"]);

    let resource_list_temp = Array.from(resource_arranged_map)
    console.log(resource_list_temp);
    let result_map = new Map()

    for (let i in resource_list_temp) {
        let resource_list_row = resource_list_temp[i];
        let seq_title = resource_list_row[0];
        let chapter_resource_list = resource_list_row[1]

        let chapter_result = await export_title_resource(export_date_folder, chapter_resource_list, seq_title, version_path);
        result_map.set(seq_title, chapter_result)
    }
    
    console.log(result_map);
    return result_map;
    
    async function export_title_resource(export_date_folder, title_resource_list, seq_title, version_path) {
        let title_resource_arranged_map = title_resource_list.$toMapList("turn", ["name","version","resource_type","size","url"]);

        let ret_title_resource = [];

        let file_name = 'chapter_data_' + seq_title;

        title_resource_arranged_map.forEach((value, key) => {
            let turn = key;

            let ret_chapter_resource = {
                turn: turn,
                resource_list: title_resource_arranged_map.get(turn)
            }

            ret_title_resource.push(ret_chapter_resource);
        });
        
        let temp = {}
        temp.resource = ret_title_resource;

        let file_full_path = export_date_folder + `/${file_name}.json`;

        fs.writeFileSync(file_full_path, JSON.stringify( temp, null,'\t'), 'utf8');    

        let crc_chapter = crc.crc32(fs.readFileSync(file_full_path,'utf8')).toString(16);

        s3_info.key = `meta_data/${file_name}.json`;
        await s3_upload(s3_info, file_full_path)

        return { 
            crc32: crc_chapter ,
            key: s3_info.key
        };
    }
}

async function s3_upload(s3_info, file_full_path) {
    var param = {
        Bucket: s3_info.s3_config.source.bucket,
        Key: s3_info.key,
        Body: fs.createReadStream(file_full_path),
    }

    // 테섭에 하나 올려보자
    await s3_info.s3_source.putObject(param).promise();
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



function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}