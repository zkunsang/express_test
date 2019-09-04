var AWS = require('aws-sdk');

var s3_manager = {
    source: null,
    target: null,
    s3_client: null,
    aws: null,
    
    initialize: function() {
        let s3_config = require('../s3_config');
        this.source = s3_config.source;
        this.target = s3_config.target;
        
        return this;
    }
}

module.exports = s3_manager;