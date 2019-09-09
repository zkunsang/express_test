var fs = require('fs');

var event_emitter = require('events');
class my_emitter extends event_emitter{}

test_execute_script = {
    before: function() {
        return []
    },
    
    route: async function( req, res) {
        try {
            var child_process = require('child_process');

            let operation = req.body.operation;
            let server = req.body.server;

            let exec = process.env.ROOT_PATH + '\\ssh_script\\operation_script.sh ' + server + ' ' + operation;
            
            let script_emitter = new my_emitter();

            script_emitter.on("script_end", function(payload) {
                console.log(payload.error);
                console.log(payload.stdout);
                console.log(payload.stderr);

                res.send({result: "complete!"})
            })
            
            child_process.exec(exec, function(error, stdout, stderr) {
                script_emitter.emit("script_end", {error: error, stdout: stdout, stderr: stderr});
            });
        }
        catch( err ) {
            res.send({result: "fail"})
        }
    }
}

module.exports = test_execute_script;