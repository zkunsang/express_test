let db_manager = {};

db_manager.initialize = function(Aop) {
    this.Aop = Aop;
}

db_manager.before = () =>{
    return {before: "temp"};
}

db_manager.advice = async (target_info) => {
    // 트랜잭션을 만들어주고 
    let db_object = db_manager.before();
    
    let temp = db_manager.Aop.next(target_info);
    
    db_manager.after(db_object);
}

db_manager.after = async (db_object) =>{
    console.log("db_manager.after");
}

module.exports = db_manager;