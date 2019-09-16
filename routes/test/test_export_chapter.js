var builder = require('xmlbuilder');
var fs = require('fs');

test_export_chapter = {
    before: function() {
        return [
            {db_name:"game", db_transaction: false}
        ]
    },
    route: async function( req, res) {
        try {
            let db_game = this.db_list["game"].con;

            let resource_query = 'SELECT c.seq_title, c.turn, a.name, a.url, a.version,a.resource_type, a.size FROM RESOURCE AS a';
            resource_query += ' INNER JOIN CHAPTER_RESOURCE AS b ON a.seq_resource = b.seq_resource';
            resource_query += ' INNER JOIN CHAPTER AS c on b.seq_chapter = c.seq_chapter';
            
            // 타이틀 // 챕터
            let resource_list = (await db_game.query(resource_query))[0];
            let resource_arranged_map = resource_list.$toMapList("seq_title", ["turn","name","version","resource_type","size", "url"]);

            resource_arranged_map.forEach((value, key) => {
                let resource = value;
                let seq_title = key;

                let title_resource_list = resource_arranged_map.get(seq_title);
                
                export_title_resource(title_resource_list, seq_title);
            })
            
            function export_title_resource(title_resource_list, seq_title) {
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
                
                let temp = {
                    resource_version: 123,
                    resource: null
                }

                //temp.resource = ret_title_resource;

                //fs.writeFileSync(process.env.ROOT_PATH + `/temp/${file_name}.json`, JSON.stringify(ret_title_resource,null,'\t'), 'utf8');    
                fs.writeFileSync(process.env.ROOT_PATH + `/output_folder/title_data/${file_name}.json`, JSON.stringify(temp, null,'\t'), 'utf8');    
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