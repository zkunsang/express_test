var builder = require('xmlbuilder');
var fs = require('fs');

test_export_xml = {
    before: function() {
        return [
            {db_name:"game", db_transaction: true}
        ]
    },
    route: async function( req, res) {
        let db_game = this.db_list["game"].con;

        let resource_version_list = (await db_game.query('select * from RESOURCE_VERSION'))[0];

        let resource_data = {};

        for ( var i in resource_version_list) {
            let resource_version = resource_version_list[i];
            let table_name = resource_version.table_name;
            let table_query = resource_version.query;
            let table_list = (await db_game.query(table_query))[0];

            if (table_name == "KEYWORD") {
                table_list = table_list.$toMapList("seq_title", ["name"]);
            }
            else if (table_name == "TAG") {
                table_list = table_list.$toMapList("seq_title", ["name"]);
            }
            else if (table_name == "RESOURCE_OF_TITLE") {
                table_list = table_list.$toMapList("seq_title", ["version", "url", "resource_type"]);
            }
            
            resource_data[table_name] = table_list;
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
            ret_xml_data.push(title);
            ret_json_data.push(title_data);
        }

        let temp = {}
        temp.resource_version = 123;
        temp.resource = ret_json_data;

        var xml = builder.create(ret_xml_data).end({ pretty: true});
        console.log(xml);

        
        //fs.writeFileSync(process.env.ROOT_PATH + '\\temp\\title_data.xml', xml, 'utf8');
        
        fs.writeFileSync(process.env.ROOT_PATH + '\\temp\\title_data.json', JSON.stringify(temp,null,'\t'), 'utf8');
        //fs.writeFileSync(process.env.ROOT_PATH + '\\temp\\title_data.json', JSON.stringify(ret_json_data,null,'\t'), 'utf8');
        

        res.send("completed");
    }
}

module.exports = test_export_xml;