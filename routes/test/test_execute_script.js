var fs = require('fs');

test_execute_script = {
    before: function() {
        return []
    },
    
    route: async function( req, res) {
        try {
            var child_process = require('child_process');

            let mode = req.body.mode;

            if ( mode == "start" ) {
                child_process.exec('D:/DramaGameAPI/ApiLegacy/start_api_server.bat', function(error, stdout, stderr) {
                    console.log(error);
                    console.log(stdout);
                    console.log(stderr);
                    
                });
            }
            else {
                child_process.exec('D:/DramaGameAPI/ApiLegacy/stop_api_server.bat', function(error, stdout, stderr) {
                    console.log(error);
                    console.log(stdout);
                    console.log(stderr);
                    
                });
            }
            

            res.send({result: "hello!"})
        }
        catch( err ) {
        }
    }
}

module.exports = test_execute_script;