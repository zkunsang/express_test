start_chapter = {
    before: function() {
        return [
            {db_name:"usergame", db_transaction: false},
            {db_name:"game", db_transaction: false}
        ]
    },
    route: async function( req, res) {
        
        this.log_object.archive_log('test','hello');
        console.log(this);
        res.send({"1234":2134});
        return {result:"1234"};
        
    }
}

module.exports = start_chapter;