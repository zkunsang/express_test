var fs = require('fs');

test_execute_script = {
    before: function() {
        return []
    },
    
    route: async function( req, res) {
        try {
            res.send({result: "start_server!"})
        }
        catch( err ) {
            next( err );
        }
    }
}

module.exports = test_execute_script;