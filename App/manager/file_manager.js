var fs = require('fs');

var fsPromises = fs.promises;

var file_manager = {
    initialize: async function() {
        //export_mysql 기본 폴더 생성
        //export_resource 기본 폴더 생성
        await fsPromises.mkdir(process.env.ROOT_PATH + '/output_folder/export_resource/', { recursive: true });
        await fsPromises.mkdir(process.env.ROOT_PATH + '/output_folder/export_mysql/', { recursive: true });
        await fsPromises.mkdir(process.env.ROOT_PATH + '/output_folder/export_mysql/local', { recursive: true });
        await fsPromises.mkdir(process.env.ROOT_PATH + '/output_folder/export_mysql/debug', { recursive: true });
        await fsPromises.mkdir(process.env.ROOT_PATH + '/output_folder/export_mysql/production', { recursive: true });

        return this;
    }
}

module.exports = file_manager;