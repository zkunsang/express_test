let route = {}

route.initialize = function () {
    return {
        yahoo: async (obj)=> {
            console.log("yahoo");
        },
        set_db_manager: async (obj)=> {
            console.log(obj);
        },
        route: async (req, res) => {

            console.log(db_object);
            res.send("hello");
            
        }    
    }
    
}

module.exports = route;