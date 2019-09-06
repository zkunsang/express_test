const md5 = require('md5');
var log_manager = {
    initialize: function(Aop) {
        return {
            route_advice: async function(target_info) {
                this.log_object = log_manager.create_log_object();

                log_manager.route_before_log.call(this.log_object, this.req);

                let result = await Aop.next.call(this, target_info);

                log_manager.route_after_log.call(this.log_object, this.res);
                
                return result;
            },
        }
    },

    route_after_log: function(res) {
        this.archive_log('after :' , res);
    },

    route_before_log: function(req_body) {
        let topic = "before";
        let message = `[${req_body.path}][${req_body.ip}]`;
        this.archive_log(topic, message);
        
    },

    create_log_object: function() {
        let log_index = md5(new Date() + Math.round(Math.random() * 10000));

        log_index = log_index.substr(0,8);
        
        return {
            archive_log() {
                let arguments_list = Array.prototype.slice.call(arguments)
                let log_topic = arguments_list[0];
                for ( var i = 1; i < arguments_list.length; i++) {
                    let log_message = arguments_list[i];
                    console.log(`[${process.env.NODE_ENV}]` + log_index + ':' + log_topic + ':' + log_message);
                }
            }
        };
    }
};


module.exports = log_manager;