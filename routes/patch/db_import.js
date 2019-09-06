var fs = require('fs');

test_execute_script = {
    before: function() {
        return []
    },
    
    route: async function( req, res) {
        try {
            this.log_manager.archive("test", "test");
            res.send({result: "db_import!"})
        }
        catch( err ) {
        }
    }
}

module.exports = test_execute_script;