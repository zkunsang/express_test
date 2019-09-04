const md5 = require('md5');
var log_manager = {
    initialize: function(Aop) {
        return {
            route_advice: async function(target_info) {
                this.log_object = log_manager.create_log_object();

                log_manager.route_before_log.call(this.log_object, this.req.body);

                let result = Aop.next.call(this, target_info);

                log_manager.route_after_log.call(this.log_object, this.req.body);
                
                return result;
            },
        }
    },

    route_after_log: function(req_body, res) {
        this.archive_log('router_after', res);
    },

    route_before_log: function(req_body) {
        this.archive_log('router_before', req_body);
    },

    create_log_object: function() {
        let log_index = md5(new Date() + Math.round(Math.random() * 10000));

        log_index = log_index.substr(0,8);
        
        return {
            archive_log(log_topic ,log_message) {
                console.log(log_index + ':' + log_topic + ':' + log_message);
            }
        };
    }
};


module.exports = log_manager;