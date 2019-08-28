start_chapter = {
    before: function() {
        return [
            {db_name:"usergame", db_transaction: true},
            {db_name:"game", db_transaction: true}
        ]
    },
    route: async function( req, res) {
        
        this.log_object.archive_log('test','hello');
        res.send({"1234":2134});

        return {
            result:"1234"
        };
        
    }
}

module.exports = start_chapter;